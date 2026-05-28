/**
 * 图片路由模块
 * 处理图片上传和分析的 HTTP 请求
 */

import express from "express";
import multer from "multer";
import { analyzeImage } from "./api.js";

const router = express.Router();

// 配置文件上传（限制 20MB）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只支持 JPG、PNG、GIF、WebP 格式的图片"));
    }
  },
});

// 上传图片
router.post("/upload", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "没有上传图片" });
    }

    // 修复中文文件名
    const filename = Buffer.from(req.file.originalname, "latin1").toString("utf8");

    // 转为 base64
    const base64 = req.file.buffer.toString("base64");

    res.json({
      success: true,
      filename,
      size: req.file.size,
      base64,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 分析图片
router.post("/analyze", async (req, res) => {
  const { imageBase64, question } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "缺少图片数据" });
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  await analyzeImage(
    imageBase64,
    question,
    (chunk, fullContent) => {
      res.write(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`);
    },
    (fullContent) => {
      res.write(`data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`);
      res.end();
    },
    (error) => {
      res.write(`data: ${JSON.stringify({ type: "error", error })}\n\n`);
      res.end();
    }
  );
});

export default router;
