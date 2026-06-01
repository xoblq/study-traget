/**
 * 文件上传 API 模块
 */

/**
 * 上传文件
 * @param {File} file - 文件对象
 * @returns {Promise<Object>} 上传结果
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/document/upload', {
    method: 'POST',
    body: formData
  })
  return res.json()
}

/**
 * 处理 SSE 流
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
 * 分析文档（流式）
 */
export async function analyzeDocument(text, question, model, signal, onChunk, onDone, onError) {
  try {
    const response = await fetch('/api/document/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, question, model }),
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
