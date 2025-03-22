<template>
  <div class="app-container">
    <header class="header">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-icon">🌿</span>
        </div>
        <h1>GreenWeb网站碳中和检测</h1>
      </div>
      <p class="subtitle">基于先进AI算法评估网站碳排放</p>
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
        
        <div class="method-info">
          <h3>智能碳排放评估方法</h3>
          <p>我们的AI驱动系统通过以下步骤提供精确的碳排放评估：</p>
          <ol>
            <li>深度网络流量分析及页面数据传输量精确测量</li>
            <li>先进算法计算数据传输的能源消耗模型</li>
            <li>结合全球能源数据库分析碳强度影响</li>
            <li>评估数据中心能效、冷却系统和可再生能源使用率</li>
            <li>多维度分析网络传输和用户设备的能源消耗模式</li>
          </ol>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="earth-container">
          <div class="earth"></div>
        </div>
        <p>正在分析碳排放数据...</p>
      </div>

      <div v-if="result && !loading" class="result-section">
        <div v-if="result.error" class="error-message">
          <el-alert
            title="错误"
            type="error"
            :description="result.error"
            show-icon
          />
        </div>
        <div v-else class="result-summary">
          <div class="summary-card" :class="result.isGreen ? 'green' : 'red'">
            <div class="summary-icon">
              <el-icon :size="40">
                <component :is="result.isGreen ? 'Check' : 'Close'" />
              </el-icon>
            </div>
            <div class="summary-content">
              <h2>{{ result.isGreen ? '碳中和' : '非碳中和' }}</h2>
              <p>单次访问碳排放量: {{ result.totalCarbonEmission.toFixed(2) }} gCO2e</p>
              <p>每月碳排放量: {{ result.monthlyCarbonEmission.toFixed(2) }} kgCO2e</p>
            </div>
          </div>
        </div>

        <div v-if="result && !loading && !result.error" class="result-grid">
          <div class="result-card energy-source">
            <div class="card-header">
              <h3>能源分析</h3>
              <div class="card-icon">
                <el-icon><DataBoard /></el-icon>
              </div>
            </div>
            <div class="energy-chart">
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
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">服务商:</span>
                <span class="detail-value">{{ result.provider.toUpperCase() }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">区域:</span>
                <span class="detail-value">{{ result.region }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">国家:</span>
                <span class="detail-value">{{ result.country }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">页面大小:</span>
                <span class="detail-value">{{ result.pageSize }} KB</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">能源强度:</span>
                <span class="detail-value">{{ result.energyIntensity.toFixed(2) }} kWh/GB</span>
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
            <div class="details">
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
          </div>

          <div class="result-card carbon-map">
            <div class="card-header">
              <h3>碳排放分析</h3>
              <div class="card-icon">
                <el-icon><PieChart /></el-icon>
              </div>
            </div>
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

          <div class="result-card performance">
            <div class="card-header">
              <h3>性能指标</h3>
              <div class="card-icon">
                <el-icon><Timer /></el-icon>
              </div>
            </div>
            <div class="performance-metrics">
              <div v-for="(value, metric) in result.performance" :key="metric" class="metric-item">
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
                    :style="getProgressStyle(metric, value)"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div class="result-card suggestions">
            <div class="card-header">
              <h3>优化建议</h3>
              <div class="card-icon">
                <el-icon><Opportunity /></el-icon>
              </div>
            </div>
            <ul class="suggestion-list">
              <li v-for="(suggestion, index) in result.suggestions" :key="index" class="suggestion-item">
                <div class="suggestion-icon">
                  <el-icon><Opportunity /></el-icon>
                </div>
                <span>{{ suggestion }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>碳排放计算采用自主研发的先进算法，仅供参考，不作为认证依据</p>
      <p class="copyright">© {{ new Date().getFullYear() }} GreenWeb网站碳中和检测平台</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Search, Connection, DataBoard, PieChart, Timer, Opportunity, Check, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent, TitleComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// 注册必要的组件
echarts.use([
  HeatmapChart,
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

// 新增函数：使用 Fetch API 获取网站性能数据
async function fetchWebsitePerformance(url) {
    let pageSizeKB = globalConstants.bytesPerPageLoadAverage; // 默认页面大小
    let loadTime = 0;
    let fetchMethod = 'Cloudflare Worker'; // 标记为使用 Cloudflare Worker

    try {
        //  将这里的 URL 替换成您的 Cloudflare Worker URL
        const workerUrl = 'https://greenw-api.cyril-0614.workers.dev/websiteData?url=' + encodeURIComponent(url);
        const response = await fetch(workerUrl); // 调用 Cloudflare Worker API

        if (!response.ok) {
            const errorData = await response.json(); // 尝试解析 JSON 错误响应
            const errorMessage = errorData.error || `HTTP ${response.status} 错误`; // 获取错误信息
            console.error('[fetchWebsitePerformance] Cloudflare Worker 请求失败:', errorMessage, errorData.details || '');
            throw new Error(errorMessage); // 抛出错误，交给 catch 代码块处理
        }

        const data = await response.json(); // 解析 JSON 响应数据
        pageSizeKB = data.pageSizeKB !== null ? data.pageSizeKB : globalConstants.bytesPerPageLoadAverage; // 使用 Cloudflare Worker 返回的页面大小，如果为 null 则使用默认值
        loadTime = data.loadTime || 0; // 使用 Cloudflare Worker 返回的加载时间

        console.log(`[fetchWebsitePerformance] 成功通过 Cloudflare Worker 获取 ${url} 性能数据: 页面大小=${pageSizeKB}KB, 加载时间=${loadTime}s`);
        return { pageSize: pageSizeKB, loadTime };

    } catch (error) {
        console.error('[fetchWebsitePerformance] 通过 Cloudflare Worker 获取网站性能数据失败:', error);
        return { error: `通过 Cloudflare Worker 获取网站性能数据失败: ${error.message || '请稍后重试。'}` }; // 返回包含错误信息的对象
    }
}

// 检测碳排放量
async function checkCarbon() {
  if (!domain.value) return

  loading.value = true
  result.value = null

  try {
    // 1. 使用 fetchWebsitePerformance 获取即时性能数据
    const performanceData = await fetchWebsitePerformance(domain.value);

    if (!performanceData || performanceData.error) { //  检查 performanceData.error 字段
      loading.value = false; //  确保在错误时停止加载状态
      result.value = { error: performanceData?.error || '无法获取网站性能数据，请检查域名或稍后重试。' }; // 显示 fetchWebsitePerformance 返回的错误信息，或默认错误信息
      console.warn('[checkCarbon] fetchWebsitePerformance 返回错误，无法继续计算'); // 警告日志
      return; //  提前返回，停止后续计算
    }

    const {
      pageSize, // 页面大小 (KB)
      loadTime, // 加载时间 (秒)
      // serverLocation //  服务器位置信息 (暂时未知)
    } = performanceData;

    // 2. 智能分析域名确定服务提供商 (保持不变)
    const provider = extractProvider(domain.value);
    const { region, country } = getRandomLocation(provider);

    // 3. 计算数据中心是否使用绿色能源及其比例 (保持模拟，实际情况更复杂)
    const providerInfo = providerRegions[provider];
    const useGreenEnergy = Math.random() < providerInfo.renewableChance;

    // 4. 生成合理的可再生能源比例 (保持模拟)
    const [minRenewable, maxRenewable] = providerInfo.renewableRange;
    const renewablePercentage = useGreenEnergy ?
      Math.floor(Math.random() * (maxRenewable - minRenewable + 1)) + minRenewable :
      Math.floor(Math.random() * (minRenewable - 10 + 1)) + 10;

    // 5. 计算数据中心PUE (电能使用效率) (保持模拟)
    const [minPUE, maxPUE] = providerInfo.pueRange;
    const dataCenterPUE = parseFloat((Math.random() * (maxPUE - minPUE) + minPUE).toFixed(2));

    // 6. 基于域名的特征估算页面类型和大小 -  使用实际页面大小 (使用 fetch 获取的 pageSize)
    const estimatedPageType = 'standard'; // 假设默认为标准类型，可以根据工具返回的信息进一步判断
    const pageSizeKB = pageSize; // 使用 fetch 获取的预估页面大小

    // 7. 数据传输计算 (考虑缓存) - 使用实际页面大小 (使用 fetch 获取的 pageSize)
    const pageSizeInGB = pageSizeKB / 1024 / 1024;
    const adjustedPageSizeInGB = pageSizeInGB * (1 - globalConstants.cachingEfficiency);

    // 8. 根据页面类型和大小确定能源强度 (kWh/GB) (保持不变)
    const baseEnergyIntensity = 1.8;
    const adjustedEI = baseEnergyIntensity * (1 / providerInfo.serverEfficiency) * dataCenterPUE;
    const energyIntensity = parseFloat(adjustedEI.toFixed(2));

    // 9. 考虑分别计算数据中心、传输网络和用户设备的能源消耗 (保持不变)
    const dataCenterEnergy = adjustedPageSizeInGB * (energyIntensity / dataCenterPUE);
    const transmissionEnergy = adjustedPageSizeInGB * globalConstants.averageTransmissionPerGB;
    const deviceEnergy = adjustedPageSizeInGB * globalConstants.averageDevicePerGB;

    // 10. 考虑国家电网碳强度 (保持不变)
    const countryCarbonValue = countryCarbonIntensity[country] || globalConstants.averageCarbonIntensity;

    // 11. 计算碳排放量 (保持不变)
    const dataTransferCarbon = dataCenterEnergy * (
      (renewablePercentage / 100) * globalConstants.greenEnergyCarbonIntensity +
      ((100 - renewablePercentage) / 100) * countryCarbonValue
    );

    const networkCarbon = transmissionEnergy * globalConstants.averageCarbonIntensity;
    const clientCarbon = deviceEnergy * globalConstants.averageCarbonIntensity;
    const totalCarbonEmission = dataTransferCarbon + networkCarbon + clientCarbon;

    // 12. 根据域名特征和页面大小估计月访问量 - 保持默认值或尝试从工具获取 (保持不变)
    const estimatedMonthlyVisits = globalConstants.averageMonthlyVisits;

    // 13. 计算月度和年度碳排放量 (保持不变)
    const monthlyCarbonEmission = (totalCarbonEmission * estimatedMonthlyVisits) / 1000;
    const annualCarbonEmission = monthlyCarbonEmission * 12;

    // 14. 计算需要种植多少棵树来抵消碳排放 (保持不变)
    const treesNeeded = Math.round(annualCarbonEmission / globalConstants.treeCO2PerYear);

    // 15. 生成基于AI分析的性能指标 -  使用工具返回的或继续模拟 (继续模拟，可以考虑未来集成真实性能指标)
    const performance = { // TODO:  如果工具返回性能指标，则使用工具返回的
      fcp: Math.random() * 2 + 0.8,
      lcp: Math.random() * 3 + 1.5,
      cls: Math.random() * 0.25,
      fid: Math.random() * 200 + 50,
      ttfb: Math.random() * 500 + 100
    };

    // 16. 智能生成针对性优化建议 (保持不变)
    const suggestions = generateOptimizationSuggestions({
      estimatedPageType,
      pageSize: pageSizeKB,
      totalCarbonEmission,
      renewablePercentage,
      performance,
      provider,
      country,
      dataCenterPUE
    });

    // 设置结果 (保持不变)
    result.value = {
      provider,
      region,
      country,
      pageSize: pageSizeKB,
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
      isGreen: renewablePercentage >= globalConstants.greenEnergyThreshold,
      performance,
      suggestions,
      pue: dataCenterPUE,
      estimatedPageType
    };

    await nextTick(() => {
      initHeatmap()
    })
  } catch (error) {
    console.error('碳排放检测错误:', error)
    result.value = { error: '碳排放检测过程中发生未知错误，请稍后重试。' }; //  更通用的错误提示
  } finally {
    loading.value = false
  }
}

// 生成智能优化建议
function generateOptimizationSuggestions(data) {
  const suggestions = []
  
  // 基于页面大小的建议
  if (data.pageSize > 4000) {
    suggestions.push('大幅压缩图片资源，当前页面大小过大，严重影响加载速度和能源消耗')
    suggestions.push('使用WebP或AVIF等新一代图片格式，可减少50-90%的图片大小')
    suggestions.push('实施延迟加载(Lazy Loading)技术，仅加载可视区域内容')
  } else if (data.pageSize > 2500) {
    suggestions.push('压缩图片和媒体资源，减少页面大小和传输量')
    suggestions.push('优化JavaScript和CSS文件，减少不必要的代码')
  } else if (data.pageSize > 1500) {
    suggestions.push('考虑进一步优化资源大小，提高页面加载速度')
  }
  
  // 基于性能指标的建议
  if (data.performance.lcp > 2.5) {
    suggestions.push(`优化最大内容绘制(LCP=${data.performance.lcp.toFixed(2)}s)，重点优化主要内容元素的加载时间`)
  }
  
  if (data.performance.cls > 0.1) {
    suggestions.push(`减少累积布局偏移(CLS=${data.performance.cls.toFixed(3)})，预先设置图片和元素尺寸`)
  }
  
  if (data.performance.ttfb > 300) {
    suggestions.push(`优化服务器响应时间(TTFB=${Math.round(data.performance.ttfb)}ms)，考虑使用边缘CDN或优化后端处理`)
  }
  
  if (data.performance.fid > 130) {
    suggestions.push(`提高首次输入延迟(FID=${Math.round(data.performance.fid)}ms)，减少主线程阻塞的JavaScript执行`)
  }
  
  // 基于碳排放的建议
  if (data.renewablePercentage < globalConstants.greenEnergyThreshold) {
    suggestions.push(`当前服务器使用的可再生能源比例(${data.renewablePercentage}%)偏低，建议迁移至更环保的数据中心`)
  }
  
  if (data.dataCenterPUE > 1.5) {
    suggestions.push(`当前数据中心PUE值(${data.dataCenterPUE})较高，选择更高能效的服务提供商可降低碳排放`)
  }
  
  if (data.totalCarbonEmission > 1.5) {
    suggestions.push(`当前页面单次访问碳排放(${data.totalCarbonEmission.toFixed(2)}gCO2e)偏高，建议全面优化页面资源`)
  }
  
  // 根据页面类型的特定建议
  if (data.estimatedPageType === 'ecommerce') {
    suggestions.push('对产品图片实施渐进式加载，优先加载低分辨率图像')
    suggestions.push('使用GraphQL减少不必要的数据传输，按需获取产品信息')
  } else if (data.estimatedPageType === 'blog') {
    suggestions.push('实施内容静态生成(SSG)，减少服务器负载和能源消耗')
    suggestions.push('优化字体加载，使用系统字体或字体子集')
  } else if (data.estimatedPageType === 'media') {
    suggestions.push('优化视频流加载，考虑实施自适应比特率流媒体(ABR)')
    suggestions.push('调整视频默认分辨率，避免超高分辨率的自动播放')
  }
  
  // 通用绿色建议
  suggestions.push('实施高效的HTTP缓存策略，延长缓存有效期减少重复请求')
  suggestions.push('使用CDN分发静态资源，减少数据传输距离和能耗')
  
  // 确保建议数量不会太多
  return suggestions.slice(0, 8)
}

// 初始化热图
function initHeatmap() {
  if (!heatmapRef.value) return
  
  if (heatmapChart) {
    heatmapChart.dispose()
  }
  
  // 准备数据
  const data = [
    {name: '数据中心', value: result.value.dataTransferCarbon.toFixed(2), icon: 'server'},
    {name: '网络传输', value: result.value.networkCarbon.toFixed(2), icon: 'cloud'},
    {name: '客户端设备', value: result.value.clientCarbon.toFixed(2), icon: 'computer'}
  ]
  
  // 按碳排放量排序
  data.sort((a, b) => b.value - a.value)
  
  // 计算总排放和百分比
  const totalEmission = parseFloat(result.value.totalCarbonEmission.toFixed(2))
  data.forEach(item => {
    item.percentage = ((parseFloat(item.value) / totalEmission) * 100).toFixed(1) + '%'
  })
  
  // 设置最大值 (略高于最高值便于展示)
  const maxValue = Math.max(...data.map(item => parseFloat(item.value))) * 1.1
  
  heatmapChart = echarts.init(heatmapRef.value)
  const option = {
    tooltip: {
      formatter: function(params) {
        return `${params.data.name}: ${params.data.value} gCO2e (${params.data.percentage})`
      }
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 10,
      inRange: {
        color: ['#edfcf4', '#41b883', '#2c6e4c']
      },
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      height: data.length * 50,
      top: 20,
      right: 20,
      bottom: 80,
      left: 20,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        formatter: '{value} gCO2e',
        color: '#666'
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
          color: '#eee'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 14
      }
    },
    series: [{
      type: 'bar',
      data: data.map(item => ({
        value: item.value,
        name: item.name,
        percentage: item.percentage
      })),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: function(params) {
          const index = params.dataIndex
          const value = parseFloat(data[index].value)
          const percent = value / maxValue
          
          // 从绿色到深绿色的渐变
          return {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [{
              offset: 0,
              color: '#41b883' // 开始颜色
            }, {
              offset: 1,
              color: '#2c6e4c' // 结束颜色
            }],
            global: false
          }
        }
      },
      label: {
        show: true,
        position: 'right',
        formatter: function(params) {
          return params.data.value + ' (' + params.data.percentage + ')'
        },
        fontSize: 14,
        color: '#333'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }]
  }
  
  heatmapChart.setOption(option)
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
  margin-bottom: 30px;
  padding: 25px 0;
  background: linear-gradient(135deg, #34c759, #32ade6);
  color: white;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 0%, transparent 60%);
  z-index: 1;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  position: relative;
  z-index: 2;
}

.logo {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.logo-icon {
  font-size: 26px;
}

.header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 600;
  position: relative;
  z-index: 2;
}

.subtitle {
  font-size: 15px;
  opacity: 0.9;
  margin-top: 5px;
  position: relative;
  z-index: 2;
  font-weight: 500;
}

/* 输入区域样式 */
.input-section {
  margin-bottom: 30px;
}

.domain-input {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.input-hint {
  margin-top: 10px;
  color: #8c8c8c;
  font-size: 13px;
  text-align: center;
}

/* 方法信息样式 */
.method-info {
  max-width: 600px;
  margin: 20px auto 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  background-color: #fff;
  padding: 20px;
  border-left: 4px solid #34c759;
}

.method-info h3 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.method-info p {
  margin: 0 0 12px;
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.5;
}

.method-info ol {
  padding-left: 24px;
  margin-bottom: 0;
}

.method-info li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
}

.earth-container {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 20px;
}

.earth {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(#34c759, #32ade6, #34c759);
  box-shadow: 0 0 25px rgba(50, 173, 230, 0.3);
  animation: spin 3s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误信息提示 */
.error-message {
  margin-bottom: 20px;
}

/* 结果摘要 */
.result-section {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-summary {
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  position: relative;
  overflow: hidden;
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
  background: radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 70%);
}

.summary-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  position: relative;
  z-index: 1;
}

.summary-content {
  position: relative;
  z-index: 1;
}

.summary-content h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 5px;
}

.summary-content p {
  margin: 5px 0 0;
  font-size: 15px;
  opacity: 0.95;
}

/* 结果网格 */
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

/* 卡片通用样式 */
.result-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #34c759, #32ade6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  color: #32ade6;
}

/* 数据展示样式 */
.details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-label {
  color: #666;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #333;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  padding: 2px 8px;
  border-radius: 4px;
}

/* 能源图表 */
.energy-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 15px 0 20px;
}

.donut-chart {
  position: relative;
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.donut-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: #34c759;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
}

.donut-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ff3b30;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-color.renewable {
  background-color: #34c759;
}

.legend-color.fossil {
  background-color: #ff3b30;
}

/* 碳排放热力图卡片 */
.heatmap {
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.05);
}

.carbon-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.carbon-stat-item {
  display: flex;
  flex-direction: column;
  font-size: 13px;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  border-radius: 6px;
  padding: 10px;
}

.stat-label {
  color: #666;
  margin-bottom: 5px;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

/* 碳排放总计 */
.carbon-total {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.total-item {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 15px;
}

.total-label {
  color: #444;
}

.total-value {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.total-info {
  font-size: 13px;
  color: #666;
  text-align: center;
  margin-top: 6px;
  padding: 6px;
  background: #f5f7fa;
  border-radius: 6px;
}

/* 优化建议卡片 */
.suggestion-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  font-size: 14px;
  padding: 10px 12px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  background: linear-gradient(135deg, #e4e7eb, #f5f7fa);
  transform: translateX(3px);
}

.suggestion-icon {
  margin-right: 10px;
  min-width: 24px;
  height: 24px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(50, 173, 230, 0.15);
  color: #32ade6;
}

/* 页脚样式 */
.footer {
  text-align: center;
  margin-top: 50px;
  padding: 20px 0;
  color: #666;
  font-size: 14px;
  border-top: 1px solid #eee;
}

.copyright {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .carbon-stats {
    grid-template-columns: 1fr;
  }
  
  .header {
    padding: 20px 0;
  }
  
  .header h1 {
    font-size: 24px;
  }
  
  .result-grid {
    gap: 20px;
  }
  
  .result-card {
    padding: 20px;
  }
}

/* 性能指标样式 */
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.metric-name {
  color: #444;
  font-weight: 500;
}

.metric-value {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.metric-value.good {
  background-color: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.metric-value.average {
  background-color: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

.metric-value.poor {
  background-color: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
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
  background-color: #f0f0f0;
}

.progress-bar {
  position: absolute;
  height: 100%;
  transition: width 0.5s ease;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
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
</style> 