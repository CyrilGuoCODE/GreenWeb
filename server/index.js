/**
 * GreenWeb后端代理服务器
 * 用于处理跨域请求和获取网站性能数据
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dns = require('dns').promises;
const { performance } = require('perf_hooks');
const { URL } = require('url');
const geoip = require('geoip-lite');
const whois = require('whois-json');
const useragent = require('express-useragent');
const path = require('path');
const https = require('https');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(useragent.express());
app.use(express.static(path.join(__dirname, '../dist')));

// 创建不验证SSL证书的axios实例
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  }),
  timeout: 10000
});

// 全局常量 - 用于碳排放计算
const GLOBAL_CONSTANTS = {
  // 能源消耗常量
  averageEnergyConsumption: 1.805, // kWh/GB
  greenEnergyCarbonIntensity: 50, // gCO2e/kWh
  averageCarbonIntensity: 475, // gCO2e/kWh
  
  // 数据中心效率
  averagePUE: 1.67, // 电能使用效率
  bestPUE: 1.1,
  
  // 传输和设备能耗
  averageTransmissionPerGB: 0.06, // kWh/GB
  averageDevicePerGB: 0.08, // kWh/GB
  
  // 缓存效率
  cachingEfficiency: 0.2, // 20%的流量被缓存
  
  // 访问量估算
  averageMonthlyVisits: 10000,
  
  // 碳中和阈值
  greenEnergyThreshold: 80, // 80%以上可再生能源视为碳中和
  
  // 每年一棵树可吸收二氧化碳量（kg）
  treeCO2PerYear: 25
};

// 国家碳强度数据 (gCO2e/kWh)
const COUNTRY_CARBON_INTENSITY = {
  'US': 383,
  'CN': 554,
  'IN': 739,
  'JP': 478,
  'DE': 344,
  'GB': 231,
  'FR': 56,
  'IT': 331,
  'BR': 87,
  'CA': 135,
  'KR': 415,
  'RU': 351,
  'AU': 656,
  'ES': 200,
  'MX': 428,
  'ID': 736,
  'NL': 358,
  'SA': 523,
  'CH': 24,
  'TR': 461,
  'SE': 13,
  'PL': 751,
  'BE': 161,
  'TH': 471,
  'AT': 109,
  'IE': 291,
  'SG': 418,
  'IL': 529,
  'DK': 135,
  'FI': 89,
  'NO': 8,
  // 默认值将使用全球平均值
};

// 主要云服务提供商信息
const PROVIDER_INFO = {
  'aws': {
    name: 'Amazon Web Services',
    renewableRange: [60, 85],
    renewableChance: 0.8,
    pueRange: [1.1, 1.4],
    serverEfficiency: 1.2,
    regions: ['us-east', 'us-west', 'eu-west', 'eu-central', 'ap-northeast', 'ap-southeast', 'sa-east']
  },
  'azure': {
    name: 'Microsoft Azure',
    renewableRange: [65, 90],
    renewableChance: 0.85,
    pueRange: [1.1, 1.35],
    serverEfficiency: 1.25,
    regions: ['us-east', 'us-west', 'eu-west', 'eu-north', 'asia-east', 'asia-southeast', 'australia-east']
  },
  'google': {
    name: 'Google Cloud',
    renewableRange: [80, 95],
    renewableChance: 0.9,
    pueRange: [1.1, 1.2],
    serverEfficiency: 1.3,
    regions: ['us-central', 'us-east', 'us-west', 'europe-west', 'europe-north', 'asia-east', 'asia-south']
  },
  'cloudflare': {
    name: 'Cloudflare',
    renewableRange: [70, 90],
    renewableChance: 0.8,
    pueRange: [1.1, 1.3],
    serverEfficiency: 1.2,
    regions: ['global-edge']
  },
  'alibaba': {
    name: 'Alibaba Cloud',
    renewableRange: [45, 70],
    renewableChance: 0.6,
    pueRange: [1.3, 1.6],
    serverEfficiency: 1.1,
    regions: ['cn-hangzhou', 'cn-shanghai', 'cn-beijing', 'us-west', 'eu-central', 'ap-southeast']
  },
  'tencent': {
    name: 'Tencent Cloud',
    renewableRange: [40, 65],
    renewableChance: 0.5,
    pueRange: [1.35, 1.65],
    serverEfficiency: 1.0,
    regions: ['ap-guangzhou', 'ap-shanghai', 'ap-beijing', 'na-siliconvalley', 'eu-frankfurt', 'ap-singapore']
  },
  'other': {
    name: 'Unknown Provider',
    renewableRange: [30, 60],
    renewableChance: 0.4,
    pueRange: [1.5, 1.9],
    serverEfficiency: 0.9,
    regions: ['unknown']
  }
};

/**
 * 健康检查端点
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 获取服务器位置信息
 */
