import fs from 'fs'
import path from 'path'
import bcryptjs from 'bcryptjs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.resolve(__dirname, '../data/users.json')

const ensureDataDir = () => {
  const dataDir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

const readUsers = () => {
  ensureDataDir()
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]))
  }
  const data = fs.readFileSync(USERS_FILE, 'utf8')
  return JSON.parse(data || '[]')
}

const writeUsers = (users) => {
  ensureDataDir()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export const createUser = async (email, password) => {
  const users = readUsers()
  const existing = users.find((u) => u.email === email)
  
  if (existing) {
    throw new Error('User already exists')
  }

  const hashedPassword = await bcryptjs.hash(password, 10)
  const user = {
    id: Date.now().toString(),
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  writeUsers(users)
  
  return { id: user.id, email: user.email }
}

export const findUserByEmail = async (email) => {
  const users = readUsers()
  return users.find((u) => u.email === email) || null
}

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcryptjs.compare(plainPassword, hashedPassword)
}

export const getUserById = (id) => {
  const users = readUsers()
  const user = users.find((u) => u.id === id)
  if (user) {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  return null
}
