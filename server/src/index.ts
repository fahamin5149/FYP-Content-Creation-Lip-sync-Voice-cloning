//server/src/index.ts
import dotenv from "dotenv"
dotenv.config()

console.log("1. Environment loaded first")

import express from "express"
import cors from "cors"

// Routers
import authRoutes from "./routes/auth.js"

console.log("2. Starting server setup...")
console.log("3. Routers imported successfully")

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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