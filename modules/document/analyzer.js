/**
 * 文档分析模块
 * 负责使用 AI 分析文档内容
 */

import { chatStream } from "../chat/api.js";

/**
 * 分析文档内容
 * @param {string} text - 文档文本内容
 * @param {string} question - 用户的问题
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到一块数据时的回调
 * @param {Function} onDone - 完成时的回调
 * @param {Function} onError - 出错时的回调
 */
export async function analyzeDocument(text, question, model, onChunk, onDone, onError) {
  // 截取前 8000 个字符，避免超出 token 限制
  const truncatedText = text.slice(0, 8000);

  // 构建消息
  const messages = [
    {
      role: "system",
      content: `你是一个专业的文档分析助手。你的任务是：

1. **总结文档**：首先给出文档的核心摘要（2-3句话）
2. **提取要点**：用列表形式列出关键信息和重点内容
3. **回答问题**：针对用户的具体问题给出详细回答

回答格式要求：
- 使用 **加粗** 标记重要信息
- 使用 \`代码\` 标记专业术语
- 使用列表结构让内容更清晰
- 如果有数据或数字，要特别标注出来

请用中文回答。`,
    },
    {
      role: "user",
      content: `以下是文档内容：

---
${truncatedText}
---

用户的问题：${question}

请按照以下格式回答：
## 文档摘要
（简要总结文档核心内容）

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
