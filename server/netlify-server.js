/**
 * GreenWeb Netlify服务器设置
 * 从原始服务器代码中分离出来以适应Netlify Functions
 */

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
const os = require('os');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // 用于API请求
const express = require('express');

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
 * 设置Express应用路由和中间件
 * @param {Express} app - Express应用实例
 */
async function setupServer(app) {
  // 创建不验证SSL证书的axios实例
  const axiosInstance = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    }),
    timeout: 10000
  });

  // 中间件
  app.use(cors());
  app.use(express.json());
  app.use(useragent.express());
  
  // 路由设置
  
  /**
   * 健康检查端点
   */
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  /**
   * 基本示例API路由
   */
  app.get('/api/info', (req, res) => {
    res.json({
      name: 'GreenWeb API',
      version: '1.0.0',
      environment: 'Netlify Functions',
      runtime: `Node.js ${process.version}`,
      timestamp: new Date().toISOString()
    });
  });
  
  // 这里添加你服务器中所有的API路由...
  // 例如：/api/location, /api/headers, /api/analyze等
  
  // 最后添加一个404处理程序
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: '未找到请求的API端点',
      path: req.originalUrl
    });
  });
  
  return app;
}

// 导出设置函数
module.exports = setupServer; 