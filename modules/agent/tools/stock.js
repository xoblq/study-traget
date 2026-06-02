/**
 * 股票查询工具
 * 使用新浪财经 API 查询股票实时数据
 */

import { registerTool } from './index.js'

/**
 * 识别股票市场
 * @param {string} symbol - 股票代码或名称
 * @returns {Object} 市场信息
 */
function detectMarket(symbol) {
  symbol = symbol.trim().toUpperCase()
  
  // A 股代码：6位数字
  if (/^\d{6}$/.test(symbol)) {
    // 沪市：60开头，深市：00/30开头
    if (symbol.startsWith('60') || symbol.startsWith('68')) {
      return { market: 'sh', code: symbol, prefix: 'sh' }
    } else {
      return { market: 'sz', code: symbol, prefix: 'sz' }
    }
  }
  
  // 港股代码：5位数字
  if (/^\d{1,5}$/.test(symbol)) {
    return { market: 'hk', code: symbol.padStart(5, '0'), prefix: 'hk' }
  }
  
  // 美股代码：字母
  if (/^[A-Z]+$/.test(symbol)) {
    return { market: 'us', code: symbol, prefix: 'gb' }
  }
  
  // 默认返回 A 股
  return { market: 'unknown', code: symbol, prefix: '' }
}

/**
 * 从新浪财经获取股票数据
 * @param {string} symbol - 股票代码
 * @param {string} market - 市场类型
 * @returns {Promise<Object>} 股票数据
 */
async function fetchStockData(symbol, market) {
  try {
    let url = ''
    
    if (market === 'hk') {
      url = `https://hq.sinajs.cn/list=hk${symbol}`
    } else if (market === 'us') {
      url = `https://hq.sinajs.cn/list=gb${symbol}`
    } else {
      url = `https://hq.sinajs.cn/list=${symbol}`
    }
    
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`)
    }
    
    const text = await response.text()
    
    // 解析返回数据
    // 格式: var hq_str_xxx="字段1,字段2,...";
    const match = text.match(/="([^"]+)"/)
    if (!match) {
      throw new Error('无法解析股票数据')
    }
    
    const fields = match[1].split(',')
    
    if (market === 'hk') {
      // 港股数据格式
      return {
        success: true,
        market: '港股',
        name: fields[1],
        code: symbol,
        price: parseFloat(fields[6]),
        change: parseFloat(fields[7]),
        changePercent: parseFloat(fields[8]),
        open: parseFloat(fields[2]),
        high: parseFloat(fields[4]),
        low: parseFloat(fields[5]),
        volume: parseInt(fields[12]),
        marketCap: fields[17] ? (parseFloat(fields[17]) / 100000000).toFixed(2) + '亿' : '未知',
        currency: 'HKD'
      }
    } else if (market === 'us') {
      // 美股数据格式
      return {
        success: true,
        market: '美股',
        name: fields[0],
        code: symbol,
        price: parseFloat(fields[1]),
        change: parseFloat(fields[4]),
        changePercent: parseFloat(fields[2]),
        open: parseFloat(fields[5]),
        high: parseFloat(fields[6]),
        low: parseFloat(fields[7]),
        volume: parseInt(fields[10]),
        marketCap: '未知',
        currency: 'USD'
      }
    } else {
      // A 股数据格式
      return {
        success: true,
        market: 'A股',
        name: fields[0],
        code: symbol,
        price: parseFloat(fields[3]),
        change: parseFloat(fields[3]) - parseFloat(fields[2]),
        changePercent: ((parseFloat(fields[3]) - parseFloat(fields[2])) / parseFloat(fields[2]) * 100).toFixed(2),
        open: parseFloat(fields[1]),
        high: parseFloat(fields[4]),
        low: parseFloat(fields[5]),
        volume: parseInt(fields[8]),
        marketCap: '未知',
        currency: 'CNY'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 股票查询工具定义
 */
const stockTool = {
  name: 'stock_query',
  description: '查询股票实时信息，包括当前价格、涨跌幅、开盘价、最高价、最低价、成交量等。支持 A 股、港股、美股。',
  parameters: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: '股票代码，如：600519（茅台）、01810（小米）、AAPL（苹果）'
      }
    },
    required: ['symbol']
  },
  
  async execute({ symbol }) {
    console.log(`[股票工具] 查询: ${symbol}`)
    
    const market = detectMarket(symbol)
    console.log(`[股票工具] 识别市场: ${market.market}, 代码: ${market.code}`)
    
    const result = await fetchStockData(market.code, market.market)
    console.log(`[股票工具] 查询结果:`, result)
    
    return result
  }
}

// 注册工具
registerTool(stockTool)

export default stockTool
