/**
 * 文本分块工具模块
 * 用于将超长文档切分为固定大小的片段以适应向量计算
 */

/**
 * 将长文本按滑动窗口大小和重叠大小切分为数组
 * @param {string} text - 原始文本内容
 * @param {number} size - 每个文本块的目标字符数 (默认 600)
 * @param {number} overlap - 相邻块之间的重叠字符数 (默认 100，以防止语义在切口处断开)
 * @returns {string[]} 切分后的文本块数组
 */
export function chunkText(text, size = 600, overlap = 100) {
  if (!text) return [];
  const chunks = [];
  let index = 0;

  // 保证滑动窗口不会死循环
  const step = size - overlap;
  if (step <= 0) {
    throw new Error("分块大小 (size) 必须大于重叠大小 (overlap)");
  }

  while (index < text.length) {
    // 截取当前窗口的文本
    const chunk = text.slice(index, index + size).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    // 滑动窗口向前移动
    index += step;
  }

  return chunks;
}
