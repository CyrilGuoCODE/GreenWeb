# GreenWeb Cloudflare Pages 部署指南

本文档提供了如何将GreenWeb项目部署到Cloudflare Pages的详细步骤。

## 项目架构

本项目使用了前后端整合方案：
- 前端：Vue.js + Element Plus
- 后端API：Cloudflare Pages Functions

## 部署步骤

### 1. 创建Cloudflare Pages项目

1. 登录Cloudflare控制台 https://dash.cloudflare.com/
2. 进入Pages选项，点击"创建应用程序"
3. 连接到您的Git仓库（GitHub, GitLab等）并选择GreenWeb仓库
4. 在构建设置中填写：
   - 构建命令：`npm install && npm run build`
   - 输出目录：`dist`
   - 根目录：`/`
   - Node.js版本：选择 >=16.0.0

### 2. 启用Pages Functions

1. 在项目设置中，确保Pages Functions已启用
2. 如果需要自定义域名，在"自定义域"选项卡中添加

### 3. 部署过程

部署过程会自动执行以下步骤：
1. 安装项目依赖（npm install）
2. 构建前端应用（npm run build）
3. 部署静态内容到Cloudflare CDN
4. 部署Functions（`functions`目录中的代码）到Cloudflare Workers

### 4. 性能特性

由于Cloudflare的限制，此版本与本地开发版本有以下区别：

- **不使用Lighthouse/Puppeteer**：由于Cloudflare Functions环境限制，无法运行完整的浏览器测试
- **使用HTTP基础分析**：分析基于HTTP响应头和简单的请求计时
- **模拟数据补充**：对于部分无法直接测量的指标采用估算值

## 本地开发

如果需要在本地测试Cloudflare Pages Functions，可以安装wrangler：

```bash
npm install -g wrangler
```

然后在项目根目录运行：

```bash
wrangler pages dev dist
```

## 故障排除

如果遇到白屏问题：

1. 检查Cloudflare Pages日志以查看构建或运行时错误
2. 确保API请求到达了Functions（检查网络请求标签）
3. 清除浏览器缓存并刷新页面

## 重要文件说明

- `functions/`：包含所有Cloudflare Functions代码
- `functions/_middleware.js`：请求路由中间件
- `functions/_routes.json`：路由配置
- `functions/api/*.js`：API端点实现

对于需要完整功能的情况，请考虑使用专门的服务器部署方案。 