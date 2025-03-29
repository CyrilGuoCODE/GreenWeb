/**
 * Cloudflare Pages 中间件
 * 用于路由请求到相应的处理程序
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // 如果是 API 请求，则路由到相应的 API 处理程序
  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }
  
  // 为静态资产和前端页面继续正常的请求处理流程
  return context.next();
} 