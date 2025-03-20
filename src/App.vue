<template>
  <div class="app-container">
    <header class="header">
      <h1>网站碳中和检测</h1>
    </header>
    
    <main class="main-content">
      <div class="input-section">
        <el-input
          v-model="domain"
          placeholder="请输入网站域名或IP地址"
          class="domain-input"
        >
          <template #append>
            <el-button type="primary" @click="checkCarbon" :loading="loading">
              检测
            </el-button>
          </template>
        </el-input>
      </div>

      <div v-if="result" class="result-section">
        <div class="result-grid">
          <div class="result-card status">
            <h3>状态</h3>
            <el-icon :size="50" :color="result.isGreen ? '#67C23A' : '#F56C6C'">
              <component :is="result.isGreen ? 'Check' : 'Close'" />
            </el-icon>
            <p>{{ result.isGreen ? '碳中和' : '非碳中和' }}</p>
            <div class="details">
              <p>服务商: {{ result.provider.toUpperCase() }}</p>
              <p>区域: {{ result.region }}</p>
              <p>国家: {{ result.country }}</p>
            </div>
          </div>

          <div class="result-card performance">
            <h3>性能指标</h3>
            <div class="performance-metrics">
              <div v-for="(value, metric) in result.performance" :key="metric" class="metric-item">
                <span class="metric-name">{{ formatMetricName(metric) }}:</span>
                <span :class="['metric-value', getMetricGrade(metric, value)]">
                  {{ formatMetricValue(metric, value) }}
                </span>
              </div>
            </div>
            <div class="performance-score">
              <el-progress 
                :percentage="result.performanceScore" 
                :color="getScoreColor(result.performanceScore)"
              />
            </div>
          </div>

          <div class="result-card carbon-map">
            <h3>碳排放热力图</h3>
            <div ref="heatmapRef" class="heatmap"></div>
            <div class="carbon-stats">
              <p>总碳排放量: {{ result.totalCarbonEmission.toFixed(2) }} gCO2e</p>
              <p>数据传输: {{ result.dataTransferCarbon.toFixed(2) }} gCO2e</p>
              <p>服务器能耗: {{ result.serverCarbon.toFixed(2) }} gCO2e</p>
              <p>网络传输: {{ result.networkCarbon.toFixed(2) }} gCO2e</p>
              <p>客户端能耗: {{ result.clientCarbon.toFixed(2) }} gCO2e</p>
            </div>
          </div>

          <div class="result-card suggestions">
            <h3>优化建议</h3>
            <ul>
              <li v-for="(suggestion, index) in result.suggestions" :key="index">
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <p>数据仅供参考，不作为认证依据</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Close } from '@element-plus/icons-vue'
import * as d3 from 'd3'
import { 
  dataCenterLocations, 
  regionToCountry, 
  carbonData,
  performanceWeights,
  carbonFactors,
  performanceGrades
} from './data/carbonData'

const domain = ref('')
const loading = ref(false)
const result = ref(null)
const heatmapRef = ref(null)

