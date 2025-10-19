import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,       // e.g., "devuser"
  host: process.env.DB_HOST,       // e.g., "localhost"
  database: process.env.DB_NAME,   // e.g., "mydbMAIN"
  password: process.env.DB_PASS,   // e.g., "devpass"
  port: Number(process.env.DB_PORT) || 5432,
});

pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL successfully"))
  .catch((err: Error) => console.error("❌ PostgreSQL connection error:", err.message));

export { pool };
