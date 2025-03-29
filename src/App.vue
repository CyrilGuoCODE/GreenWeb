<template>
  <div class="green-web-app">
    <!-- 标题和介绍 -->
    <header class="app-header">
      <div class="logo">
        <img src="./assets/logo.svg" alt="Green Web Checker Logo">
      </div>
      <h1>GreenWeb <span>碳排放检测</span></h1>
      <p>分析网站服务器能源使用和碳足迹，助力可持续互联网发展</p>
    </header>
    
    <!-- 输入区域 -->
    <div class="input-section">
      <div class="url-input-group">
        <el-input
          v-model="domain"
          class="domain-input"
          placeholder="输入网站域名 (例如: example.com)"
          @keyup.enter="checkCarbon"
          :disabled="loading"
        />
        
        <!-- 浏览器选择下拉菜单 -->
        <el-select v-model="selectedBrowser" placeholder="分析方式" class="browser-select">
          <el-option label="自动选择" value="auto"></el-option>
          <el-option label="基础HTTP分析" value="basic"></el-option>
          <el-option label="仅HTTP头分析" value="headers"></el-option>
        </el-select>
        
        <el-button 
          type="primary" 
          @click="checkCarbon" 
          :loading="loading"
          class="analyze-button"
        >
          分析碳排放
        </el-button>
      </div>
    </div>
    
    <main class="main-content">
      <div v-if="loading" class="loading-container">
        <div class="earth-container">
          <div class="earth"></div>
        </div>
        <p>正在分析碳排放数据...<br><small>(使用Lighthouse测量性能，可能需要1-2分钟)</small></p>
      </div>

      <div v-if="result && !loading" class="result-section">
        <!-- 添加错误提示区域 -->
        <div v-if="result.hasError" class="error-alerts">
          <div class="error-alert">
            <h3>注意：部分数据无法获取</h3>
            <ul>
              <li v-for="(error, index) in result.errorMessages" :key="index">{{ error }}</li>
            </ul>
            <p>以下分析仅基于可获取的真实数据。</p>
          </div>
        </div>   
        <div class="result-summary">
          <div class="summary-card" :class="result.isGreen ? 'green' : 'red'">
            <div class="summary-header">
              <div class="summary-title">碳排放评估结果</div>
              <div class="summary-subtitle">{{ domain }}</div>
            </div>
            <div class="summary-content">
              <div class="summary-section">
                <div class="total-emission">
                  <div class="carbon-icon">
                    <i :class="result.isGreen ? 'fa-solid fa-leaf fa-2x' : 'fa-solid fa-smog fa-2x'"></i>
                  </div>
                  <div class="carbon-details">
                    <div class="total-title">此网页单次访问的碳排放</div>
                    <div class="total-value">
                      {{ result.totalCarbonEmission?.toFixed(4) || '0.0000' }} gCO2e
                      <span v-if="result.estimatedData && result.estimatedData.includes('totalCarbonEmission')" class="estimated-data-tag">估算</span>
                    </div>
                    <div class="total-breakdown">
                      <div class="total-item">
                        <span class="total-label">月度碳排放:</span>
                        <span class="total-value">
                          {{ result.monthlyCarbonEmission?.toFixed(2) || '0.00' }} kgCO2e
                          <span v-if="result.estimatedData && result.estimatedData.includes('monthlyCarbonEmission')" class="estimated-data-tag">估算</span>
                        </span>
                      </div>
                      <div class="total-info">
                        基于{{ globalConstants.averageMonthlyVisits.toLocaleString() }}次月访问量
                        <span class="estimated-data-tag">估算</span>
                      </div>
                      <div class="total-item">
                        <span class="total-label">年度碳排放:</span>
                        <span class="total-value">
                          {{ result.annualCarbonEmission?.toFixed(2) || '0.00' }} kgCO2e
                          <span v-if="result.estimatedData && result.estimatedData.includes('annualCarbonEmission')" class="estimated-data-tag">估算</span>
                        </span>
                      </div>
                      <div class="total-info">
                        相当于种植{{ Math.round((result.annualCarbonEmission || 0) / (globalConstants.treeCO2PerYear || 1)) }}棵树才能抵消
                        <span class="estimated-data-tag">估算</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="summary-section">
                <div class="energy-breakdown">
                  <div class="energy-title">能源消耗明细</div>
                  <div class="energy-items">
                    <div class="energy-item">
                      <div class="energy-label">数据中心</div>
                      <div class="energy-value">
                        {{ (result.dataCenterEnergy || 0).toFixed(4) }} Wh
                        <span v-if="result.estimatedData && result.estimatedData.includes('dataCenterEnergy')" class="estimated-data-tag">估算</span>
                      </div>
                    </div>
                    <div class="energy-item">
                      <div class="energy-label">网络传输</div>
                      <div class="energy-value">
                        {{ (result.transmissionEnergy || 0).toFixed(4) }} Wh
                        <span v-if="result.estimatedData && result.estimatedData.includes('transmissionEnergy')" class="estimated-data-tag">估算</span>
                      </div>
                    </div>
                    <div class="energy-item">
                      <div class="energy-label">用户设备</div>
                      <div class="energy-value">
                        {{ (result.deviceEnergy || 0).toFixed(4) }} Wh
                        <span v-if="result.estimatedData && result.estimatedData.includes('deviceEnergy')" class="estimated-data-tag">估算</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="detail-card">
            <div class="detail-header">
              <div class="detail-title">绿色托管信息</div>
            </div>
            <div class="detail-content">
              <div class="provider-info">
                <div class="provider-icon">
                  <i :class="result.isGreen ? 'fa-solid fa-solar-panel fa-2x' : 'fa-solid fa-industry fa-2x'"></i>
                </div>
                <div class="provider-details">
                  <div class="provider-name">{{ result.providerName || '未知服务商' }}</div>
                  <div class="provider-stats">
                    <div class="provider-item">
                      <span class="provider-label">可再生能源使用率:</span>
                      <span class="provider-value">
                        {{ result.renewablePercentage !== null ? result.renewablePercentage + '%' : '未知' }}
                        <span v-if="result.estimatedData && result.estimatedData.includes('renewablePercentage')" class="estimated-data-tag">估算</span>
                      </span>
                    </div>
                    <div class="provider-item">
                      <span class="provider-label">PUE:</span>
                      <span class="provider-value">
                        {{ result.pue || '未知' }}
                        <span v-if="result.estimatedData && result.estimatedData.includes('pue')" class="estimated-data-tag">估算</span>
                      </span>
                    </div>
                    <div class="provider-item">
                      <span class="provider-label">服务器位置:</span>
                      <span class="provider-value">{{ result.region || '未知' }}, {{ result.country || '未知' }}</span>
                    </div>
                    <div class="provider-item">
                      <span class="provider-label">绿色托管等级:</span>
                      <span class="provider-value" :class="{'green-value': result.isGreen}">
                        {{ result.isGreen ? '环保托管' : '标准托管' }}
                      </span>
                    </div>
                    <div class="provider-item">
                      <span class="provider-label">全球碳强度:</span>
                      <span class="provider-value">{{ globalConstants.averageCarbonIntensity }} gCO2e/kWh</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="result.isGreen" class="green-hosting-info">
                <p>该网站使用环保托管服务，有助于减少互联网碳足迹。</p>
              </div>
              <div v-else class="green-hosting-info">
                <p>建议考虑使用更环保的托管服务，以减少碳排放。</p>
              </div>
            </div>
          </div>
        </div>

        <div class="result-grid">
          
          <!-- 现代化的结果卡片网格布局 -->
          <div class="result-card-container">
            <!-- 第一行卡片 - 重要信息 -->
            <div class="result-row">
              <div class="result-card energy-source major-card">
                <div class="card-header">
                  <h3>可再生能源使用情况</h3>
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
                <div class="card-summary">
                  <div class="summary-badge" :class="result.isGreen ? 'green-badge' : 'standard-badge'">
                    {{ result.isGreen ? '环保托管' : '标准托管' }}
                  </div>
                  <p>{{ result.isGreen ? '此网站使用环保友好的托管服务' : '建议使用更环保的托管服务' }}</p>
                </div>
              </div>

              <div class="result-card carbon-map major-card">
                <div class="card-header">
                  <h3>碳排放评分</h3>
                  <div class="card-icon">
                    <el-icon><PieChart /></el-icon>
                  </div>
                </div>
                <div v-if="result.totalCarbonEmission !== null">
                  <div class="score-container" v-if="result.carbonFootprintScore || result.energyEfficiencyScore">
                    <div class="carbon-score-card" :class="getCarbonScoreClass(result.carbonFootprintScore)">
                      <div class="score-circle">{{ Math.round(result.carbonFootprintScore || 50) }}</div>
                      <div class="score-label">碳足迹评分</div>
                      <div class="score-desc">{{ getCarbonScoreDesc(result.carbonFootprintScore) }}</div>
                    </div>
                    <div class="carbon-score-card" :class="getEnergyScoreClass(result.energyEfficiencyScore)">
                      <div class="score-circle">{{ Math.round(result.energyEfficiencyScore || 50) }}</div>
                      <div class="score-label">能源效率评分</div>
                      <div class="score-desc">{{ getEnergyScoreDesc(result.energyEfficiencyScore) }}</div>
                    </div>
                  </div>
                  <div class="total-emission-highlight">
                    <div class="highlight-value">{{ result.totalCarbonEmission.toFixed(4) }} <span>gCO2e</span></div>
                    <div class="highlight-label">单次访问碳排放</div>
                  </div>
                </div>
                <div v-else class="data-unavailable">
                  无法获取碳排放分析数据
                </div>
              </div>
            </div>

            <!-- 第二行卡片 - 详细数据 -->
            <div class="result-row">
              <div class="result-card site-info">
                <div class="card-header">
                  <h3>网站基础信息</h3>
                  <div class="card-icon">
                    <el-icon><Connection /></el-icon>
                  </div>
                </div>
                <div class="details">
                  <div class="detail-item">
                    <span class="detail-label">服务商:</span>
                    <span class="detail-value highlight-text">{{ result.provider && typeof result.provider === 'string' ? result.provider.toUpperCase() : '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">服务器位置:</span>
                    <span class="detail-value">{{ result.region || '未知' }}, {{ result.country || '未知' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">页面大小:</span>
                    <span class="detail-value">{{ result.pageSize ? `${result.pageSize} KB` : '无法获取' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">能源强度:</span>
                    <span class="detail-value">{{ result.energyIntensity !== null ? `${result.energyIntensity.toFixed(2)} kWh/GB` : '无法获取' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">PUE值:</span>
                    <span class="detail-value" :class="{'highlight-text': result.pue && result.pue < 1.5}">
                      {{ result.pue || '未知' }}
                      <span v-if="result.estimatedData && result.estimatedData.includes('pue')" class="estimated-data-tag">估算</span>
                    </span>
                  </div>
                </div>
              </div>

              <div class="result-card energy-consumption">
                <div class="card-header">
                  <h3>能源消耗分析</h3>
                  <div class="card-icon">
                    <el-icon><Connection /></el-icon>
                  </div>
                </div>
                <!-- 显示设置，确保始终显示能源消耗网格 -->
                <div class="energy-consumption-grid">
                  <div class="energy-consumption-item">
                    <div class="consumption-icon data-center-icon"></div>
                    <div class="consumption-value">{{ formatEnergyValue(result.dataCenterEnergy) }}</div>
                    <div class="consumption-label">数据中心能耗</div>
                  </div>
                  <div class="energy-consumption-item">
                    <div class="consumption-icon network-icon"></div>
                    <div class="consumption-value">{{ formatEnergyValue(result.transmissionEnergy) }}</div>
                    <div class="consumption-label">网络传输能耗</div>
                  </div>
                  <div class="energy-consumption-item">
                    <div class="consumption-icon device-icon"></div>
                    <div class="consumption-value">{{ formatEnergyValue(result.deviceEnergy) }}</div>
                    <div class="consumption-label">用户设备能耗</div>
                  </div>
                </div>
                <div v-if="!result.dataCenterEnergy && !result.transmissionEnergy && !result.deviceEnergy" class="energy-note">
                  <p>注意: 能源消耗数据可能很低或无法获取。这可能是因为页面太小或性能分析不完整。</p>
                </div>
              </div>

              <div class="result-card carbon-impact">
                <div class="card-header">
                  <h3>碳排放详情</h3>
                  <div class="card-icon">
                    <el-icon><PieChart /></el-icon>
                  </div>
                </div>
                <div v-if="result.totalCarbonEmission !== null" class="carbon-stats">
                  <div class="carbon-stat-item">
                    <span class="stat-label">数据中心碳排放:</span>
                    <span class="stat-value">{{ formatNumber(result.dataTransferCarbon) }} gCO2e</span>
                  </div>
                  <div class="carbon-stat-item">
                    <span class="stat-label">网络传输碳排放:</span>
                    <span class="stat-value">{{ formatNumber(result.networkCarbon) }} gCO2e</span>
                  </div>
                  <div class="carbon-stat-item">
                    <span class="stat-label">客户端碳排放:</span>
                    <span class="stat-value">{{ formatNumber(result.clientCarbon) }} gCO2e</span>
                  </div>
                  <div class="carbon-annual-impact">
                    <div class="impact-title">年度碳排放估计</div>
                    <div class="impact-value">{{ result.annualCarbonEmission.toFixed(2) }} kgCO2e</div>
                    <div class="impact-equivalent">
                      相当于种植 <span class="highlight-text">{{ Math.round(result.annualCarbonEmission / globalConstants.treeCO2PerYear) }}</span> 棵树才能抵消
                    </div>
                  </div>
                </div>
                <div v-else class="data-unavailable">
                  无法获取碳排放分析数据
                </div>
              </div>
            </div>

            <!-- 第三行卡片 - 性能和建议 -->
            <div class="result-row">
              <div class="result-card performance wide-card">
                <div class="card-header">
                  <h3>性能指标</h3>
                  <div class="card-icon">
                    <el-icon><Timer /></el-icon>
                  </div>
                </div>
                <div v-if="result.performance && result.performance.measurable !== false" class="performance-metrics-v2">
                  <div class="metrics-grid">
                    <div 
                      v-for="(value, metric, index) in result.performance" 
                      :key="metric"
                      class="metric-card"
                      v-show="!['measuredBy', 'statusCode', 'measurable', 'requestCount', 'domainCount'].includes(metric)"
                    >
                      <div class="metric-visual">
                        <div class="metric-circle" :class="getMetricGrade(metric, value)">
                          {{ formatMetricValue(metric, value) }}
                        </div>
                      </div>
                      <div class="metric-info">
                        <div class="metric-name">{{ formatMetricName(metric) }}</div>
                        <div class="metric-description">{{ getMetricDescription(metric) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="result.performance.requestCount || result.performance.domainCount" class="network-stats">
                    <div class="network-title">网络请求数据</div>
                    <div class="network-grid">
                      <div class="network-item" v-if="result.performance.requestCount">
                        <div class="network-value">{{ result.performance.requestCount }}</div>
                        <div class="network-label">请求数量</div>
                      </div>
                      <div class="network-item" v-if="result.performance.domainCount">
                        <div class="network-value">{{ result.performance.domainCount }}</div>
                        <div class="network-label">域名数量</div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="result.performance.measuredBy" class="data-source-info">
                    测量工具: {{ result.performance.measuredBy }}
                  </div>
                </div>
                <div v-else class="data-unavailable">
                  无法获取性能指标数据<br>
                  <small v-if="result.performance && result.performance.error">{{ result.performance.error }}</small>
                </div>
              </div>

              <div class="result-card suggestions wide-card">
                <div class="card-header">
                  <h3>优化建议</h3>
                  <div class="card-icon">
                    <el-icon><Opportunity /></el-icon>
                  </div>
                </div>
                <div v-if="result.suggestions && result.suggestions.length > 0" class="suggestions-container">
                  <div class="suggestions-list">
                    <div 
                      v-for="(suggestion, index) in result.suggestions" 
                      :key="index" 
                      class="suggestion-card"
                    >
                      <div class="suggestion-header">
                        <div class="suggestion-icon">
                          <el-icon><Opportunity /></el-icon>
                        </div>
                        <div class="suggestion-title">优化建议 #{{ index + 1 }}</div>
                      </div>
                      <div class="suggestion-content">
                        {{ suggestion }}
                      </div>
                      <div class="suggestion-impact" :class="getImpactClass(index)">
                        {{ getImpactLevel(index) }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="data-unavailable">
                  无法生成具体优化建议，请确保网站可访问
                </div>
              </div>
            </div>

            <!-- 绿色托管信息卡片 -->
            <div v-if="carbonResult" class="result-card green-hosting wide-card">
              <h3>绿色托管信息</h3>
              <div class="detail-content">
                <div class="provider-info">
                  <div><strong>提供商：</strong> {{ carbonResult.provider || '未知' }}</div>
                  <div><strong>服务器位置：</strong> {{ carbonResult.region || '未知' }}</div>
                  
                  <div class="provider-stats">
                    <div><strong>可再生能源使用率：</strong> <span :class="{ 'green-value': carbonResult.renewablePercentage > 50 }">{{ carbonResult.renewablePercentage || 0 }}%</span></div>
                    <div><strong>PUE值：</strong> <span :class="{ 'green-value': carbonResult.pue < 1.5 }">{{ carbonResult.pue || '未知' }}</span></div>
                    <div><strong>绿色托管级别：</strong> <span :class="{ 'green-value': isGreenHosting }">{{ isGreenHosting ? '环保托管' : '标准托管' }}</span></div>
                  </div>
                  
                  <div class="green-hosting-info">
                    <p v-if="isGreenHosting">此网站由环保友好的主机提供商托管，使用高比例的可再生能源和高效的数据中心设施。</p>
                    <p v-else>此网站使用标准托管服务，可以通过迁移到使用更多可再生能源的提供商来降低碳足迹。</p>
                    <p>全球服务器平均碳强度：{{ globalCarbonIntensity || '未知' }} gCO2/kWh</p>
                  </div>
                </div>
              </div>
            </div>
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

<script>
import { ref, onMounted, reactive, nextTick, computed } from 'vue'
import { Search, Connection, DataBoard, PieChart, Timer, Opportunity, Check, Close } from '@element-plus/icons-vue'
import {
  analyzeWebsite, 
  measurePerformance, 
  analyzeCarbonEmission, 
  getServerLocation, 
  analyzeProvider
} from './services/websiteAnalyzer'

export default {
  name: 'App',
  components: {
    Search,
    Connection,
    DataBoard,
    PieChart,
    Timer,
    Opportunity,
    Check,
    Close
  },
  
  setup() {
    // 引用和状态
    const domain = ref('')
    const loading = ref(false)
    const result = ref(null)
    const selectedBrowser = ref('auto')
    
    // 全局常量
    const globalConstants = reactive({
      averageEnergyConsumption: 1.8, // kWh/GB
      averageTransmissionPerGB: 0.06, // kWh/GB
      averageDevicePerGB: 0.15, // kWh/GB
      averageCarbonIntensity: 442, // gCO2e/kWh (全球平均)
      greenEnergyCarbonIntensity: 50, // gCO2e/kWh (绿色能源)
      averageMonthlyVisits: 10000, // 每月平均访问量
      cachingEfficiency: 0.3, // 缓存效率 (30%)
      treeCO2PerYear: 22, // 每棵树每年吸收的CO2量 (kg)
      bestPUE: 1.1, // 最佳数据中心PUE
      averagePUE: 1.67, // 平均数据中心PUE
      greenEnergyThreshold: 80 // 绿色能源使用比例阈值
    })
    
    // 碳排放分析
    async function checkCarbon() {
      if (!domain.value) {
        return
      }
      
      loading.value = true
      result.value = null
      
      try {
        // 分析网站性能和碳排放
        console.log(`开始分析网站: ${domain.value} (使用${selectedBrowser.value === 'auto' ? '自动选择浏览器' : selectedBrowser.value})`)
        
        // 获取使用的浏览器参数
        const browserOption = selectedBrowser.value
        
        let performanceResult = null
        let locationResult = null
        let providerResult = null
        let carbonResult = null
        let hasError = false
        let errorMessages = []
        
        // 1. 测量性能指标
        try {
          performanceResult = await measurePerformance(domain.value, browserOption)
          
          if (performanceResult.error) {
            console.warn('性能测量警告:', performanceResult.error)
            errorMessages.push(`性能指标: ${performanceResult.error}`)
            hasError = true
          }
        } catch (perfError) {
          console.error('性能测量失败:', perfError)
          errorMessages.push(`性能指标: ${perfError.message || '无法获取'}`)
          hasError = true
        }
        
        // 2. 获取服务器位置
        try {
          locationResult = await getServerLocation(domain.value)
          
          if (locationResult.error) {
            console.warn('位置获取警告:', locationResult.error)
            errorMessages.push(`服务器位置: ${locationResult.error}`)
            hasError = true
          }
        } catch (locError) {
          console.error('位置获取失败:', locError)
          errorMessages.push(`服务器位置: ${locError.message || '无法获取'}`)
          hasError = true
        }
        
        // 3. 分析服务提供商
        try {
          providerResult = await analyzeProvider(domain.value)
          
          if (providerResult.error) {
            console.warn('提供商分析警告:', providerResult.error)
            errorMessages.push(`服务提供商: ${providerResult.error}`)
            hasError = true
          }
        } catch (provError) {
          console.error('提供商分析失败:', provError)
          errorMessages.push(`服务提供商: ${provError.message || '无法获取'}`)
          hasError = true
        }
        
        // 4. 计算碳排放 - 只在有足够的真实数据时进行
        if (performanceResult && !performanceResult.error && locationResult && !locationResult.error) {
          try {
            const carbonParams = {
              pageSize: performanceResult.pageSize || (performanceResult.performance?.pageSize) || 0,
              country: locationResult?.country || 'unknown',
              requestCount: performanceResult.requests || (performanceResult.performance?.requestCount) || 1,
              domainCount: performanceResult.domainCount || (performanceResult.performance?.domainCount) || 1,
              // 添加必要的参数
              renewablePercentage: providerResult?.renewablePercentage || 0,
              pue: providerResult?.pue || 1.67, // 使用平均PUE
              responseTime: performanceResult.responseTime || (performanceResult.performance?.responseTime) || 0,
              hasCompression: performanceResult.headers?.supportsCompression || false,
              resourceStats: JSON.stringify(performanceResult.performance?.resourceStats || {}),
              cacheControl: performanceResult.headers?.cacheControl || ''
            }
            
            // 确保主要参数有值
            if (carbonParams.pageSize <= 0) {
              throw new Error('页面大小不能为零或负值');
            }
            
            carbonResult = await analyzeCarbonEmission(carbonParams)
            
            if (carbonResult.error) {
              console.warn('碳排放计算警告:', carbonResult.error)
              errorMessages.push(`碳排放计算: ${carbonResult.error}`)
              hasError = true
            }
          } catch (carbonError) {
            console.error('碳排放计算失败:', carbonError)
            errorMessages.push(`碳排放计算: ${carbonError.message || '无法获取'}`)
            hasError = true
          }
        } else {
          console.warn('缺少性能或位置数据，无法计算碳排放')
          errorMessages.push('缺少性能或位置数据，无法计算碳排放')
          hasError = true
        }
        
        // 初始化结果对象 - 只包含真实数据
        result.value = {
          hasError,
          errorMessages,
          onlyRealData: true, // 标记只显示真实数据
          provider: providerResult?.provider || 'unknown',
          isGreen: false,
          totalCarbonEmission: null,
          monthlyCarbonEmission: null,
          suggestions: []
        }
        
        // 合并各种结果 - 只添加真实测量的数据
        if (performanceResult && !performanceResult.error) {
          result.value = {
            ...result.value,
            performance: performanceResult.performance,
            pageSize: performanceResult.pageSize || performanceResult.performance?.pageSize
          }
        }
        
        if (locationResult && !locationResult.error) {
          result.value = {
            ...result.value,
            country: locationResult.country,
            region: locationResult.region,
            coordinates: locationResult.coordinates
          }
        }
        
        if (providerResult && !providerResult.error) {
          result.value = {
            ...result.value,
            provider: providerResult.provider || 'unknown',
            providerName: providerResult.providerName || '未知提供商',
            renewablePercentage: providerResult.renewablePercentage,
            pue: providerResult.pue,
            isGreen: providerResult.renewablePercentage >= globalConstants.greenEnergyThreshold
          }
        }
        
        if (carbonResult && !carbonResult.error) {
          result.value = {
            ...result.value,
            ...carbonResult,
            // 明确标记估算数据
            estimatedData: carbonResult.dataSourceInfo?.estimatedValues || []
          }
        }
        
        console.log('分析完成:', result.value)
      } catch (error) {
        console.error('分析过程中出错:', error)
        result.value = {
          error: error.message,
          isGreen: false,
          totalCarbonEmission: null,
          monthlyCarbonEmission: null,
          annualCarbonEmission: null,
          performance: {
            measurable: false,
            error: error.message
          },
          provider: 'unknown',
          renewablePercentage: null,
          suggestions: [],
          region: null,
          country: null,
          coordinates: null,
          dataTransferCarbon: null,
          networkCarbon: null,
          clientCarbon: null,
          dataCenterEnergy: null,
          transmissionEnergy: null,
          deviceEnergy: null,
          hasError: true,
          errorMessages: [error.message]
        }
      } finally {
        loading.value = false
      }
    }
    
    // 监听窗口大小变化
    onMounted(() => {
      console.log('应用已挂载')
    })
    
    const isGreenHosting = computed(() => {
      if (!carbonResult.value) return false;
      const renewable = carbonResult.value.renewablePercentage || 0;
      const pue = carbonResult.value.pue || 2.0;
      return renewable > 50 && pue < 1.5;
    });
    
    const globalCarbonIntensity = computed(() => {
      // 全球平均碳强度，单位：gCO2/kWh
      return 475;
    });
    
    return {
      domain,
      loading,
      result,
      globalConstants,
      selectedBrowser,
      checkCarbon,
      isGreenHosting,
      globalCarbonIntensity
    }
  },
  
  methods: {
    // 格式化性能指标名称
    formatMetricName(metric) {
      const metricNames = {
        fcp: 'First Contentful Paint',
        lcp: 'Largest Contentful Paint',
        cls: 'Cumulative Layout Shift',
        fid: 'First Input Delay',
        ttfb: 'Time to First Byte'
      }
      
      return metricNames[metric] || metric
    },
    
    // 格式化性能指标值
    formatMetricValue(metric, value) {
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
    },
    
    // 获取性能指标评级
    getMetricGrade(metric, value) {
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
    },
    
    // 获取进度条样式
    getProgressStyle(metric, value) {
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
      } else {
        // 默认值
        percentage = 50
      }
      
      return { width: `${percentage}%` }
    },
    
    // 获取进度条类
    getProgressClass(metric, value) {
      return this.getMetricGrade(metric, value)
    },
    
    // 格式化数字
    formatNumber(value) {
      if (value === null || value === undefined) return '无法获取'
      return parseFloat(value).toFixed(2)
    },
    
    // 获取碳排放分数样式类
    getCarbonScoreClass(score) {
      if (!score) return 'average'
      score = parseInt(score)
      if (score <= 30) return 'excellent'
      if (score <= 50) return 'good'
      if (score <= 70) return 'moderate'
      return 'poor'
    },
    
    // 获取能源效率评分样式类
    getEnergyScoreClass(score) {
      if (!score) return 'average'
      score = parseInt(score)
      if (score >= 80) return 'excellent'
      if (score >= 60) return 'good'
      if (score >= 40) return 'moderate'
      return 'poor'
    },
    
    // 获取指标样式类
    getMetricClass(metric, value) {
      return this.getMetricGrade(metric, value)
    },
    
    // 判断是否为时间指标
    isTimingMetric(metric) {
      return ['fcp', 'lcp', 'fid', 'ttfb'].includes(metric)
    },
    
    // 获取进度条样式
    getProgressBarStyle(metric, value) {
      if (value === null || value === undefined) {
        return { width: '0%' }
      }
      
      let percentage = 0
      let grade = this.getMetricGrade(metric, value)
      
      if (metric === 'fcp' || metric === 'lcp') {
        // 转换为毫秒
        const ms = value * 1000
        percentage = Math.min(100, Math.max(10, (ms / 5000) * 100))
      } else if (metric === 'cls') {
        percentage = Math.min(100, Math.max(10, (value / 0.25) * 100))
      } else if (metric === 'fid' || metric === 'ttfb') {
        percentage = Math.min(100, Math.max(10, (value / 1000) * 100))
      }
      
      return {
        width: `${percentage}%`,
        backgroundColor: grade === 'good' ? 'var(--color-good)' : 
                         grade === 'average' ? 'var(--color-moderate)' : 
                         'var(--color-poor)'
      }
    },
    
    // 获取安全评分样式类
    getSecurityScoreClass(score) {
      if (!score && score !== 0) return 'poor'
      if (score >= 80) return 'excellent'
      if (score >= 60) return 'good'
      if (score >= 40) return 'moderate'
      return 'poor'
    },
    
    // 格式化安全头信息
    formatSecurityHeader(header) {
      const headerNames = {
        'strict-transport-security': 'HTTP严格传输安全',
        'content-security-policy': '内容安全策略',
        'x-content-type-options': '内容类型选项',
        'x-frame-options': '框架选项',
        'x-xss-protection': 'XSS保护'
      }
      
      return headerNames[header] || header
    },
    
    // 获取碳排放等级描述
    getCarbonScoreDesc(score) {
      if (!score) return '评估中'
      score = parseInt(score)
      if (score <= 30) return '非常环保'
      if (score <= 50) return '较为环保'
      if (score <= 70) return '一般水平'
      return '需要改进'
    },
    
    // 获取能源效率评分描述
    getEnergyScoreDesc(score) {
      if (!score) return '评估中'
      score = parseInt(score)
      if (score >= 80) return '高效利用'
      if (score >= 60) return '良好效率'
      if (score >= 40) return '一般效率'
      return '低效利用'
    },
    
    // 获取碳排放等价物描述
    getCarbonEquivalent(emission) {
      if (!emission) return '无法计算'
      
      if (emission < 0.5) {
        return '少于一封电子邮件的碳排放'
      } else if (emission < 1) {
        return '约等于一封电子邮件的碳排放'
      } else if (emission < 3) {
        return '约等于浏览一个简单网页'
      } else if (emission < 10) {
        return '约等于观看1分钟高清视频'
      } else {
        return `约等于观看${Math.round(emission/10)}分钟高清视频`
      }
    },
    
    // 格式化能源消耗值
    formatEnergy(value) {
      if (!value) return '0 Wh'
      return (value * 1000).toFixed(3) + ' Wh'
    },
    
    // 获取缓存效率描述
    getCachingEfficiency(value) {
      if (!value) return '标准优化'
      const percent = (value * 100).toFixed(0)
      if (value < 0.2) return `基础优化 (${percent}%)`
      if (value < 0.4) return `标准优化 (${percent}%)`
      if (value < 0.6) return `良好优化 (${percent}%)`
      return `优秀优化 (${percent}%)`
    },
    
    // 格式化文本长度
    formatTextLength(length) {
      if (!length && length !== 0) return 'N/A';
      if (length > 10000) return (length / 1000).toFixed(1) + 'K 字符';
      return length + ' 字符';
    },
    
    // 获取内容质量评分的样式类
    getQualityScoreClass(score) {
      if (!score && score !== 0) return 'poor';
      if (score >= 80) return 'excellent';
      if (score >= 60) return 'good';
      if (score >= 40) return 'moderate';
      return 'poor';
    },
    
    // 获取元数据状态
    getMetadataStatus(metadata) {
      if (!metadata) return '缺失';
      
      const hasCount = (metadata.hasTitle ? 1 : 0) + 
                       (metadata.hasDescription ? 1 : 0) + 
                       (metadata.hasKeywords ? 1 : 0);
      
      if (hasCount === 3) return '完整';
      if (hasCount >= 1) return '部分';
      return '缺失';
    },
    
    // 获取元数据的样式类
    getMetadataClass(metadata) {
      if (!metadata) return 'poor';
      
      const hasCount = (metadata.hasTitle ? 1 : 0) + 
                       (metadata.hasDescription ? 1 : 0) + 
                       (metadata.hasKeywords ? 1 : 0);
      
      if (hasCount === 3) return 'good';
      if (hasCount >= 1) return 'moderate';
      return 'poor';
    },
    
    // 获取资源类型的颜色
    getResourceColor(type) {
      const colors = {
        html: '#e34c26',
        css: '#563d7c',
        js: '#f1e05a',
        images: '#4caf50',
        fonts: '#ff9800',
        other: '#607d8b'
      };
      return colors[type] || '#607d8b';
    },
    
    // 格式化资源类型名称
    formatResourceType(type) {
      const types = {
        html: 'HTML',
        css: 'CSS',
        js: 'JavaScript',
        images: '图像',
        fonts: '字体',
        other: '其他'
      };
      return types[type] || type;
    },
    
    // 计算资源条形图的宽度
    getResourceBarWidth(count, allStats) {
      if (!allStats) return '0%';
      const total = Object.values(allStats).reduce((sum, c) => sum + c, 0);
      if (total === 0) return '0%';
      const percentage = (count / total) * 100;
      return Math.max(percentage, 3) + '%'; // 确保即使很小的值也有最小宽度
    },
    
    // 获取性能指标（过滤掉非性能指标）
    getPerformanceMetrics(performance) {
      if (!performance) return {};
      
      // 只选择性能指标来显示
      const metricsToShow = [
        'fcp', 'lcp', 'cls', 'fid', 'ttfb'
      ];
      
      return Object.fromEntries(
        Object.entries(performance)
          .filter(([key]) => metricsToShow.includes(key))
      );
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (!bytes && bytes !== 0) return 'N/A';
      bytes = Number(bytes);
      
      if (bytes >= 1048576) {
        return (bytes / 1048576).toFixed(2) + ' MB';
      }
      if (bytes >= 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
      }
      return bytes + ' B';
    },
    
    // 获取建议图标
    getSuggestionIcon(type) {
      const icons = {
        'image': 'fa-image',
        'script': 'fa-code',
        'font': 'fa-font',
        'cdn': 'fa-server',
        'cache': 'fa-database',
        'compress': 'fa-file-archive',
        'performance': 'fa-tachometer-alt',
        'default': 'fa-lightbulb'
      };
      return icons[type] || icons.default;
    },
    
    // 获取影响等级
    getImpactLevel(index) {
      const levels = ['低', '中', '高'];
      return levels[index % levels.length];
    },
    
    // 获取影响类
    getImpactClass(index) {
      const classes = ['low', 'medium', 'high'];
      return classes[index % classes.length];
    },
    
    // 获取指标描述
    getMetricDescription(metric) {
      const descriptions = {
        fcp: '首次内容绘制时间',
        lcp: '最大内容绘制时间',
        cls: '累计布局偏移',
        fid: '首次输入延迟',
        ttfb: '首次字节时间',
        responseTime: '服务器响应时间',
        pageSize: '页面总大小'
      };
      return descriptions[metric] || '未知描述';
    },
    
    // 格式化能源消耗值
    formatEnergyValue(value) {
      if (value === null || value === undefined) return '0.0000';
      const wattHours = value * 1000; // 转换为瓦时
      
      if (wattHours < 0.001) {
        // 小于1微瓦时，显示为微瓦时
        return `${(wattHours * 1000000).toFixed(2)} μWh`;
      } else if (wattHours < 1) {
        // 小于1毫瓦时，显示为毫瓦时
        return `${(wattHours * 1000).toFixed(2)} mWh`;
      } else {
        // 正常显示瓦时
        return `${wattHours.toFixed(4)} Wh`;
      }
    }
  }
}
</script>

<style>
/* 全局样式 */
.green-web-app {
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
.app-header {
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

.app-header::before {
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

.app-header::after {
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

.app-header h1 {
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

.url-input-group {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.domain-input {
  flex: 1;
  margin-right: 10px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  margin-bottom: 40px;
}

.summary-card {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  display: block;
  padding: 0;
  align-items: initial;
  margin: 0;
}

.summary-card.green {
  border-top: 5px solid #4caf50;
  background: #fff;
}

.summary-card.red {
  border-top: 5px solid #f44336;
  background: #fff;
}

/* 移除冲突的伪元素 */
.summary-card::before,
.summary-card::after {
  display: none;
  content: none;
}

.summary-header {
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.summary-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.summary-subtitle {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.summary-content {
  padding: 20px;
}

.summary-section {
  margin-bottom: 25px;
}

.summary-section:last-child {
  margin-bottom: 0;
}

/* 重置原来summary-content的样式 */
.summary-content h2,
.summary-content p {
  margin: 0;
  text-align: left;
  color: #333;
  text-shadow: none;
}

/* 总碳排放显示 */
.total-emission {
  display: flex;
  align-items: flex-start;
}

.carbon-icon {
  margin-right: 15px;
  color: #555;
  padding-top: 5px;
}

.carbon-details {
  flex: 1;
}

.total-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.total-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 15px;
}

.total-breakdown {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px 15px;
}

.total-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.total-label {
  color: #555;
  font-weight: 500;
}

.total-item .total-value {
  font-size: 16px;
  margin-bottom: 0;
}

.total-info {
  font-size: 12px;
  color: #777;
  margin-bottom: 12px;
  padding-left: 5px;
}

/* 确保每个section内的最后一个元素没有margin-bottom */
.summary-section > *:last-child {
  margin-bottom: 0;
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
.performance-metrics-v2 {
  padding: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #fff, #f8faff);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.metric-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.metric-visual {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.metric-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.metric-circle::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent 70%);
}

.metric-circle.good {
  background: linear-gradient(135deg, #34c759, #32ade6);
}

.metric-circle.average {
  background: linear-gradient(135deg, #ff9500, #ff2d55);
}

.metric-circle.poor {
  background: linear-gradient(135deg, #ff3b30, #ff375f);
}

.metric-circle.unknown {
  background: linear-gradient(135deg, #8e8e93, #aeaeb2);
}

.metric-info {
  width: 100%;
  text-align: center;
}

.metric-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  font-size: 15px;
}

.metric-description {
  color: #666;
  font-size: 13px;
  margin-top: 4px;
}

.network-stats {
  background: linear-gradient(135deg, #f5f7fa, #f9fafc);
  border-radius: 12px;
  padding: 15px 20px;
  margin-top: 10px;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.network-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  font-size: 16px;
  position: relative;
  padding-left: 16px;
}

.network-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34c759, #32ade6);
}

.network-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.network-item {
  text-align: center;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.network-value {
  font-size: 18px;
  font-weight: 600;
  color: #32ade6;
  margin-bottom: 5px;
}

.network-label {
  font-size: 14px;
  color: #666;
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
  .app-header {
    padding: 25px 0;
  }
  
  .app-header h1 {
    font-size: 28px;
  }
  
  .logo {
    width: 50px;
    height: 50px;
  }
  
  .logo-icon {
    font-size: 28px;
  }
  
  .url-input-group {
    flex-direction: column;
  }
  
  .domain-input {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .browser-select {
    width: 100%;
    margin-bottom: 10px;
    margin-right: 0;
  }
  
  .result-grid {
    grid-template-columns: 1fr;
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
    margin-right: 20px;
  }
  
  .summary-content h2 {
    font-size: 26px;
  }
  
  .summary-card {
    padding: 25px;
  }
  
  .score-container {
    flex-direction: column;
    align-items: center;
  }
  
  .carbon-score-card {
    width: 90%;
    margin-bottom: 10px;
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
  .app-header h1 {
    font-size: 24px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
    margin-right: 10px;
  }
  
  .logo-icon {
    font-size: 22px;
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
  
  .carbon-score-card {
    width: 100%;
    padding: 12px;
  }
  
  .score-circle {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}

/* 添加浏览器选择下拉菜单的样式 */
.browser-select {
  margin-right: 10px;
  width: 140px;
}

/* 调整URL输入框组的样式以容纳新的下拉菜单 */
.url-input-group {
  display: flex;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.domain-input {
  flex: 1;
  margin-right: 10px;
}

/* 碳排放分数显示 */
.score-container {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.carbon-score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  min-width: 110px;
  text-align: center;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.carbon-score-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.carbon-score-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #ff3b30, #ff9500);
}

.carbon-score-card.excellent::before {
  background: linear-gradient(90deg, #4cd964, #34c759);
}

.carbon-score-card.good::before {
  background: linear-gradient(90deg, #34c759, #5ac8fa);
}

.carbon-score-card.moderate::before {
  background: linear-gradient(90deg, #ffcc00, #ff9500);
}

.carbon-score-card.poor::before {
  background: linear-gradient(90deg, #ff3b30, #ff9500);
}

.score-circle {
  font-size: 24px;
  font-weight: 700;
  background: #f5f7fa;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  color: #333;
  border: 3px solid #eee;
}

.carbon-score-card.excellent .score-circle {
  background: rgba(76, 217, 100, 0.15);
  color: #34c759;
  border-color: rgba(76, 217, 100, 0.3);
}

.carbon-score-card.good .score-circle {
  background: rgba(90, 200, 250, 0.15);
  color: #007aff;
  border-color: rgba(90, 200, 250, 0.3);
}

.carbon-score-card.moderate .score-circle {
  background: rgba(255, 204, 0, 0.15);
  color: #ff9500;
  border-color: rgba(255, 204, 0, 0.3);
}

.carbon-score-card.poor .score-circle {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
  border-color: rgba(255, 59, 48, 0.3);
}

.score-label {
  font-size: 14px;
  color: #555;
  margin-bottom: 5px;
  font-weight: 500;
}

.score-desc {
  font-size: 13px;
  color: #888;
}

/* 错误提示样式 */
.error-alerts {
  margin-bottom: 20px;
  width: 100%;
}

.error-alert {
  background-color: #fff8f8;
  border-left: 4px solid #ff5252;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.error-alert h3 {
  color: #d32f2f;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.error-alert ul {
  margin: 10px 0;
  padding-left: 20px;
}

.error-alert li {
  margin-bottom: 5px;
  color: #616161;
}

/* 数据真实性提示样式 */
.data-note {
  background-color: #f0f4ff;
  border-left: 4px solid #5c6bc0;
  padding: 10px 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  font-size: 14px;
}

.estimated-data-tag {
  display: inline-block;
  background-color: #ffecb3;
  color: #795548;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  vertical-align: middle;
  font-weight: bold;
}

/* 能源消耗详情 */
.energy-breakdown {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 15px;
}

.energy-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.energy-items {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.energy-item {
  flex: 1;
  min-width: 120px;
  background-color: #fff;
  padding: 10px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.energy-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 5px;
}

.energy-value {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

/* 详情卡片样式 */
.detail-card {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-header {
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.detail-content {
  padding: 20px;
}

/* 托管提供商信息 */
.provider-info {
  display: flex;
  align-items: flex-start;
}

.provider-icon {
  margin-right: 15px;
  color: #555;
  padding-top: 5px;
}

.provider-details {
  flex: 1;
}

.provider-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

.provider-stats {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px 15px;
}

.provider-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
}

.provider-label {
  color: #555;
  font-weight: 500;
}

.provider-value {
  font-weight: 600;
  color: #2c3e50;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .result-summary {
    flex-direction: column;
  }
  
  .total-emission,
  .provider-info {
    flex-direction: column;
  }
  
  .carbon-icon,
  .provider-icon {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .energy-items {
    flex-direction: column;
  }
  
  .energy-item {
    width: 100%;
  }
}

/* 绿色托管信息卡片样式 */
.green-hosting .detail-content {
  padding: 15px;
}

.green-hosting .provider-info {
  margin-bottom: 20px;
}

.green-hosting .provider-stats {
  background-color: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
}

.green-value {
  color: #34c759 !important;
  font-weight: bold;
}

.green-hosting-info {
  background-color: #f0f9f4;
  border-radius: 8px;
  padding: 12px 15px;
  border-left: 4px solid #34c759;
  margin-top: 15px;
}

.green-hosting-info p {
  margin: 0;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.5;
}

/* 新的卡片布局样式 */
.result-card-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  margin-bottom: 40px;
}

.result-row {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  width: 100%;
}

.result-card {
  flex: 1;
  min-width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(230, 230, 230, 0.7);
  display: flex;
  flex-direction: column;
  padding: 0;
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #34c759, #32ade6);
  opacity: 0.8;
}

.result-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.major-card {
  min-height: 380px;
}

.wide-card {
  width: 100%;
  flex-basis: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fcfcfc;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  position: relative;
}

.card-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  color: #32ade6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.result-card .details, 
.result-card .carbon-stats,
.result-card .performance-metrics,
.result-card .suggestion-list,
.result-card .energy-chart,
.result-card .detail-content {
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 详情项目样式 */
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #666;
  font-weight: 500;
  font-size: 14px;
}

.detail-value {
  font-weight: 600;
  color: #333;
  background: linear-gradient(135deg, #f5f7fa, #e4e7eb);
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  font-size: 14px;
}

.highlight-text {
  color: #34c759;
  font-weight: bold;
}

/* 卡片摘要样式 */
.card-summary {
  padding: 20px 25px;
  background-color: #f9f9f9;
  margin-top: auto;
  border-top: 1px solid #f0f0f0;
}

.card-summary p {
  margin: 10px 0 0;
  color: #666;
  font-size: 14px;
}

.summary-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
}

.green-badge {
  background-color: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.standard-badge {
  background-color: rgba(255, 149, 0, 0.15);
  color: #ff9500;
}

/* 能源消耗网格 */
.energy-consumption-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  padding: 25px;
}

.energy-consumption-item {
  background: linear-gradient(135deg, #f9f9f9, #f5f5f5);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease;
}

.energy-consumption-item:hover {
  transform: translateY(-5px);
}

.consumption-icon {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  margin-bottom: 15px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.data-center-icon {
  background-color: rgba(52, 199, 89, 0.15);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2334c759"><path d="M4 1h16c1.1 0 2 .9 2 2v1c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1V3c0-1.1.9-2 2-2zm0 5h16c1.1 0 2 .9 2 2v1c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1V8c0-1.1.9-2 2-2zm0 5h16c1.1 0 2 .9 2 2v1c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1v-1c0-1.1.9-2 2-2z"/></svg>');
}

.network-icon {
  background-color: rgba(90, 200, 250, 0.15);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%235ac8fa"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>');
}

.device-icon {
  background-color: rgba(255, 149, 0, 0.15);
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff9500"><path d="M4 18h16c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2zM4 5h16v11H4V5zm8 14h2v-2h-2v2zm-4 0h2v-2H8v2zm8 0h2v-2h-2v2z"/></svg>');
}

.consumption-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.consumption-label {
  font-size: 14px;
  color: #666;
}

/* 碳排放详情 */
.carbon-impact .carbon-stats {
  padding: 20px 25px;
}

.carbon-annual-impact {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9f4, #e6f7eb);
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.impact-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.impact-value {
  font-size: 24px;
  font-weight: 700;
  color: #34c759;
  margin-bottom: 5px;
}

.impact-equivalent {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

/* 碳排放评分 */
.total-emission-highlight {
  background: linear-gradient(135deg, #f0f9f4, #e6f7eb);
  padding: 25px;
  margin: 20px 25px;
  border-radius: 12px;
  text-align: center;
  animation: pulse 3s infinite alternate;
}

@keyframes pulse {
  0% { box-shadow: 0 4px 15px rgba(52, 199, 89, 0.1); }
  100% { box-shadow: 0 4px 25px rgba(52, 199, 89, 0.25); }
}

.highlight-value {
  font-size: 28px;
  font-weight: 700;
  color: #34c759;
  margin-bottom: 5px;
}

.highlight-value span {
  font-size: 16px;
  font-weight: 500;
  color: #666;
}

.highlight-label {
  font-size: 14px;
  color: #666;
}

/* 数据源信息 */
.data-source-info {
  padding: 10px 25px;
  background-color: #f9f9f9;
  color: #888;
  font-size: 13px;
  font-style: italic;
  margin-top: auto;
  border-top: 1px solid #f0f0f0;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .result-row {
    flex-direction: column;
  }
  
  .result-card {
    width: 100%;
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .energy-consumption-grid {
    grid-template-columns: 1fr;
  }
  
  .score-container {
    flex-direction: column;
  }
  
  .carbon-score-card {
    width: 100%;
    margin-bottom: 15px;
  }
}

/* 性能指标和优化建议布局 */
.performance-metrics-v2 {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 15px;
  animation: fadeInUp 0.6s ease-out forwards;
}

.metrics-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.metric-card {
  flex: 1;
  min-width: 200px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.metric-visual {
  width: 100%;
  padding: 20px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.metric-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-circle.good {
  background: linear-gradient(to right, #4caf50, #45a049);
}

.metric-circle.average {
  background: linear-gradient(to right, #ff9500, #ffb340);
}

.metric-circle.poor {
  background: linear-gradient(to right, #ff3b30, #ff6b60);
}

.metric-circle.unknown {
  background: linear-gradient(to right, #aaa, #ccc);
  opacity: 0.5;
}

.metric-info {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #eee;
}

.metric-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

.metric-description {
  font-size: 14px;
  color: #666;
}

.network-stats {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-top: 8px;
  animation: fadeIn 0.8s ease-out forwards;
}

.network-title {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 6px;
}

.network-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.network-item {
  flex: 1;
  min-width: 150px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.network-value {
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.network-label {
  font-size: 14px;
  color: #666;
}

/* 优化建议布局 */
.suggestions-container {
  padding: 25px;
}

.suggestions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.suggestion-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
}

.suggestion-header {
  padding: 18px;
  background: linear-gradient(135deg, #f8faff, #f0f4f9);
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.suggestion-icon {
  margin-right: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(50, 173, 230, 0.15), rgba(52, 199, 89, 0.15));
  color: #32ade6;
  box-shadow: 0 4px 8px rgba(50, 173, 230, 0.15);
}

.suggestion-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.3px;
}

.suggestion-content {
  padding: 20px;
  color: #555;
  font-size: 15px;
  line-height: 1.7;
  flex: 1;
  background-color: #fff;
  position: relative;
}

.suggestion-content::before {
  content: '';
  position: absolute;
  left: 20px;
  right: 20px;
  height: 2px;
  top: 0;
  background: linear-gradient(to right, rgba(50, 173, 230, 0.1), transparent);
  border-radius: 2px;
}

.suggestion-impact {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #fff;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
}

.suggestion-impact.low {
  background: linear-gradient(to right, #4caf50, #66bb6a);
}

.suggestion-impact.medium {
  background: linear-gradient(to right, #ff9800, #ffa726);
}

.suggestion-impact.high {
  background: linear-gradient(to right, #f44336, #ef5350);
}

@media (max-width: 768px) {
  .suggestions-list {
    grid-template-columns: 1fr;
  }
  
  .metrics-grid {
    flex-direction: column;
  }
  
  .metric-card {
    width: 100%;
    min-width: 100%;
  }
}

.energy-note {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}
</style> 