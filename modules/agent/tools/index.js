/**
 * 工具注册中心
 * 所有工具在这里统一注册和管理
 */

// 存储所有注册的工具
const tools = new Map()

/**
 * 注册工具
 * @param {Object} tool - 工具对象
 * @param {string} tool.name - 工具名称（唯一标识）
 * @param {string} tool.description - 工具描述
 * @param {Object} tool.parameters - 工具参数定义
 * @param {Function} tool.execute - 工具执行函数
 */
export function registerTool(tool) {
  if (!tool.name || !tool.execute) {
    throw new Error('工具必须包含 name 和 execute 属性')
  }
  tools.set(tool.name, tool)
}

/**
 * 获取工具
 * @param {string} name - 工具名称
 * @returns {Object|null} 工具对象
 */
export function getTool(name) {
  return tools.get(name) || null
}

/**
 * 获取所有工具列表
 * @returns {Array} 工具列表
 */
export function getAllTools() {
  return Array.from(tools.values()).map(tool => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters
  }))
}

/**
 * 获取 OpenAI 格式的工具定义（用于 function calling）
 * @returns {Array} OpenAI 工具定义
 */
export function getToolsForOpenAI() {
  return Array.from(tools.values()).map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}

/**
 * 执行工具
 * @param {string} name - 工具名称
 * @param {Object} args - 工具参数
 * @returns {Promise<string>} 执行结果
 */
export async function executeTool(name, args) {
  const tool = tools.get(name)
  if (!tool) {
    return JSON.stringify({ error: `工具 ${name} 不存在` })
  }
  
  try {
    console.log(`[Agent] 执行工具: ${name}`, args)
    const result = await tool.execute(args)
    console.log(`[Agent] 工具结果:`, result)
    return typeof result === 'string' ? result : JSON.stringify(result)
  } catch (error) {
    console.error(`[Agent] 工具执行失败:`, error)
    return JSON.stringify({ error: error.message })
  }
}
