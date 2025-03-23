# GreenWeb - 网站碳中和检测工具
https://GreenWeb.pages.dev/
GreenWeb是一个网站碳中和检测工具，可以评估网站的碳排放并提供优化建议。该工具通过分析网站服务器位置、页面大小、性能指标等因素，计算网站访问产生的碳排放量，并提供可视化展示。

## 功能特点

- **碳排放检测**：基于真实数据计算网站单次访问和月度碳排放量
- **能源分析**：显示可再生能源使用比例和能源消耗细节
- **性能评估**：测量和展示关键性能指标（FCP、LCP、CLS等）
- **优化建议**：根据分析结果提供针对性的优化建议
- **可视化展示**：使用图表直观展示碳排放和能源数据

## 技术架构

- **前端**：Vue 3 + Element Plus + ECharts
- **后端**：Node.js + Express
- **数据分析**：自定义算法和外部API集成

## 安装与运行

### 前提条件

- Node.js 14+
- npm 7+

### 步骤

1. **克隆仓库**

```bash
git clone https://github.com/cyrilguocode/GreenWeb.git
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

3. **启动开发服务器**

```bash
# 在一个终端中启动前端开发服务器
npm run dev

# 在另一个终端中启动后端服务
cd server
npm run dev
```

4. **构建生产版本**

```bash
npm run build
```

构建后的文件将位于`dist`目录中。

5. **部署**

将`dist`目录的内容和`server`目录一起部署到你的服务器上，然后通过以下命令启动后端服务：

```bash
cd server
npm start
```

## 使用方法

1. 在输入框中输入要检测的网站域名（例如：example.com）
2. 点击"检测"按钮
3. 等待系统分析并展示结果
4. 查看碳排放数据、能源分析、性能指标和优化建议

## 项目结构

```
├── src                   # 前端源代码
│   ├── assets            # 静态资源
│   ├── components        # Vue组件
│   └── services          # 服务接口
├── server                # 后端服务
│   └── index.js          # Express服务器
├── public                # 公共文件
└── dist                  # 构建输出目录
```

## 数据来源

- 域名解析和位置信息通过DNS查询和GeoIP服务获取
- 页面大小通过HTTP请求测量
- 性能指标通过模拟测量或实际访问获取
- 碳强度数据来自国际能源署和其他研究机构

## 贡献

欢迎通过Pull Request或Issue参与项目的改进。

## 许可证

MIT 