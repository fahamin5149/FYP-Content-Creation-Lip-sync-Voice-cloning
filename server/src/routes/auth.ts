import { Router } from "express"
import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import nodemailer from "nodemailer"
import { pool } from "../db/connect.js"
import { OAuth2Client } from "google-auth-library"

const router = Router()

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Validation helpers
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

// Generate verification token
const generateVerificationToken = (): { token: string; expires: Date } => {
  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return { token, expires }
}

// Send verification email
const sendVerificationEmail = async (email: string, token: string, name: string): Promise<void> => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email - Urdu AI Platform",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333; margin-bottom: 20px;">Welcome to Urdu AI Platform, ${name}!</h2>
          
          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
            Thank you for creating an account. Please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="display: inline-block; background-color: #e78a53; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-bottom: 20px;">
            Or copy and paste this link in your browser:
          </p>
          <p style="color: #0066cc; word-break: break-all; font-size: 12px;">
            ${verificationLink}
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
          
          <p style="color: #999; font-size: 12px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// Send password reset email
const sendPasswordResetEmail = async (email: string, token: string, name: string): Promise<void> => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Password - Urdu AI Platform",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #333; margin-bottom: 20px;">Password reset request for ${name}</h2>

          <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
            We received a request to reset the password for your account. Click the button below to set a new password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background-color: #e78a53; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>

          <p style="color: #999; font-size: 14px; margin-bottom: 20px;">Or copy and paste this link in your browser:</p>
          <p style="color: #0066cc; word-break: break-all; font-size: 12px;">${resetLink}</p>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// ✅ SIGNUP ROUTE
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Full name is required",
      })
    }

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

    // Generate verification token
    const { token, expires } = generateVerificationToken()

    // Insert user into database with verification token
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, verification_token, verification_token_expires_at, is_email_verified) 
       VALUES ($1, $2, $3, $4, $5, false) 
       RETURNING id, email, full_name`,
      [name.trim(), email, hashedPassword, token, expires],
    )

    const newUser = result.rows[0]

    // Send verification email
    try {
      await sendVerificationEmail(email, token, name.trim())
    } catch (emailError: any) {
      console.error("Error sending verification email:", emailError)
    }

    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.full_name,
        message: "Account created successfully. Please check your email to verify your account.",
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
    const result = await pool.query(
      "SELECT id, email, password_hash, is_email_verified, full_name FROM users WHERE email = $1",
      [email],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      })
    }

    const user = result.rows[0]

    // Check if email is verified
    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before signing in",
      })
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      })
    }

    // ✅ SET SESSION
    ;(req as any).session.userId = user.id

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.full_name,
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

// ✅ GET USER PROFILE ROUTE
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).session?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated"
      })
    }

    const result = await pool.query(
      "SELECT id, email, full_name, is_email_verified, created_at FROM users WHERE id = $1",
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found"
      })
    }

    const user = result.rows[0]

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error"
    })
  }
})

// ✅ VERIFY EMAIL ROUTE
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Verification token is required",
      })
    }

    // Find user with valid token
    const result = await pool.query(
      `SELECT id, email FROM users 
       WHERE verification_token = $1 
       AND verification_token_expires_at > NOW() 
       AND is_email_verified = false`,
      [token],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired verification token",
      })
    }

    const user = result.rows[0]

    // Mark email as verified and clear token
    await pool.query(
      `UPDATE users 
       SET is_email_verified = true, 
           verification_token = NULL, 
           verification_token_expires_at = NULL 
       WHERE id = $1`,
      [user.id],
    )

    return res.status(200).json({
      success: true,
      data: {
        email: user.email,
        message: "Email verified successfully. You can now sign in.",
      },
    })
  } catch (error: any) {
    console.error("Email verification error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ FORGOT PASSWORD
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" })
    }

    const result = await pool.query("SELECT id, full_name FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No account found with this email" })
    }

    const user = result.rows[0]
    const { token, expires } = generateVerificationToken()

    await pool.query(
      `UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = $2 WHERE id = $3`,
      [token, expires, user.id],
    )

    try {
      await sendPasswordResetEmail(email, token, user.full_name || "")
    } catch (emailError: any) {
      console.error("Error sending password reset email:", emailError)
    }

    return res.status(200).json({ success: true, data: { message: "Password reset email sent successfully" } })
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
})

// ✅ VALIDATE RESET TOKEN
router.post("/validate-reset-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" })
    }

    const result = await pool.query(
      `SELECT id, email FROM users WHERE password_reset_token = $1 AND password_reset_token_expires_at > NOW()`,
      [token],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token" })
    }

    const user = result.rows[0]

    return res.status(200).json({ success: true, data: { email: user.email } })
  } catch (error: any) {
    console.error("Validate reset token error:", error)
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
})

// ✅ RESET PASSWORD
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const { token, password, confirmPassword } = req.body

    if (!token) {
      return res.status(400).json({ success: false, error: "Reset token is required" })
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, error: "Password and confirmPassword are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" })
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, error: "Password does not meet security requirements" })
    }

    const result = await pool.query(
      `SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_token_expires_at > NOW()`,
      [token],
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Invalid or expired reset token" })
    }

    const user = result.rows[0]
    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_token_expires_at = NULL WHERE id = $2`,
      [hashedPassword, user.id],
    )

    return res.status(200).json({ success: true, data: { message: "Password reset successful" } })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
})

