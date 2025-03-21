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
        
        <div class="advanced-options">
          <el-collapse>
            <el-collapse-item title="高级选项" name="1">
              <div class="options-grid">
                <div class="option-item">
                  <span class="option-label">页面类型：</span>
                  <el-select v-model="advancedOptions.pageType" placeholder="选择页面类型">
                    <el-option label="简单页面" value="simple" />
                    <el-option label="博客页面" value="blog" />
                    <el-option label="电商页面" value="ecommerce" />
                    <el-option label="媒体页面" value="media" />
                    <el-option label="Web应用" value="webapp" />
                  </el-select>
                </div>
                <div class="option-item">
                  <span class="option-label">连接类型：</span>
                  <el-select v-model="advancedOptions.connectionType" placeholder="选择连接类型">
                    <el-option label="移动网络" value="mobile" />
                    <el-option label="WiFi" value="wifi" />
                    <el-option label="固定宽带" value="fixed" />
                  </el-select>
                </div>
                <div class="option-item">
                  <span class="option-label">网站流量：</span>
                  <el-select v-model="advancedOptions.trafficLevel" placeholder="选择流量级别">
                    <el-option label="低流量" value="low" />
                    <el-option label="中等流量" value="medium" />
                    <el-option label="高流量" value="high" />
                    <el-option label="非常高流量" value="veryhigh" />
                  </el-select>
                </div>
                <div class="option-item">
                  <span class="option-label">月访问量：</span>
                  <el-input-number v-model="advancedOptions.monthlyVisits" :min="1000" :max="10000000" :step="1000" />
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
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
              <p>单次访问碳排放量: {{ result.totalCarbonEmission.toFixed(2) }} gCO2e</p>
              <p>每月碳排放量: {{ result.monthlyCarbonEmission.toFixed(2) }} kgCO2e</p>
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
            <div class="energy-chart">
              <div class="donut-chart">
                <div class="donut-hole">{{ result.renewablePercentage }}%</div>
                <div class="donut-ring">
                  <div class="donut-segment renewable" :style="`transform: rotate(0deg); transform-origin: center; clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%); clip: rect(0px, 100px, 100px, 50px); transform: rotate(${3.6 * result.renewablePercentage}deg);`"></div>
                  <div class="donut-segment fossil" :style="`transform: rotate(${3.6 * result.renewablePercentage}deg); transform-origin: center; clip-path: polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%, 50% 50%); clip: rect(0px, 100px, 100px, 50px);`"></div>
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
                <span class="detail-label">页面类型:</span>
                <span class="detail-value">{{ advancedOptions.pageType }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">页面大小:</span>
                <span class="detail-value">{{ result.pageSize }} KB</span>
              </div>
            </div>
          </div>

          <div class="result-card data-analysis">
            <div class="card-header">
              <h3>数据传输分析</h3>
              <div class="card-icon">
                <el-icon><Connection /></el-icon>
              </div>
            </div>
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">连接类型:</span>
                <span class="detail-value">{{ advancedOptions.connectionType }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">能源强度:</span>
                <span class="detail-value">{{ result.energyIntensity }} kWh/GB</span>
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
                <span class="stat-label">数据传输碳排放:</span>
                <span class="stat-value">{{ result.dataTransferCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">服务器碳排放:</span>
                <span class="stat-value">{{ result.serverCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">网络传输碳排放:</span>
                <span class="stat-value">{{ result.networkCarbon.toFixed(2) }} gCO2e</span>
              </div>
              <div class="carbon-stat-item">
                <span class="stat-label">客户端碳排放:</span>
                <span class="stat-value">{{ result.clientCarbon.toFixed(2) }} gCO2e</span>
              </div>
            </div>
            <div class="carbon-total">
              <div class="total-item">
                <span class="total-label">年度碳排放:</span>
                <span class="total-value">{{ result.annualCarbonEmission.toFixed(2) }} kgCO2e</span>
              </div>
              <div class="total-info">相当于种植{{ Math.round(result.annualCarbonEmission / 25) }}棵树才能抵消</div>
            </div>
          </div>

          <div class="result-card suggestions">
            <div class="card-header">
              <h3>优化建议</h3>
              <div class="card-icon">
                <el-icon><Connection /></el-icon>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import {
  Search,
  DataBoard,
  Connection,
  Check,
  Close,
  Timer,
  PieChart,
  Opportunity
} from '@element-plus/icons-vue'
import {
  findProviderAndRegion,
  dataCenterLocationMapping,
  regionToCountry,
  carbonIntensityData,
  performanceMetricsWeight,
  carbonEmissionFactors,
  performanceGradeStandard,
  dataCenterEnergySource,
  webPageSizeByType,
  dataTransferEnergyIntensity,
  trafficLevels,
  energyPerVisit
} from './data/carbonData'

const domain = ref('')
const loading = ref(false)
const result = ref(null)
const heatmapRef = ref(null)
let heatmapChart = null

// 高级选项设置
const advancedOptions = reactive({
  pageType: 'simple',
  connectionType: 'wifi',
  trafficLevel: 'medium',
  monthlyVisits: 50000
})

// 检查网站碳中和状态
const checkCarbon = async () => {
  if (!domain.value) return

  loading.value = true
  result.value = null

  try {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 获取服务商和区域信息
    const { provider, region } = findProviderAndRegion(domain.value)
    
    // 获取国家信息
    const country = regionToCountry[region] || '未知'
    
    // 获取碳排放强度
    const intensity = carbonIntensityData[country]?.carbonIntensity || 500
    
    // 可再生能源比例
    const renewablePercentage = dataCenterEnergySource[provider]?.[region]?.renewable || carbonIntensityData[country]?.greenEnergy || 30
    
    // 页面大小计算（基于页面类型）
    const pageSize = webPageSizeByType[advancedOptions.pageType] || 2000 // KB
    
    // 能源强度计算（基于连接类型）
    const energyIntensity = dataTransferEnergyIntensity[advancedOptions.connectionType] || 0.025 // kWh/GB
    
    // 能源消耗计算
    const dataCenterEnergy = energyPerVisit.dataCenter * (pageSize / 1000) // kWh
    const transmissionEnergy = energyPerVisit.transmission * (pageSize / 1000) // kWh
    const deviceEnergy = energyPerVisit.device * (pageSize / 1000) // kWh
    
    // 碳排放计算
    const dataTransferCarbon = (pageSize / 1000) * carbonEmissionFactors.dataTransfer
    const serverCarbon = dataCenterEnergy * intensity * (1 - renewablePercentage / 100)
    const networkCarbon = transmissionEnergy * intensity * 0.5 // 假设网络基础设施使用50%的绿色能源
    const clientCarbon = deviceEnergy * intensity * 0.7 // 假设终端设备使用30%的绿色能源
    
    // 总碳排放量
    const totalCarbonEmission = dataTransferCarbon + serverCarbon + networkCarbon + clientCarbon
    
    // 月度和年度碳排放计算
    const monthlyVisits = advancedOptions.monthlyVisits || trafficLevels[advancedOptions.trafficLevel] || 50000
    const monthlyCarbonEmission = (totalCarbonEmission * monthlyVisits) / 1000 // kg CO2e
    const annualCarbonEmission = monthlyCarbonEmission * 12 // kg CO2e
    
    // 性能指标模拟
    const performance = {
      fcp: Math.floor(Math.random() * 1000) + 500,
      lcp: Math.floor(Math.random() * 2000) + 800,
      tti: Math.floor(Math.random() * 3000) + 1000,
      tbt: Math.floor(Math.random() * 300),
      cls: Math.random() * 0.25
    }
    
    // 性能得分计算
    const performanceScore = calculatePerformanceScore(performance)
    
    // 根据性能和碳排放生成建议
    const suggestions = generateSuggestions(performance, {
      isGreen: renewablePercentage > 70,
      pageSize,
      totalCarbonEmission,
      provider,
      country
    })
    
    // 设置结果
    result.value = {
      provider,
      region,
      country,
      isGreen: renewablePercentage > 70,
      renewablePercentage,
      dataTransferCarbon,
      serverCarbon,
      networkCarbon,
      clientCarbon,
      totalCarbonEmission,
      monthlyCarbonEmission,
      annualCarbonEmission,
      performance,
      performanceScore,
      suggestions,
      pageSize,
      energyIntensity,
      dataCenterEnergy,
      transmissionEnergy,
      deviceEnergy
    }
    
    // 渲染碳排放热力图
    nextTick(() => {
      renderHeatmap()
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

// 计算性能得分
const calculatePerformanceScore = (performance) => {
  let score = 0
  let totalWeight = 0
  
  for (const [metric, weight] of Object.entries(performanceMetricsWeight)) {
    const value = performance[metric]
    
    let metricScore = 0
    const grades = performanceGradeStandard[metric]
    
    if (metric === 'cls') {
      // CLS的得分计算（值越小越好）
      if (value <= grades.good) metricScore = 100
      else if (value <= grades.poor) metricScore = 50
      else metricScore = 0
    } else {
      // 其他指标的得分计算（值越小越好）
      if (value <= grades.good) metricScore = 100
      else if (value <= grades.poor) metricScore = 50
      else metricScore = 0
    }
    
    score += metricScore * weight
    totalWeight += weight
  }
  
  return Math.round(score / totalWeight)
}

// 生成优化建议
const generateSuggestions = (performance, carbonData) => {
  const suggestions = []
  
  // 页面大小相关建议
  if (carbonData.pageSize > 3000) {
    suggestions.push(`减小页面大小，当前页面大小(${carbonData.pageSize}KB)过大，影响加载速度和碳排放`)
  }
  
  // 性能相关建议
  if (performance.fcp > 1000) {
    suggestions.push(`优化首次内容绘制(FCP)，当前值${performance.fcp}ms过高`)
  }
  
  if (performance.lcp > 2500) {
    suggestions.push(`优化最大内容绘制(LCP)，当前值${performance.lcp}ms不满足Core Web Vitals标准`)
  }
  
  if (performance.tti > 3000) {
    suggestions.push(`优化交互时间(TTI)，当前值${performance.tti}ms过高，影响用户体验`)
  }
  
  if (performance.tbt > 200) {
    suggestions.push(`减少总阻塞时间(TBT)，当前值${performance.tbt}ms过高`)
  }
  
  if (performance.cls > 0.1) {
    suggestions.push(`减少累积布局偏移(CLS)，当前值${performance.cls}过高，影响视觉稳定性`)
  }
  
  // 碳排放相关建议
  if (!carbonData.isGreen) {
    suggestions.push(`考虑使用更多使用绿色能源的数据中心或服务提供商`)
  }
  
  if (carbonData.totalCarbonEmission > 1.5) {
    suggestions.push(`当前页面单次访问碳排放(${carbonData.totalCarbonEmission.toFixed(2)}gCO2e)偏高，建议优化`)
  }
  
  if (carbonData.country && carbonIntensityData[carbonData.country]?.carbonIntensity > 400) {
    suggestions.push(`当前服务器位于碳强度较高的地区(${carbonData.country})，考虑更换到碳强度更低的地区`)
  }
  
  // 静态资源优化建议
  suggestions.push(`使用CDN分发静态资源，减少数据传输距离和能耗`)
  
  // 如果建议太少，添加一些通用建议
  if (suggestions.length < 3) {
    suggestions.push(`实施图片懒加载和压缩，减少页面初始加载大小`)
    suggestions.push(`采用适当的缓存策略，减少重复请求`)
  }
  
  return suggestions
}

// 格式化指标名称
const formatMetricName = (metric) => {
  const metricNames = {
    fcp: '首次内容绘制',
    lcp: '最大内容绘制',
    tti: '交互时间',
    tbt: '总阻塞时间',
    cls: '累积布局偏移'
  }
  return metricNames[metric] || metric
}

// 格式化指标值
const formatMetricValue = (metric, value) => {
  if (metric === 'cls') {
    return value.toFixed(3)
  } else {
    return `${value} ms`
  }
}

// 获取指标等级
const getMetricGrade = (metric, value) => {
  const grades = performanceGradeStandard[metric]
  
  if (metric === 'cls') {
    if (value <= grades.good) return 'good'
    if (value <= grades.poor) return 'average'
    return 'poor'
  } else {
    if (value <= grades.good) return 'good'
    if (value <= grades.poor) return 'average'
    return 'poor'
  }
}

// 获取性能分数样式
const getScoreStyle = (score) => {
  let color = '#f56c6c'
  
  if (score >= 90) {
    color = '#67c23a'
  } else if (score >= 70) {
    color = '#e6a23c'
  }
  
  return {
    background: `conic-gradient(${color} ${score * 3.6}deg, #e4e7ed 0deg)`
  }
}

// 渲染碳排放热力图
const renderHeatmap = () => {
  if (!heatmapRef.value || !result.value) return
  
  // 注册需要的组件
  echarts.use([
    TitleComponent,
    TooltipComponent,
    GridComponent,
    VisualMapComponent,
    HeatmapChart,
    CanvasRenderer
  ])
  
  if (heatmapChart) {
    heatmapChart.dispose()
  }
  
  heatmapChart = echarts.init(heatmapRef.value)
  
  const data = [
    ['数据传输', '碳排放', result.value.dataTransferCarbon],
    ['服务器能耗', '碳排放', result.value.serverCarbon],
    ['网络传输', '碳排放', result.value.networkCarbon],
    ['客户端能耗', '碳排放', result.value.clientCarbon]
  ]
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: function (params) {
        return `${params.data[0]}: ${params.data[2].toFixed(2)} gCO2e`
      }
    },
    grid: {
      top: '0',
      left: '0',
      right: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['碳排放'],
      position: 'top',
      splitArea: {
        show: true
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
      }
    },
    yAxis: {
      type: 'category',
      data: ['数据传输', '服务器能耗', '网络传输', '客户端能耗'],
      splitArea: {
        show: true
      }
    },
    visualMap: {
      min: 0,
      max: Math.max(
        result.value.dataTransferCarbon,
        result.value.serverCarbon,
        result.value.networkCarbon,
        result.value.clientCarbon
      ) * 1.2,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: {
        color: '#606266'
      },
      inRange: {
        color: ['#e1f3d8', '#42b883', '#2c7e5c']
      }
    },
    series: [{
      name: '碳排放量',
      type: 'heatmap',
      data: data.map(item => [item[1], item[0], item[2]]),
      label: {
        show: true,
        formatter: function (params) {
          return params.data[2].toFixed(1)
        },
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
  
  heatmapChart.setOption(option)
  
  // 响应式调整
  window.addEventListener('resize', () => {
    heatmapChart && heatmapChart.resize()
  })
}

// 自动调整图表大小
onMounted(() => {
  window.addEventListener('resize', () => {
    if (heatmapChart) {
      heatmapChart.resize()
    }
  })
})
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

/* 高级选项样式 */
.advanced-options {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  padding: 15px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label {
  font-weight: 500;
  color: #606266;
}

/* 能源图表 */
.energy-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 15px 0;
}

.donut-chart {
  position: relative;
  width: 120px;
  height: 120px;
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
  text-align: center;
  line-height: 70px;
  font-size: 22px;
  font-weight: bold;
  color: #42b883;
}

.donut-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

.donut-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transform-origin: center;
}

.renewable {
  background-color: #42b883;
}

.fossil {
  background-color: #e74c3c;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 15px;
  height: 15px;
  border-radius: 3px;
}

/* 碳排放总计 */
.carbon-total {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.total-item {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 5px;
}

.total-label {
  color: #606266;
}

.total-value {
  color: #e74c3c;
}

.total-info {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 5px;
}

/* 数据分析卡片样式 */
.data-analysis .details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style> 