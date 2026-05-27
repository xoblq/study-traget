/**
 * 存储路由模块
 * 处理对话保存/加载相关的 HTTP 请求
 */

import express from "express";
import { listConversations, saveConversation, loadConversation, deleteConversation } from "./file.js";

const router = express.Router();

// 获取对话列表
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await listConversations();
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存对话
router.post("/conversations", async (req, res) => {
  try {
    const result = await saveConversation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 加载对话
router.get("/conversations/:id", async (req, res) => {
  try {
    const conversation = await loadConversation(req.params.id);
    res.json(conversation);
  } catch (error) {
    res.status(404).json({ error: "对话不存在" });
  }
});

// 删除对话
router.delete("/conversations/:id", async (req, res) => {
  try {
    await deleteConversation(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
