/**
 * UI 模块
 * 处理界面相关的操作
 */

export class UIModule {
  constructor() {
    // 获取所有 DOM 元素
    this.chatMessages = document.getElementById("chatMessages");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.modelSelect = document.getElementById("modelSelect");
    this.newChatBtn = document.getElementById("newChatBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.systemPromptBtn = document.getElementById("systemPromptBtn");
    this.systemPromptPanel = document.getElementById("systemPromptPanel");
    this.systemPromptInput = document.getElementById("systemPromptInput");
    this.applyPromptBtn = document.getElementById("applyPromptBtn");
    this.closePanelBtn = document.getElementById("closePanelBtn");
    this.conversationList = document.getElementById("conversationList");
    this.tokenInfo = document.getElementById("tokenInfo");

    // 文件上传相关元素
    this.fileInfo = document.getElementById("fileInfo");
    this.fileName = document.getElementById("fileName");
    this.fileSize = document.getElementById("fileSize");
    this.removeFileBtn = document.getElementById("removeFileBtn");
    this.inputWrapper = document.getElementById("inputWrapper");
    this.dropZone = document.getElementById("dropZone");
  }

  /**
   * 显示欢迎消息
   */
  showWelcome() {
    this.chatMessages.innerHTML = `
      <div class="welcome-message">
        <h1>AI Chat</h1>
        <p>开始一个新的对话吧</p>
      </div>
    `;
  }

  /**
   * 清空聊天区域
   */
  clearChat() {
    this.chatMessages.innerHTML = "";
  }

  /**
   * 添加消息到界面
   * @param {Object} message - 消息对象
   * @param {boolean} isStreaming - 是否正在流式输出
   */
  addMessage(message, isStreaming = false) {
    // 移除欢迎消息
    const welcome = this.chatMessages.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    // 创建消息元素
    const div = document.createElement("div");
    div.className = `message ${message.role}`;
    div.innerHTML = `
      <div class="message-avatar">${message.role === "user" ? "U" : "AI"}</div>
      <div class="message-content">
        ${isStreaming ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : this.formatContent(message.content)}
      </div>
    `;
    this.chatMessages.appendChild(div);
    this.scrollToBottom();
  }

  /**
   * 更新最后一条消息
   * @param {string} content - 消息内容
   */
  updateLastMessage(content) {
    const messages = this.chatMessages.querySelectorAll(".message");
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const contentDiv = lastMessage.querySelector(".message-content");
      contentDiv.innerHTML = this.formatContent(content);
      this.scrollToBottom();
    }
  }

  /**
   * 渲染所有消息
   * @param {Array} messages - 消息列表
   */
  renderMessages(messages) {
    if (messages.length === 0) {
      this.showWelcome();
      return;
    }

    this.clearChat();
    messages
      .filter((m) => m.role !== "system")
      .forEach((m) => this.addMessage(m));
  }

  /**
   * 格式化消息内容
   * @param {string} content - 原始内容
   * @returns {string} 格式化后的 HTML
   */
  formatContent(content) {
    let formatted = this.escapeHtml(content);
    
    // 代码块
    formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // 行内代码
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
    
    // 标题 (## 标题)
    formatted = formatted.replace(/^### (.+)$/gm, '<h4 class="md-h3">$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3 class="md-h2">$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h2 class="md-h1">$1</h2>');
    
    // 加粗 **文本**
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // 列表项 (- 或 *)
    formatted = formatted.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
    
    // 连续的 li 包装成 ul
    formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // 换行
    formatted = formatted.replace(/\n/g, "<br>");
    
    return formatted;
  }

  /**
   * 转义 HTML
   * @param {string} text - 原始文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 滚动到底部
   */
  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * 自动调整输入框高度
   */
  autoResize() {
    this.messageInput.style.height = "auto";
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 200) + "px";
  }

  /**
   * 渲染模型列表
   * @param {Array} models - 模型列表
   * @param {string} currentModel - 当前选中的模型
   */
  renderModels(models, currentModel) {
    this.modelSelect.innerHTML = models
      .map((m) => `<option value="${m.id}" ${m.id === currentModel ? "selected" : ""}>${m.name}</option>`)
      .join("");
  }

  /**
   * 渲染对话列表
   * @param {Array} conversations - 对话列表
   * @param {string} currentId - 当前对话 ID
   * @param {Function} onLoad - 加载对话的回调
   * @param {Function} onDelete - 删除对话的回调
   */
  renderConversations(conversations, currentId, onLoad, onDelete) {
    this.conversationList.innerHTML = conversations
      .map(
        (c) => `
        <div class="conversation-item ${c.id === currentId ? "active" : ""}" data-id="${c.id}">
          <span class="title">${this.escapeHtml(c.title)}</span>
          <button class="delete-btn" data-id="${c.id}">&times;</button>
        </div>
      `
      )
      .join("");

    // 绑定事件
    this.conversationList.querySelectorAll(".conversation-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.classList.contains("delete-btn")) {
          onLoad(item.dataset.id);
        }
      });
    });

    this.conversationList.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        onDelete(btn.dataset.id);
      });
    });
  }

  /**
   * 切换系统提示词面板
   */
  togglePanel() {
    this.systemPromptPanel.classList.toggle("hidden");
  }

  /**
   * 显示 token 信息
   * @param {Object} usage - token 使用情况
   */
  showTokenInfo(usage) {
    if (usage) {
      this.tokenInfo.textContent = `Tokens: ${usage.total_tokens}`;
    }
  }

  /**
   * 设置按钮状态
   * @param {string} btnName - 按钮名称
   * @param {boolean} disabled - 是否禁用
   */
  setButtonState(btnName, disabled) {
    const btn = this[btnName];
    if (btn) {
      btn.disabled = disabled;
    }
  }

  /**
   * 获取输入框内容
   * @returns {string} 输入框内容
   */
  getInputValue() {
    return this.messageInput.value.trim();
  }

  /**
   * 清空输入框
   */
  clearInput() {
    this.messageInput.value = "";
    this.autoResize();
  }

  /**
   * 获取系统提示词
   * @returns {string} 系统提示词
   */
  getSystemPrompt() {
    return this.systemPromptInput.value.trim();
  }

  /**
   * 设置系统提示词
   * @param {string} prompt - 系统提示词
   */
  setSystemPrompt(prompt) {
    this.systemPromptInput.value = prompt;
  }

  /**
   * 显示文件信息
   * @param {Object} fileInfo - 文件信息
   */
  showFileInfo(fileInfo) {
    this.fileName.textContent = fileInfo.name;
    this.fileSize.textContent = this.formatFileSize(fileInfo.size);
    this.fileInfo.classList.remove("hidden");
  }

  /**
   * 隐藏文件信息
   */
  hideFileInfo() {
    this.fileInfo.classList.add("hidden");
  }

  /**
   * 显示拖拽区域
   */
  showDropZone() {
    this.dropZone.classList.remove("hidden");
  }

  /**
   * 隐藏拖拽区域
   */
  hideDropZone() {
    this.dropZone.classList.add("hidden");
  }

  /**
   * 添加拖拽样式
   */
  addDragOverStyle() {
    this.inputWrapper.classList.add("drag-over");
  }

  /**
   * 移除拖拽样式
   */
  removeDragOverStyle() {
    this.inputWrapper.classList.remove("drag-over");
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
}
