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
const os = require('os');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');
const fetch = require('node-fetch'); // 用于API请求

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
 * 检测Edge浏览器路径
 * @returns {string|null} Edge浏览器路径
 */
function detectEdgePath() {
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    try {
      // Windows上Edge的常见安装路径
      const possiblePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        process.env.LOCALAPPDATA + '\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      
      for (const path of possiblePaths) {
        try {
          // 检查文件是否存在
          const stats = require('fs').statSync(path);
          if (stats.isFile()) {
            console.log(`找到Edge浏览器: ${path}`);
            return path;
          }
        } catch (e) {
          // 文件不存在，继续检查下一个路径
        }
      }
      
      // 通过注册表查询Edge路径
      try {
        const stdout = execSync(
          'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\msedge.exe" /ve',
          { encoding: 'utf8' }
        );
        
        const match = stdout.match(/REG_SZ\s+(.+)/i);
        if (match && match[1]) {
          const edgePath = match[1].trim();
          console.log(`通过注册表找到Edge浏览器: ${edgePath}`);
          return edgePath;
        }
      } catch (e) {
        console.log('注册表查询Edge路径失败:', e.message);
      }
    } catch (error) {
      console.error('检测Edge路径时出错:', error);
    }
  } else {
    // 在非Windows系统上尝试查找Edge
    try {
      const stdout = execSync('which msedge', { encoding: 'utf8' });
      if (stdout.trim()) {
        console.log(`找到Edge浏览器: ${stdout.trim()}`);
        return stdout.trim();
      }
    } catch (e) {
      console.log('在非Windows系统上未找到Edge浏览器');
    }
  }
  
  console.log('未找到Edge浏览器');
  return null;
}

/**
 * 使用Edge进行性能测量
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 性能指标
 */
async function measurePerformanceWithEdge(url) {
  let chrome = null;
  try {
    console.log('尝试使用Edge浏览器进行性能测量...');
    
    // 检测Edge浏览器路径
    const edgePath = detectEdgePath();
    if (!edgePath) {
      throw new Error('未找到Edge浏览器，无法进行性能测量');
    }
    
    // 设置Edge启动选项
    const chromeFlags = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-extensions'
    ];
    
    // 使用chrome-launcher启动Edge
    chrome = await chromeLauncher.launch({
      chromePath: edgePath,
      chromeFlags,
      logLevel: 'verbose',
      connectionPollInterval: 500,
      maxConnectionRetries: 10,
      ignoreDefaultFlags: true
    });
    
    console.log(`Edge浏览器已启动，端口: ${chrome.port}`);
    
    // 设置Lighthouse选项
    const lighthouseOptions = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      maxWaitForLoad: 60000,
      throttlingMethod: 'simulate',
      formFactor: 'desktop',
      emulatedFormFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    };
    
    console.log(`开始使用Edge和Lighthouse分析: ${url}`);
    
    // 设置分析超时
    const timeout = setTimeout(() => {
      if (chrome) {
        console.error('Edge分析超时，强制终止浏览器...');
        chrome.kill().catch(e => console.error('终止Edge失败:', e));
        chrome = null;
        throw new Error('Edge分析超时');
      }
    }, 90000); // 90秒超时
    
    const runnerResult = await lighthouse(url, lighthouseOptions);
    clearTimeout(timeout); // 清除超时计时器
    
    console.log('Edge分析完成，处理结果...');
    const audits = runnerResult.lhr.audits;
    
    // 关闭Edge
    if (chrome) {
      console.log('正在关闭Edge浏览器...');
      await chrome.kill();
      chrome = null;
      console.log('Edge浏览器已关闭');
    }
    
    // 提取Web核心指标
    const fcp = audits['first-contentful-paint'].numericValue / 1000; // 转换为秒
    const lcp = audits['largest-contentful-paint'].numericValue / 1000; // 转换为秒
    const cls = audits['cumulative-layout-shift'].numericValue;
    const fid = audits['max-potential-fid'].numericValue; // 首次输入延迟估计值
    const ttfb = audits['server-response-time'].numericValue; // 服务器响应时间
    
    // 页面大小(KB)
    const pageSize = audits['total-byte-weight'].numericValue / 1024;
    
    console.log(`==== Edge性能分析结束 [${new Date().toISOString()}] ====`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      statusCode: 200,
      browser: 'edge'
    };
  } catch (error) {
    // 确保浏览器实例被关闭
    if (chrome) {
      try {
        console.log('尝试关闭Edge浏览器实例...');
        await chrome.kill();
      } catch (chromeError) {
        console.error('关闭Edge浏览器时出错:', chromeError);
      }
    }
    throw error;
  }
}

/**
 * 使用Puppeteer测量性能
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 性能指标
 */
