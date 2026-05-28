/**
 * 图片分析模块
 * 使用 Qwen-VL 模型分析图片内容
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// 支持视觉的模型
const VISION_MODEL = "qwen-vl-max";

/**
 * 分析图片
 * @param {string} imageBase64 - 图片的 base64 编码
 * @param {string} question - 用户的问题
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function analyzeImage(imageBase64, question, onChunk, onDone, onError) {
  try {
    const messages = [
      {
        role: "system",
        content: `你是一个图片分析助手。你可以看到并理解用户上传的图片内容。
请用中文回答，描述要详细准确。如果用户问问题，请基于图片内容回答。`,
      },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: question || "请详细描述这张图片的内容",
          },
        ],
      },
    ];

    const stream = await client.chat.completions.create({
      model: VISION_MODEL,
      messages,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content, fullContent);
      }
    }

    onDone(fullContent);
  } catch (error) {
    onError(error.message);
  }
}