const checkCarbon = () => {
  if (!domain.value) return
  
  loading.value = true
  try {
    // 模拟检测过程
    setTimeout(() => {
      const provider = detectProvider(domain.value)
      const region = detectRegion(provider)
      const country = regionToCountry[region] || 'Unknown'
      const countryData = carbonData[country] || {
        carbonIntensity: 500,
        greenEnergyCoverage: 0
      }

      // 模拟性能指标
      const performance = generatePerformanceMetrics()
      const performanceScore = calculatePerformanceScore(performance)

      // 计算碳排放
      const dataTransfer = Math.random() * 5 + 1 // 1-6MB
      const serverPower = 300 // 假设服务器功耗为300W
      const networkPower = 100 // 假设网络传输功耗为100W
      const clientPower = 200 // 假设客户端功耗为200W

      const dataTransferCarbon = dataTransfer * carbonFactors.dataTransfer
      const serverCarbon = (serverPower / 1000) * carbonFactors.serverEnergy
      const networkCarbon = (networkPower / 1000) * carbonFactors.networkEnergy
      const clientCarbon = (clientPower / 1000) * carbonFactors.clientEnergy
      const totalCarbonEmission = dataTransferCarbon + serverCarbon + networkCarbon + clientCarbon

      const isGreen = countryData.greenEnergyCoverage > 80

      result.value = {
        isGreen,
        performance,
        performanceScore,
        totalCarbonEmission,
        dataTransferCarbon,
        serverCarbon,
        networkCarbon,
        clientCarbon,
        country,
        provider,
        region,
        suggestions: generateSuggestions(isGreen, countryData, performance)
      }

      renderHeatmap()
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('检测失败:', error)
    loading.value = false
  }
}

const generatePerformanceMetrics = () => {
  return {
    firstContentfulPaint: Math.random() * 3000 + 1000,
    largestContentfulPaint: Math.random() * 4000 + 1500,
    timeToInteractive: Math.random() * 5000 + 2000,
    totalBlockingTime: Math.random() * 500 + 100,
    cumulativeLayoutShift: Math.random() * 0.3
  }
}

const calculatePerformanceScore = (performance) => {
  let score = 0
  for (const [metric, value] of Object.entries(performance)) {
    const weight = performanceWeights[metric]
    const grade = performanceGrades[metric]
    if (value <= grade.good) {
      score += weight * 100
    } else if (value <= grade.poor) {
      score += weight * 50
    }
  }
  return Math.round(score)
}

const formatMetricName = (metric) => {
  const names = {
    firstContentfulPaint: '首次内容绘制',
    largestContentfulPaint: '最大内容绘制',
    timeToInteractive: '可交互时间',
    totalBlockingTime: '总阻塞时间',
    cumulativeLayoutShift: '累积布局偏移'
  }
  return names[metric] || metric
}

const formatMetricValue = (metric, value) => {
  if (metric.includes('LayoutShift')) {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

const getMetricGrade = (metric, value) => {
  const grade = performanceGrades[metric]
  if (value <= grade.good) return 'good'
  if (value <= grade.poor) return 'needs-improvement'
  return 'poor'
}

const getScoreColor = (score) => {
  if (score >= 90) return '#67C23A'
  if (score >= 50) return '#E6A23C'
  return '#F56C6C'
}

const detectProvider = (domain) => {
  if (domain.includes('aws')) return 'aws'
  if (domain.includes('google') || domain.includes('gcp')) return 'gcp'
  if (domain.includes('azure')) return 'azure'
  return 'unknown'
}

const detectRegion = (provider) => {
  if (provider === 'unknown') return 'Unknown'
  const regions = dataCenterLocations[provider]
  return regions[Math.floor(Math.random() * regions.length)]
}

const generateSuggestions = (isGreen, countryData, performance) => {
  const suggestions = []
  
  // 基于碳排放的建议
  if (!isGreen) {
    suggestions.push('建议迁移到绿色能源覆盖区域')
    suggestions.push('考虑使用可再生能源证书')
  }
  if (countryData.carbonIntensity > 400) {
    suggestions.push('建议优化服务器能效')
  }

  // 基于性能的建议
  if (performance.firstContentfulPaint > performanceGrades.firstContentfulPaint.poor) {
    suggestions.push('优化首次内容绘制时间，减少关键资源加载')
  }
  if (performance.largestContentfulPaint > performanceGrades.largestContentfulPaint.poor) {
    suggestions.push('优化最大内容绘制时间，优先加载核心内容')
  }
  if (performance.timeToInteractive > performanceGrades.timeToInteractive.poor) {
    suggestions.push('优化可交互时间，减少JavaScript执行时间')
  }
  if (performance.totalBlockingTime > performanceGrades.totalBlockingTime.poor) {
    suggestions.push('减少总阻塞时间，优化长任务执行')
  }
  if (performance.cumulativeLayoutShift > performanceGrades.cumulativeLayoutShift.poor) {
    suggestions.push('优化累积布局偏移，确保页面布局稳定')
  }

  return suggestions
}

const renderHeatmap = () => {
  if (!heatmapRef.value || !result.value) return
  
  const width = 300
  const height = 200
  const svg = d3.select(heatmapRef.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
  
  // 创建热力图数据
  const data = []
  const intensity = result.value.totalCarbonEmission / 1000 // 转换为kgCO2e
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      data.push({
        x: i,
        y: j,
        value: intensity * (0.8 + Math.random() * 0.4)
      })
    }
  }

  // 创建颜色比例尺
  const colorScale = d3.scaleSequential()
    .domain([0, 5]) // 0-5 kgCO2e
    .interpolator(d3.interpolateRdYlGn)

  // 绘制热力图
  svg.selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('x', d => d.x * (width / 10))
    .attr('y', d => d.y * (height / 10))
    .attr('width', width / 10)
    .attr('height', height / 10)
    .attr('fill', d => colorScale(d.value))
    .attr('stroke', 'none')
}
</script>

<style scoped>
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.input-section {
  margin-bottom: 40px;
}

.domain-input {
  max-width: 600px;
  margin: 0 auto;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.result-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.heatmap {
  width: 100%;
  height: 200px;
  margin-bottom: 15px;
}

.details {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.carbon-stats {
  margin-top: 15px;
  font-size: 14px;
  color: #666;
}

.performance-metrics {
  margin: 15px 0;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.metric-value {
  font-weight: bold;
}

.metric-value.good {
  color: #67C23A;
}

.metric-value.needs-improvement {
  color: #E6A23C;
}

.metric-value.poor {
  color: #F56C6C;
}

.performance-score {
  margin-top: 20px;
}

.footer {
  text-align: center;
  margin-top: 40px;
  color: #666;
  font-size: 14px;
}
</style> 