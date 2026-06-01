/**
 * Agent 路由模块
 * 处理 Agent 对话请求
 */

import express from "express";
import { agentChat } from "./core.js";
import { getAllTools } from "./tools/index.js";

// 导入工具（会自动注册）
import "./tools/weather.js";
import "./tools/calculator.js";

const router = express.Router();

// 获取可用工具列表
router.get("/tools", (req, res) => {
  const tools = getAllTools();
  res.json(tools);
});

// Agent 对话（流式）
router.post("/chat", async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "缺少消息内容" });
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await agentChat(
      messages,
      model,
      // 收到数据块
      (chunk, fullContent) => {
        res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
      },
      // 工具调用
      (toolCall) => {
        res.write(`data: ${JSON.stringify({ type: "tool_call", tool: toolCall })}\n\n`);
      },
      // 完成
      (fullContent) => {
        res.write(`data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`);
        res.end();
      },
      // 出错
      (error) => {
        res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