async function measurePerformanceWithPuppeteer(url) {
  let browser = null;
  
  try {
    console.log('尝试使用Puppeteer进行性能测量...');
    
    // 启动Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    // 创建新页面
    const page = await browser.newPage();
    
    // 启用性能指标收集
    await page.setCacheEnabled(false);
    await page.setRequestInterception(true);
    
    // 跟踪所有请求和资源大小
    let totalSize = 0;
    let requestCount = 0;
    let domainCount = new Set();
    
    page.on('request', request => {
      requestCount++;
      const domain = new URL(request.url()).hostname;
      if (domain) {
        domainCount.add(domain);
      }
      request.continue();
    });
    
    page.on('response', async response => {
      try {
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          totalSize += parseInt(contentLength, 10);
        } else {
          // 如果没有content-length头，尝试获取响应体大小
          try {
            const buffer = await response.buffer();
            if (buffer) {
              totalSize += buffer.length;
            }
          } catch (e) {
            // 忽略无法获取响应体的请求
          }
        }
      } catch (err) {
        // 忽略错误
      }
    });
    
    // 监听客户端性能指标
    let firstPaint = 0;
    let firstContentfulPaint = 0;
    let largestContentfulPaint = 0;
    let cumulativeLayoutShift = 0;
    let timeToInteractive = 0;
    let firstInputDelay = 0;
    let timeToFirstByte = 0;
    
    // 设置性能观察器
    await page.evaluateOnNewDocument(() => {
      // 首次绘制和首次内容绘制
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint') {
            window.firstPaint = entry.startTime;
          }
          if (entry.name === 'first-contentful-paint') {
            window.firstContentfulPaint = entry.startTime;
          }
        }
      });
      observer.observe({ type: 'paint', buffered: true });
      
      // 最大内容绘制
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      
      // 累积布局偏移
      const clsObserver = new PerformanceObserver((list) => {
        let sum = 0;
        for (const entry of list.getEntries()) {
          sum += entry.value;
        }
        window.cumulativeLayoutShift = sum;
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // 首次输入延迟
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (window.firstInputDelay === undefined) {
            window.firstInputDelay = entry.processingStart - entry.startTime;
          }
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      
      // 记录导航性能
      window.addEventListener('load', () => {
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
          window.timeToFirstByte = navigationEntry.responseStart;
          window.domComplete = navigationEntry.domComplete;
        }
      });
    });
    
    console.log(`导航到: ${url}`);
    const navigationStart = Date.now();
    
    // 加载页面并等待所有网络活动完成
    const response = await page.goto(url, {
      waitUntil: ['load', 'networkidle2'],
      timeout: 60000
    });
    
    // 等待性能指标稳定
    await page.waitForTimeout(2000);
    
    // 收集从页面获取的指标
    const metrics = await page.evaluate(() => {
      return {
        firstPaint: window.firstPaint,
        firstContentfulPaint: window.firstContentfulPaint,
        largestContentfulPaint: window.largestContentfulPaint,
        cumulativeLayoutShift: window.cumulativeLayoutShift,
        firstInputDelay: window.firstInputDelay,
        timeToFirstByte: window.timeToFirstByte,
        domComplete: window.domComplete,
        // 从Navigation Timing API获取更多指标
        navigationTiming: performance.getEntriesByType('navigation')[0]
      };
    });
    
    // 关闭浏览器
    await browser.close();
    browser = null;
    
    // 解析和归一化指标
    const ttfb = metrics.timeToFirstByte || 0;
    const fcp = metrics.firstContentfulPaint ? metrics.firstContentfulPaint / 1000 : 0;
    const lcp = metrics.largestContentfulPaint ? metrics.largestContentfulPaint / 1000 : 0;
    const cls = metrics.cumulativeLayoutShift || 0;
    const fid = metrics.firstInputDelay || 100; // 默认100ms
    const pageSize = totalSize / 1024; // KB
    
    console.log(`Puppeteer性能测量完成，获取到以下指标:`);
    console.log(`FCP: ${fcp}s, LCP: ${lcp}s, CLS: ${cls}, FID: ${fid}ms, TTFB: ${ttfb}ms`);
    console.log(`请求数: ${requestCount}, 不同域名数: ${domainCount.size}, 页面大小: ${pageSize}KB`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      requestCount,
      domainCount: domainCount.size,
      statusCode: response.status(),
      measuredBy: 'puppeteer'
    };
  } catch (error) {
    console.error('Puppeteer性能测量错误:', error);
    if (browser) {
      await browser.close().catch(e => console.error('关闭浏览器失败:', e));
    }
    throw error;
  }
}

/**
 * 使用WebPageTest API测量性能
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 性能指标
 */
