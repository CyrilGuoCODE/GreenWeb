# GreenWeb Netlify部署指南

本文档提供在Netlify上部署GreenWeb应用的详细步骤和注意事项。

## 快速开始

1. **Fork或克隆仓库**

   首先，将GreenWeb仓库fork到您自己的GitHub账户，或者克隆到本地。

2. **连接到Netlify**

   - 登录[Netlify](https://app.netlify.com/)
   - 点击"New site from Git"
   - 选择GitHub并授权访问
   - 选择您的GreenWeb仓库
   
3. **配置构建设置**

   在部署设置页面中：
   
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
   
4. **环境变量**

   在Netlify站点设置的"Environment variables"部分添加以下变量：
   
   - `VITE_NETLIFY`: `true`
   
5. **部署**

   点击"Deploy site"按钮开始部署。

## 本地开发

要在本地测试Netlify Functions，请按照以下步骤操作：

1. **安装依赖**

   ```bash
   npm install
   ```

2. **启动Netlify开发服务器**

   ```bash
   npm run netlify:dev
   ```

   这将同时启动前端和Netlify Functions，允许您在本地测试完整的应用。

## 项目结构

- `netlify.toml`: Netlify配置文件
- `netlify/functions/api.js`: API函数入口点
- `server/netlify-server.js`: 从主服务器代码中提取的API路由
- `.env.production`: 生产环境配置
- `.env.development`: 开发环境配置

## 注意事项

### 内存限制

Netlify Functions有128MB的内存限制和10秒的执行时间限制，这可能会影响某些复杂的分析功能。为解决这个问题：

1. 我们将复杂的分析功能简化，使其在无服务器环境中更高效
2. 对于大型或复杂的网站，我们提供基本的HTTP分析选项，该选项使用更少的资源

### 浏览器模拟

由于Netlify Functions环境限制，依赖Chrome或其他浏览器的功能可能会受到影响。我们建议：

1. 主要使用"基础HTTP分析"或"仅HTTP头分析"选项
2. 避免使用"自动选择"模式，因为它可能会尝试启动Chrome

### 环境变量

确保在Netlify站点设置中配置了所有必要的环境变量。这些变量对于API路径和其他配置设置至关重要。

## 常见问题

### API返回504错误
   
这通常表示函数执行时间超过了Netlify的10秒限制。解决方法：
- 使用更简单的分析模式
- 分析较小的网站
- 考虑使用带有更长超时设置的替代平台

### Chrome启动失败

如果您在日志中看到Chrome启动错误，请在前端选择"基础HTTP分析"选项，这不依赖于Chrome。

### 前端无法连接到API

确保前端代码中的API基础URL正确配置为`/.netlify/functions/api`。检查`src/services/websiteAnalyzer.js`中的`getBaseUrl()`函数。

## 支持

如有任何问题，请在GitHub上提交Issue或通过项目页面联系我们。 