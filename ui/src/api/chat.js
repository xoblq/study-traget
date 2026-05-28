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
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
async function processStream(response, onChunk, onDone, onError) {
  try {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (value) {
        buffer += decoder.decode(value, { stream: true })
      }
      
      // 处理 buffer 中的数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最后一个可能不完整，保留

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith('data: ')) {
          try {
            const jsonStr = trimmedLine.slice(6)
            if (jsonStr) {
              const data = JSON.parse(jsonStr)
              if (data.type === 'chunk') {
                onChunk(data.content)
              } else if (data.type === 'done') {
                onDone(data.content, data.usage)
                return
              } else if (data.type === 'error') {
                onError(data.error)
                return
              }
            }
          } catch (e) {
            console.error('解析 SSE 数据失败:', e, trimmedLine)
          }
        }
      }

      if (done) {
        // 流结束，处理剩余 buffer
        if (buffer.trim()) {
          const trimmedBuffer = buffer.trim()
          if (trimmedBuffer.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedBuffer.slice(6))
              if (data.type === 'done') {
                onDone(data.content, data.usage)
                return
              }
            } catch (e) {}
          }
        }
        // 如果没有收到 done 事件，手动调用 onDone
        onDone('', null)
        return
      }
    }
  } catch (error) {
    onError(error.message)
  }
}

/**
 * 发送聊天消息（流式）
 * @param {Array} messages - 消息列表
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function chatStream(messages, model, onChunk, onDone, onError) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, model })
    })

    if (!response.ok) {
      onError(`HTTP 错误: ${response.status}`)
      return
    }

    await processStream(response, onChunk, onDone, onError)
  } catch (error) {
    onError(error.message)
  }
}
