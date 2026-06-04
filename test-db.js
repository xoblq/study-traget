/**
 * 数据库连通性测试脚本
 */

import { initDatabase, getPool } from "./modules/document/db.js";

async function runTest() {
  console.log("开始进行 PostgreSQL 数据库连通性与 Schema 初始化测试...");
  
  // 1. 初始化数据库连接并建表
  await initDatabase();
  
  try {
    const pool = getPool();
    // 2. 执行一次简单查询
    const res = await pool.query("SELECT NOW()");
    console.log("恭喜！数据库连接与查询测试完全正常！当前数据库时间为:", res.rows[0].now);
    process.exit(0);
  } catch (err) {
    console.error("数据库连通性测试失败，详细错误信息如下:");
    console.error(err);
    process.exit(1);
  }
}

runTest();
