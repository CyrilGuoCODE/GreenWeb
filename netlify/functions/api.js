/**
 * GreenWeb Netlify Function
 * 将Express应用封装为Netlify Function
 */

const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs');

// 动态导入ESM模块的准备工作
let chromeLauncher;
global.initializeChromeLauncher = async () => {
  try {
    chromeLauncher = await import('chrome-launcher');
    console.log('Chrome Launcher模块已成功导入');
    return chromeLauncher;
  } catch (err) {
    console.error('导入ESM模块失败:', err);
    throw err;
  }
};

// 创建一个新的Express应用实例
const app = express();

// 将原始服务器代码分离出来并导入（稍后会创建）
const setupServer = require('../../server/netlify-server');

// 设置API路由（这是一个处理函数，因为setupServer可能是异步的）
const setupRoutes = async () => {
  try {
    // 等待chromeLauncher初始化
    global.chromeLauncher = await global.initializeChromeLauncher();
    
    // 设置服务器路由
    await setupServer(app);
    
    console.log('Netlify函数已成功设置API路由');
  } catch (error) {
    console.error('设置Netlify函数API路由时出错:', error);
    
    // 添加错误处理路由
    app.use('/api/*', (req, res) => {
      res.status(500).json({
        error: '服务器初始化失败',
        message: error.message,
        details: '可能是ESM模块导入问题，请检查服务器日志'
      });
    });
  }
};

// 立即调用设置函数
setupRoutes();

// 包装Express应用为Netlify函数
exports.handler = serverless(app); 