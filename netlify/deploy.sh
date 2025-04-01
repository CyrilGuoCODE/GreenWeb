#!/bin/bash

# GreenWeb Netlify部署脚本

echo "=============================================="
echo "         GreenWeb Netlify部署脚本"
echo "=============================================="

# 安装依赖
echo "安装依赖..."
npm install

# 构建前端应用
echo "构建前端应用..."
npm run build

echo "部署完成！"
echo "应用现在应该可以在Netlify上访问"
echo "==============================================" 