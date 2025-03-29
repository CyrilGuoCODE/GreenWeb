/**
 * 简化版性能分析 API 端点
 * 因为 Cloudflare Functions 无法运行 Lighthouse/Puppeteer
 * 使用模拟数据和基本 HTTP 分析
 */
export async function onRequest(context) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: '缺少域名参数' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 格式化完整URL
    let targetUrl = domain;
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    // 使用基本HTTP请求分析网站性能
    const startTime = Date.now();
    
    // 发送HEAD请求以获取响应头
    const headResponse = await fetch(targetUrl, {
      method: 'HEAD',
      redirect: 'follow',
      cf: {
        cacheTtl: 300,
        cacheEverything: false
      }
    }).catch(e => null);
    
    if (!headResponse) {
      return new Response(
        JSON.stringify({ 
          error: '无法访问目标网站',
          success: false 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 计算TTFB时间
    const ttfb = Date.now() - startTime;
    
    // 发送实际GET请求获取网页内容
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      cf: {
        cacheTtl: 300,
        cacheEverything: false
      }
    });
    
    const totalTime = Date.now() - startTime;
    const serverType = response.headers.get('server') || 'unknown';
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    
    // 获取页面大小 (以字节为单位)
    let pageSize = 0;
    if (contentLength) {
      pageSize = parseInt(contentLength, 10);
    } else {
      // 如果没有content-length头，估算页面大小
      pageSize = 50000; // 约50KB - 平均HTML文档大小
    }
    
    // 估算FCP, LCP, CLS (简化版)
    const fcpEstimate = Math.max(ttfb + 200, ttfb * 1.2);
    const lcpEstimate = Math.max(ttfb + 500, ttfb * 1.5);
    let clsEstimate = 0.05; // 默认值
    
    if (totalTime > 2000) clsEstimate = 0.15;
    else if (totalTime > 1000) clsEstimate = 0.1;
    
    // FID估计
    let fidEstimate = 50; // 默认值（毫秒）
    if (totalTime > 3000) fidEstimate = 200;
    else if (totalTime > 1500) fidEstimate = 100;
    
    // 检查页面是否支持HTTPS
    const supportsHTTPS = targetUrl.startsWith('https://');
    
    // 检查页面是否使用压缩
    const supportsCompression = 
      response.headers.get('content-encoding') && 
      (response.headers.get('content-encoding').includes('gzip') || 
       response.headers.get('content-encoding').includes('br') || 
       response.headers.get('content-encoding').includes('deflate'));
    
    // 检查是否使用缓存控制
    const cacheControl = response.headers.get('cache-control') || '';
    const supportsCaching = cacheControl !== '' && 
                         (cacheControl.includes('max-age') || 
                          cacheControl.includes('s-maxage') || 
                          cacheControl.includes('public'));
    
    // 构建结果对象
    const performance = {
      fcp: fcpEstimate / 1000, // 转换为秒
      lcp: lcpEstimate / 1000, // 转换为秒
      cls: clsEstimate,
      fid: fidEstimate,
      ttfb: ttfb,
      pageSize: pageSize,
      totalResourceSize: pageSize * 3, // 估算
      requestCount: Math.floor(5 + Math.random() * 20), // 估算
      domainCount: Math.floor(1 + Math.random() * 5), // 估算
      responseTime: totalTime,
      usesHttps: supportsHTTPS,
      serverType: serverType,
      supportsCompression: supportsCompression,
      supportsCaching: supportsCaching,
      usesCdn: serverType.toLowerCase().includes('cloudflare') || response.headers.get('cf-cache-status') !== null,
      cdnProvider: serverType.toLowerCase().includes('cloudflare') ? 'Cloudflare' : 'Unknown',
      measuredBy: 'Cloudflare Functions (基础HTTP分析)'
    };
    
    // 碳排放计算
    const pageSizeInGB = pageSize / 1024 / 1024 / 1024;
    const safeSizeInGB = Math.max(pageSizeInGB, 0.0001); // 确保至少为0.1MB
    
    const dataCenterEnergy = safeSizeInGB * 1.8; // kWh/GB
    const transmissionEnergy = safeSizeInGB * 0.06; // kWh/GB
    const deviceEnergy = safeSizeInGB * 0.15; // kWh/GB
    const totalEnergy = dataCenterEnergy + transmissionEnergy + deviceEnergy;
    
    const carbonIntensity = 442; // 全球平均碳强度 gCO2e/kWh
    const carbonEmission = totalEnergy * carbonIntensity;
    const annualCarbonEmission = carbonEmission * 12 * (10000 / 1000); // 假设每月10000访问量
    
    const carbonResult = {
      dataCenterEnergy,
      transmissionEnergy,
      deviceEnergy,
      totalEnergy,
      carbonEmission,
      annualCarbonEmission,
      provider: getProviderFromServer(serverType),
      region: '未知',
      renewablePercentage: getRandomRenewablePercentage(serverType),
      pue: getRandomPUE(serverType)
    };
    
    // 生成优化建议
    const suggestions = [];
    
    if (!supportsHTTPS) {
      suggestions.push('启用HTTPS以提高安全性和性能。');
    }
    
    if (!supportsCompression) {
      suggestions.push('启用Gzip或Brotli压缩以减少传输数据量。');
    }
    
    if (!supportsCaching) {
      suggestions.push('启用浏览器缓存以减少页面加载时间和服务器负载。');
    }
    
    if (performance.lcp > 2.5) {
      suggestions.push('优化最大内容绘制(LCP)时间，尝试预加载关键资源和优化图像。');
    }
    
    if (carbonResult.totalEnergy > 0.001) {
      suggestions.push('考虑使用绿色托管服务提供商，以减少碳排放。');
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        performance,
        carbonResult,
        suggestions: suggestions.length > 0 ? suggestions : generateDefaultSuggestions()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=1800'
        }
      }
    );
  } catch (error) {
    console.error('性能分析错误:', error);
    return new Response(
      JSON.stringify({ 
        error: `性能分析失败: ${error.message}`,
        success: false,
        performance: {
          measurable: false,
          error: error.message
        },
        suggestions: generateDefaultSuggestions()
      }),
      {
        status: 200, // 使用200状态码以便前端能正常处理
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// 根据服务器类型推断提供商
function getProviderFromServer(serverType) {
  if (!serverType) return '未知';
  const serverLower = serverType.toLowerCase();
  
  if (serverLower.includes('cloudflare')) return 'Cloudflare';
  if (serverLower.includes('amazon') || serverLower.includes('aws')) return 'Amazon Web Services';
  if (serverLower.includes('google')) return 'Google Cloud';
  if (serverLower.includes('microsoft') || serverLower.includes('azure')) return 'Microsoft Azure';
  if (serverLower.includes('nginx')) return 'NGINX Hosting';
  if (serverLower.includes('apache')) return 'Apache Hosting';
  if (serverLower.includes('litespeed')) return 'LiteSpeed Hosting';
  if (serverLower.includes('alibaba')) return 'Alibaba Cloud';
  if (serverLower.includes('tencent')) return 'Tencent Cloud';
  
  return '标准托管服务';
}

// 获取随机可再生能源百分比
function getRandomRenewablePercentage(serverType) {
  const serverLower = serverType ? serverType.toLowerCase() : '';
  
  if (serverLower.includes('cloudflare')) return Math.floor(70 + Math.random() * 20);
  if (serverLower.includes('google')) return Math.floor(80 + Math.random() * 15);
  if (serverLower.includes('amazon') || serverLower.includes('aws')) return Math.floor(60 + Math.random() * 20);
  if (serverLower.includes('microsoft') || serverLower.includes('azure')) return Math.floor(65 + Math.random() * 20);
  
  return Math.floor(30 + Math.random() * 40);
}

// 获取随机PUE值
function getRandomPUE(serverType) {
  const serverLower = serverType ? serverType.toLowerCase() : '';
  
  if (serverLower.includes('google')) return 1.1 + Math.random() * 0.1;
  if (serverLower.includes('cloudflare')) return 1.2 + Math.random() * 0.15;
  if (serverLower.includes('amazon') || serverLower.includes('aws')) return 1.2 + Math.random() * 0.2;
  if (serverLower.includes('microsoft') || serverLower.includes('azure')) return 1.15 + Math.random() * 0.2;
  
  return 1.4 + Math.random() * 0.3;
}

// 生成默认优化建议
function generateDefaultSuggestions() {
  return [
    '选择使用可再生能源的绿色托管服务提供商，减少碳足迹。',
    '优化代码效率和资源加载，减少服务器处理时间和能源消耗。',
    '使用CDN分发内容，减少数据传输距离，提高加载速度。',
    '压缩和优化图像和视频资源，减少传输数据量。',
    '实施有效的缓存策略，减少重复请求和服务器负载。'
  ];
} 