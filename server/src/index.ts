//server/src/index.ts
import dotenv from "dotenv"
dotenv.config()

console.log("1. Environment loaded first")

import express from "express"
import cors from "cors"
import session from "express-session"

// Routers
import authRoutes from "./routes/auth.js"

console.log("2. Starting server setup...")
console.log("3. Routers imported successfully")

const app = express()

// ✅ CORS - IMPORTANT: must allow credentials for sessions
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Allow cookies
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ✅ Session configuration - ADD THIS
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // true only in production (requires HTTPS)
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }
}))

// ✅ Healthcheck endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    database: "PostgreSQL connected",
  })
})

// ✅ Main app routes
app.use("/api/auth", authRoutes)

console.log("4. Routes configured")

// Ensure PORT is a number
const PORT: number = parseInt(process.env.PORT ?? "5000", 10)

app.listen(PORT, () => {
  console.log(`5. Server running on: ${PORT}`)
  console.log("6. All files loaded successfully!")
})