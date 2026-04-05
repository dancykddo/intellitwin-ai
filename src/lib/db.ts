import mysql from 'mysql2/promise';

let pool: mysql.Pool;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'intellitwin',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
};

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T;
}

export default getPool;
