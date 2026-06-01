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
 * 处理 SSE 流
 */
async function processStream(response, signal, onChunk, onToolCall, onDone, onError) {
  let fullContent = ''
  try {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      if (signal.aborted) {
        reader.cancel()
        onDone(fullContent)
        return
      }

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
                fullContent += data.content
                onChunk(data.content, fullContent)
              } else if (data.type === 'tool_call') {
                onToolCall(data.tool)
              } else if (data.type === 'done') {
                onDone(data.content || fullContent)
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
        onDone(fullContent)
        return
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      onDone(fullContent)
    } else {
      onError(error.message)
    }
  }
}

/**
 * Agent 对话（流式）
 */
export async function agentChat(messages, model, signal, onChunk, onToolCall, onDone, onError) {
  try {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
      signal
    })

    if (!response.ok) {
      onError(`HTTP 错误: ${response.status}`)
      return
    }

    await processStream(response, signal, onChunk, onToolCall, onDone, onError)
  } catch (error) {
    if (error.name !== 'AbortError') {
      onError(error.message)
    }
  }
}
