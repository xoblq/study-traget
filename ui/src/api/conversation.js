/**
 * 对话 API 模块
 */

/**
 * 获取对话列表
 * @returns {Promise<Array>} 对话列表
 */
export async function getConversations() {
  const res = await fetch('/api/conversations')
  return res.json()
}

/**
 * 保存对话
 * @param {Object} data - 对话数据
 * @returns {Promise<Object>} 保存结果
 */
export async function saveConversation(data) {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

/**
 * 加载对话
 * @param {string} id - 对话 ID
 * @returns {Promise<Object>} 对话数据
 */
export async function loadConversation(id) {
  const res = await fetch(`/api/conversations/${id}`)
  return res.json()
}

/**
 * 删除对话
 * @param {string} id - 对话 ID
 * @returns {Promise<Object>} 删除结果
 */
export async function deleteConversation(id) {
  const res = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE'
  })
  return res.json()
}
