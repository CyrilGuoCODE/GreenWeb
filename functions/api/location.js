/**
 * 获取服务器位置信息 API 端点
 * 使用 Cloudflare 内置功能替代 Node.js DNS 和 GeoIP
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
    
    // 执行 DNS 查询 (使用 fetch 从公共 DNS API 获取)
    const dnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: {
        'Accept': 'application/dns-json',
      }
    });
    
    const dnsData = await dnsResponse.json();
    const ip = dnsData.Answer && dnsData.Answer[0] ? dnsData.Answer[0].data : null;
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: '无法解析域名' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // 使用 IP 地理位置 API
    const geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
    const geoData = await geoResponse.json();
    
    return new Response(
      JSON.stringify({
        ip: ip,
        country: geoData.country,
        countryCode: geoData.country_code,
        region: geoData.region,
        city: geoData.city,
        timezone: geoData.timezone,
        latitude: parseFloat(geoData.latitude),
        longitude: parseFloat(geoData.longitude),
        carbonIntensity: getCarbonIntensity(geoData.country_code)
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'max-age=3600'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `位置查询失败: ${error.message}` }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

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

// 获取碳强度函数
function getCarbonIntensity(countryCode) {
  return COUNTRY_CARBON_INTENSITY[countryCode] || 475; // 默认全球平均值
} 