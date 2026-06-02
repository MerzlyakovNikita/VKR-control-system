import bcrypt from 'bcrypt'
import { db } from '../db/index.js'
import { capitalize, normalizePhone, normalizeEmail } from '../shared/normalize.js'

export const getMe = async (req, res) => {
  try {
    const userResult = await db.query(
      `SELECT id, email, last_name, first_name, middle_name, phone, degree, position
       FROM users WHERE id = $1`,
      [req.user.id],
    )

    const rolesResult = await db.query(`SELECT role FROM user_roles WHERE user_id = $1`, [
      req.user.id,
    ])

    const user = userResult.rows[0]
    user.roles = rolesResult.rows.map((r) => r.role)

    res.json(user)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const { degree, position } = req.body

    const last_name = capitalize(req.body.last_name)
    const first_name = capitalize(req.body.first_name)
    const middle_name = capitalize(req.body.middle_name)
    const email = normalizeEmail(req.body.email)
    const phone = normalizePhone(req.body.phone)

    const result = await db.query(
      `UPDATE users
       SET last_name = $1, first_name = $2, middle_name = $3,
           email = $4, phone = $5, degree = $6, position = $7
       WHERE id = $8
       RETURNING id, email, last_name, first_name, middle_name, phone, degree, position`,
      [
        last_name,
        first_name,
        middle_name,
        email,
        phone,
        degree || null,
        position || null,
        req.user.id,
      ],
    )

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления профиля' })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Все поля обязательны' })
    }

    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const isMatch = await bcrypt.compare(current_password, result.rows[0].password_hash)
    if (!isMatch) {
      return res.status(400).json({ message: 'Неверный текущий пароль' })
    }

    const hash = await bcrypt.hash(new_password, 10)
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id])

    res.json({ message: 'Пароль изменён' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const getPendingUsers = async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const result = await db.query(`
      SELECT u.id, u.email, u.phone, u.last_name, u.first_name, u.middle_name,
             u.degree, u.position
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE ur.id IS NULL
      ORDER BY u.id ASC
    `)

    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения списка заявок' })
  }
}

export const approveUser = async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params
    const { roles } = req.body

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: 'Укажите хотя бы одну роль' })
    }

    const user = await db.query('SELECT id FROM users WHERE id = $1', [id])
    if (user.rowCount === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' })
    }

    for (const role of roles) {
      await db.query(
        'INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, role],
      )
    }

    res.json({ message: 'Пользователь одобрен' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка одобрения пользователя' })
  }
}

export const rejectUser = async (req, res) => {
  try {
    if (!req.user.roles?.includes('SECRETARY')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params

    await db.query('DELETE FROM users WHERE id = $1', [id])

    res.json({ message: 'Заявка отклонена' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка отклонения заявки' })
  }
}
