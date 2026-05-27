/**
 * 聊天模块
 * 处理聊天相关的逻辑
 */

export class ChatModule {
  constructor() {
    this.messages = [];
    this.systemPrompt = "";
    this.currentModel = "qwen-plus";
    this.currentConversationId = null;
    this.isGenerating = false;
  }

  /**
   * 发送消息
   * @param {string} content - 消息内容
   * @param {Function} onChunk - 收到一块数据时的回调
   * @param {Function} onDone - 完成时的回调
   * @param {Function} onError - 出错时的回调
   */
  async sendMessage(content, onChunk, onDone, onError) {
    if (!content || this.isGenerating) return;

    // 添加用户消息
    this.messages.push({ role: "user", content });

    // 构建 API 请求的消息列表
    const apiMessages = [];
    if (this.systemPrompt) {
      apiMessages.push({ role: "system", content: this.systemPrompt });
    }
    apiMessages.push(...this.messages);

    this.isGenerating = true;

    // 添加助手消息（占位）
    const assistantMessage = { role: "assistant", content: "" };
    this.messages.push(assistantMessage);

    try {
      // 发送请求
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, model: this.currentModel }),
      });

      // 读取流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "chunk") {
                assistantMessage.content += data.content;
                onChunk(assistantMessage.content);
              } else if (data.type === "done") {
                onDone(assistantMessage.content, data.usage);
              } else if (data.type === "error") {
                onError(data.error);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      onError(error.message);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * 清空对话
   */
  clear() {
    this.messages = [];
    this.currentConversationId = null;
  }

  /**
   * 加载对话
   * @param {Object} data - 对话数据
   */
  load(data) {
    this.messages = data.messages || [];
    this.systemPrompt = data.systemPrompt || "";
    this.currentModel = data.model || "qwen-plus";
    this.currentConversationId = data.id;
  }

  /**
   * 获取对话数据
   * @returns {Object} 对话数据
   */
  getData() {
    return {
      id: this.currentConversationId,
      messages: this.messages,
      systemPrompt: this.systemPrompt,
      model: this.currentModel,
    };
  }
}
