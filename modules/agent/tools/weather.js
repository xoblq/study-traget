/**
 * 天气查询工具
 * 使用 wttr.in 免费天气 API（备用：OpenMeteo）
 */

import { registerTool } from './index.js'

/**
 * 从 wttr.in 获取天气
 */
async function fetchFromWttr(city) {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`
  
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'AI-Agent/1.0' },
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const data = await response.json()
    const current = data.current_condition[0]
    const location = data.nearest_area[0]
    
    return {
      success: true,
      city: location.areaName[0].value,
      region: location.region[0].value,
      country: location.country[0].value,
      weather: {
        description: current.lang_zh?.[0]?.value || current.weatherDesc[0].value,
        temperature: current.temp_C,
        feelsLike: current.FeelsLikeC,
        humidity: current.humidity,
        windSpeed: current.windspeedKmph,
        windDirection: current.winddir16Point,
        visibility: current.visibility,
        uvIndex: current.uvIndex
      },
      forecast: data.weather.slice(0, 3).map(day => ({
        date: day.date,
        maxTemp: day.maxtempC,
        minTemp: day.mintempC,
        description: day.hourly[4]?.lang_zh?.[0]?.value || day.hourly[4]?.weatherDesc[0]?.value || ''
      }))
    }
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

/**
 * 从 OpenMeteo 获取天气（免费，无需 API Key）
 */
async function fetchFromOpenMeteo(city) {
  // 先获取城市坐标
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`
  
  const geoResponse = await fetch(geoUrl)
  const geoData = await geoResponse.json()
  
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error('找不到该城市')
  }
  
  const location = geoData.results[0]
  const { latitude, longitude, name, country } = location
  
  // 获取天气数据
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai`
  
  const weatherResponse = await fetch(weatherUrl)
  const weatherData = await weatherResponse.json()
  
  const current = weatherData.current
  
  // 天气代码转描述
  const weatherCodes = {
    0: '晴',
    1: '大部晴朗',
    2: '多云',
    3: '阴天',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '中毛毛雨',
    55: '大毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    80: '阵雨',
    81: '中阵雨',
    82: '大阵雨',
    95: '雷暴',
    96: '雷暴伴小冰雹',
    99: '雷暴伴大冰雹'
  }
  
  return {
    success: true,
    city: name,
    country: country,
    weather: {
      description: weatherCodes[current.weather_code] || '未知',
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: getWindDirection(current.wind_direction_10m)
    },
    forecast: weatherData.daily.time.slice(0, 3).map((date, i) => ({
      date,
      maxTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
      minTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
      description: weatherCodes[weatherData.daily.weather_code[i]] || '未知'
    }))
  }
}

/**
 * 风向转换
 */
function getWindDirection(degrees) {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

// 天气工具定义
const weatherTool = {
  name: 'get_weather',
  description: '查询指定城市的当前天气信息，包括温度、湿度、风速、天气状况等',
  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: '城市名称，支持中文和英文，如：北京、Shanghai、东京、武汉'
      }
    },
    required: ['city']
  },
  
  async execute({ city }) {
    console.log(`[天气工具] 查询城市: ${city}`)
    
    try {
      // 先尝试 wttr.in
      console.log('[天气工具] 尝试 wttr.in...')
      const result = await fetchFromWttr(city)
      console.log('[天气工具] wttr.in 成功')
      return result
    } catch (error) {
      console.log('[天气工具] wttr.in 失败:', error.message)
      
      try {
        // 备用：OpenMeteo
        console.log('[天气工具] 尝试 OpenMeteo...')
        const result = await fetchFromOpenMeteo(city)
        console.log('[天气工具] OpenMeteo 成功')
        return result
      } catch (error2) {
        console.log('[天气工具] OpenMeteo 也失败:', error2.message)
        return {
          success: false,
          error: `天气查询失败: ${error2.message}`
        }
      }
    }
  }
}

// 注册工具
registerTool(weatherTool)

export default weatherTool
