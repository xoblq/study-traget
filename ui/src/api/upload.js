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
        onDone('', null)
        return
      }
    }
  } catch (error) {
    onError(error.message)
  }
}

/**
 * 分析文档（流式）
 * @param {string} text - 文档文本
 * @param {string} question - 用户问题
 * @param {string} model - 模型名称
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function analyzeDocument(text, question, model, onChunk, onDone, onError) {
  try {
    const response = await fetch('/api/document/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, question, model })
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
