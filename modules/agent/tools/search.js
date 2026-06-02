/**
 * 搜索工具
 * 使用 searchapi.io 获取 Google 搜索结果
 */

import { registerTool } from './index.js'

// searchapi.io API Key
const SEARCH_API_KEY = 'Ex7Vtb6Xow38PDQoNbykRTC8'

/**
 * 使用 searchapi.io 搜索
 */
async function searchWithAPI(query) {
  try {
    const url = `https://www.searchapi.io/api/v1/search?engine=google&q=${encodeURIComponent(query)}&api_key=${SEARCH_API_KEY}&gl=cn&hl=zh-cn`
    
    console.log('[搜索工具] 请求 URL:', url)
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    console.log('[搜索工具] 响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('[搜索工具] 错误响应:', errorText)
      throw new Error(`搜索失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('[搜索工具] 返回数据 keys:', Object.keys(data))
    
    // 提取搜索结果
    const results = []
    
    // 有机搜索结果
    if (data.organic_results) {
      console.log('[搜索工具] 有机结果数量:', data.organic_results.length)
      for (const item of data.organic_results.slice(0, 8)) {
        results.push({
          title: item.title || '',
          link: item.link || '',
          snippet: item.snippet || '',
          position: item.position
        })
      }
    } else {
      console.log('[搜索工具] 没有有机结果')
    }
    
    // 如果有知识图谱，添加到结果前面
    if (data.knowledge_graph) {
      console.log('[搜索工具] 有知识图谱')
      const kg = data.knowledge_graph
      results.unshift({
        title: kg.title || '',
        link: kg.source?.link || '',
        snippet: kg.description || '',
        type: 'knowledge_graph'
      })
    }
    
    console.log('[搜索工具] 最终结果数量:', results.length)
    
    return results
  } catch (error) {
    console.error('[搜索工具] 搜索错误:', error.message)
    throw new Error(`搜索失败: ${error.message}`)
  }
}

/**
 * 搜索工具定义
 */
const searchTool = {
  name: 'search_web',
  description: '搜索互联网获取实时信息，如新闻、产品价格、天气、技术问题、人物信息等。当用户需要最新信息、查询产品价格、了解新闻事件时使用此工具。',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词，如：小米YU7价格、2024年最新电影、iPhone 16 参数'
      }
    },
    required: ['query']
  },
  
  async execute({ query }) {
    console.log(`[搜索工具] 开始搜索: ${query}`)
    
    try {
      const results = await searchWithAPI(query)
      
      if (results.length === 0) {
        return {
          success: true,
          query,
          results: [],
          message: '没有找到相关结果'
        }
      }
      
      return {
        success: true,
        query,
        results,
        count: results.length
      }
    } catch (error) {
      console.error('[搜索工具] 执行错误:', error.message)
      return {
        success: false,
        query,
        error: error.message
      }
    }
  }
}

// 注册工具
registerTool(searchTool)

export default searchTool
