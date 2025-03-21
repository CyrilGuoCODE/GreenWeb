<template>
  <div class="app-container">
    <header class="header">
      <div class="logo-container">
        <div class="logo">
          <span class="logo-icon">🌿</span>
        </div>
        <h1>GreenWeb网站碳中和检测</h1>
      </div>
      <p class="subtitle">检测并优化您网站的碳排放足迹</p>
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
        <p class="input-hint">例如: aws.example.com, google.example.com</p>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="earth-container">
          <div class="earth"></div>
        </div>
        <p>正在分析碳排放数据...</p>
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
              <p>总碳排放量: {{ result.totalCarbonEmission.toFixed(2) }} gCO2e</p>
            </div>
          </div>
        </div>

        <div class="result-grid">
          <div class="result-card status">
            <div class="card-header">
              <h3>服务器信息</h3>
              <div class="card-icon">
                <el-icon><DataBoard /></el-icon>
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
            </div>
          </div>

          <div class="result-card performance">
            <div class="card-header">
              <h3>性能指标</h3>
              <div class="card-icon">
                <el-icon><Timer /></el-icon>
              </div>
            </div>
            <div class="performance-score">
              <div class="score-circle" :style="getScoreStyle(result.performanceScore)">
                <span class="score-text">{{ result.performanceScore }}</span>
              </div>
            </div>
            <div class="performance-metrics">
              <div v-for="(value, metric) in result.performance" :key="metric" class="metric-item">
                <span class="metric-name">{{ formatMetricName(metric) }}:</span>
                <span :class="['metric-value', getMetricGrade(metric, value)]">
                  {{ formatMetricValue(metric, value) }}
                </span>
              </div>
            </div>
          </div>

          <div class="result-card carbon-map">
            <div class="card-header">
              <h3>碳排放热力图</h3>
              <div class="card-icon">
                <el-icon><PieChart /></el-icon>
              </div>
            </div>
            <div ref="heatmapRef" class="heatmap"></div>
            <div class="carbon-stats">
              <div class="carbon-stat-item">
                <span class="stat-label">数据传输:</span>
                <span class="stat-value">{{ result.dataTransferCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">服务器能耗:</span>
                <span class="stat-value">{{ result.serverCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">网络传输:</span>
                <span class="stat-value">{{ result.networkCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">客户端能耗:</span>
                <span class="stat-value">{{ result.clientCarbon.toFixed(2) }} gCO2e</span>
              </div>
            </div>
          </div>

          <div class="result-card suggestions">
            <div class="card-header">
              <h3>优化建议</h3>
              <div class="card-icon">
                <el-icon><Light /></el-icon>
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
      <p>数据仅供参考，不作为认证依据</p>
      <p class="copyright">© {{ new Date().getFullYear() }} 网站碳中和检测</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Close, DataBoard, Timer, Light, PieChart, Opportunity, Search } from '@element-plus/icons-vue'
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
  
  // 清空之前的结果
  if (heatmapRef.value) {
    heatmapRef.value.innerHTML = ''
  }
  
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

      loading.value = false
      
      // 渲染热力图
      setTimeout(() => {
        renderHeatmap()
      }, 100)
    }, 1500) // 增加延迟模拟更长的检测过程
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

const getScoreStyle = (score) => {
  const color = getScoreColor(score)
  return {
    background: `conic-gradient(${color} ${score}%, #f0f0f0 0)`
  }
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
  
  // 清空之前的内容
  heatmapRef.value.innerHTML = ''
  
  const width = heatmapRef.value.clientWidth || 300
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
    .attr('rx', 2)
    .attr('ry', 2)
}
</script>

<style scoped>
/* 全局样式 */
.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 0;
  background: linear-gradient(135deg, #43a047 0%, #1de9b6 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.logo {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  font-size: 30px;
  line-height: 1;
}

.header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
}

.subtitle {
  font-size: 16px;
  opacity: 0.8;
  margin-top: 5px;
}

/* 输入区域样式 */
.input-section {
  margin-bottom: 40px;
  text-align: center;
}

.domain-input {
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.input-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 14px;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.earth-container {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.earth {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(90deg, #2196f3 0%, #4caf50 100%);
  box-shadow: 0 0 30px rgba(0,0,0,0.15);
  animation: rotate 3s linear infinite;
  position: relative;
  overflow: hidden;
}

.earth::before {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="none" width="100" height="100"/><path fill="rgba(255,255,255,0.3)" d="M10,50 C20,40 30,60 40,30 C50,70 60,45 70,55 C80,30 90,60 100,50"/><path fill="rgba(255,255,255,0.3)" d="M0,30 C10,40 20,20 30,50 C40,10 50,60 60,45 C70,70 80,40 90,30 C100,20"/></svg>');
  top: -10%;
  left: -10%;
  opacity: 0.3;
  animation: cloud 8s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes cloud {
  0% { transform: translateX(0); }
  100% { transform: translateX(100px); }
}

/* 结果摘要 */
.result-summary {
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.summary-card.green {
  background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
  color: white;
}

.summary-card.red {
  background: linear-gradient(135deg, #e57373 0%, #f44336 100%);
  color: white;
}

.summary-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
}

.summary-content h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.summary-content p {
  margin: 5px 0 0;
  font-size: 16px;
  opacity: 0.9;
}

/* 结果网格 */
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
}

@media (max-width: 768px) {
  .result-grid {
    grid-template-columns: 1fr;
  }
}

/* 卡片通用样式 */
.result-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.result-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
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
  color: #303133;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f6fc;
  color: #409eff;
}

/* 服务器信息卡片 */
.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-label {
  color: #909399;
}

.detail-value {
  font-weight: 500;
  color: #303133;
}

/* 性能指标卡片 */
.performance-score {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-circle::after {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border-radius: 50%;
  background: white;
}

.score-text {
  position: relative;
  z-index: 1;
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.performance-metrics {
  margin-top: 20px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.metric-name {
  color: #909399;
}

.metric-value {
  font-weight: 500;
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

/* 碳排放热力图卡片 */
.heatmap {
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f9fa;
}

.carbon-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.carbon-stat-item {
  display: flex;
  flex-direction: column;
  font-size: 14px;
}

.stat-label {
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-weight: 500;
  color: #303133;
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
}

.suggestion-icon {
  margin-right: 10px;
  min-width: 22px;
  height: 22px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf5ff;
  color: #409eff;
}

/* 页脚样式 */
.footer {
  text-align: center;
  margin-top: 60px;
  padding: 20px 0;
  color: #909399;
  font-size: 14px;
  border-top: 1px solid #ebeef5;
}

.copyright {
  margin-top: 5px;
  font-size: 12px;
}
</style> 