async function measurePerformanceWithWebPageTest(url) {
  try {
    console.log('尝试使用WebPageTest API进行远程性能测量...');
    
    // WebPageTest API密钥和配置
    // 注意：实际使用时应从环境变量获取API密钥
    const WPT_API_KEY = process.env.WPT_API_KEY || 'demo_key'; // 使用演示密钥用于测试
    const WPT_SERVER = 'https://www.webpagetest.org';
    
    // 创建测试请求
    const testParams = new URLSearchParams({
      url: url,
      k: WPT_API_KEY,
      f: 'json',
      location: 'ec2-ap-northeast-1:Chrome',
      lighthouse: 1,
      mobile: 0,
      runs: 1
    });
    
    // 发送测试请求
    console.log(`发起WebPageTest测试: ${url}`);
    const startResponse = await fetch(`${WPT_SERVER}/runtest.php?${testParams.toString()}`);
    const startData = await startResponse.json();
    
    if (startData.statusCode !== 200) {
      throw new Error(`WebPageTest API错误: ${startData.statusText}`);
    }
    
    // 获取测试ID
    const testId = startData.data.testId;
    console.log(`WebPageTest测试ID: ${testId}`);
    
    // 轮询测试结果
    let results = null;
    let attempts = 0;
    const maxAttempts = 30; // 最多等待30次
    const pollingInterval = 10000; // 每10秒查询一次
    
    while (!results && attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      
      console.log(`检查WebPageTest结果 (尝试 ${attempts}/${maxAttempts})...`);
      const resultsResponse = await fetch(`${WPT_SERVER}/jsonResult.php?test=${testId}`);
      const resultsData = await resultsResponse.json();
      
      if (resultsData.statusCode === 200 && resultsData.data.completed) {
        results = resultsData.data;
        console.log('WebPageTest测试完成，获取结果...');
        break;
      }
    }
    
    if (!results) {
      throw new Error('WebPageTest测试超时，未能获取结果');
    }
    
    // 提取性能指标
    const run = results.runs['1'];
    const firstView = run.firstView;
    
    // 将WebPageTest指标转换为我们的格式
    const fcp = firstView.firstContentfulPaint / 1000; // 转换为秒
    const lcp = (firstView.chromeUserTiming && firstView.chromeUserTiming.LargestContentfulPaint) 
      ? firstView.chromeUserTiming.LargestContentfulPaint / 1000 
      : firstView.renderStart / 1000;
    const cls = firstView.chromeUserTiming && firstView.chromeUserTiming.CumulativeLayoutShift 
      ? firstView.chromeUserTiming.CumulativeLayoutShift 
      : 0.05; // 默认值
    const fid = firstView.firstInputDelay || 100; // 默认100ms
    const ttfb = firstView.TTFB;
    const pageSize = firstView.bytesIn / 1024; // 转换为KB
    
    console.log(`WebPageTest性能测量完成，获取到以下指标:`);
    console.log(`FCP: ${fcp}s, LCP: ${lcp}s, CLS: ${cls}, FID: ${fid}ms, TTFB: ${ttfb}ms, 页面大小: ${pageSize}KB`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      requests: firstView.requests,
      domainCount: firstView.domains,
      statusCode: 200,
      measuredBy: 'webpagetest'
    };
  } catch (error) {
    console.error('WebPageTest性能测量错误:', error);
    throw error;
  }
}

/**
 * 修改性能测量API端点，添加WebPageTest选项
 */
app.get('/api/performance', async (req, res) => {
  try {
    const { url, browser } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    console.log(`==== 开始性能分析 [${new Date().toISOString()}] ====`);
    console.log(`目标URL: ${url}`);
    
    // 根据请求选择分析方式
    const requestedMethod = browser || 'auto';
    
    if (requestedMethod === 'headers' || requestedMethod === 'http-headers') {
      // 仅分析HTTP头
      try {
        const headersInfo = await analyzeHttpHeaders(url);
        const estimatedPageSize = 500; // 默认估计值
        
        // 基于HTTP头构建估计的性能指标
        res.json({
          fcp: 1.2, // 估计值
          lcp: 2.0, // 估计值
          cls: 0.05, // 估计值
          fid: 100, // 估计值
          ttfb: 300, // 估计值
          pageSize: estimatedPageSize,
          statusCode: 200,
          hasCompression: headersInfo.hasCompression,
          hasCaching: headersInfo.hasCaching,
          securityScore: headersInfo.securityScore,
          server: headersInfo.server,
          measuredBy: 'http-headers-only'
        });
        return;
      } catch (headersError) {
        console.error('HTTP头分析失败:', headersError.message);
        throw headersError;
      }
    } else {
      // 默认使用基础HTTP分析方法
      try {
        const result = await measurePerformanceBasic(url);
        res.json({
          ...result,
          measuredBy: 'basic-http'
        });
        return;
      } catch (basicError) {
        console.error('基础HTTP分析失败:', basicError.message);
        
        // 如果基础分析失败，尝试HTTP头分析作为后备
        try {
          console.log('基础HTTP分析失败，尝试使用HTTP头分析...');
          const headersInfo = await analyzeHttpHeaders(url);
          res.json({
            fcp: 1.2, // 估计值
            lcp: 2.0, // 估计值
            cls: 0.05, // 估计值
            fid: 100, // 估计值
            ttfb: 300, // 估计值
            pageSize: 500, // 估计值
            statusCode: 200,
            hasCompression: headersInfo.hasCompression,
            hasCaching: headersInfo.hasCaching,
            securityScore: headersInfo.securityScore,
            server: headersInfo.server,
            measuredBy: 'headers-fallback'
          });
          return;
        } catch (headersError) {
          console.error('HTTP头分析也失败:', headersError.message);
          throw new Error('性能测量失败: 所有可用的分析方法均失败');
        }
      }
    }
  } catch (error) {
    console.error('==== 性能测量错误 ====');
    console.error(`错误类型: ${error.name}`);
    console.error(`错误消息: ${error.message}`);
    console.error(`错误堆栈: ${error.stack}`);
    
    // 测量失败时返回错误信息
    res.status(500).json({ 
      error: '性能测量失败', 
      message: error.message,
      measurable: false
    });
  }
});

/**
 * 使用Lighthouse测量性能
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 性能指标
 */
