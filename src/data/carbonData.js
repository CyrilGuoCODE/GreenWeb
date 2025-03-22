// 数据中心位置数据
export const dataCenterLocationMapping = {
  'aws': ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  'gcp': ['us-central1', 'europe-west2', 'asia-east1'],
  'azure': ['eastus', 'westeurope', 'southeastasia']
};

// 数据中心到国家的映射
export const regionToCountry = {
  'us-east-1': 'United States',
  'us-west-2': 'United States',
  'eu-west-1': 'Ireland',
  'ap-southeast-1': 'Singapore',
  'us-central1': 'United States',
  'europe-west2': 'United Kingdom',
  'asia-east1': 'Taiwan',
  'eastus': 'United States',
  'westeurope': 'Netherlands',
  'southeastasia': 'Singapore'
};

// 碳强度数据
export const carbonIntensityData = {
  'China': { carbonIntensity: 800, greenEnergy: 30 },
  'United States': { carbonIntensity: 400, greenEnergy: 20 },
  'Germany': { carbonIntensity: 300, greenEnergy: 45 },
  'France': { carbonIntensity: 100, greenEnergy: 75 },
  'Sweden': { carbonIntensity: 50, greenEnergy: 95 },
  'Norway': { carbonIntensity: 20, greenEnergy: 98 },
  'Iceland': { carbonIntensity: 10, greenEnergy: 100 },
  'Denmark': { carbonIntensity: 150, greenEnergy: 80 },
  'Netherlands': { carbonIntensity: 350, greenEnergy: 25 },
  'Japan': { carbonIntensity: 450, greenEnergy: 15 },
  'Ireland': { carbonIntensity: 250, greenEnergy: 40 },
  'Singapore': { carbonIntensity: 550, greenEnergy: 10 },
  'Taiwan': { carbonIntensity: 600, greenEnergy: 15 }
};

// 数据中心能源源类型
export const dataCenterEnergySource = {
  'aws': {
    'us-east-1': { renewable: 35, fossil: 65 },
    'us-west-2': { renewable: 85, fossil: 15 }, // 使用大量水电
    'eu-west-1': { renewable: 65, fossil: 35 },
    'ap-southeast-1': { renewable: 20, fossil: 80 }
  },
  'gcp': {
    'us-central1': { renewable: 40, fossil: 60 },
    'europe-west2': { renewable: 55, fossil: 45 },
    'asia-east1': { renewable: 15, fossil: 85 }
  },
  'azure': {
    'eastus': { renewable: 30, fossil: 70 },
    'westeurope': { renewable: 60, fossil: 40 },
    'southeastasia': { renewable: 25, fossil: 75 }
  }
};

// 网页类型平均数据传输量 (KB)
export const webPageSizeByType = {
  'simple': 500, // 简单静态页面
  'blog': 1500, // 博客页面
  'ecommerce': 3000, // 电商页面
  'media': 5000, // 媒体页面
  'webapp': 2000 // Web应用
};

// 网络数据传输能源强度 (kWh/GB)
export const dataTransferEnergyIntensity = {
  'mobile': 0.9, // 移动网络
  'wifi': 0.3, // WiFi网络
  'fixed': 0.2 // 固定宽带
};

// 性能指标权重
export const performanceMetricsWeight = {
  fcp: 0.15, // 首次内容绘制
  lcp: 0.25, // 最大内容绘制
  tti: 0.30, // 交互时间
  tbt: 0.20, // 总阻塞时间
  cls: 0.10  // 累积布局偏移
};

// 碳排放因子
export const carbonEmissionFactors = {
  // 每GB数据传输的碳排放（gCO2e）
  dataTransfer: 500,
  // 每千瓦时服务器能耗的碳排放（gCO2e/kWh）
  serverEnergy: 500,
  // 每千瓦时网络传输能耗的碳排放（gCO2e/kWh）
  networkEnergy: 200,
  // 每千瓦时客户端能耗的碳排放（gCO2e/kWh）
  clientEnergy: 400
};

// 网站流量级别 (每月访问量)
export const trafficLevels = {
  'low': 10000, // 低流量
  'medium': 50000, // 中等流量
  'high': 500000, // 高流量
  'veryhigh': 5000000 // 非常高流量
};

// 每次页面访问的能源消耗 (kWh/GB)
export const energyPerVisit = {
  'dataCenter': 0.00045, // 数据中心能耗
  'transmission': 0.00015, // 传输能耗
  'device': 0.00060 // 终端设备能耗
};

// 性能评分标准
export const performanceGradeStandard = {
  fcp: {
    good: 1000,
    poor: 2500
  },
  lcp: {
    good: 2500,
    poor: 4000
  },
  tti: {
    good: 2000,
    poor: 5000
  },
  tbt: {
    good: 200,
    poor: 600
  },
  cls: {
    good: 0.1,
    poor: 0.25
  }
};

/**
 * 基于域名查找供应商和区域
 * @param {string} domain 域名
 * @returns {Object} 供应商和区域信息
 */
export function findProviderAndRegion(domain) {
  let provider = 'unknown';
  
  if (domain.includes('aws') || domain.includes('amazon')) {
    provider = 'aws';
  } else if (domain.includes('google') || domain.includes('gcp')) {
    provider = 'gcp';
  } else if (domain.includes('azure') || domain.includes('microsoft')) {
    provider = 'azure';
  }
  
  // 如果找到供应商，随机选择一个区域
  let region = 'unknown';
  if (provider !== 'unknown' && dataCenterLocationMapping[provider]) {
    const regions = dataCenterLocationMapping[provider];
    region = regions[Math.floor(Math.random() * regions.length)];
  }
  
  return { provider, region };
} 