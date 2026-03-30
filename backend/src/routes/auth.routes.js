import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../db/index.js'

const router = Router()

router.post('/register', async (req, res) => {
  try {
    const {
      email,
      phone,
      password,
      lastName,
      firstName,
      middleName,
    } = req.body

    // проверка
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Не все поля заполнены' })
    }

    // проверка существования
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existing.rows.length) {
      return res.status(400).json({ message: 'Email уже используется' })
    }

    // хеш пароля
    const hash = await bcrypt.hash(password, 10)

    // создание пользователя
    const result = await db.query(
      `INSERT INTO users (
        email, phone, password_hash, role,
        last_name, first_name, middle_name
      )
      VALUES ($1, $2, $3, 'STUDENT', $4, $5, $6)
      RETURNING id, email, role`,
      [email, phone, hash, lastName, firstName, middleName]
    )

    const user = result.rows[0]

    // токен
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({ token, user })

  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(400).json({ message: 'Пользователь не найден' })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный пароль' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    )

    res.json({ token })

  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
})

export default router