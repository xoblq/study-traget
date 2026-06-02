/**
 * Agent 核心逻辑
 * 处理工具调用的完整流程
 */

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getToolsForOpenAI, executeTool } from "./tools/index.js";

// 加载环境变量
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// 创建 OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

// Agent 系统提示词
const AGENT_SYSTEM_PROMPT = `你是一个智能助手，可以使用工具来帮助用户解决问题。

使用工具的原则：
1. 当用户的问题需要实时信息（如天气、时间）时，必须调用相应工具
2. 当用户需要计算时，使用计算器工具
3. 先调用工具获取数据，再根据数据回答用户
4. 回答要简洁、准确、友好

请用中文回答。`;

/**
 * 执行 Agent 对话（流式）
 * @param {Array} messages - 消息历史
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onToolCall - 工具调用回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function agentChat(messages, model, onChunk, onToolCall, onDone, onError) {
  try {
    // 获取所有工具定义
    const tools = getToolsForOpenAI();
    
    // 添加系统提示词
    const fullMessages = [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      ...messages
    ];

    // 第一次调用：让 AI 决定是否需要调用工具
    console.log('[Agent] 调用 AI，工具数量:', tools.length)
    const response = await client.chat.completions.create({
      model: model || "qwen-plus",
      messages: fullMessages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? "auto" : undefined,
    });

    const assistantMessage = response.choices[0].message;
    console.log('[Agent] AI 响应:', assistantMessage.content ? '有内容' : '无内容')
    console.log('[Agent] 工具调用:', assistantMessage.tool_calls ? assistantMessage.tool_calls.length : 0)
    
    // 检查是否有工具调用
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // 通知前端正在调用工具
      for (const toolCall of assistantMessage.tool_calls) {
        console.log('[Agent] 调用工具:', toolCall.function.name)
        console.log('[Agent] 工具参数:', toolCall.function.arguments)
        onToolCall({
          id: toolCall.id,
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments)
        });
      }

      // 执行所有工具调用
      const toolResults = [];
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);
        console.log('[Agent] 工具结果:', result.substring(0, 200) + '...')
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result
        });
      }

      // 第二次调用：让 AI 根据工具结果生成回答
      const finalMessages = [
        ...fullMessages,
        assistantMessage,
        ...toolResults
      ];

      // 流式输出最终回答
      const stream = await client.chat.completions.create({
        model: model || "qwen-plus",
        messages: finalMessages,
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
    } else {
      // 没有工具调用，直接输出回答
      const content = assistantMessage.content || "";
      onChunk(content, content);
      onDone(content);
    }
  } catch (error) {
    console.error("[Agent] 执行失败:", error);
    onError(error.message);
  }
}