async function measurePerformanceWithLighthouse(url) {
  let chrome = null;
  
  try {
    console.log('尝试启动Chrome for Lighthouse...');
    
    // 设置更全面的Chrome启动选项
    const chromeFlags = [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio'
    ];
    
    // 尝试检测Chrome路径
    let options = {
      chromeFlags,
      logLevel: 'verbose',
      connectionPollInterval: 500,
      maxConnectionRetries: 10,
      ignoreDefaultFlags: true
    };
    
    const isWindows = os.platform() === 'win32';
    if (isWindows) {
      const installations = chromeLauncher.Launcher.getInstallations();
      if (installations.length > 0) {
        options.chromePath = installations[0];
        console.log(`使用检测到的Chrome路径: ${options.chromePath}`);
      }
    }
    
    // 设置Chrome启动的超时时间
    chrome = await chromeLauncher.launch(options);
    
    console.log(`Chrome已启动，端口: ${chrome.port}`);
    
    // 设置更详细的Lighthouse选项
    const lighthouseOptions = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
      // 设置超时参数
      maxWaitForLoad: 60000,
      throttlingMethod: 'simulate',
      formFactor: 'desktop',
      // 设置设备模拟
      emulatedFormFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      // 设置网络节流
      throttling: {
        rttMs: 40,
        throughputKbps: 10 * 1024,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
    };
    
    console.log(`开始使用Lighthouse分析: ${url}`);
    console.log('Lighthouse配置:', JSON.stringify(lighthouseOptions, null, 2));
    
    // 设置分析超时
    const timeout = setTimeout(() => {
      if (chrome) {
        console.error('Lighthouse分析超时，强制终止Chrome...');
        chrome.kill().catch(e => console.error('终止Chrome失败:', e));
        chrome = null;
        throw new Error('Lighthouse分析超时');
      }
    }, 90000); // 90秒超时
    
    const runnerResult = await lighthouse(url, lighthouseOptions);
    clearTimeout(timeout); // 清除超时计时器
    
    console.log('Lighthouse分析完成，处理结果...');
    const audits = runnerResult.lhr.audits;
    
    // 关闭Chrome
    if (chrome) {
      console.log('正在关闭Chrome...');
      await chrome.kill();
      chrome = null;
      console.log('Chrome已关闭');
    }
    
    // 提取Web核心指标
    const fcp = audits['first-contentful-paint'].numericValue / 1000; // 转换为秒
    const lcp = audits['largest-contentful-paint'].numericValue / 1000; // 转换为秒
    const cls = audits['cumulative-layout-shift'].numericValue;
    const fid = audits['max-potential-fid'].numericValue; // 首次输入延迟估计值
    const ttfb = audits['server-response-time'].numericValue; // 服务器响应时间
    
    // 页面大小(KB)
    const pageSize = audits['total-byte-weight'].numericValue / 1024;
    
    console.log(`==== Lighthouse性能分析结束 [${new Date().toISOString()}] ====`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      statusCode: 200
    };
  } catch (error) {
    // 确保Chrome实例被关闭
    if (chrome) {
      try {
        console.log('尝试关闭Chrome实例...');
        await chrome.kill();
      } catch (chromeError) {
        console.error('关闭Chrome时出错:', chromeError);
      }
    }
    throw error;
  }
}

/**
 * 使用纯Chrome测量性能（备用方法）
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 性能指标
 */
async function measurePerformanceWithChrome(url) {
  let chrome = null;
  
  try {
    console.log('尝试使用纯Chrome进行性能测量...');
    
    // 启动Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });
    
    const protocol = await chrome.connectToDevTools();
    
    // 设置超时
    const timeout = setTimeout(() => {
      if (chrome) {
        console.error('Chrome性能测量超时，强制终止...');
        chrome.kill().catch(e => console.error('终止Chrome失败:', e));
        chrome = null;
      }
    }, 60000); // 60秒超时
    
    // 启用必要的域
    await protocol.send('Network.enable');
    await protocol.send('Page.enable');
    
    // 清除缓存以确保准确性
    await protocol.send('Network.clearBrowserCache');
    
    // 导航到目标页面并等待加载完成
    console.log(`导航到: ${url}`);
    await protocol.send('Page.navigate', { url });
    
    // 等待页面加载完成
    await new Promise(resolve => {
      protocol.on('Page.loadEventFired', resolve);
    });
    
    // 收集性能指标
    const performanceMetrics = await protocol.send('Performance.getMetrics');
    
    // 获取页面资源大小
    const resources = await protocol.send('Network.getResourceTree');
    let totalSize = 0;
    
    if (resources && resources.frameTree && resources.frameTree.resources) {
      resources.frameTree.resources.forEach(resource => {
        if (resource.contentSize) {
          totalSize += resource.contentSize;
        }
      });
    }
    
    // 关闭Chrome
    clearTimeout(timeout);
    if (chrome) {
      await chrome.kill();
      chrome = null;
    }
    
    // 解析指标
    const fcpMetric = performanceMetrics.metrics.find(m => m.name === 'FirstContentfulPaint');
    const lcpMetric = performanceMetrics.metrics.find(m => m.name === 'LargestContentfulPaint');
    const clsMetric = 0.1; // 无法直接测量，给出合理估计
    const fidMetric = performanceMetrics.metrics.find(m => m.name === 'FirstInputDelay') || { value: 100 };
    const ttfbMetric = performanceMetrics.metrics.find(m => m.name === 'TimeToFirstByte') || { value: 200 };
    
    const fcp = fcpMetric ? fcpMetric.value / 1000 : 1.5;
    const lcp = lcpMetric ? lcpMetric.value / 1000 : 2.5;
    const cls = clsMetric;
    const fid = fidMetric.value;
    const ttfb = ttfbMetric.value;
    const pageSize = totalSize / 1024; // 转换为KB
    
    console.log(`Chrome性能测量完成，获取到以下指标:`);
    console.log(`FCP: ${fcp}s, LCP: ${lcp}s, CLS: ${cls}, FID: ${fid}ms, TTFB: ${ttfb}ms, 页面大小: ${pageSize}KB`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      statusCode: 200
    };
  } catch (error) {
    if (chrome) {
      await chrome.kill();
    }
    throw error;
  }
}

