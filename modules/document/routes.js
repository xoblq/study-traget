/**
 * 文档路由模块
 * 处理文档上传和分析的 HTTP 请求，整合 PostgreSQL 向量存储 (RAG)
 */

import express from "express";
import multer from "multer";
import { parseFile } from "./parser.js";
import { analyzeDocument } from "./analyzer.js";
import { getPool, isVectorSupported } from "./db.js";
import { chunkText } from "./chunker.js";
import { getEmbedding } from "./embedding.js";

const router = express.Router();

// 配置文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制 10MB
  },
});

// 上传并解析文件 (RAG 向量化存储模式)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    // 修复中文文件名乱码
    const filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    // 解析文件为文本
    const result = await parseFile(req.file.buffer, filename);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const db = getPool();
    
    // 1. 在 documents 主表插入文档元数据
    const docResult = await db.query(
      "INSERT INTO documents (filename, size) VALUES ($1, $2) RETURNING id",
      [filename, req.file.size]
    );
    const documentId = docResult.rows[0].id;

    // 2. 文本分块 (每块 600 字，重叠 100 字)
    const chunks = chunkText(result.text, 600, 100);
    console.log(`[RAG] 文档 "${filename}" 已成功切分为 ${chunks.length} 个文本块，开始计算向量...`);

    const hasVector = isVectorSupported();

    // 3. 循环计算向量并存入数据库 (采用串行处理以防 DashScope API 触发 QPS 限流)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await getEmbedding(chunk);

      if (hasVector) {
        // pgvector 写入格式：'[val1, val2, ...]'
        const vectorStr = `[${embedding.join(",")}]`;
        await db.query(
          "INSERT INTO document_chunks (document_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4)",
          [documentId, chunk, vectorStr, i]
        );
      } else {
        // 兼容 float8[] 写入
        await db.query(
          "INSERT INTO document_chunks (document_id, content, embedding, chunk_index) VALUES ($1, $2, $3, $4)",
          [documentId, chunk, embedding, i]
        );
      }
    }

    console.log(`[RAG] 文档 "${filename}" 向量化切片全部写入数据库完毕。`);

    // 返回文档 ID 给前端 (无需返回庞大的全文内容)
    res.json({
      success: true,
      documentId: documentId,
      filename: filename,
      size: req.file.size,
      chunksCount: chunks.length
    });
  } catch (error) {
    console.error("[RAG] 上传与向量化失败:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 分析文档 (向量检索模式)
router.post("/analyze", async (req, res) => {
  const { documentId, question, model } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: "缺少文档 ID (documentId)" });
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    console.log(`[RAG] 正在分析文档 ID: ${documentId}，用户提问: "${question}"`);

    // 1. 生成用户问题的 1536 维 Embedding 向量
    const questionEmbedding = await getEmbedding(question);

    const db = getPool();
    const hasVector = isVectorSupported();
    let queryText = "";
    let queryParams = [];

    // 2. 根据数据库支持特性进行向量相似度检索
    if (hasVector) {
      // 使用 pgvector <=> 运算符检索余弦距离最小（最相似）的 5 个片段
      queryText = `
        SELECT content 
        FROM document_chunks 
        WHERE document_id = $1 
        ORDER BY embedding <=> $2 
        LIMIT 5
      `;
      const vectorStr = `[${questionEmbedding.join(",")}]`;
      queryParams = [documentId, vectorStr];
    } else {
      // 降级使用 PL/pgSQL 的 cosine_similarity 计算余弦相似度最大（最相似）的 5 个片段
      queryText = `
        SELECT content 
        FROM document_chunks 
        WHERE document_id = $1 
        ORDER BY cosine_similarity(embedding, $2) DESC 
        LIMIT 5
      `;
      queryParams = [documentId, questionEmbedding];
    }

    const searchResult = await db.query(queryText, queryParams);
    const chunks = searchResult.rows.map(row => row.content);

    console.log(`[RAG] 成功召回相关片段数量: ${chunks.length}`);

    if (chunks.length === 0) {
      res.write(`data: ${JSON.stringify({ type: "error", error: "未能在数据库中匹配到文档片段，请确保上传了有效文档。" })}\n\n`);
      res.end();
      return;
    }

    // 3. 调用 AI 模块进行阅读分析，传入匹配出的 Top-K 片段
    await analyzeDocument(
      chunks,
      question,
      model,
      // 收到数据块
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
  } catch (error) {
    console.error("[RAG] 分析流程出错:", error.message);
    res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
