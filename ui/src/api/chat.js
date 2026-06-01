/**
 * 聊天 API 模块
 */

/**
 * 获取可用模型列表
 * @returns {Promise<Array>} 模型列表
 */
export async function getModels() {
  const res = await fetch('/api/models')
  return res.json()
}

/**
 * 处理 SSE 流
 * @param {Response} response - fetch 响应对象
 * @param {AbortSignal} signal - 中断信号
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
async function processStream(response, signal, onChunk, onDone, onError) {
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
 * 发送聊天消息（流式）
 * @param {Array} messages - 消息列表
 * @param {string} model - 模型名称
 * @param {AbortSignal} signal - 中断信号
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 * @returns {AbortController} 控制器，可用于中断请求
 */
export async function chatStream(messages, model, signal, onChunk, onDone, onError) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model }),
      signal
    })

    if (!response.ok) {
      onError(`HTTP 错误: ${response.status}`)
      return
    }

    await processStream(response, signal, onChunk, onDone, onError)
  } catch (error) {
    if (error.name !== 'AbortError') {
      onError(error.message)
    }
  }
}
