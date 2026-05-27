/**
 * 文件上传模块
 * 处理文件上传和解析
 */

export class UploadModule {
  constructor() {
    this.currentFile = null;
    this.currentText = null;
  }

  /**
   * 上传文件
   * @param {File} file - 文件对象
   * @returns {Object} 上传结果
   */
  async upload(file) {
    try {
      // 创建 FormData
      const formData = new FormData();
      formData.append("file", file);

      // 发送请求
      const response = await fetch("/api/document/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.currentFile = {
          name: result.filename,
          size: result.size,
        };
        this.currentText = result.text;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * 分析文档
   * @param {string} question - 用户的问题
   * @param {string} model - 模型名称
   * @param {Function} onChunk - 收到一块数据时的回调
   * @param {Function} onDone - 完成时的回调
   * @param {Function} onError - 出错时的回调
   */
  async analyze(question, model, onChunk, onDone, onError) {
    if (!this.currentText) {
      onError("请先上传文件");
      return;
    }

    try {
      const response = await fetch("/api/document/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: this.currentText,
          question: question,
          model: model,
        }),
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
                onChunk(data.content);
              } else if (data.type === "done") {
                onDone(data.content, data.usage);
              } else if (data.type === "error") {
                onError(data.error);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      onError(error.message);
    }
  }

  /**
   * 移除当前文件
   */
  remove() {
    this.currentFile = null;
    this.currentText = null;
  }

  /**
   * 检查是否有文件
   * @returns {boolean} 是否有文件
   */
  hasFile() {
    return this.currentFile !== null;
  }

  /**
   * 获取文件信息
   * @returns {Object} 文件信息
   */
  getFileInfo() {
    return this.currentFile;
  }
}
