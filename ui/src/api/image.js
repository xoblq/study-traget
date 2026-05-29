/**
 * 图片 API 模块
 */

/**
 * 上传图片
 * @param {File} file - 图片文件
 * @returns {Promise<Object>} 上传结果，包含 base64
 */
export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch('/api/image/upload', {
    method: 'POST',
    body: formData
  })
  return res.json()
}

/**
 * 分析图片（流式）
 * @param {string} imageBase64 - 图片 base64
 * @param {string} question - 用户问题
 * @param {Function} onChunk - 收到数据块回调
 * @param {Function} onDone - 完成回调
 * @param {Function} onError - 错误回调
 */
export async function analyzeImage(imageBase64, question, onChunk, onDone, onError) {
  try {
    const response = await fetch('/api/image/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, question })
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
