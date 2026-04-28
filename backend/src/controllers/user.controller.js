import { db } from '../db/index.js'

export const getMe = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        id,
        email,
        role,
        last_name,
        first_name,
        middle_name,
        phone,
        group_id
       FROM users
       WHERE id = $1`,
      [req.user.id]
    )

    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' })
  }
}

export const updateMe = async (req, res) => {
  try {
    const { group_id } = req.body

    const result = await db.query(
      `
      UPDATE users
      SET group_id = $1
      WHERE id = $2
      RETURNING id, group_id
      `,
      [group_id, req.user.id]
    )

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления пользователя' })
  }
}