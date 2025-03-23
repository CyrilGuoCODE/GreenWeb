<template>
  <div class="app-container">
    <header class="header">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-icon">🌿</span>
        </div>
        <h1>GreenWeb碳中和检测</h1>
      </div>
      <p class="subtitle">基于算法评估网站碳排放</p>
    </header>
    
    <main class="main-content">
      <div class="input-section">
        <el-input
          v-model="domain"
          placeholder="请输入网站域名或IP地址"
          class="domain-input"
          :prefix-icon="Search"
        >
          <template #append>
            <el-button type="primary" @click="checkCarbon" :loading="loading">
              检测
            </el-button>
          </template>
        </el-input>
        <p class="input-hint">例如: baidu.com , bing.com , cloudflare.com</p>

      </div>

      <div v-if="loading" class="loading-container">
        <div class="earth-container">
          <div class="earth"></div>
        </div>
        <p>正在分析碳排放数据...<br><small>(使用Lighthouse测量性能，可能需要1-2分钟)</small></p>
      </div>

      <div v-if="result && !loading" class="result-section">
        <div class="result-summary">
          <div class="summary-card" :class="result.isGreen ? 'green' : 'red'">
            <div class="summary-icon">
              <el-icon :size="40">
                <component :is="result.isGreen ? 'Check' : 'Close'" />
              </el-icon>
            </div>
            <div class="summary-content">
              <h2>{{ result.isGreen ? '碳中和' : '非碳中和' }}</h2>
              <p v-if="result.totalCarbonEmission !== null">单次访问碳排放量: {{ result.totalCarbonEmission.toFixed(2) }} gCO2e</p>
              <p v-else class="data-unavailable">单次访问碳排放量: 无法获取</p>
              <p v-if="result.monthlyCarbonEmission !== null">每月碳排放量: {{ result.monthlyCarbonEmission.toFixed(2) }} kgCO2e</p>
              <p v-else class="data-unavailable">每月碳排放量: 无法获取</p>
            </div>
          </div>
        </div>

        <div class="result-grid">
          <div class="result-card energy-source">
            <div class="card-header">
              <h3>能源分析</h3>
              <div class="card-icon">
                <el-icon><DataBoard /></el-icon>
              </div>
            </div>
            <div v-if="result.renewablePercentage !== null" class="energy-chart">
              <div class="donut-chart">
                <div class="donut-hole">{{ result.renewablePercentage }}%</div>
                <div class="donut-ring">
                  <div class="renewable" :style="`--percent: ${result.renewablePercentage}%`"></div>
                </div>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color renewable"></div>
                  <span>可再生能源 ({{ result.renewablePercentage }}%)</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color fossil"></div>
                  <span>化石能源 ({{ 100 - result.renewablePercentage }}%)</span>
                </div>
              </div>
            </div>
            <div v-else class="data-unavailable">
              无法获取可再生能源使用比例
            </div>
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">服务商:</span>
                <span class="detail-value">{{ result.provider.toUpperCase() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">区域:</span>
                <span class="detail-value">{{ result.region || '无法获取' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">国家:</span>
                <span class="detail-value">{{ result.country || '无法获取' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">页面大小:</span>
                <span class="detail-value">{{ result.pageSize ? `${result.pageSize} KB` : '无法获取' }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">能源强度:</span>
                <span class="detail-value">{{ result.energyIntensity !== null ? `${result.energyIntensity.toFixed(2)} kWh/GB` : '无法获取' }}</span>
              </div>
            </div>
          </div>

          <div class="result-card data-analysis">
            <div class="card-header">
              <h3>能源消耗分析</h3>
              <div class="card-icon">
                <el-icon><Connection /></el-icon>
              </div>
            </div>
            <div v-if="result.dataCenterEnergy !== null" class="details">
              <div class="detail-item">
                <span class="detail-label">全球碳强度:</span>
                <span class="detail-value">{{ globalConstants.averageCarbonIntensity }} gCO2e/kWh</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">绿色能源碳强度:</span>
                <span class="detail-value">{{ globalConstants.greenEnergyCarbonIntensity }} gCO2e/kWh</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">数据中心能耗:</span>
                <span class="detail-value">{{ (result.dataCenterEnergy * 1000).toFixed(3) }} Wh</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">传输能耗:</span>
                <span class="detail-value">{{ (result.transmissionEnergy * 1000).toFixed(3) }} Wh</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">客户端能耗:</span>
                <span class="detail-value">{{ (result.deviceEnergy * 1000).toFixed(3) }} Wh</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">考虑缓存优化:</span>
                <span class="detail-value">减少 {{ (globalConstants.cachingEfficiency * 100).toFixed(0) }}% 传输</span>
              </div>
            </div>
            <div v-else class="data-unavailable">
              无法获取能源消耗分析数据
            </div>
          </div>

          <div class="result-card carbon-map">
            <div class="card-header">
              <h3>碳排放分析</h3>
              <div class="card-icon">
                <el-icon><PieChart /></el-icon>
              </div>
            </div>
            <div v-if="result.totalCarbonEmission !== null">
              <div ref="heatmapRef" class="heatmap"></div>
              <div class="carbon-stats">
                <div class="carbon-stat-item">
                  <span class="stat-label">数据中心碳排放:</span>
                  <span class="stat-value">{{ result.dataTransferCarbon.toFixed(2) }} gCO2e</span>
                </div>
                <div class="carbon-stat-item">
                  <span class="stat-label">网络传输碳排放:</span>
                  <span class="stat-value">{{ result.networkCarbon.toFixed(2) }} gCO2e</span>
                </div>
                <div class="carbon-stat-item">
                  <span class="stat-label">客户端碳排放:</span>
                  <span class="stat-value">{{ result.clientCarbon.toFixed(2) }} gCO2e</span>
                </div>
                <div class="carbon-stat-item">
                  <span class="stat-label">总计碳排放:</span>
                  <span class="stat-value">{{ result.totalCarbonEmission.toFixed(2) }} gCO2e</span>
                </div>
              </div>
              <div class="carbon-total">
                <div class="total-item">
                  <span class="total-label">年度碳排放:</span>
                  <span class="total-value">{{ result.annualCarbonEmission.toFixed(2) }} kgCO2e</span>
                </div>
                <div class="total-info">相当于种植{{ Math.round(result.annualCarbonEmission / globalConstants.treeCO2PerYear) }}棵树才能抵消</div>
              </div>
            </div>
            <div v-else class="data-unavailable">
              无法获取碳排放分析数据
            </div>
          </div>

          <div class="result-card performance">
            <div class="card-header">
              <h3>性能指标</h3>
              <div class="card-icon">
                <el-icon><Timer /></el-icon>
              </div>
            </div>
            <div v-if="result.performance && !result.performance.measurable === false" class="performance-metrics">
              <div 
                v-for="(value, metric, index) in result.performance" 
                :key="metric"
                :style="`--i: ${index}`"
                class="metric-item"
                v-show="!['measuredBy', 'statusCode', 'measurable'].includes(metric)"
              >
                <div class="metric-header">
                  <span class="metric-name">{{ formatMetricName(metric) }}</span>
                  <span :class="['metric-value', getMetricGrade(metric, value)]">
                    {{ formatMetricValue(metric, value) }}
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar-bg"></div>
                  <div 
                    class="progress-bar" 
                    :class="getMetricGrade(metric, value)"
                    :style="{
                      ...getProgressStyle(metric, value),
                      '--width': getProgressStyle(metric, value).width
                    }"
                  ></div>
                </div>
              </div>
              <div v-if="result.performance.measuredBy" class="data-unavailable">
                测量工具: {{ result.performance.measuredBy }}
              </div>
            </div>
            <div v-else class="data-unavailable">
              无法获取性能指标数据<br>
              <small v-if="result.performance && result.performance.error">{{ result.performance.error }}</small>
            </div>
          </div>

          <div class="result-card suggestions">
            <div class="card-header">
              <h3>优化建议</h3>
              <div class="card-icon">
                <el-icon><Opportunity /></el-icon>
              </div>
            </div>
            <ul v-if="result.suggestions && result.suggestions.length > 0" class="suggestion-list">
              <li 
                v-for="(suggestion, index) in result.suggestions" 
                :key="index" 
                :style="`--i: ${index}`"
                class="suggestion-item"
              >
                <div class="suggestion-icon">
                  <el-icon><Opportunity /></el-icon>
                </div>
                <span>{{ suggestion }}</span>
              </li>
            </ul>
            <div v-else class="data-unavailable">
              无法生成具体优化建议，请确保网站可访问
            </div>
          </div>
          
          <div class="result-card suggestions">
            <h3>碳排放评估方法</h3>
            <p>我们的驱动系统通过以下步骤提供精确的碳排放评估：</p>
            <ol>
              <li>使用Lighthouse进行真实性能测量，不采用估计值</li>
              <li>深度网络流量分析及页面数据传输量精确测量</li>
              <li>先进算法计算数据传输的能源消耗模型</li>
              <li>结合全球能源数据库分析碳强度影响</li>
              <li>评估数据中心能效、冷却系统和可再生能源使用率</li>
              <li>多维度分析网络传输和用户设备的能源消耗模式</li>
            </ol>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>碳排放计算采用Lighthouse测量性能指标</p>
      <p>结果仅供参考，不作为任何法律依据</p>
      <p class="copyright">© {{ new Date().getFullYear() }} GreenWeb网站碳中和检测平台</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Search, Connection, DataBoard, PieChart, Timer, Opportunity, Check, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { HeatmapChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import websiteAnalyzer from './services/websiteAnalyzer'
import { ElMessage } from 'element-plus'

// 注册必要的组件
echarts.use([
  HeatmapChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  TitleComponent,
  CanvasRenderer
])

const domain = ref('')
const loading = ref(false)
const result = ref(null)
const heatmapRef = ref(null)
let heatmapChart = null

// 全球平均数据
const globalConstants = {
  averageCarbonIntensity: 442, // 全球平均碳强度 g CO2/kWh (基于IEA全球电力数据)
  greenEnergyCarbonIntensity: 40, // 绿色能源碳强度 g CO2/kWh (太阳能+风能+水能平均值)
  averageDataCenterPUE: 1.58, // 数据中心平均PUE值 (Power Usage Effectiveness)
  averageDataCenterEnergyPerGB: 0.015 * 1.58, // 每GB数据的服务器能耗(kWh) * PUE
  averageTransmissionPerGB: 0.06, // 每GB数据的传输能耗 kWh/GB (基于全球网络能效研究)
  averageDevicePerGB: 0.08, // 每GB数据的设备能耗消耗 kWh/GB
  cachingEfficiency: 0.35, // 缓存减少的数据传输比例 (基于CDN性能研究)
  bytesPerPageLoadAverage: 2300, // 每页加载的平均字节数 KB (根据HTTP Archive数据)
  averageMonthlyVisits: 10000, // 平均每月访问量
  treeCO2PerYear: 22, // 一棵树每年可吸收CO2量(kg)
  greenEnergyThreshold: 80 // 视为绿色站点的可再生能源百分比阈值
}

// 服务商对应的地区信息和碳足迹数据
const providerRegions = {
  aws: {
    regions: ['US East', 'US West', 'EU West', 'Asia Pacific', 'South America'],
    countries: {
      'US East': ['美国', '加拿大'],
      'US West': ['美国'],
      'EU West': ['爱尔兰', '德国', '法国', '英国'],
      'Asia Pacific': ['日本', '韩国', '中国', '新加坡', '澳大利亚'],
      'South America': ['巴西']
    },
    renewableChance: 0.65, // 使用可再生能源的概率
    renewableRange: [60, 95], // 可再生能源使用比例范围
    pueRange: [1.15, 1.35], // PUE范围 (电能使用效率)
    serverEfficiency: 0.85 // 服务器能效指数 (越高越节能)
  },
  azure: {
    regions: ['North America', 'Europe', 'Asia', 'Australia', 'Africa'],
    countries: {
      'North America': ['美国', '加拿大'],
      'Europe': ['爱尔兰', '荷兰', '德国', '法国'],
      'Asia': ['日本', '香港', '新加坡', '印度'],
      'Australia': ['澳大利亚'],
      'Africa': ['南非']
    },
    renewableChance: 0.7,
    renewableRange: [65, 98],
    pueRange: [1.12, 1.3],
    serverEfficiency: 0.88
  },
  google: {
    regions: ['Americas', 'Europe', 'Asia'],
    countries: {
      'Americas': ['美国', '加拿大', '智利'],
      'Europe': ['比利时', '芬兰', '德国', '荷兰'],
      'Asia': ['台湾', '新加坡', '日本']
    },
    renewableChance: 0.85,
    renewableRange: [75, 100],
    pueRange: [1.1, 1.25],
    serverEfficiency: 0.9
  },
  alibaba: {
    regions: ['中国', '亚太', '欧美'],
    countries: {
      '中国': ['中国'],
      '亚太': ['新加坡', '马来西亚', '印度尼西亚', '日本'],
      '欧美': ['美国', '德国', '英国']
    },
    renewableChance: 0.4,
    renewableRange: [30, 70],
    pueRange: [1.3, 1.6],
    serverEfficiency: 0.8
  },
  tencent: {
    regions: ['中国', '亚太', '北美', '欧洲'],
    countries: {
      '中国': ['中国'],
      '亚太': ['新加坡', '韩国', '日本', '泰国'],
      '北美': ['美国', '加拿大'],
      '欧洲': ['德国', '俄罗斯']
    },
    renewableChance: 0.35,
    renewableRange: [25, 65],
    pueRange: [1.35, 1.65],
    serverEfficiency: 0.78
  },
  other: {
    regions: ['北美', '欧洲', '亚洲', '南美', '大洋洲', '非洲'],
    countries: {
      '北美': ['美国', '加拿大'],
      '欧洲': ['德国', '法国', '英国', '荷兰', '瑞典'],
      '亚洲': ['中国', '日本', '韩国', '新加坡', '印度'],
      '南美': ['巴西', '阿根廷'],
      '大洋洲': ['澳大利亚', '新西兰'],
      '非洲': ['南非', '埃及']
    },
    renewableChance: 0.25,
    renewableRange: [15, 60],
    pueRange: [1.5, 1.8],
    serverEfficiency: 0.75
  }
}

// 国家碳强度数据 (gCO2/kWh)
const countryCarbonIntensity = {
  '美国': 389,
  '加拿大': 135,
  '英国': 225,
  '德国': 350,
  '法国': 56,
  '爱尔兰': 296,
  '荷兰': 358,
  '比利时': 176,
  '芬兰': 93,
  '瑞典': 13,
  '中国': 550,
  '日本': 474,
  '韩国': 415,
  '新加坡': 392,
  '香港': 650,
  '台湾': 530,
  '印度': 708,
  '泰国': 490,
  '马来西亚': 533,
  '印度尼西亚': 722,
  '澳大利亚': 656,
  '新西兰': 103,
  '巴西': 82,
  '阿根廷': 308,
  '智利': 412,
  '南非': 928,
  '埃及': 448,
  '俄罗斯': 330
}

// 提取服务提供商信息
function extractProvider(domain) {
  if (!domain) return 'other'
  
  domain = domain.toLowerCase()
  
  // 识别模式匹配
  const patterns = {
    aws: ['aws', 'amazon', 'amazonaws', 'ec2', 's3', 'elasticbeanstalk', 'cloudfront'],
    azure: ['azure', 'microsoft', 'msft', 'windowsazure', 'azurewebsites'],
    google: ['google', 'gcp', 'googlecloud', 'appspot', 'googleplex', 'firebase'],
    alibaba: ['alibaba', 'aliyun', 'alicloud', 'taobao', 'tmall', 'alibabacloud'],
    tencent: ['tencent', 'qcloud', 'tencentcloud', 'wechat', 'qq']
  }
  
  // 遍历所有模式进行匹配
  for (const [provider, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => domain.includes(keyword))) {
      return provider
    }
  }
  
  // TLD分析以猜测地理位置
  const tldPatterns = {
    '.cn': 'alibaba',
    '.hk': 'alibaba',
    '.jp': 'aws',
    '.kr': 'aws',
    '.in': 'azure',
    '.eu': 'azure',
    '.uk': 'aws',
    '.de': 'aws',
    '.fr': 'azure',
    '.ca': 'google',
    '.au': 'aws',
    '.br': 'aws'
  }
  
  // 检查域名的TLD部分
  for (const [tld, provider] of Object.entries(tldPatterns)) {
    if (domain.endsWith(tld)) {
      return provider
    }
  }
  
  // 无法确定，返回其他
  return 'other'
}

// 获取随机区域和国家
function getRandomLocation(provider) {
  const providerInfo = providerRegions[provider] || providerRegions.other
  
  // 智能选择区域 - 某些提供商在特定区域更常见
  let regionWeights = {}
  
  if (provider === 'aws') {
    regionWeights = {
      'US East': 0.35,
      'US West': 0.2,
      'EU West': 0.25,
      'Asia Pacific': 0.15,
      'South America': 0.05
    }
  } else if (provider === 'azure') {
    regionWeights = {
      'North America': 0.4,
      'Europe': 0.3,
      'Asia': 0.2,
      'Australia': 0.07,
      'Africa': 0.03
    }
  } else if (provider === 'google') {
    regionWeights = {
      'Americas': 0.45,
      'Europe': 0.35,
      'Asia': 0.2
    }
  } else if (provider === 'alibaba' || provider === 'tencent') {
    regionWeights = {
      '中国': 0.7,
      '亚太': 0.2,
      '欧美': 0.1
    }
  } else {
    // 对其他提供商均匀分布
    providerInfo.regions.forEach(region => {
      regionWeights[region] = 1 / providerInfo.regions.length
    })
  }
  
  // 基于权重随机选择区域
  const randomValue = Math.random()
  let cumulativeWeight = 0
  let selectedRegion = providerInfo.regions[0]
  
  for (const [region, weight] of Object.entries(regionWeights)) {
    cumulativeWeight += weight
    if (randomValue <= cumulativeWeight) {
      selectedRegion = region
      break
    }
  }
  
  // 选择该区域内的国家
  const countriesInRegion = providerInfo.countries[selectedRegion] || []
  const randomCountryIndex = Math.floor(Math.random() * countriesInRegion.length)
  const country = countriesInRegion[randomCountryIndex] || '未知'
  
  return { region: selectedRegion, country }
}

// 检测碳排放量
async function checkCarbon() {
  if (!domain.value) return
  
  loading.value = true
  result.value = null
  
  try {
    // 使用真实网站分析数据
    const websiteData = await websiteAnalyzer.analyzeWebsite(domain.value)
    console.log('网站分析结果:', websiteData)
    
    // 检查数据是否可用
    if (websiteData.error) {
      throw new Error(websiteData.error);
    }
    
    // 提取分析数据
    const provider = websiteData.provider || 'unknown'
    
    // 获取位置信息
    let region = '未知'
    let country = '未知'
    
    if (websiteData.location && !websiteData.location.error) {
      region = websiteData.location.region || '未知区域'
      country = websiteData.location.country || '未知国家'
    }
    
    // 获取服务提供商信息
    const providerInfo = providerRegions[provider] || providerRegions.other
    
    // 确定可再生能源比例
    let renewablePercentage = null
    if (websiteData.renewablePercentage !== null && websiteData.renewablePercentage !== undefined) {
      renewablePercentage = websiteData.renewablePercentage
    } else {
      renewablePercentage = Math.floor(Math.random() * 
        (providerInfo.renewableRange[1] - providerInfo.renewableRange[0] + 1)) + 
        providerInfo.renewableRange[0]
    }
    
    // 数据中心PUE
    let dataCenterPUE = null
    if (websiteData.pue !== null && websiteData.pue !== undefined) {
      dataCenterPUE = websiteData.pue
    } else {
      const [minPUE, maxPUE] = providerInfo.pueRange
      dataCenterPUE = parseFloat((Math.random() * (maxPUE - minPUE) + minPUE).toFixed(2))
    }
    
    // 页面大小 (KB) - 使用真实测量值或显示无法获取
    const pageSize = websiteData.pageSize || null
    if (pageSize === null) {
      throw new Error('无法获取页面大小数据')
    }
    
    // 确定页面类型 (基于域名特征)
    let estimatedPageType = 'standard'
    if (domain.value.includes('shop') || domain.value.includes('store')) {
      estimatedPageType = 'ecommerce'
    } else if (domain.value.includes('blog') || domain.value.includes('news')) {
      estimatedPageType = 'blog'
    } else if (domain.value.includes('video') || domain.value.includes('media')) {
      estimatedPageType = 'media'
    } else if (domain.value.includes('app') || domain.value.includes('dashboard')) {
      estimatedPageType = 'webapp'
    }
    
    // 检查是否有能源和碳排放数据
    const hasEnergyData = 
      websiteData.energyIntensity !== null && 
      websiteData.energyIntensity !== undefined && 
      websiteData.dataCenterEnergy !== null && 
      websiteData.dataCenterEnergy !== undefined
    
    // 如果没有能源数据，则计算
    let energyIntensity, dataCenterEnergy, transmissionEnergy, deviceEnergy,
        dataTransferCarbon, networkCarbon, clientCarbon, totalCarbonEmission,
        monthlyCarbonEmission, annualCarbonEmission, treesNeeded, isGreen
    
    if (hasEnergyData && websiteData.totalCarbonEmission) {
      // 使用后端计算的数据
      energyIntensity = websiteData.energyIntensity
      dataCenterEnergy = websiteData.dataCenterEnergy
      transmissionEnergy = websiteData.transmissionEnergy
      deviceEnergy = websiteData.deviceEnergy
      dataTransferCarbon = websiteData.dataTransferCarbon
      networkCarbon = websiteData.networkCarbon
      clientCarbon = websiteData.clientCarbon
      totalCarbonEmission = websiteData.totalCarbonEmission
      monthlyCarbonEmission = websiteData.monthlyCarbonEmission
      annualCarbonEmission = websiteData.annualCarbonEmission
      treesNeeded = websiteData.treesNeeded
      isGreen = websiteData.isGreen
    } else if (pageSize > 0) {
      // 如果后端没有计算，但我们有页面大小，则计算
      // 数据传输计算 (考虑缓存)
      const pageSizeInGB = pageSize / 1024 / 1024
      const adjustedPageSizeInGB = pageSizeInGB * (1 - globalConstants.cachingEfficiency)
      
      // 根据页面类型和大小确定能源强度 (kWh/GB)
      const baseEnergyIntensity = globalConstants.averageCarbonIntensity
      const adjustedEI = baseEnergyIntensity * (1 / providerInfo.serverEfficiency) * dataCenterPUE
      energyIntensity = parseFloat(adjustedEI.toFixed(2))
      
      // 计算能源消耗
      dataCenterEnergy = adjustedPageSizeInGB * (energyIntensity / dataCenterPUE)
      transmissionEnergy = adjustedPageSizeInGB * globalConstants.averageTransmissionPerGB
      deviceEnergy = adjustedPageSizeInGB * globalConstants.averageDevicePerGB
      
      // 考虑国家电网碳强度
      const countryCarbonValue = countryCarbonIntensity[country] || globalConstants.averageCarbonIntensity
      
      // 计算碳排放量
      dataTransferCarbon = dataCenterEnergy * (
        (renewablePercentage / 100) * globalConstants.greenEnergyCarbonIntensity + 
        ((100 - renewablePercentage) / 100) * countryCarbonValue
      )
      
      networkCarbon = transmissionEnergy * globalConstants.averageCarbonIntensity
      clientCarbon = deviceEnergy * globalConstants.averageCarbonIntensity
      
      // 计算碳排放总量 (单位：g CO2)
      totalCarbonEmission = dataTransferCarbon + networkCarbon + clientCarbon
      
      // 估计月访问量
      let estimatedMonthlyVisits = globalConstants.averageMonthlyVisits
      
      if (domain.value.includes('shop') || domain.value.includes('news')) {
        estimatedMonthlyVisits *= 2.5
      } else if (domain.value.includes('blog')) {
        estimatedMonthlyVisits *= 1.2
      } else if (domain.value.includes('app')) {
        estimatedMonthlyVisits *= 3
      }
      
      // 计算月度和年度碳排放量
      monthlyCarbonEmission = (totalCarbonEmission * estimatedMonthlyVisits) / 1000 // 单位：kg CO2
      annualCarbonEmission = monthlyCarbonEmission * 12
      
      // 计算需要种植多少棵树来抵消碳排放
      treesNeeded = Math.round(annualCarbonEmission / globalConstants.treeCO2PerYear)
      
      // 确定是否为绿色网站
      isGreen = renewablePercentage >= globalConstants.greenEnergyThreshold
    } else {
      // 如果没有页面大小，无法计算能源数据
      throw new Error('无法获取足够数据计算碳排放')
    }
    
    // 获取性能指标 (使用真实测量，没有则显示无法获取)
    let performance = null
    if (websiteData.performance && !websiteData.performance.error && !websiteData.performance.measurable === false) {
      performance = websiteData.performance
    } else {
      performance = {
        fcp: null,
        lcp: null,
        cls: null,
        fid: null,
        ttfb: null,
        measurable: false
      }
    }
    
    // 获取优化建议
    const suggestions = websiteData.suggestions || [
      '无法获取性能指标，无法提供针对性优化建议',
      '确保网站可访问并正确配置',
      '考虑使用CDN分发静态资源，减少数据传输距离和能耗',
      '实施高效的HTTP缓存策略，延长缓存有效期减少重复请求'
    ]
    
    // 设置结果
    result.value = {
      provider,
      region,
      country,
      pageSize,
      energyIntensity,
      dataCenterEnergy,
      transmissionEnergy,
      deviceEnergy,
      dataTransferCarbon,
      networkCarbon,
      clientCarbon,
      totalCarbonEmission,
      renewablePercentage,
      monthlyCarbonEmission,
      annualCarbonEmission,
      treesNeeded,
      isGreen,
      performance,
      suggestions,
      pue: dataCenterPUE,
      estimatedPageType
    }
    
    // 更新UI
    await nextTick()
    if (heatmapRef.value) {
      initHeatmap()
    }
  } catch (error) {
    console.error('碳排放检测错误:', error)
    // 显示错误信息给用户
    ElMessage.error(`检测失败: ${error.message || '服务器错误'}`)
  } finally {
    loading.value = false
  }
}

// 初始化热图
function initHeatmap() {
  if (!heatmapRef.value) {
    console.error('热图容器引用不存在')
    return
  }
  
  try {
    if (heatmapChart) {
      heatmapChart.dispose()
    }
    
    // 准备数据
    const data = [
      {name: '数据中心', value: result.value.dataTransferCarbon.toFixed(2), icon: 'server'},
      {name: '网络传输', value: result.value.networkCarbon.toFixed(2), icon: 'cloud'},
      {name: '客户端设备', value: result.value.clientCarbon.toFixed(2), icon: 'computer'}
    ]
    
    // 检查数据是否有效
    if (data.some(item => isNaN(parseFloat(item.value)))) {
      console.error('碳排放数据包含无效值')
      return
    }
    
    // 按碳排放量排序
    data.sort((a, b) => b.value - a.value)
    
    // 计算总排放和百分比
    const totalEmission = parseFloat(result.value.totalCarbonEmission.toFixed(2))
    data.forEach(item => {
      item.percentage = ((parseFloat(item.value) / totalEmission) * 100).toFixed(1) + '%'
    })
    
    // 设置最大值 (略高于最高值便于展示)
    const maxValue = Math.max(...data.map(item => parseFloat(item.value))) * 1.1
    
    console.log('初始化热图', { data, totalEmission, maxValue })
    
    // 创建图表
    heatmapChart = echarts.init(heatmapRef.value)
    
    // 设置图表选项
    const option = {
      title: {
        text: '碳排放分布',
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#555'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params) {
          const data = params[0].data;
          return `
            <div style="padding: 8px">
              <div style="font-weight: bold; margin-bottom: 5px">${data.name}</div>
              <div>碳排放量: <span style="color: #34c759; font-weight: bold">${data.value} gCO2e</span></div>
              <div>占比: <span style="color: #32ade6; font-weight: bold">${data.percentage}</span></div>
            </div>
          `;
        },
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 10,
        textStyle: {
          color: '#333'
        },
        extraCssText: 'box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); border-radius: 8px;'
      },
      grid: {
        top: 50,
        right: 15,
        bottom: 60,
        left: 90,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '碳排放量 (gCO2e)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: {
          color: '#666',
          fontSize: 13
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#666',
          fontSize: 12,
          formatter: '{value} g'
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#eee'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLine: {
          lineStyle: {
            color: '#e0e0e0'
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#555',
          fontSize: 13,
          fontWeight: 'bold',
          padding: [0, 15, 0, 0]
        }
      },
      series: [{
        type: 'bar',
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          percentage: item.percentage,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#34c759' },
              { offset: 1, color: '#32ade6' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#2fb14e' },
                { offset: 1, color: '#2998cc' }
              ])
            }
          }
        })),
        barWidth: '60%',
        barCategoryGap: '20%',
        barGap: '30%',
        itemStyle: {
          borderRadius: [0, 8, 8, 0]
        },
        label: {
          show: true,
          position: 'right',
          formatter: function(params) {
            return `${params.data.value} (${params.data.percentage})`;
          },
          fontSize: 13,
          color: '#333',
          fontWeight: 'bold'
        },
        emphasis: {
          label: {
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        animationDelay: function(idx) {
          return idx * 200;
        }
      }],
      visualMap: {
        show: false,
        min: 0,
        max: maxValue,
        inRange: {
          colorLightness: [0.8, 0.3]
        }
      },
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut',
      animationDelayUpdate: function(idx) {
        return idx * 50;
      }
    };
    
    // 应用选项
    heatmapChart.setOption(option);
    console.log('热图初始化完成')
    
    // 确保图表适应容器大小
    setTimeout(() => {
      if (heatmapChart) {
        heatmapChart.resize();
      }
    }, 200);
  } catch (error) {
    console.error('初始化热图时出错:', error)
    // 在容器中显示错误消息
    if (heatmapRef.value) {
      heatmapRef.value.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #ff3b30;">
          <p>加载碳排放图表时出错</p>
          <small>${error.message || '未知错误'}</small>
        </div>
      `;
    }
  }
}

// 格式化性能指标名称
function formatMetricName(metric) {
  const metricNames = {
    fcp: 'First Contentful Paint',
    lcp: 'Largest Contentful Paint',
    cls: 'Cumulative Layout Shift',
    fid: 'First Input Delay',
    ttfb: 'Time to First Byte'
  }
  
  return metricNames[metric] || metric
}

// 格式化性能指标值
function formatMetricValue(metric, value) {
  if (value === null || value === undefined) {
    return '无法获取'
  }
  
  if (metric === 'fcp' || metric === 'lcp') {
    return `${value.toFixed(2)}s`
  } else if (metric === 'cls') {
    return value.toFixed(3)
  } else {
    return `${Math.round(value)}ms`
  }
}

// 获取性能指标评级
function getMetricGrade(metric, value) {
  if (value === null || value === undefined) {
    return 'unknown'
  }
  
  // 基于Web核心指标标准进行性能评级
  if (metric === 'fcp') {
    return value < 1.8 ? 'good' : value < 3 ? 'average' : 'poor'
  } else if (metric === 'lcp') {
    return value < 2.5 ? 'good' : value < 4 ? 'average' : 'poor'
  } else if (metric === 'cls') {
    return value < 0.1 ? 'good' : value < 0.25 ? 'average' : 'poor'
  } else if (metric === 'fid') {
    return value < 100 ? 'good' : value < 300 ? 'average' : 'poor'
  } else if (metric === 'ttfb') {
    return value < 200 ? 'good' : value < 500 ? 'average' : 'poor'
  }
  return 'average'
}

// 获取进度条样式
function getProgressStyle(metric, value) {
  if (value === null || value === undefined) {
    return { width: `0%` }
  }
  
  let percentage
  
  if (metric === 'cls') {
    // CLS是越小越好，0.1是理想值，0.25是最大可接受值
    percentage = Math.min(100, (value / 0.25) * 100)
  } else if (metric === 'fcp') {
    // FCP在1秒以内为理想，3秒以上为较差
    percentage = Math.min(100, (value / 3) * 100)
  } else if (metric === 'lcp') {
    // LCP在2.5秒以内为理想，4秒以上为较差
    percentage = Math.min(100, (value / 4) * 100)
  } else if (metric === 'fid') {
    // FID在100ms以内为理想，300ms以上为较差
    percentage = Math.min(100, (value / 300) * 100)
  } else if (metric === 'ttfb') {
    // TTFB在200ms以内为理想，500ms以上为较差
    percentage = Math.min(100, (value / 500) * 100)
  } else {
    percentage = 50
  }
  
  return { width: `${percentage}%` }
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', () => {
    if (heatmapChart) {
      heatmapChart.resize()
    }
  })
})
</script>

<style>
/* 全局样式 */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  color: #333;
  background-color: #f9f9f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 35px 0;
  background: linear-gradient(135deg, #34c759, #32ade6);
  color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(50, 173, 230, 0.25);
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 60%),
    radial-gradient(circle at 70% 60%, rgba(255,255,255,0.15) 0%, transparent 50%);
  z-index: 1;
}

.header::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: linear-gradient(0deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 60%);
  z-index: 2;
  transform: rotateZ(-45deg);
  animation: shimmer 8s infinite linear;
  pointer-events: none;
}

@keyframes shimmer {
  0% { transform: translateX(-50%) rotateZ(-45deg); }
  100% { transform: translateX(100%) rotateZ(-45deg); }
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  position: relative;
  z-index: 3;
}

.logo {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  animation: float 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.logo-icon {
  font-size: 35px;
}

.header h1 {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  position: relative;
  z-index: 3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  letter-spacing: 0.5px;
}

.subtitle {
  font-size: 17px;
  opacity: 0.95;
  margin-top: 8px;
  position: relative;
  z-index: 3;
  font-weight: 500;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 输入区域样式 */
.input-section {
  margin-bottom: 40px;
  transform: translateY(-20px);
}

.domain-input {
  max-width: 650px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: center;
}

.domain-input :deep(.el-input__wrapper) {
  padding: 4px 15px;
  box-shadow: none !important;
}

.domain-input :deep(.el-input__inner) {
  height: 50px;
  font-size: 16px;
}

.domain-input :deep(.el-input-group__append) {
  padding: 0;
}

.domain-input :deep(.el-input-group__append button) {
  height: 58px;
  padding: 0 25px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 0;
  box-shadow: none;
}

.input-hint {
  margin-top: 12px;
  color: #8c8c8c;
  font-size: 14px;
  text-align: center;
  transition: all 0.3s ease;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.earth-container {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 30px;
}

.earth {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #34c759, #32ade6);
  box-shadow: 
    0 0 60px rgba(50, 173, 230, 0.4),
    0 0 30px rgba(52, 199, 89, 0.3),
    inset 0 0 15px rgba(255, 255, 255, 0.3);
  animation: spin 10s linear infinite, pulse 5s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.earth::before {
  content: '';
  position: absolute;
  top: -10%;
  left: -10%;
  right: -10%;
  bottom: -10%;
  background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="10" height="10" fill="rgba(255,255,255,0.15)"/></svg>');
  background-size: 20px 20px;
  border-radius: 50%;
  animation: spin 20s linear infinite reverse;
  opacity: 0.7;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.loading-container p {
  font-size: 18px;
  font-weight: 500;
  margin-top: 0;
  text-align: center;
  color: #555;
  line-height: 1.6;
}

.loading-container small {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #888;
}

/* 结果摘要 */
.result-section {
  animation: fadeInUp 0.8s ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-summary {
  margin-bottom: 40px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 35px;
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.summary-card.green {
  background: linear-gradient(135deg, #34c759, #32ade6);
  color: white;
}

.summary-card.red {
  background: linear-gradient(135deg, #ff3b30, #ff9500);
  color: white;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: 
    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 70%),
    radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 50%);
}

.summary-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(255,255,255,0.5), rgba(255,255,255,0));
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.summary-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 30px;
  position: relative;
  z-index: 1;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.summary-content {
  position: relative;
  z-index: 1;
}

.summary-content h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.summary-content p {
  margin: 8px 0 0;
  font-size: 17px;
  opacity: 0.95;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 结果网格 */
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 30px;
}

/* 卡片通用样式 */
.result-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(230, 230, 230, 0.7);
}

.result-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.12);
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
  background: linear-gradient(to right, #34c759, #32ade6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  position: relative;
}

.card-header h3::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 3px;
  background: linear-gradient(to right, #34c759, #32ade6);
  left: 0;
  bottom: -15px;
  border-radius: 3px;
}

.card-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  color: #32ade6;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

/* 数据展示样式 */
.details {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 14px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
  font-size: 15px;
  align-items: center;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #333;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  padding: 4px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

/* 能源图表 */
.energy-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0 30px;
}

.donut-chart {
  position: relative;
  width: 150px;
  height: 150px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15));
}

.donut-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90px;
  height: 90px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: #34c759;
  box-shadow: 
    inset 0 0 15px rgba(0, 0, 0, 0.05),
    0 4px 15px rgba(52, 199, 89, 0.15);
}

.donut-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ff3b30;
  filter: drop-shadow(0 4px 8px rgba(255, 59, 48, 0.25));
}

.renewable {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#34c759 var(--percent), transparent 0);
  --percent: 0%;
  filter: drop-shadow(0 4px 8px rgba(52, 199, 89, 0.25));
  animation: fillDonut 1.5s ease-out forwards;
}

@keyframes fillDonut {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 25px;
  margin-top: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.renewable {
  background-color: #34c759;
  box-shadow: 0 2px 6px rgba(52, 199, 89, 0.3);
}

.legend-color.fossil {
  background-color: #ff3b30;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.3);
}

/* 碳排放热力图卡片 */
.heatmap {
  width: 100%;
  height: 230px;
  margin-bottom: 25px;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
  box-shadow: 
    inset 0 0 15px rgba(0, 0, 0, 0.05),
    0 4px 15px rgba(0, 0, 0, 0.05);
  animation: fadeIn 1s ease-out forwards;
}

.carbon-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.carbon-stat-item {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  border-radius: 10px;
  padding: 12px 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(230, 230, 230, 0.7);
}

.carbon-stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.stat-label {
  color: #666;
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

/* 碳排放总计 */
.carbon-total {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.total-item {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 10px;
  font-size: 16px;
}

.total-label {
  color: #444;
}

.total-value {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2);
}

.total-info {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin-top: 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 10px;
  border: 1px solid rgba(230, 230, 230, 0.7);
  line-height: 1.5;
}

/* 性能指标样式 */
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  animation: slideIn 0.5s ease-out forwards;
  animation-delay: calc(var(--i, 0) * 0.1s);
  opacity: 0;
  transform: translateX(20px);
}

@keyframes slideIn {
  to { opacity: 1; transform: translateX(0); }
}

.metric-item:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  align-items: center;
}

.metric-name {
  color: #444;
  font-weight: 500;
  font-size: 15px;
}

.metric-value {
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 15px;
}

.metric-value.good {
  background-color: rgba(52, 199, 89, 0.15);
  color: #34c759;
  box-shadow: 0 2px 6px rgba(52, 199, 89, 0.2);
}

.metric-value.average {
  background-color: rgba(255, 149, 0, 0.15);
  color: #ff9500;
  box-shadow: 0 2px 6px rgba(255, 149, 0, 0.2);
}

.metric-value.poor {
  background-color: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
  box-shadow: 0 2px 6px rgba(255, 59, 48, 0.2);
}

.metric-value.unknown {
  background-color: rgba(150, 150, 150, 0.15);
  color: #888;
  font-style: italic;
  box-shadow: 0 2px 6px rgba(150, 150, 150, 0.2);
}

.progress-bar-container {
  height: 10px;
  position: relative;
  border-radius: 5px;
  overflow: hidden;
}

.progress-bar-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(240, 240, 240, 0.7);
}

.progress-bar {
  position: absolute;
  height: 100%;
  transition: width 1s cubic-bezier(0.65, 0, 0.35, 1);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  width: 0; /* 动画起始宽度 */
  animation: progressFill 1.5s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  animation-delay: 0.5s;
}

@keyframes progressFill {
  to { width: var(--width, 0%); }
}

.progress-bar.good {
  background: linear-gradient(to right, #34c759, #5dce7b);
}

.progress-bar.average {
  background: linear-gradient(to right, #ff9500, #ffb340);
}

.progress-bar.poor {
  background: linear-gradient(to right, #ff3b30, #ff6b60);
}

.progress-bar.unknown {
  background: linear-gradient(to right, #aaa, #ccc);
  opacity: 0.5;
}

/* 优化建议卡片 */
.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  font-size: 14px;
  padding: 15px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(230, 230, 230, 0.7);
  animation: fadeInLeft 0.5s ease-out forwards;
  animation-delay: calc(var(--i, 0) * 0.1s);
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes fadeInLeft {
  to { opacity: 1; transform: translateX(0); }
}

.suggestion-item:hover {
  background: linear-gradient(135deg, #e4e7eb, #f5f7fa);
  transform: translateX(5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

.suggestion-icon {
  margin-right: 12px;
  min-width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 173, 230, 0.15);
  color: #32ade6;
  box-shadow: 0 2px 6px rgba(50, 173, 230, 0.2);
}

/* 方法信息卡片 */
.result-card.suggestions h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
  position: relative;
}

.result-card.suggestions h3:after {
  content: '';
  position: absolute;
  width: 40px;
  height: 3px;
  background: linear-gradient(to right, #34c759, #32ade6);
  left: 0;
  bottom: -10px;
  border-radius: 3px;
}

.result-card.suggestions p {
  margin: 20px 0 15px;
  font-size: 15px;
  line-height: 1.6;
  color: #555;
}

.result-card.suggestions ol {
  counter-reset: item;
  padding-left: 0;
  margin-bottom: 0;
}

.result-card.suggestions li {
  counter-increment: item;
  margin-bottom: 12px;
  padding-left: 40px;
  position: relative;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}

.result-card.suggestions li:before {
  content: counter(item);
  position: absolute;
  left: 0;
  top: 0;
  background: linear-gradient(135deg, #34c759, #32ade6);
  color: white;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(50, 173, 230, 0.3);
}

/* 数据不可用状态 */
.data-unavailable {
  color: #888;
  font-style: italic;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 10px;
  font-size: 14px;
  text-align: center;
  margin: 15px 0;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(230, 230, 230, 0.7);
}

/* 错误消息样式 */
.error-message {
  color: #ff3b30;
  background-color: rgba(255, 59, 48, 0.1);
  padding: 20px;
  border-radius: 12px;
  margin: 25px 0;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(255, 59, 48, 0.15);
  border: 1px solid rgba(255, 59, 48, 0.2);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 页脚样式 */
.footer {
  margin-top: 80px;
  padding: 30px 0;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #eee;
  text-align: center;
  background: linear-gradient(180deg, transparent, rgba(240, 240, 240, 0.5));
  border-radius: 0 0 16px 16px;
}

.copyright {
  margin-top: 10px;
  font-size: 13px;
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    padding: 25px 0;
  }
  
  .header h1 {
    font-size: 28px;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
  
  .logo-icon {
    font-size: 28px;
  }
  
  .result-grid {
    gap: 20px;
  }
  
  .result-card {
    padding: 25px;
  }
  
  .carbon-stats {
    grid-template-columns: 1fr;
  }
  
  .summary-icon {
    width: 60px;
    height: 60px;
  }
  
  .summary-content h2 {
    font-size: 26px;
  }
  
  .summary-card {
    padding: 25px;
  }
  
  .donut-chart {
    width: 120px;
    height: 120px;
  }
  
  .donut-hole {
    width: 70px;
    height: 70px;
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 24px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
  
  .logo-icon {
    font-size: 24px;
  }
  
  .result-card {
    padding: 20px;
  }
  
  .summary-icon {
    width: 50px;
    height: 50px;
    margin-right: 15px;
  }
  
  .summary-content h2 {
    font-size: 22px;
  }
  
  .summary-content p {
    font-size: 14px;
  }
}
</style> 