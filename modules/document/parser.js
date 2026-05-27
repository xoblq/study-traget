/**
 * 文档解析模块
 * 负责解析 PDF 和 Word 文件，提取文本内容
 */

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

/**
 * 解析 PDF 文件
 * @param {Buffer} buffer - 文件内容
 * @returns {Object} 解析结果
 */
export async function parsePDF(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return {
      success: true,
      text: textResult.text,
      pages: textResult.total,
    };
  } catch (error) {
    return {
      success: false,
      error: "PDF 解析失败: " + error.message,
    };
  }
}

/**
 * 解析 Word 文件
 * @param {Buffer} buffer - 文件内容
 * @returns {Object} 解析结果
 */
export async function parseWord(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      success: true,
      text: result.value,
      messages: result.messages,
    };
  } catch (error) {
    return {
      success: false,
      error: "Word 解析失败: " + error.message,
    };
  }
}

/**
 * 根据文件类型解析文件
 * @param {Buffer} buffer - 文件内容
 * @param {string} filename - 文件名
 * @returns {Object} 解析结果
 */
export async function parseFile(buffer, filename) {
  const ext = filename.toLowerCase().split(".").pop();

  if (ext === "pdf") {
    return await parsePDF(buffer);
  } else if (ext === "docx" || ext === "doc") {
    return await parseWord(buffer);
  } else {
    return {
      success: false,
      error: "不支持的文件格式，请上传 PDF 或 Word 文件",
    };
  }
}