/**
 * 碳排放计算 - 优化使用实际测量数据
 */
app.get('/api/carbon', async (req, res) => {
  try {
    const { pageSize, country, renewablePercentage, pue, requestCount, domainCount } = req.query;
    
    if (!pageSize) {
      return res.status(400).json({ 
        error: '缺少页面大小参数',
        measurable: false,
        message: '无法获取页面大小数据，无法计算能源消耗'
      });
    }
    
    // 使用提供的实际值或默认值
    const pageSizeKB = parseInt(pageSize) || 0;
    const countryCode = country || 'US';
    const renewable = parseFloat(renewablePercentage) || 50;
    const dataCenterPUE = parseFloat(pue) || GLOBAL_CONSTANTS.averagePUE;
    const actualRequestCount = parseInt(requestCount) || 1;
    const actualDomainCount = parseInt(domainCount) || 1;
    
    // 如果页面大小为0，返回数据不可测量
    if (pageSizeKB <= 0) {
      return res.status(200).json({ 
        measurable: false,
        message: '页面大小为0或无法测量，无法计算能源消耗'
      });
    }
    
    // 数据传输计算 (考虑缓存 - 使用动态缓存效率)
    const pageSizeInGB = pageSizeKB / 1024 / 1024;
    
    // 根据请求数和域名数动态计算缓存效率
    const cachingFactor = Math.min(0.8, Math.max(0.1, 1 - (1 / (actualRequestCount * 0.1 + 1))));
    const cachingEfficiency = actualDomainCount > 3 ? cachingFactor * 0.8 : cachingFactor;
    
    const adjustedPageSizeInGB = pageSizeInGB * (1 - cachingEfficiency);
    
    // 能源强度计算 - 根据国家和提供商类型优化
    const baseEnergyIntensity = GLOBAL_CONSTANTS.averageEnergyConsumption;
    const energyIntensity = baseEnergyIntensity * dataCenterPUE;
    
    // 根据请求数量优化传输能耗
    const transmissionFactor = Math.log10(actualRequestCount + 1) * 1.2;
    
    // 计算能源消耗
    const dataCenterEnergy = adjustedPageSizeInGB * (energyIntensity / dataCenterPUE);
    const transmissionEnergy = adjustedPageSizeInGB * GLOBAL_CONSTANTS.averageTransmissionPerGB * transmissionFactor;
    
    // 根据域名数优化设备能耗
    const deviceFactor = 1 + (actualDomainCount / 10);
    const deviceEnergy = adjustedPageSizeInGB * GLOBAL_CONSTANTS.averageDevicePerGB * deviceFactor;
    
    // 考虑国家电网碳强度
    const countryCarbonValue = COUNTRY_CARBON_INTENSITY[countryCode] || GLOBAL_CONSTANTS.averageCarbonIntensity;
    
    // 数据中心碳排放 - 考虑可再生能源比例
    const dataTransferCarbon = dataCenterEnergy * (
      (renewable / 100) * GLOBAL_CONSTANTS.greenEnergyCarbonIntensity + 
      ((100 - renewable) / 100) * countryCarbonValue
    );
    
    // 网络传输和客户设备碳排放
    const networkCarbon = transmissionEnergy * countryCarbonValue;
    const clientCarbon = deviceEnergy * countryCarbonValue;
    
    // 计算总碳排放量 (单位：g CO2e)
    const totalCarbonEmission = dataTransferCarbon + networkCarbon + clientCarbon;
    
    // 页面复杂度评分 (基于页面大小和请求数)
    const pageComplexityScore = Math.min(10, Math.sqrt(pageSizeKB / 100) * Math.log10(actualRequestCount + 1));
    
    // 估计访问量和长期排放
    const adjustedMonthlyVisits = Math.min(
      GLOBAL_CONSTANTS.averageMonthlyVisits * 2,
      GLOBAL_CONSTANTS.averageMonthlyVisits * (1 + pageComplexityScore / 20)
    );
    
    const monthlyCarbonEmission = (totalCarbonEmission * adjustedMonthlyVisits) / 1000; // 单位：kg CO2e
    const annualCarbonEmission = monthlyCarbonEmission * 12;
    
    // 计算碳中和所需的树木数量
    const treesNeeded = Math.ceil(annualCarbonEmission / GLOBAL_CONSTANTS.treeCO2PerYear);
    
    // 碳足迹评分 (1-100，越低越好)
    const carbonFootprintScore = Math.min(100, Math.max(1, 
      (totalCarbonEmission / 0.5) * 20 + // 基础碳排放
      (dataCenterPUE / GLOBAL_CONSTANTS.bestPUE - 1) * 20 + // 数据中心效率
      ((100 - renewable) / 100) * 40 // 可再生能源使用
    ));
    
    // 能源效率评分 (1-100，越高越好)
    const energyEfficiencyScore = Math.min(100, Math.max(1, 
      100 - (totalCarbonEmission / 3) * 20 - // 基础能源效率
      (pageComplexityScore * 5) - // 页面复杂度惩罚
      ((actualDomainCount - 1) * 3) // 域名数量惩罚
    ));
    
    res.json({
      measurable: true,
      pageSize: pageSizeKB,
      energyIntensity,
      cachingEfficiency,
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
      isGreen: renewable >= GLOBAL_CONSTANTS.greenEnergyThreshold,
      pageComplexityScore,
      carbonFootprintScore,
      energyEfficiencyScore,
      requestCount: actualRequestCount,
      domainCount: actualDomainCount
    });
  } catch (error) {
    console.error('碳排放计算错误:', error);
    res.status(500).json({ 
      error: '碳排放计算失败', 
      message: error.message,
      measurable: false
    });
  }
});