app.get('/api/location', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: '缺少域名参数' });
    }
    
    // 使用DNS查询获取IP地址
    const addresses = await dns.lookup(domain, { all: true });
    const ip = addresses[0]?.address;
    
    if (!ip) {
      return res.status(404).json({ error: '无法解析域名' });
    }
    
    // 使用GeoIP获取位置信息
    const geo = geoip.lookup(ip);
    
    // 尝试使用WHOIS获取额外信息
    let whoisData = {};
    try {
      whoisData = await whois(domain);
    } catch (whoisError) {
      console.error('WHOIS查询失败:', whoisError);
    }
    
    res.json({
      ip,
      country: geo?.country || null,
      region: geo?.region || null,
      city: geo?.city || null,
      timezone: geo?.timezone || null,
      coordinates: geo?.ll || null,
      org: geo?.org || null,
      registrar: whoisData.registrar || null,
      registrantCountry: whoisData.registrantCountry || null
    });
  } catch (error) {
    console.error('位置查询错误:', error);
    res.status(500).json({ error: '位置查询失败', message: error.message });
  }
});

/**
 * 获取HTTP响应头信息
 */
app.get('/api/headers', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    const startTime = performance.now();
    const response = await axiosInstance.head(url, {
      maxRedirects: 5,
      validateStatus: null
    });
    const endTime = performance.now();
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      responseTime: endTime - startTime
    });
  } catch (error) {
    console.error('头信息获取错误:', error);
    res.status(500).json({ error: '头信息获取失败', message: error.message });
  }
});

/**
 * 测量页面大小
 */
app.get('/api/size', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    const startTime = performance.now();
    const response = await axiosInstance.get(url, {
      maxRedirects: 5,
      validateStatus: null,
      responseType: 'arraybuffer' // 获取二进制响应以精确计算大小
    });
    const endTime = performance.now();
    
    // 计算页面大小（KB）
    const contentLength = response.headers['content-length'] || response.data.length;
    const sizeInKB = Math.round(contentLength / 1024);
    
    res.json({
      size: sizeInKB,
      contentType: response.headers['content-type'],
      responseTime: endTime - startTime
    });
  } catch (error) {
    console.error('页面大小测量错误:', error);
    res.status(500).json({ error: '页面大小测量失败', message: error.message });
  }
});

/**
 * 分析服务提供商
 */
