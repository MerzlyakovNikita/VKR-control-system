import { db } from '../db/index.js'

export const getMyThesis = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM thesis WHERE student_id = $1`,
      [req.user.id]
    )

    res.json(result.rows[0] || null)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения ВКР' })
  }
}

export const saveThesis = async (req, res) => {
  try {
    const {
      topic,
      practice_place,
      company_supervisor_name,
      supervisor_name
    } = req.body

    if (!topic) {
      return res.status(400).json({ message: 'Тема обязательна' })
    }

    const existing = await db.query(
      `SELECT id FROM thesis WHERE student_id = $1`,
      [req.user.id]
    )

    if (existing.rowCount > 0) {
      const result = await db.query(
        `UPDATE thesis
         SET topic = $1,
             practice_place = $2,
             company_supervisor_name = $3,
             supervisor_name = $4,
             version = version + 1,
             updated_at = NOW()
         WHERE student_id = $5
         RETURNING *`,
        [
          topic,
          practice_place,
          company_supervisor_name,
          supervisor_name,
          req.user.id
        ]
      )

      return res.json(result.rows[0])
    }

    const result = await db.query(
      `INSERT INTO thesis
       (
         topic,
         practice_place,
         company_supervisor_name,
         supervisor_name,
         status,
         version,
         created_at,
         updated_at,
         student_id
       )
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW(),$7)
       RETURNING *`,
      [
        topic,
        practice_place,
        company_supervisor_name,
        supervisor_name,
        'DRAFT',
        1,
        req.user.id
      ]
    )

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сохранения ВКР' })
  }
}