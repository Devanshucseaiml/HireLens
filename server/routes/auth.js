import { Router } from 'express'
import { createUser, findUserByEmail, verifyPassword, getUserById } from '../services/user.service.js'
import { generateToken, authMiddleware } from '../middleware/auth.js'
import logger from '../utils/logger.js'

const router = Router()

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const user = await createUser(email, password)
    const token = generateToken(user.id)

    logger.info(`User registered: ${email}`)

    res.status(201).json({
      user,
      token,
      message: 'User registered successfully',
    })
  } catch (err) {
    logger.error(`Register error: ${err.message}`)
    res.status(400).json({ error: err.message })
  }
})

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const isPasswordValid = await verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user.id)
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
    }

    logger.info(`User logged in: ${email}`)

    res.status(200).json({
      user: userWithoutPassword,
      token,
      message: 'Logged in successfully',
    })
  } catch (err) {
    logger.error(`Login error: ${err.message}`)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = getUserById(req.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.status(200).json({ user })
  } catch (err) {
    logger.error(`Get user error: ${err.message}`)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// ── POST /api/auth/logout ────────────────────────────────────
router.post('/logout', authMiddleware, (req, res) => {
  // JWT logout is handled client-side (token deletion)
  // This endpoint can be used for additional cleanup if needed
  logger.info(`User logged out: ${req.userId}`)
  res.status(200).json({ message: 'Logged out successfully' })
})

export default router
