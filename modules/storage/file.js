/**
 * 文件存储模块
 * 负责保存和加载对话记录
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONVERSATIONS_DIR = path.resolve(__dirname, "../../data/conversations");

/**
 * 确保目录存在
 */
async function ensureDir() {
  await fs.mkdir(CONVERSATIONS_DIR, { recursive: true });
}

/**
 * 获取所有对话列表
 * @returns {Array} 对话列表
 */
export async function listConversations() {
  await ensureDir();
  const files = await fs.readdir(CONVERSATIONS_DIR);
  const conversations = [];

  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = await fs.readFile(path.join(CONVERSATIONS_DIR, file), "utf-8");
      const data = JSON.parse(content);
      conversations.push({
        id: file.replace(".json", ""),
        title: data.title || "未命名对话",
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    }
  }

  // 按更新时间排序
  conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return conversations;
}

/**
 * 保存对话
 * @param {Object} data - 对话数据
 * @returns {Object} 保存后的对话信息
 */
export async function saveConversation(data) {
  await ensureDir();
  const id = data.id || Date.now().toString();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);

  // 读取已有的数据（如果存在）
  let existingData = {};
  try {
    const content = await fs.readFile(filePath, "utf-8");
    existingData = JSON.parse(content);
  } catch {}

  // 合并数据
  const conversation = {
    id: id,
    title: data.title || data.messages[0]?.content?.slice(0, 50) || "未命名对话",
    messages: data.messages,
    systemPrompt: data.systemPrompt,
    model: data.model,
    createdAt: existingData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 写入文件
  await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
  return conversation;
}

/**
 * 加载对话
 * @param {string} id - 对话 ID
 * @returns {Object} 对话数据
 */
export async function loadConversation(id) {
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * 删除对话
 * @param {string} id - 对话 ID
 */
export async function deleteConversation(id) {
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
  await fs.unlink(filePath);
}
