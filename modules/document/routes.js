/**
 * 文档路由模块
 * 处理文档上传和分析的 HTTP 请求
 */

import express from "express";
import multer from "multer";
import { parseFile } from "./parser.js";
import { analyzeDocument } from "./analyzer.js";

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制 10MB
  },
});

// 上传并解析文件
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    // 修复中文文件名乱码
    const filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 解析文件
    const result = await parseFile(req.file.buffer, filename);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // 返回解析结果
    res.json({
      success: true,
      filename: filename,
      size: req.file.size,
      text: result.text,
      pages: result.pages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 分析文档
router.post("/analyze", async (req, res) => {
  const { text, question, model } = req.body;

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // 调用 AI 分析
  await analyzeDocument(
    text,
    question,
    model,
    // 收到一块数据
    (chunk, fullContent) => {
      res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
    },
    // 完成
    (fullContent, usage) => {
      res.write(`data: ${JSON.stringify({ type: "done", content: fullContent, usage })}\n\n`);
      res.end();
    },
    // 出错
    (error) => {
      res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
      res.end();
    }
  );
});

export default router;
