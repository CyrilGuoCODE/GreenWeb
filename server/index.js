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
    
    res.json({
      provider,
      ip,
      org
    });
  } catch (error) {
    console.error('提供商分析错误:', error);
    res.status(500).json({ error: '提供商分析失败', message: error.message });
  }
});

/**
 * 模拟性能测量
 * 注意：真实场景需要使用Lighthouse或类似工具进行完整测量
 */
app.get('/api/performance', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }
    
    // 测量TTFB
    const startTime = performance.now();
    const response = await axiosInstance.get(url, {
      maxRedirects: 5,
      validateStatus: null,
      timeout: 10000
    });
    const endTime = performance.now();
    
    const ttfb = endTime - startTime;
    
    // 根据响应时间和页面大小估算其他性能指标
    // 这只是一个简化的模型，真实测量需要在浏览器环境中使用Performance API
    const contentLength = response.headers['content-length'] || 
                          response.data.length || 
                          100000; // 默认值
    
    const sizeInKB = contentLength / 1024;
    const sizeFactor = Math.min(sizeInKB / 3000, 2);
    
    // 基于TTFB和页面大小估算其他指标
    const fcp = (ttfb / 1000) + (sizeFactor * 0.5); // 估算FCP（秒）
    const lcp = (ttfb / 1000) + (sizeFactor * 1.2); // 估算LCP（秒）
    
    // CLS和FID需要用户交互才能准确测量，这里使用随机值模拟
    const cls = Math.random() * 0.15; // 0-0.15之间的随机值
    const fid = 50 + (Math.random() * 150); // 50-200ms之间的随机值
    
    res.json({
      fcp,
      lcp,
      cls,
      fid,
      ttfb: ttfb,
      pageSize: sizeInKB,
      statusCode: response.status
    });
  } catch (error) {
    console.error('性能测量错误:', error);
    res.status(500).json({ error: '性能测量失败', message: error.message });
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
    
    // 执行所有分析任务
    const [locationData, headerData, sizeData, performanceData, providerData] = await Promise.all([
      axios.get(`http://localhost:${PORT}/api/location?domain=${domain}`).then(resp => resp.data),
      axios.get(`http://localhost:${PORT}/api/headers?url=${encodeURIComponent(url)}`).then(resp => resp.data),
      axios.get(`http://localhost:${PORT}/api/size?url=${encodeURIComponent(url)}`).then(resp => resp.data),
      axios.get(`http://localhost:${PORT}/api/performance?url=${encodeURIComponent(url)}`).then(resp => resp.data),
      axios.get(`http://localhost:${PORT}/api/provider?domain=${domain}`).then(resp => resp.data)
    ]);
    
    res.json({
      domain,
      url,
      location: locationData,
      headers: headerData,
      size: sizeData,
      performance: performanceData,
      provider: providerData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('综合分析错误:', error);
    res.status(500).json({ error: '综合分析失败', message: error.message });
  }
});

// 所有其他路由返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`GreenWeb服务器运行在端口 ${PORT}`);
}); 