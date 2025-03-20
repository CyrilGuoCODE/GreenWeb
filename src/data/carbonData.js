// 数据中心位置数据
export const dataCenterLocations = {
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
export const carbonData = {
  'China': { carbonIntensity: 800, greenEnergyCoverage: 30 },
  'United States': { carbonIntensity: 400, greenEnergyCoverage: 20 },
  'Germany': { carbonIntensity: 300, greenEnergyCoverage: 45 },
  'France': { carbonIntensity: 100, greenEnergyCoverage: 75 },
  'Sweden': { carbonIntensity: 50, greenEnergyCoverage: 95 },
  'Norway': { carbonIntensity: 20, greenEnergyCoverage: 98 },
  'Iceland': { carbonIntensity: 10, greenEnergyCoverage: 100 },
  'Denmark': { carbonIntensity: 150, greenEnergyCoverage: 80 },
  'Netherlands': { carbonIntensity: 350, greenEnergyCoverage: 25 },
  'Japan': { carbonIntensity: 450, greenEnergyCoverage: 15 },
  'Ireland': { carbonIntensity: 250, greenEnergyCoverage: 40 },
  'Singapore': { carbonIntensity: 550, greenEnergyCoverage: 10 },
  'Taiwan': { carbonIntensity: 600, greenEnergyCoverage: 15 }
};

// 性能指标权重
export const performanceWeights = {
  firstContentfulPaint: 0.3,
  largestContentfulPaint: 0.3,
  timeToInteractive: 0.2,
  totalBlockingTime: 0.1,
  cumulativeLayoutShift: 0.1
};

// 碳排放因子
export const carbonFactors = {
  // 每MB数据传输的碳排放（gCO2e）
  dataTransfer: 0.5,
  // 每千瓦时服务器能耗的碳排放（gCO2e）
  serverEnergy: 500,
  // 每千瓦时网络传输能耗的碳排放（gCO2e）
  networkEnergy: 200,
  // 每千瓦时客户端能耗的碳排放（gCO2e）
  clientEnergy: 400
};

// 性能评分标准
export const performanceGrades = {
  firstContentfulPaint: {
    good: 1800,
    poor: 3000
  },
  largestContentfulPaint: {
    good: 2500,
    poor: 4000
  },
  timeToInteractive: {
    good: 3500,
    poor: 6000
  },
  totalBlockingTime: {
    good: 200,
    poor: 600
  },
  cumulativeLayoutShift: {
    good: 0.1,
    poor: 0.25
  }
}; 