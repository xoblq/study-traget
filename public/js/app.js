/**
 * 主应用
 * 整合所有模块，处理用户交互
 */

import { ChatModule } from "./chat.js";
import { UIModule } from "./ui.js";
import { UploadModule } from "./upload.js";

class App {
  constructor() {
    // 初始化模块
    this.chat = new ChatModule();
    this.ui = new UIModule();
    this.upload = new UploadModule();
    this.models = [];

    // 绑定事件
    this.bindEvents();
    this.bindDragEvents();

    // 加载初始数据
    this.init();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 发送按钮
    this.ui.sendBtn.addEventListener("click", () => this.sendMessage());

    // 输入框按键
    this.ui.messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 输入框自动调整高度
    this.ui.messageInput.addEventListener("input", () => this.ui.autoResize());

    // 模型选择
    this.ui.modelSelect.addEventListener("change", (e) => {
      this.chat.currentModel = e.target.value;
    });

    // 新对话按钮
    this.ui.newChatBtn.addEventListener("click", () => this.newChat());

    // 清空按钮
    this.ui.clearBtn.addEventListener("click", () => this.clearChat());

    // 系统提示词按钮
    this.ui.systemPromptBtn.addEventListener("click", () => this.ui.togglePanel());

    // 应用系统提示词
    this.ui.applyPromptBtn.addEventListener("click", () => this.applySystemPrompt());

    // 关闭面板
    this.ui.closePanelBtn.addEventListener("click", () => this.ui.togglePanel());

    // 移除文件按钮
    this.ui.removeFileBtn.addEventListener("click", () => this.removeFile());
  }

