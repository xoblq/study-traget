/**
 * 聊天路由模块
 * 处理聊天相关的 HTTP 请求
 */

import express from "express";
import { chatStream, MODELS } from "./api.js";

const router = express.Router();

// 获取可用模型列表
router.get("/models", (req, res) => {
  res.json(MODELS);
});

// 流式聊天接口
router.post("/chat", async (req, res) => {
  const { messages, model } = req.body;

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 调用聊天 API
  await chatStream(
    messages,
    model,
    // 收到一块数据
    (chunk, fullContent) => {
      res.write(
        `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`,
      );
    },
    // 完成
    (fullContent, usage) => {
      res.write(
        `data: ${JSON.stringify({ type: "done", content: fullContent, usage })}\n\n`,
      );
      res.end();
    },
    // 出错
    (error) => {
      res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
      res.end();
    },
  );
});

export default router;