app.get('/api/provider', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: '缺少域名参数' });
    }
    
    // 使用DNS和WHOIS信息尝试确定服务提供商
    const addresses = await dns.lookup(domain, { all: true });
    const ip = addresses[0]?.address;
    
    if (!ip) {
      return res.status(404).json({ error: '无法解析域名' });
    }
    
    // 使用GeoIP获取组织信息
    const geo = geoip.lookup(ip);
    const org = geo?.org || '';
    
    // 尝试确定服务提供商
    let provider = 'other';
    
    if (org.includes('AMAZON') || org.includes('AWS')) {
      provider = 'aws';
    } else if (org.includes('MICROSOFT') || org.includes('MSFT')) {
      provider = 'azure';
    } else if (org.includes('GOOGLE')) {
      provider = 'google';
    } else if (org.includes('ALIBABA') || org.includes('ALIYUN')) {
      provider = 'alibaba';
    } else if (org.includes('TENCENT')) {
      provider = 'tencent';
    } else if (org.includes('CLOUDFLARE')) {
      provider = 'cloudflare';
    }
    
    // 获取提供商详细信息
    const providerInfo = PROVIDER_INFO[provider] || PROVIDER_INFO.other;
    
    // 估计可再生能源使用比例
    const [minRenewable, maxRenewable] = providerInfo.renewableRange;
    const renewablePercentage = Math.floor(Math.random() * (maxRenewable - minRenewable + 1)) + minRenewable;
    
    // 计算数据中心PUE (电能使用效率)
    const [minPUE, maxPUE] = providerInfo.pueRange;
    const dataCenterPUE = parseFloat((Math.random() * (maxPUE - minPUE) + minPUE).toFixed(2));
    
    res.json({
      provider,
      providerName: providerInfo.name,
      ip,
      org,
      renewablePercentage,
      pue: dataCenterPUE,
      serverEfficiency: providerInfo.serverEfficiency
    });
  } catch (error) {
    console.error('提供商分析错误:', error);
    res.status(500).json({ error: '提供商分析失败', message: error.message });
  }
});

/**
 * 性能测量
 */
app.get('/api/performance', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    // 使用Lighthouse进行性能测量
    const chrome = await chromeLauncher.launch({chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']});
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };
    
    console.log(`开始使用Lighthouse分析: ${url}`);
    
    const runnerResult = await lighthouse(url, options);
    const audits = runnerResult.lhr.audits;
    
    // 关闭Chrome
    await chrome.kill();
    
    // 提取Web核心指标
    const fcp = audits['first-contentful-paint'].numericValue / 1000; // 转换为秒
    const lcp = audits['largest-contentful-paint'].numericValue / 1000; // 转换为秒
    const cls = audits['cumulative-layout-shift'].numericValue;
    const fid = audits['max-potential-fid'].numericValue; // 首次输入延迟估计值
    const ttfb = audits['server-response-time'].numericValue; // 服务器响应时间
    
    // 页面大小(KB)
    const pageSize = audits['total-byte-weight'].numericValue / 1024;
    
    res.json({
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      statusCode: 200,
      measuredBy: 'lighthouse'
    });
  } catch (error) {
    console.error('性能测量错误:', error);
    // 测量失败时返回错误信息，而不是估计值
    res.status(500).json({ 
      error: '性能测量失败', 
      message: error.message,
      measurable: false
    });
  }
});

/**
 * 碳排放计算
 */
