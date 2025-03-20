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