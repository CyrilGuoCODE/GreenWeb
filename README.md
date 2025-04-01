# GreenWeb - 网站碳中和检测工具

GreenWeb是一个综合性的网站碳中和检测工具，可以评估网站的碳排放并提供优化建议。该工具通过分析网站服务器位置、页面大小、性能指标等因素，计算网站访问产生的碳排放量，并提供可视化展示。

官方网站: https://GreenWeb.pages.dev/

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/cyrilguocode/GreenWeb)

## 功能特点

- **碳排放检测**：基于真实数据计算网站单次访问和月度碳排放量
- **能源分析**：显示可再生能源使用比例和能源消耗细节
- **性能评估**：测量和展示关键性能指标（FCP、LCP、CLS等）
- **优化建议**：根据分析结果提供针对性的优化建议
- **Netlify部署支持**：提供完整的Netlify部署配置，一键部署到Netlify

## 技术架构

- **前端**：Vue 3 + Element Plus + ECharts
- **后端**：Node.js + Express
- **数据分析**：自定义算法和外部API集成
- **构建工具**：Vite
- **自动化脚本**：批处理脚本用于项目管理和依赖维护
- **无服务器功能**：支持Netlify Functions部署

## 在线部署

### Netlify一键部署（推荐）

1. 点击上方的"Deploy to Netlify"按钮
2. 按照Netlify指引完成部署流程
3. 等待几分钟，即可获得一个完整功能的GreenWeb应用

详细部署指南请参考[NETLIFY.md](NETLIFY.md)文件。

### 其他部署选项

详见本文档下方的"安装与运行"部分。

## 安装与运行

### 前提条件

- Node.js 14+
- npm 7+

### 使用自动化脚本（推荐）

我们提供了完整的批处理脚本来简化项目的安装和运行过程：

```
start-app.bat       # 主启动脚本，包含多种运行模式
```

直接运行`start-app.bat`脚本，根据菜单提示选择相应的操作：

1. **开发模式** - 前后端分离，方便调试
2. **生产模式** - 构建并启动整合后的应用
3. **仅构建项目** - 不启动服务器，构建项目
4. **更新项目依赖** - 更新前后端依赖
5. **退出** - 退出脚本

### 手动安装与运行

如果不使用自动化脚本，也可以按以下步骤手动安装和运行：

1. **克隆仓库**

```bash
git clone https://github.com/yourusername/GreenWeb.git
cd GreenWeb
```

2. **安装依赖**

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

3. **开发模式（前后端分离）**

```bash
# 启动前端开发服务器
npm run dev

# 在另一个终端中启动后端服务
npm run server:dev
```

4. **生产模式（前后端整合）**

```bash
# 构建前端应用
npm run build

# 启动整合服务器
npm run start
```

## 使用方法

1. 在输入框中输入要检测的网站域名（例如：example.com）
2. 点击"检测"按钮
3. 等待系统分析并展示结果
4. 查看碳排放数据、能源分析、性能指标和优化建议

## 数据来源

- 域名解析和位置信息通过DNS查询和GeoIP服务获取
- 页面大小通过HTTP请求测量
- 性能指标通过模拟测量或实际访问获取
- 碳强度数据来自国际能源署和其他研究机构

## 贡献

欢迎通过Pull Request或Issue参与项目的改进。

## 许可证

MIT 