  /**
   * 绑定拖拽事件
   */
  bindDragEvents() {
    const inputArea = document.querySelector(".input-area");

    // 阻止默认行为
    inputArea.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.ui.showDropZone();
    });

    inputArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.ui.addDragOverStyle();
    });

    inputArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 检查是否离开了 inputArea
      const rect = inputArea.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        this.ui.hideDropZone();
        this.ui.removeDragOverStyle();
      }
    });

    inputArea.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.ui.hideDropZone();
      this.ui.removeDragOverStyle();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    // 也支持输入框的拖拽
    this.ui.messageInput.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.ui.addDragOverStyle();
    });

    this.ui.messageInput.addEventListener("dragleave", (e) => {
      e.preventDefault();
      this.ui.removeDragOverStyle();
    });

    this.ui.messageInput.addEventListener("drop", (e) => {
      e.preventDefault();
      this.ui.removeDragOverStyle();
      this.ui.hideDropZone();

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });
  }

  /**
   * 处理文件上传
   * @param {File} file - 文件对象
   */
  async handleFile(file) {
    // 检查文件类型
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx", "doc"].includes(ext)) {
      alert("只支持 PDF 和 Word 文件");
      return;
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert("文件大小不能超过 10MB");
      return;
    }

    // 显示上传中状态
    this.ui.showFileInfo({ name: file.name, size: file.size });

    // 上传文件
    const result = await this.upload.upload(file);

    if (!result.success) {
      alert(result.error);
      this.ui.hideFileInfo();
      return;
    }

    // 自动填充分析提示
    this.ui.messageInput.value = "请帮我分析这个文档的内容";
    this.ui.autoResize();
  }

  /**
   * 移除文件
   */
  removeFile() {
    this.upload.remove();
    this.ui.hideFileInfo();
  }

  /**
   * 初始化
   */
  async init() {
    await this.loadModels();
    await this.loadConversations();
    this.ui.showWelcome();
  }

  /**
   * 加载模型列表
   */
  async loadModels() {
    try {
      const res = await fetch("/api/models");
      this.models = await res.json();
      this.ui.renderModels(this.models, this.chat.currentModel);
    } catch (error) {
      console.error("加载模型失败:", error);
    }
  }

  /**
   * 加载对话列表
   */
  async loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      const conversations = await res.json();
      this.ui.renderConversations(
        conversations,
        this.chat.currentConversationId,
        (id) => this.loadConversation(id),
        (id) => this.deleteConversation(id)
      );
    } catch (error) {
      console.error("加载对话列表失败:", error);
    }
  }

  /**
   * 加载对话
   * @param {string} id - 对话 ID
   */
  async loadConversation(id) {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = await res.json();
      this.chat.load(data);
      this.ui.renderMessages(this.chat.messages);
      this.ui.setSystemPrompt(this.chat.systemPrompt);
      this.ui.modelSelect.value = this.chat.currentModel;
      this.loadConversations();
    } catch (error) {
      console.error("加载对话失败:", error);
    }
  }

  /**
   * 删除对话
   * @param {string} id - 对话 ID
   */
  async deleteConversation(id) {
    if (!confirm("确定要删除这个对话吗？")) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (this.chat.currentConversationId === id) {
        this.newChat();
      }
      this.loadConversations();
    } catch (error) {
      console.error("删除对话失败:", error);
    }
  }

  /**
   * 保存对话
   */
  async saveConversation() {
    if (this.chat.messages.length === 0) return;
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.chat.getData()),
      });
      const data = await res.json();
      this.chat.currentConversationId = data.id;
      this.loadConversations();
    } catch (error) {
      console.error("保存对话失败:", error);
    }
  }

  /**
   * 新对话
   */
  newChat() {
    this.chat.clear();
    this.ui.showWelcome();
    this.loadConversations();
  }

  /**
   * 清空对话
   */
  clearChat() {
    if (this.chat.messages.length === 0) return;
    if (confirm("确定要清空当前对话吗？")) {
      this.newChat();
    }
  }

  /**
   * 应用系统提示词
   */
  applySystemPrompt() {
    this.chat.systemPrompt = this.ui.getSystemPrompt();
    this.ui.togglePanel();
  }

  /**
   * 发送消息
   */
  async sendMessage() {
    const content = this.ui.getInputValue();
    if (!content || this.chat.isGenerating) return;

    // 清空输入框
    this.ui.clearInput();

    // 检查是否有文件需要分析
    if (this.upload.hasFile()) {
      // 显示用户消息（带文件信息）
      const fileInfo = this.upload.getFileInfo();
      this.ui.addMessage({ role: "user", content: `📎 ${fileInfo.name}\n${content}` });

      // 禁用发送按钮
      this.ui.setButtonState("sendBtn", true);

      // 显示打字指示器
      this.ui.addMessage({ role: "assistant", content: "" }, true);

      // 分析文档
      await this.upload.analyze(
        content,
        this.chat.currentModel,
        // 收到一块数据
        (chunk) => {
          this.ui.updateLastMessage(chunk);
        },
        // 完成
        (fullContent, usage) => {
          this.ui.showTokenInfo(usage);
          // 添加到聊天历史
          this.chat.messages.push({ role: "user", content: `📎 ${fileInfo.name}\n${content}` });
          this.chat.messages.push({ role: "assistant", content: fullContent });
          this.saveConversation();
          // 移除文件
          this.removeFile();
        },
        // 出错
        (error) => {
          this.ui.updateLastMessage(`错误: ${error}`);
        }
      );

      // 启用发送按钮
      this.ui.setButtonState("sendBtn", false);
    } else {
      // 普通聊天
      // 显示用户消息
      this.ui.addMessage({ role: "user", content });

      // 禁用发送按钮
      this.ui.setButtonState("sendBtn", true);

      // 显示打字指示器
      this.ui.addMessage({ role: "assistant", content: "" }, true);

      // 发送消息
      await this.chat.sendMessage(
        content,
        // 收到一块数据
        (fullContent) => {
          this.ui.updateLastMessage(fullContent);
        },
        // 完成
        (fullContent, usage) => {
          this.ui.showTokenInfo(usage);
          this.saveConversation();
        },
        // 出错
        (error) => {
          this.ui.updateLastMessage(`错误: ${error}`);
        }
      );

      // 启用发送按钮
      this.ui.setButtonState("sendBtn", false);
    }
  }
}

// 启动应用
new App();