// ✅ RESEND VERIFICATION EMAIL
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      })
    }

    const result = await pool.query(
      `SELECT id, full_name, is_email_verified FROM users WHERE email = $1`,
      [email],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      })
    }

    const user = result.rows[0]

    if (user.is_email_verified) {
      return res.status(400).json({
        success: false,
        error: "Email is already verified",
      })
    }

    const { token, expires } = generateVerificationToken()

    await pool.query(
      `UPDATE users 
       SET verification_token = $1, 
           verification_token_expires_at = $2 
       WHERE id = $3`,
      [token, expires, user.id],
    )

    try {
      await sendVerificationEmail(email, token, user.full_name)
    } catch (emailError: any) {
      console.error("Error sending verification email:", emailError)
    }

    return res.status(200).json({
      success: true,
      data: {
        message: "Verification email sent successfully",
      },
    })
  } catch (error: any) {
    console.error("Resend verification error:", error)
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    })
  }
})

// ✅ GOOGLE SIGNIN / SIGNUP
router.post("/google-signin", async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ success: false, error: "Token is required" })
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID as string
    const client = new OAuth2Client(googleClientId)

    let payload: any = null

    try {
      const ticket = await client.verifyIdToken({ idToken: token, audience: googleClientId })
      payload = (ticket as any).getPayload()
    } catch (idErr) {
      try {
        const info = await client.getTokenInfo(token)
        payload = {
          sub: info.sub,
          email: info.email,
          email_verified: info.email_verified,
        }
      } catch (tokErr) {
        console.error("Google token verification error:", idErr, tokErr)
        return res.status(401).json({ success: false, error: "Failed to verify Google token" })
      }
    }

    const googleId = payload.sub
    const email = payload.email
    const name = payload.name || 
          `${payload.given_name || ''} ${payload.family_name || ''}`.trim() || 
          payload.email.split('@')[0] || 
          "User"
    const emailVerified = payload.email_verified || false

    if (!googleId || !email) {
      return res.status(401).json({ success: false, error: "Invalid authentication token" })
    }

    // Check by google_id first
    const byGoogle = await pool.query("SELECT id, email, full_name FROM users WHERE google_id = $1", [googleId])
    if (byGoogle.rows.length > 0) {
      const user = byGoogle.rows[0]
      // ✅ SET SESSION
      ;(req as any).session.userId = user.id
      return res.status(200).json({ success: true, data: { id: user.id, email: user.email, name: user.full_name, message: "Sign in successful" } })
    }

    // Check by email
    const byEmail = await pool.query("SELECT id, email, full_name, google_id FROM users WHERE email = $1", [email])
    if (byEmail.rows.length > 0) {
      const existing = byEmail.rows[0]
      if (!existing.google_id) {
        await pool.query(
          `UPDATE users SET google_id = $1, is_email_verified = $2, full_name = COALESCE(NULLIF($3, ''), full_name) WHERE id = $4`,
          [googleId, emailVerified, name, existing.id],
        )
        // ✅ SET SESSION
        ;(req as any).session.userId = existing.id
        const updated = (await pool.query("SELECT id, email, full_name FROM users WHERE id = $1", [existing.id])).rows[0]
        return res.status(200).json({ success: true, data: { id: updated.id, email: updated.email, name: updated.full_name, message: "Sign in successful" } })
      } else {
        return res.status(409).json({ success: false, error: "Email already associated with another account" })
      }
    }

    // Create new user
    const create = await pool.query(
      `INSERT INTO users (full_name, email, google_id, is_email_verified, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id, email, full_name`,
      [name, email, googleId],
    )

    const newUser = create.rows[0]
    // ✅ SET SESSION
    ;(req as any).session.userId = newUser.id

    return res.status(201).json({ success: true, data: { id: newUser.id, email: newUser.email, name: newUser.full_name, message: "Sign in successful" } })
  } catch (error: any) {
    console.error("Google signin error:", error)
    return res.status(500).json({ success: false, error: "Internal server error" })
  }
})

// ✅ LOGOUT ROUTE
router.post("/logout", async (req: Request, res: Response) => {
  try {
    // Destroy session
    if ((req as any).session) {
      ;(req as any).session.destroy((err: any) => {
        if (err) {
          console.error("Session destroy error:", err)
        }
      })
    }

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

export default router