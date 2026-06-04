/**
 * PostgreSQL 数据库连接与初始化模块
 * 负责管理连接池、数据库建表及 pgvector 检测
 */

import pg from "pg";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载环境变量 (.env)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const { Pool } = pg;

// 配置数据库连接参数
const poolConfig = {
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432", 10),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "stream_out",
};

const pool = new Pool(poolConfig);

// 全局状态：是否支持 pgvector 扩展
let hasVector = false;

/**
 * 初始化数据库连接并执行 Schema 迁移建表
 */
export async function initDatabase() {
  try {
    console.log("[DB] 正在尝试连接 PostgreSQL 数据库:", `${poolConfig.host}:${poolConfig.port}/${poolConfig.database}`);
    
    // 测试连接
    const client = await pool.connect();
    console.log("[DB] 数据库连接成功！正在执行初始化脚本...");

    try {
      // 读取 schema.sql 语句
      const sqlPath = path.resolve(__dirname, "./schema.sql");
      const schemaSql = await fs.readFile(sqlPath, "utf-8");
      
      // 执行建表与创建自定义函数
      await client.query(schemaSql);
      console.log("[DB] 数据库建表与辅助计算函数初始化成功。");

      // 检测是否成功安装/启用了 pgvector 扩展
      const vectorCheck = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'vector'
        ) AS has_vector;
      `);
      
      hasVector = vectorCheck.rows[0].has_vector;
      console.log(`[DB] pgvector 向量扩展检测状态: ${hasVector ? "支持 (使用 vector 类型)" : "不支持 (自动降级为 double precision[] 存储)"}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[DB] 数据库初始化失败！请确保您的 PostgreSQL 正在运行，并且 .env 文件中的连接配置正确。");
    console.error("[DB] 错误详情:", error.message);
  }
}

/**
 * 判断是否支持 pgvector
 * @returns {boolean} 是否支持向量扩展
 */
export function isVectorSupported() {
  return hasVector;
}

/**
 * 获取数据库连接池
 * @returns {Pool} pg.Pool 实例
 */
export function getPool() {
  return pool;
}
