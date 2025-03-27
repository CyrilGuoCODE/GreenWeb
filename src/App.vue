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
        
        <!-- 添加数据真实性指示 -->
        <div v-if="result.estimatedData && result.estimatedData.length > 0" class="data-note">
          <p><strong>注意:</strong> 以下数据是估算的，而非直接测量：{{ result.estimatedData.join(', ') }}。</p>
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
                  </div>
                </div>
              </div>
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
                <span class="detail-value">{{ result.provider && typeof result.provider === 'string' ? result.provider.toUpperCase() : '未知' }}</span>
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
              <!-- 新增评分显示区域 -->
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
              
              <div ref="heatmapRef" class="heatmap"></div>
              <div class="carbon-stats">
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
                <div class="carbon-stat-item">
                  <span class="stat-label">总计碳排放:</span>
                  <span class="stat-value">{{ result.totalCarbonEmission.toFixed(2) }} gCO2e</span>
                </div>
              </div>
              <div class="carbon-total">
                <div class="total-item">
                  <span class="total-label">年度碳排放:</span>
                  <span class="total-value">
                    {{ result.annualCarbonEmission.toFixed(2) }} kgCO2e
                    <span v-if="result.estimatedData && result.estimatedData.includes('annualCarbonEmission')" class="estimated-data-tag">估算</span>
                  </span>
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
            <div v-if="result.performance && result.performance.measurable !== false" class="performance-metrics">
              <div 
                v-for="(value, metric, index) in result.performance" 
                :key="metric"
                :style="`--i: ${index}`"
                class="metric-item"
                v-show="!['measuredBy', 'statusCode', 'measurable', 'requestCount', 'domainCount'].includes(metric)"
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
              
              <!-- 添加网络请求指标显示 -->
              <div v-if="result.performance.requestCount || result.performance.domainCount" class="additional-metrics">
                <h4>网络请求数据</h4>
                <div class="detail-item" v-if="result.performance.requestCount">
                  <span class="detail-label">请求数量:</span>
                  <span class="detail-value">{{ result.performance.requestCount }}</span>
                </div>
                <div class="detail-item" v-if="result.performance.domainCount">
                  <span class="detail-label">域名数量:</span>
                  <span class="detail-value">{{ result.performance.domainCount }}</span>
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

<script>
import { ref, onMounted, reactive, nextTick } from 'vue'
import { Search, Connection, DataBoard, PieChart, Timer, Opportunity, Check, Close } from '@element-plus/icons-vue'
import * as echarts from 'echarts/core'
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
    const heatmapRef = ref(null)
    const selectedBrowser = ref('auto')
    let heatmapChart = null
    
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
        
        // 初始化热图
        nextTick(() => {
          console.log('尝试初始化热图')
          // 临时禁用热图初始化以避免错误
          // initializeHeatmap()
        })
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
    
    return {
      domain,
      loading,
      result,
      heatmapRef,
      globalConstants,
      selectedBrowser,
      checkCarbon
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
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 15px;
  animation: fadeInUp 0.6s ease-out forwards;
}

.additional-metrics {
  background-color: rgba(255, 255, 255, 0.9);
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  margin-top: 8px;
  animation: fadeIn 0.8s ease-out forwards;
}

.additional-metrics h4 {
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 10px;
  margin-top: 0;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 6px;
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
</style> 