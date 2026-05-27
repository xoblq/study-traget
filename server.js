/**
 * 主服务器
 * 整合所有模块，启动 HTTP 服务
 */

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// 导入路由模块
import chatRoutes from "./modules/chat/routes.js";
import storageRoutes from "./modules/storage/routes.js";
import documentRoutes from "./modules/document/routes.js";

// 获取当前目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 注册路由
app.use("/api", chatRoutes);
app.use("/api", storageRoutes);
app.use("/api/document", documentRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动: http://localhost:${PORT}`);
});