app.get('/api/carbon', async (req, res) => {
  try {
    const { pageSize, country, renewablePercentage, pue } = req.query;
    
    if (!pageSize) {
      return res.status(400).json({ error: '缺少页面大小参数' });
    }
    
    // 使用提供的值或默认值
    const pageSizeKB = parseInt(pageSize) || 2000;
    const countryCode = country || 'US';
    const renewable = parseFloat(renewablePercentage) || 50;
    const dataCenterPUE = parseFloat(pue) || GLOBAL_CONSTANTS.averagePUE;
    
    // 数据传输计算 (考虑缓存)
    const pageSizeInGB = pageSizeKB / 1024 / 1024;
    const adjustedPageSizeInGB = pageSizeInGB * (1 - GLOBAL_CONSTANTS.cachingEfficiency);
    
    // 能源强度计算
    const baseEnergyIntensity = GLOBAL_CONSTANTS.averageEnergyConsumption;
    const energyIntensity = baseEnergyIntensity * dataCenterPUE;
    
    // 计算能源消耗
    const dataCenterEnergy = adjustedPageSizeInGB * (energyIntensity / dataCenterPUE);
    const transmissionEnergy = adjustedPageSizeInGB * GLOBAL_CONSTANTS.averageTransmissionPerGB;
    const deviceEnergy = adjustedPageSizeInGB * GLOBAL_CONSTANTS.averageDevicePerGB;
    
    // 考虑国家电网碳强度
    const countryCarbonValue = COUNTRY_CARBON_INTENSITY[countryCode] || GLOBAL_CONSTANTS.averageCarbonIntensity;
    
    // 数据中心碳排放 - 考虑可再生能源比例
    const dataTransferCarbon = dataCenterEnergy * (
      (renewable / 100) * GLOBAL_CONSTANTS.greenEnergyCarbonIntensity + 
      ((100 - renewable) / 100) * countryCarbonValue
    );
    
    // 网络传输和客户设备碳排放
    const networkCarbon = transmissionEnergy * GLOBAL_CONSTANTS.averageCarbonIntensity;
    const clientCarbon = deviceEnergy * GLOBAL_CONSTANTS.averageCarbonIntensity;
    
    // 计算碳排放总量 (单位：g CO2)
    const totalCarbonEmission = dataTransferCarbon + networkCarbon + clientCarbon;
    
    // 估计访问量和长期排放
    const estimatedMonthlyVisits = GLOBAL_CONSTANTS.averageMonthlyVisits;
    const monthlyCarbonEmission = (totalCarbonEmission * estimatedMonthlyVisits) / 1000; // 单位：kg CO2
    const annualCarbonEmission = monthlyCarbonEmission * 12;
    
    // 计算需要种植多少棵树
    const treesNeeded = Math.round(annualCarbonEmission / GLOBAL_CONSTANTS.treeCO2PerYear);
    
    res.json({
      pageSize: pageSizeKB,
      energyIntensity,
      dataCenterEnergy,
      transmissionEnergy,
      deviceEnergy,
      dataTransferCarbon,
      networkCarbon,
      clientCarbon,
      totalCarbonEmission,
      monthlyCarbonEmission,
      annualCarbonEmission,
      treesNeeded,
      isGreen: renewable >= GLOBAL_CONSTANTS.greenEnergyThreshold
    });
  } catch (error) {
    console.error('碳排放计算错误:', error);
    res.status(500).json({ error: '碳排放计算失败', message: error.message });
  }
});

/**
 * 生成优化建议
 */
app.get('/api/suggestions', async (req, res) => {
  try {
    const { pageSize, performance, provider, renewablePercentage, pue, totalCarbonEmission } = req.query;
    
    // 提取性能数据
    const performanceData = typeof performance === 'string' ? JSON.parse(performance) : (performance || {});
    
    // 准备建议生成的数据
    const data = {
      pageSize: parseInt(pageSize) || 2000,
      performance: {
        fcp: parseFloat(performanceData.fcp) || 1.5,
        lcp: parseFloat(performanceData.lcp) || 2.5,
        cls: parseFloat(performanceData.cls) || 0.05,
        fid: parseFloat(performanceData.fid) || 100,
        ttfb: parseFloat(performanceData.ttfb) || 200
      },
      provider: provider || 'other',
      renewablePercentage: parseFloat(renewablePercentage) || 50,
      pue: parseFloat(pue) || 1.67,
      totalCarbonEmission: parseFloat(totalCarbonEmission) || 1.5
    };
    
    // 生成建议
    const suggestions = generateOptimizationSuggestions(data);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('建议生成错误:', error);
    res.status(500).json({ error: '建议生成失败', message: error.message });
  }
});

/**
 * 综合网站分析
 */
