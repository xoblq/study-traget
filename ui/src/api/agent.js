/**
 * Agent API 模块
 */

/**
 * 获取可用工具列表
 * @returns {Promise<Array>} 工具列表
 */
export async function getTools() {
  const res = await fetch('/api/agent/tools')
  return res.json()
}

/**
 * Agent 对话（流式）
 * @param {Array} messages - 消息列表
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onToolCall - 工具调用回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function agentChat(messages, model, onChunk, onToolCall, onDone, onError) {
  try {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model })
    })

    if (!response.ok) {
      onError(`HTTP 错误: ${response.status}`)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6)
            if (jsonStr) {
              const data = JSON.parse(jsonStr)
              if (data.type === 'chunk') {
                onChunk(data.content)
              } else if (data.type === 'tool_call') {
                onToolCall(data.tool)
              } else if (data.type === 'done') {
                onDone(data.content)
                return
              } else if (data.type === 'error') {
                onError(data.error)
                return
              }
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e)
          }
        }
      }

      if (done) {
        onDone('')
        return
      }
    }
  } catch (error) {
    onError(error.message)
  }
}
