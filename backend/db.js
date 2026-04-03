import mysql from 'mysql2/promise';

export const db = await mysql.createPool({
  host: 'mysql-3baf3f9c-unitecnar-ab67.a.aivencloud.com',
  user: 'avnadmin',
  password: process.env.DB_PASSWORD,
  database: 'omnisynch_inventory',
  port: 17166,

  // 🔴 AQUÍ VA EL SSL
  ssl: {
    rejectUnauthorized: false
  }
});