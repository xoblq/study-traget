/**
 * 向量生成 (Embedding) 模块
 * 负责调用通义千问 API 获得高维语义向量
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 创建具有 OpenAI 兼容协议的 DashScope 客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

/**
 * 获取单条文本的向量表达（采用通义千问推荐的 1536 维 text-embedding-v3 模型）
 * @param {string} text - 输入文本内容
 * @returns {Promise<number[]>} 返回 1536 维浮点数向量数组
 */
export async function getEmbedding(text) {
  try {
    const response = await client.embeddings.create({
      model: "text-embedding-v3",
      input: text,
    });
    
    if (response && response.data && response.data[0]) {
      return response.data[0].embedding;
    }
    
    throw new Error("返回数据结构异常，未能成功取得 embedding 向量");
  } catch (error) {
    console.error("[Embedding] 语义向量生成失败:", error.message);
    throw error;
  }
}
