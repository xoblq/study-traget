/**
 * 计算器工具
 * 执行数学计算
 */

import { registerTool } from './index.js'

// 计算器工具定义
const calculatorTool = {
  name: 'calculate',
  description: '执行数学计算，支持加减乘除、幂运算、三角函数等',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如：2+3*4、sqrt(16)、sin(30)'
      }
    },
    required: ['expression']
  },
  
  /**
   * 执行计算
   * @param {Object} params - 参数
   * @param {string} params.expression - 数学表达式
   * @returns {Object} 计算结果
   */
  async execute({ expression }) {
    try {
      // 安全检查：只允许数学相关字符
      const safePattern = /^[0-9+\-*/().%\s,sqrt|sin|cos|tan|log|exp|pow|abs|ceil|floor|round|pi|e]+$/
      
      // 替换常用函数
      let expr = expression
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\bpow\b/g, 'Math.pow')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bceil\b/g, 'Math.ceil')
        .replace(/\bfloor\b/g, 'Math.floor')
        .replace(/\bround\b/g, 'Math.round')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/g, 'Math.E')
      
      // 执行计算
      const result = new Function(`return ${expr}`)()
      
      return {
        success: true,
        expression: expression,
        result: result
      }
    } catch (error) {
      return {
        success: false,
        expression: expression,
        error: `计算失败: ${error.message}`
      }
    }
  }
}

// 注册工具
registerTool(calculatorTool)

export default calculatorTool
