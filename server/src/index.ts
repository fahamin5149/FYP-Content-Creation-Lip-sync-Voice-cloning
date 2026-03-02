//server/src/index.ts
import dotenv from "dotenv"
dotenv.config()

console.log("1. Environment loaded first")

import express from "express"
import cors from "cors"

// Routers
import usersRoutes from "./routes/users.js"
import contentRoutes from "./routes/content.js"
import mediaRoutes from "./routes/media.js"

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

// ✅ Healthcheck endpoint
app.get("/test", (req, res) => {
  res.json({
    message: "Server is working!",
    database: "Supabase connected",
    auth: "Clerk",
  })
})

// ✅ Main app routes
app.use("/api/users", usersRoutes)
app.use("/api/content", contentRoutes)
app.use("/api/media", mediaRoutes)

console.log("4. Routes configured")

// Ensure PORT is a number
const PORT: number = parseInt(process.env.PORT ?? "5000", 10)

app.listen(PORT, () => {
  console.log(`5. Server running on: ${PORT}`)
  console.log("6. All files loaded successfully!")
})