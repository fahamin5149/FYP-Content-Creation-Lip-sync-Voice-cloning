import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { pool } from "./db/connect.js"
import authRoutes from "./routes/auth.js"

dotenv.config()

const app = express()

// ✅ CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
)

// ✅ Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = Number(process.env.PORT) || 5000

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: { message: "Server is running and connected to PostgreSQL!" },
  })
})

// ✅ Auth Routes
app.use("/api/auth", authRoutes)

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  })
})

// ✅ Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error",
  })
})

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`✅ API ready at http://localhost:${PORT}/api`)
})