app.get('/api/analyze', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ error: '缺少域名参数' });
    }
    
    // 确保域名格式正确
    let url;
    try {
      if (domain.startsWith('http')) {
        url = new URL(domain).href;
      } else {
        url = `https://${domain}`;
      }
    } catch (error) {
      return res.status(400).json({ error: '无效的域名格式' });
    }
    
    // 并行执行所有分析任务
    let [locationData, headerData, sizeData, providerData] = [null, null, null, null];
    let performanceData = null;
    
    try {
      [locationData, headerData, providerData] = await Promise.all([
        axios.get(`http://localhost:${PORT}/api/location?domain=${domain}`).then(resp => resp.data),
        axios.get(`http://localhost:${PORT}/api/headers?url=${encodeURIComponent(url)}`).then(resp => resp.data),
        axios.get(`http://localhost:${PORT}/api/provider?domain=${domain}`).then(resp => resp.data)
      ]);
    } catch (error) {
      console.error('基础数据获取错误:', error);
    }
    
    // 单独执行性能测量，因为它可能需要更长时间
    try {
      performanceData = await axios.get(`http://localhost:${PORT}/api/performance?url=${encodeURIComponent(url)}`)
        .then(resp => resp.data);
      
      // 如果有性能数据，使用它的页面大小
      if (performanceData && performanceData.pageSize) {
        sizeData = { size: performanceData.pageSize };
      }
    } catch (error) {
      console.error('性能测量错误:', error);
      performanceData = { measurable: false, error: error.message };
    }
    
    // 如果没有页面大小数据，尝试单独获取
    if (!sizeData) {
      try {
        sizeData = await axios.get(`http://localhost:${PORT}/api/size?url=${encodeURIComponent(url)}`)
          .then(resp => resp.data);
      } catch (error) {
        console.error('页面大小测量错误:', error);
        sizeData = { measurable: false, error: error.message };
      }
    }
    
    // 尝试计算碳排放（即使部分数据缺失）
    let carbonData = null;
    try {
      const pageSize = sizeData?.size || 0;
      const country = locationData?.country || null;
      const renewablePercentage = providerData?.renewablePercentage || 50;
      const pue = providerData?.pue || GLOBAL_CONSTANTS.averagePUE;
      
      if (pageSize > 0) {
        carbonData = await axios.get(`http://localhost:${PORT}/api/carbon`, {
          params: { pageSize, country, renewablePercentage, pue }
        }).then(resp => resp.data);
      } else {
        carbonData = { measurable: false, error: '缺少页面大小数据' };
      }
    } catch (error) {
      console.error('碳排放计算错误:', error);
      carbonData = { measurable: false, error: error.message };
    }
    
    // 只有当性能数据可用时才生成优化建议
    let suggestionsData = { suggestions: [] };
    if (performanceData && !performanceData.error) {
      try {
        suggestionsData = await axios.get(`http://localhost:${PORT}/api/suggestions`, {
          params: {
            pageSize: sizeData?.size || 0,
            performance: JSON.stringify(performanceData),
            provider: providerData?.provider || 'other',
            renewablePercentage: providerData?.renewablePercentage || 50,
            pue: providerData?.pue || GLOBAL_CONSTANTS.averagePUE,
            totalCarbonEmission: carbonData?.totalCarbonEmission || 0
          }
        }).then(resp => resp.data);
      } catch (error) {
        console.error('建议生成错误:', error);
        suggestionsData = { 
          suggestions: ['由于性能数据获取失败，无法生成针对性优化建议。'],
          measurable: false, 
          error: error.message 
        };
      }
    } else {
      suggestionsData = { 
        suggestions: ['由于性能数据获取失败，无法生成针对性优化建议。'],
        measurable: false 
      };
    }
    
    // 整合所有数据
    const result = {
      domain,
      url,
      timestamp: new Date().toISOString(),
      
      // 位置信息
      location: locationData || { measurable: false },
      
      // 页面信息
      pageSize: sizeData?.size || 0,
      contentType: sizeData?.contentType || null,
      headers: headerData?.headers || null,
      
      // 服务提供商信息
      provider: providerData?.provider || 'unknown',
      providerName: providerData?.providerName || 'Unknown Provider',
      renewablePercentage: providerData?.renewablePercentage || null,
      pue: providerData?.pue || null,
      
      // 性能指标
      performance: performanceData || { measurable: false },
      
      // 碳排放信息
      energyIntensity: carbonData?.energyIntensity || null,
      dataCenterEnergy: carbonData?.dataCenterEnergy || null,
      transmissionEnergy: carbonData?.transmissionEnergy || null,
      deviceEnergy: carbonData?.deviceEnergy || null,
      dataTransferCarbon: carbonData?.dataTransferCarbon || null,
      networkCarbon: carbonData?.networkCarbon || null,
      clientCarbon: carbonData?.clientCarbon || null,
      totalCarbonEmission: carbonData?.totalCarbonEmission || null,
      monthlyCarbonEmission: carbonData?.monthlyCarbonEmission || null,
      annualCarbonEmission: carbonData?.annualCarbonEmission || null,
      treesNeeded: carbonData?.treesNeeded || null,
      isGreen: carbonData?.isGreen || false,
      
      // 优化建议
      suggestions: suggestionsData.suggestions || []
    };
    
    res.json(result);
  } catch (error) {
    console.error('综合分析错误:', error);
    res.status(500).json({ 
      error: '综合分析失败', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * 生成智能优化建议
 */
function generateOptimizationSuggestions(data) {
  // 如果没有性能数据，返回通用建议
  if (!data.performance || !data.performance.lcp) {
    return [
      '无法获取性能指标，请确保网站可访问并且服务器配置正确',
      '考虑使用CDN分发静态资源，减少数据传输距离和能耗',
      '实施高效的HTTP缓存策略，延长缓存有效期减少重复请求',
      '优化图片资源，考虑使用WebP或AVIF等新一代图片格式'
    ];
  }
  
  const suggestions = [];
  
  // 基于页面大小的建议
  if (data.pageSize > 4000) {
    suggestions.push('大幅压缩图片资源，当前页面大小过大，严重影响加载速度和能源消耗');
    suggestions.push('使用WebP或AVIF等新一代图片格式，可减少50-90%的图片大小');
    suggestions.push('实施延迟加载(Lazy Loading)技术，仅加载可视区域内容');
  } else if (data.pageSize > 2500) {
    suggestions.push('压缩图片和媒体资源，减少页面大小和传输量');
    suggestions.push('优化JavaScript和CSS文件，减少不必要的代码');
  } else if (data.pageSize > 1500) {
    suggestions.push('考虑进一步优化资源大小，提高页面加载速度');
  }
  
  // 基于性能指标的建议
  if (data.performance.lcp > 2.5) {
    suggestions.push(`优化最大内容绘制(LCP=${data.performance.lcp.toFixed(2)}s)，重点优化主要内容元素的加载时间`);
  }
  
  if (data.performance.cls > 0.1) {
    suggestions.push(`减少累积布局偏移(CLS=${data.performance.cls.toFixed(3)})，预先设置图片和元素尺寸`);
  }
  
  if (data.performance.ttfb > 300) {
    suggestions.push(`优化服务器响应时间(TTFB=${Math.round(data.performance.ttfb)}ms)，考虑使用边缘CDN或优化后端处理`);
  }
  
  if (data.performance.fid > 130) {
    suggestions.push(`提高首次输入延迟(FID=${Math.round(data.performance.fid)}ms)，减少主线程阻塞的JavaScript执行`);
  }
  
  // 基于碳排放的建议
  if (data.renewablePercentage < GLOBAL_CONSTANTS.greenEnergyThreshold) {
    suggestions.push(`当前服务器使用的可再生能源比例(${data.renewablePercentage}%)偏低，建议迁移至更环保的数据中心`);
  }
  
  if (data.pue > 1.5) {
    suggestions.push(`当前数据中心PUE值(${data.pue})较高，选择更高能效的服务提供商可降低碳排放`);
  }
  
  if (data.totalCarbonEmission > 1.5) {
    suggestions.push(`当前页面单次访问碳排放(${data.totalCarbonEmission.toFixed(2)}gCO2e)偏高，建议全面优化页面资源`);
  }
  
  // 通用绿色建议
  suggestions.push('实施高效的HTTP缓存策略，延长缓存有效期减少重复请求');
  suggestions.push('使用CDN分发静态资源，减少数据传输距离和能耗');
  
  // 确保建议数量不会太多
  return suggestions.slice(0, 8);
}

// 所有其他路由返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`GreenWeb服务器运行在端口 ${PORT}`);
}); 