/**
 * 聊天 API 模块
 * 负责调用 OpenAI 兼容的 API
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前文件的目录路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 创建 OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 可用的模型列表
export const MODELS = [
  { id: "qwen-plus", name: "Qwen-Plus（推荐）" },
  { id: "qwen-turbo", name: "Qwen-Turbo（快速）" },
  { id: "qwen-max", name: "Qwen-Max（最强）" },
  { id: "qwen-long", name: "Qwen-Long（长文本）" },
];

/**
 * 流式聊天
 * @param {Array} messages - 消息列表
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到一块数据时的回调
 * @param {Function} onDone - 完成时的回调
 * @param {Function} onError - 出错时的回调
 */
export async function chatStream(messages, model, onChunk, onDone, onError) {
  try {
    // 调用 API 创建流式请求
    const stream = await client.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullContent = "";
    let usage = null;

    // 逐块读取响应
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content, fullContent);
      }
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    // 完成
    onDone(fullContent, usage);
  } catch (error) {
    // 出错
    onError(error.message);
  }
}
