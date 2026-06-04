/**
 * 文档分析模块
 * 负责使用 AI 分析文档内容
 */

import { chatStream } from "../chat/api.js";

/**
 * 分析文档内容 (RAG 增强模式)
 * @param {string[]|string} chunks - 检索到的文档分块数组 (或回退文本)
 * @param {string} question - 用户的问题
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到一块数据时的回调
 * @param {Function} onDone - 完成时的回调
 * @param {Function} onError - 出错时的回调
 */
export async function analyzeDocument(chunks, question, model, onChunk, onDone, onError) {
  // 组装文本分块上下文
  const contextText = Array.isArray(chunks)
    ? chunks.map((c, i) => `[参考片段 ${i + 1}]:\n${c}`).join("\n\n---\n\n")
    : chunks;

  // 构建消息
  const messages = [
    {
      role: "system",
      content: `你是一个专业的文档分析助手。你的任务是基于提供的参考文档片段，严谨、客观地回答用户的问题。
      
要求：
1. **总结文档**：首先给出对这些片段的简短核心摘要（2-3句话）。
2. **提取要点**：用列表形式列出与问题最相关的关键信息和重点内容。
3. **详细回答**：针对用户的具体问题给出详细、准确的回答。回答中如果提及具体数据或关键术语，请使用 **加粗** 标出。

请用中文回答，并仅基于提供的片段内容进行回答。如果参考片段中不包含问题所需信息，请礼貌告知。`,
    },
    {
      role: "user",
      content: `以下是检索出的相关文档片段：

---
${contextText}
---

用户的问题：${question}

请按照以下格式回答：
## 文档摘要
（简要总结提供的参考文档片段核心内容）

## 关键要点
- 要点1
- 要点2
- ...

## 详细回答
（针对问题的具体回答）`,
    },
  ];

  // 调用 AI 进行分析
  await chatStream(messages, model, onChunk, onDone, onError);
}
