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

          <div class="result-card carbon-map">
            <h3>碳排放热力图</h3>
            <div ref="heatmapRef" class="heatmap"></div>
            <div class="carbon-stats">
              <p>碳排放量: {{ result.carbonEmission.toFixed(2) }} kgCO2e/年</p>
              <p>碳强度: {{ result.carbonIntensity }} gCO2e/kWh</p>
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
import { dataCenterLocations, regionToCountry, carbonData } from './data/carbonData'

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

      const serverPower = 300 // 假设服务器功耗为300W
      const carbonEmission = countryData.carbonIntensity * serverPower
      const isGreen = countryData.greenEnergyCoverage > 80

      result.value = {
        isGreen,
        carbonEmission,
        carbonIntensity: countryData.carbonIntensity,
        country,
        provider,
        region,
        suggestions: generateSuggestions(isGreen, countryData)
      }

      renderHeatmap()
      loading.value = false
    }, 500) // 添加500ms延迟模拟检测过程
  } catch (error) {
    console.error('检测失败:', error)
    loading.value = false
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

const generateSuggestions = (isGreen, countryData) => {
  const suggestions = []
  if (!isGreen) {
    suggestions.push('建议迁移到绿色能源覆盖区域')
    suggestions.push('考虑使用可再生能源证书')
  }
  if (countryData.carbonIntensity > 400) {
    suggestions.push('建议优化服务器能效')
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
  const intensity = result.value.carbonIntensity
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
    .domain([0, 800])
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
  grid-template-columns: repeat(3, 1fr);
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

.footer {
  text-align: center;
  margin-top: 40px;
  color: #666;
  font-size: 14px;
}
</style> 