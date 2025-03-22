addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });

  async function handleRequest(request) {
    const urlParams = new URL(request.url).searchParams;
    const url = urlParams.get('url');

    if (!url) {
      return new Response(JSON.stringify({ error: "缺少 URL 参数" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GreenWeb Carbon Checker Cloudflare-Worker)' // 自定义 User-Agent
        }
      });

      if (!response.ok) {
        console.error(`Cloudflare Worker fetch error: HTTP ${response.status} for URL ${url}`);
        return new Response(
          JSON.stringify({ error: `HTTP ${response.status} 错误`, details: `请求 ${url} 失败，状态码: ${response.status}` }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const contentLength = response.headers.get('Content-Length');
      const endTime = Date.now();
      const loadTime = (endTime - startTime) / 1000;
      const pageSizeKB = contentLength ? parseInt(contentLength, 10) / 1024 : null; // 如果 Content-Length 不存在，则返回 null

      return new Response(
        JSON.stringify({ pageSizeKB, loadTime }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error("Cloudflare Worker error:", error);
      return new Response(
        JSON.stringify({ error: "Cloudflare Worker 执行错误", details: error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }