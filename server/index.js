const express = require('express');
const dns = require('dns');
const { promisify } = require('util');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const resolve4 = promisify(dns.resolve4);

app.use(express.json());

// 模拟数据中心位置数据
const dataCenterLocations = {
  'aws': ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
  'gcp': ['us-central1', 'europe-west2', 'asia-east1'],
  'azure': ['eastus', 'westeurope', 'southeastasia']
};

// 数据中心到国家的映射
const regionToCountry = {
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

// 从CSV文件加载碳强度数据
const loadCarbonData = () => {
  const carbonData = {};
  fs.createReadStream('data/carbon_db.csv')
    .pipe(csv())
    .on('data', (row) => {
      carbonData[row.country] = {
        carbonIntensity: parseFloat(row.carbonIntensity),
        greenEnergyCoverage: parseFloat(row.greenEnergyCoverage)
      };
    })
    .on('end', () => {
      console.log('碳强度数据加载完成');
    });
  return carbonData;
};

const carbonData = loadCarbonData();

// 检查域名/IP的碳排放
async function checkCarbon(domain) {
  try {
    // 解析域名
    const ip = await resolve4(domain);
    
    // 模拟数据中心位置检测
    const provider = detectProvider(domain);
    const region = detectRegion(provider);
    const country = regionToCountry[region] || 'Unknown';

    // 计算碳排放
    const countryData = carbonData[country] || {
      carbonIntensity: 500, // 默认值
      greenEnergyCoverage: 0
    };

    const serverPower = 300; // 假设服务器功耗为300W
    const carbonEmission = countryData.carbonIntensity * serverPower;

    // 判断是否为绿色区域
    const isGreen = countryData.greenEnergyCoverage > 80;

    const result = {
      isGreen,
      carbonEmission,
      country,
      provider,
      region,
      suggestions: generateSuggestions(isGreen, countryData)
    };

    return result;
  } catch (error) {
    console.error('检查失败:', error);
    throw error;
  }
}

// 检测云服务提供商
function detectProvider(domain) {
  if (domain.includes('aws')) return 'aws';
  if (domain.includes('google') || domain.includes('gcp')) return 'gcp';
  if (domain.includes('azure')) return 'azure';
  return 'unknown';
}

// 检测区域
function detectRegion(provider) {
  if (provider === 'unknown') return 'Unknown';
  const regions = dataCenterLocations[provider];
  return regions[Math.floor(Math.random() * regions.length)];
}

// 生成优化建议
function generateSuggestions(isGreen, countryData) {
  const suggestions = [];
  if (!isGreen) {
    suggestions.push('建议迁移到绿色能源覆盖区域');
    suggestions.push('考虑使用可再生能源证书');
  }
  if (countryData.carbonIntensity > 400) {
    suggestions.push('建议优化服务器能效');
  }
  return suggestions;
}

// API路由
app.post('/api/check', async (req, res) => {
  try {
    const { domain } = req.body;
    const result = await checkCarbon(domain);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: '检测失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 