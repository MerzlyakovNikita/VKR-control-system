import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'
import { capitalize, normalizePhone, normalizeEmail } from '../shared/normalize.js'

export const register = async (req, res) => {
  try {
    const { email, phone, password, lastName, firstName, middleName } = req.body

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Не все обязательные поля заполнены' })
    }

    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ message: 'Некорректный email' })
    }

    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (existing.rows.length) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' })
    }

    const hash = await bcrypt.hash(password, 10)

    await db.query(
      `INSERT INTO users (email, phone, password_hash, last_name, first_name, middle_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        normalizedEmail,
        normalizePhone(phone),
        hash,
        capitalize(lastName),
        capitalize(firstName),
        capitalize(middleName),
      ],
    )

    res.json({ message: 'Заявка отправлена. Ожидайте подтверждения секретаря кафедры.' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await db.query('SELECT * FROM users WHERE email = $1', [normalizeEmail(email)])
    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный пароль' })
    }

    const rolesResult = await db.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id])
    const roles = rolesResult.rows.map((r) => r.role)

    if (roles.length === 0) {
      return res.status(403).json({ message: 'Ваша заявка ещё не одобрена секретарём кафедры' })
    }

    const token = jwt.sign({ id: user.id, roles }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '14d',
    })

    res.json({ token, user: { id: user.id, email: user.email, roles } })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const refresh = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Нет токена' })
  try {
    const { id, roles } = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    const newToken = jwt.sign({ id, roles }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '14d',
    })
    res.json({ token: newToken })
  } catch {
    res.status(401).json({ message: 'Токен недействителен' })
  }
}
