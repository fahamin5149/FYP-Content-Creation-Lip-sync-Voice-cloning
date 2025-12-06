import type { Request, Response } from "express";
// import { pool } from "../db/connect.js";

export const getTestData = async (req: Request, res: Response) => {
  try {
    // const result = await pool.query("SELECT NOW()");
    res.json({ message: "Connected successfully", time: new Date() });
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).json({ error: "Database query failed" });
  }
};