/**
 * 生成优化建议
 */
app.get('/api/suggestions', async (req, res) => {
  try {
    const { 
      pageSize, 
      performance, 
      provider, 
      renewablePercentage, 
      pue, 
      totalCarbonEmission, 
      carbonFootprintScore, 
      energyEfficiencyScore, 
      treesNeeded,
      requestCount,
      domainCount
    } = req.query;
    
    // 提取性能数据
    const performanceData = typeof performance === 'string' ? JSON.parse(performance) : (performance || {});
    
    // 准备建议生成的数据
    const data = {
      pageSize: parseInt(pageSize) || 0,
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
      totalCarbonEmission: parseFloat(totalCarbonEmission) || 0,
      carbonFootprintScore: parseFloat(carbonFootprintScore) || 0,
      energyEfficiencyScore: parseFloat(energyEfficiencyScore) || 0,
      treesNeeded: parseInt(treesNeeded) || 0,
      requestCount: parseInt(requestCount) || 1,
      domainCount: parseInt(domainCount) || 1
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
    const { domain, browser = 'auto' } = req.query;
    
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
      performanceData = await axios.get(`http://localhost:${PORT}/api/performance?url=${encodeURIComponent(url)}&browser=${browser}`)
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
      
      // 获取性能数据中的请求数和域名数
      const requestCount = performanceData?.requestCount || 1;
      const domainCount = performanceData?.domainCount || 1;
      
      if (pageSize > 0) {
        carbonData = await axios.get(`http://localhost:${PORT}/api/carbon`, {
          params: { 
            pageSize, 
            country, 
            renewablePercentage, 
            pue,
            requestCount,
            domainCount
          }
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
            totalCarbonEmission: carbonData?.totalCarbonEmission || 0,
            carbonFootprintScore: carbonData?.carbonFootprintScore || 0,
            energyEfficiencyScore: carbonData?.energyEfficiencyScore || 0,
            treesNeeded: carbonData?.treesNeeded || 0,
            requestCount: performanceData?.requestCount || 1,
            domainCount: performanceData?.domainCount || 1
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
      browser,
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
 * @param {Object} data - 性能和碳排放数据
 * @returns {Array} 优化建议列表
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
    suggestions.push('大幅压缩图片资源，当前页面大小过大('+data.pageSize+'KB)，严重影响加载速度和能源消耗');
    suggestions.push('使用WebP或AVIF等新一代图片格式，可减少50-90%的图片大小');
    suggestions.push('实施延迟加载(Lazy Loading)技术，仅加载可视区域内容');
  } else if (data.pageSize > 2500) {
    suggestions.push('压缩图片和媒体资源，减少页面大小('+data.pageSize+'KB)和传输量');
    suggestions.push('优化JavaScript和CSS文件，减少不必要的代码');
  } else if (data.pageSize > 1500) {
    suggestions.push('考虑进一步优化资源大小('+data.pageSize+'KB)，提高页面加载速度');
  }
  
  // 基于域名数量的建议
  if (data.domainCount > 10) {
    suggestions.push(`网站加载资源来自过多域名(${data.domainCount}个)，建议合并资源来源减少DNS查询和连接建立开销`);
  } else if (data.domainCount > 5) {
    suggestions.push(`考虑减少加载资源的域名数量(${data.domainCount}个)，以降低DNS查询时间`);
  }
  
  // 基于请求数量的建议
  if (data.requestCount > 100) {
    suggestions.push(`网页请求数过多(${data.requestCount}个)，严重影响加载速度，建议合并资源并减少不必要的API调用`);
  } else if (data.requestCount > 50) {
    suggestions.push(`网页请求数较多(${data.requestCount}个)，建议通过合并小文件减少HTTP请求`);
  }
  
  // 基于性能指标的建议
  if (data.performance.lcp > 2.5) {
    suggestions.push(`优化最大内容绘制(LCP=${data.performance.lcp.toFixed(2)}s)，重点优化主要内容元素的加载时间`);
    if (data.performance.lcp > 5) {
      suggestions.push('LCP值严重超标，建议使用预加载(preload)关键资源并优化服务器响应速度');
    }
  }
  
  if (data.performance.cls > 0.1) {
    suggestions.push(`减少累积布局偏移(CLS=${data.performance.cls.toFixed(3)})，预先设置图片和元素尺寸`);
    if (data.performance.cls > 0.25) {
      suggestions.push('CLS值严重超标，检查是否有动态注入内容导致布局偏移，为所有图片和嵌入元素设置明确尺寸');
    }
  }
  
  if (data.performance.ttfb > 300) {
    suggestions.push(`优化服务器响应时间(TTFB=${Math.round(data.performance.ttfb)}ms)，考虑使用边缘CDN或优化后端处理`);
    if (data.performance.ttfb > 1000) {
      suggestions.push('服务器响应时间过长，建议使用服务端缓存，优化数据库查询，或升级服务器配置');
    }
  }
  
  if (data.performance.fid > 130) {
    suggestions.push(`提高首次输入延迟(FID=${Math.round(data.performance.fid)}ms)，减少主线程阻塞的JavaScript执行`);
    if (data.performance.fid > 300) {
      suggestions.push('输入延迟严重，拆分长任务为较小任务，并延迟加载非关键JavaScript');
    }
  }
  
  // 基于碳排放的建议
  if (data.carbonFootprintScore > 70) {
    suggestions.push(`当前网站碳足迹评分较高(${Math.round(data.carbonFootprintScore)}分)，建议全面优化能源使用效率`);
  }
  
  if (data.energyEfficiencyScore < 50) {
    suggestions.push(`能源效率评分较低(${Math.round(data.energyEfficiencyScore)}分)，建议采用更现代的Web技术和优化策略`);
  }
  
  if (data.renewablePercentage < GLOBAL_CONSTANTS.greenEnergyThreshold) {
    suggestions.push(`当前服务器使用的可再生能源比例(${data.renewablePercentage}%)偏低，建议迁移至更环保的数据中心`);
  }
  
  if (data.pue > 1.5) {
    suggestions.push(`当前数据中心PUE值(${data.pue})较高，选择更高能效的服务提供商可降低碳排放`);
  }
  
  if (data.totalCarbonEmission > 1.5) {
    suggestions.push(`当前页面单次访问碳排放(${data.totalCarbonEmission.toFixed(2)}gCO2e)偏高，建议全面优化页面资源`);
    if (data.totalCarbonEmission > 3) {
      suggestions.push('碳排放量远高于平均水平，建议对页面进行全面性能审计并减少不必要的资源加载');
    }
  }
  
  // 加入碳中和相关建议
  if (data.treesNeeded > 5) {
    suggestions.push(`抵消网站年度碳排放需要种植约${data.treesNeeded}棵树，建议考虑参与碳抵消项目或减少能源消耗`);
  }
  
  // 通用绿色建议
  if (suggestions.length < 3) {
    suggestions.push('实施高效的HTTP缓存策略，延长缓存有效期减少重复请求');
    suggestions.push('使用CDN分发静态资源，减少数据传输距离和能耗');
    suggestions.push('考虑使用绿色主机服务，选择使用可再生能源的数据中心');
  }
  
  // 确保建议数量不会太多
  return suggestions.slice(0, 10);
}

/**
 * 检查系统环境
 */
function checkEnvironment() {
  console.log('==== 系统环境信息 ====');
  console.log(`操作系统: ${os.platform()} ${os.release()}`);
  console.log(`Node.js 版本: ${process.version}`);
  console.log(`CPU 架构: ${os.arch()}`);
  console.log(`可用内存: ${Math.round(os.freemem() / 1024 / 1024)} MB / ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
  
  // 检查Chrome可能的路径
  const possibleChromePaths = chromeLauncher.Launcher.getInstallations();
  console.log('检测到的Chrome路径:');
  if (possibleChromePaths.length === 0) {
    console.log('未检测到Chrome安装路径');
  } else {
    possibleChromePaths.forEach(path => console.log(`- ${path}`));
  }
  
  // 检查环境变量
  console.log('相关环境变量:');
  const relevantEnvVars = ['CHROME_PATH', 'PATH'];
  relevantEnvVars.forEach(envVar => {
    console.log(`${envVar}: ${process.env[envVar] || '未设置'}`);
  });
  
  console.log('==== 环境信息结束 ====');
}

/**
 * 检查Chrome是否可用
 * @returns {Promise<boolean>} Chrome是否可用
 */
async function checkChromeAvailability() {
  let chrome = null;
  try {
    console.log('检查Chrome可用性...');
    
    // 检查系统环境
    checkEnvironment();
    
    // 尝试获取Chrome安装路径
    let chromePath = '';
    const installations = chromeLauncher.Launcher.getInstallations();
    if (installations.length > 0) {
      chromePath = installations[0];
      console.log(`将使用默认Chrome路径: ${chromePath}`);
    } else if (process.env.CHROME_PATH) {
      chromePath = process.env.CHROME_PATH;
      console.log(`将使用环境变量中的Chrome路径: ${chromePath}`);
    } else {
      console.log('未找到Chrome路径，将让launcher自动检测');
    }
    
    // Windows系统的特殊处理
    const isWindows = os.platform() === 'win32';
    let chromeFlags = ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'];
    
    let options = {};
    if (isWindows && chromePath) {
      options.chromePath = chromePath;
      console.log(`Windows系统: 显式设置Chrome路径为 ${chromePath}`);
    }
    
    options.chromeFlags = chromeFlags;
    
    // 尝试启动Chrome
    chrome = await chromeLauncher.launch(options);
    
    // 获取Chrome版本信息
    const version = await chrome.getVersion();
    console.log(`Chrome启动成功，版本信息:`, version);
    return true;
  } catch (error) {
    console.error('Chrome启动失败:', error);
    console.error('这可能会导致Lighthouse性能测试无法进行');
    console.error('请确保已安装Chrome浏览器，或修改ChromeLauncher配置');
    return false;
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch (e) {
        console.error('关闭Chrome失败:', e);
      }
    }
  }
}

/**
 * 基础版网页分析 - 不依赖浏览器，使用纯HTTP请求
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 基础性能指标
 */
async function measurePerformanceBasic(url) {
  console.log('使用基础版网页分析方法 (仅HTTP请求)...');
  try {
    // 开始时间
    const startTime = performance.now();
    
    // 发送HEAD请求检查资源是否存在
    const headResponse = await axiosInstance.head(url, {
      timeout: 20000,
      maxRedirects: 5,
      validateStatus: null
    });
    
    const headEndTime = performance.now();
    const ttfb = headEndTime - startTime;
    
    // 发送GET请求获取页面内容
    const response = await axiosInstance.get(url, {
      timeout: 30000,
      maxRedirects: 5,
      responseType: 'text',
      validateStatus: null
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // 解析HTML以查找资源
    const html = response.data;
    const pageSize = response.headers['content-length'] 
      ? parseInt(response.headers['content-length']) / 1024
      : Buffer.from(html).length / 1024;
    
    // 计算请求数量和域名数量
    const resourceUrls = [];
    
    // 提取各种资源链接
    const cssLinks = html.match(/href=["']([^"']+\.css[^"']*)["']/gi) || [];
    const jsLinks = html.match(/src=["']([^"']+\.js[^"']*)["']/gi) || [];
    const imgLinks = html.match(/src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg)[^"']*)["']/gi) || [];
    const fontLinks = html.match(/src=["']([^"']+\.(woff|woff2|ttf|eot)[^"']*)["']/gi) || [];
    
    // 提取出URL部分
    const extractUrl = (match) => {
      const urlMatch = match.match(/["']([^"']+)["']/);
      return urlMatch ? urlMatch[1] : null;
    };
    
    [...cssLinks, ...jsLinks, ...imgLinks, ...fontLinks].forEach(link => {
      const url = extractUrl(link);
      if (url) resourceUrls.push(url);
    });
    
    // 统计唯一域名
    const domains = new Set();
    
    // 为相对URL添加基础URL
    resourceUrls.forEach(resourceUrl => {
      try {
        let fullUrl;
        if (resourceUrl.startsWith('http')) {
          fullUrl = new URL(resourceUrl);
        } else if (resourceUrl.startsWith('//')) {
          fullUrl = new URL(`https:${resourceUrl}`);
        } else {
          fullUrl = new URL(resourceUrl, url);
        }
        domains.add(fullUrl.hostname);
      } catch (e) {
        // 忽略无效URL
      }
    });
    
    // 计算基础性能指标（估算值）
    const fcp = totalTime / 1000 * 0.7; // 估计首次内容绘制为总时间的70%
    const lcp = totalTime / 1000 * 0.9; // 估计最大内容绘制为总时间的90%
    const cls = 0.05; // 默认累积布局偏移
    const fid = 50; // 默认首次输入延迟
    
    console.log(`基础分析完成，耗时: ${totalTime.toFixed(0)}ms`);
    console.log(`页面大小: ${pageSize.toFixed(1)}KB, 资源数: ${resourceUrls.length}, 域名数: ${domains.size}`);
    
    return {
      fcp,
      lcp,
      cls,
      fid,
      ttfb,
      pageSize,
      requestCount: resourceUrls.length + 1, // +1 是页面本身
      domainCount: domains.size,
      statusCode: response.status,
      measuredBy: 'basic-http'
    };
  } catch (error) {
    console.error('基础页面分析失败:', error);
    throw error;
  }
}

/**
 * HTTP头部分析 - 检查与性能相关的HTTP头
 * @param {string} url - 目标URL
 * @returns {Promise<Object>} 基于头部的指标
 */
async function analyzeHttpHeaders(url) {
  console.log('分析HTTP头部信息...');
  try {
    const response = await axiosInstance.head(url, {
      maxRedirects: 5,
      validateStatus: null
    });
    
    const headers = response.headers;
    
    // 检查性能相关的HTTP头
    const hasCompression = headers['content-encoding'] && 
      (headers['content-encoding'].includes('gzip') || 
       headers['content-encoding'].includes('br') ||
       headers['content-encoding'].includes('deflate'));
       
    const hasCaching = headers['cache-control'] || headers['expires'];
    
    const securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    const securityScore = securityHeaders.reduce((score, header) => {
      return score + (headers[header] ? 1 : 0);
    }, 0) / securityHeaders.length;
    
    return {
      hasCompression,
      hasCaching,
      securityScore,
      server: headers['server'] || 'unknown',
      headers: headers
    };
  } catch (error) {
    console.error('HTTP头分析失败:', error);
    throw error;
  }
}

// 所有其他路由返回前端应用
const serveIndex = (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
};

app.get('*', serveIndex);

// 启动服务器
app.listen(PORT, async () => {
  console.log(`GreenWeb服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 以使用应用`);
  
  // 检查Chrome可用性
  const chromeAvailable = await checkChromeAvailability();
  if (!chromeAvailable) {
    console.warn('警告: Chrome不可用，Lighthouse性能测试功能将不可用');
    console.warn('建议解决方案:');
    console.warn('1. 确保已安装Chrome浏览器');
    console.warn('2. 在Windows上，可能需要设置Chrome路径环境变量');
    console.warn('3. 如果在Docker中运行，确保使用了适当的配置');
  } else {
    console.log('Chrome可用，Lighthouse性能测试功能正常');
  }
}); 