import { Router } from "express"
import type{ Request, Response } from "express"
import bcrypt from "bcryptjs"
import { pool } from "../db/connect.js"

const router = Router()

// Validation helper
const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

const validatePassword = (password: string): boolean => {
  return (
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

// ✅ SIGNUP ROUTE
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    console.log("Signup request received with", email, password)

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: "Password does not meet security requirements",
      })
    }

    // Check if user already exists
    const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user into database
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id, email",
      [email, hashedPassword],
    )

    const newUser = result.rows[0]

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        message: "Account created successfully. Please verify your email.",
      },
    })
  } catch (error: any) {
    console.error("Signup error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ LOGIN ROUTE
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      })
    }

    // Find user by email
    const result = await pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      })
    }

    const user = result.rows[0]

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        message: "Login successful",
      },
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ GOOGLE SIGNUP ROUTE (Placeholder for Google OAuth integration)
router.post("/google-signup", async (req: Request, res: Response) => {
  try {
    // This would integrate with Google OAuth
    // For now, returning a placeholder response
    return res.status(200).json({
      success: true,
      data: {
        message: "Google signup endpoint ready for OAuth integration",
      },
    })
  } catch (error: any) {
    console.error("Google signup error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ LOGOUT ROUTE
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // If using JWT, this would be handled on client-side
    return res.status(200).json({
      success: true,
      data: { message: "Logged out successfully" },
    })
  } catch (error: any) {
    console.error("Logout error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ VERIFY EMAIL ROUTE (Placeholder)
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      })
    }

    // Token verification logic would go here
    return res.status(200).json({
      success: true,
      data: { message: "Email verified successfully" },
    })
  } catch (error: any) {
    console.error("Email verification error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

export default router