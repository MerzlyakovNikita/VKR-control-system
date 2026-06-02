import { db } from '../db/index.js'
import { normalizePhone } from '../shared/normalize.js'

export const getAllTheses = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.last_name,
        s.first_name,
        s.middle_name,
        s.email,
        s.phone,
        v.id         AS thesis_id,
        v.topic,
        v.status,
        v.practice_place,
        v.company_supervisor,
        g.id         AS group_id,
        g.name       AS group_name,
        g.course,
        g.education_form,
        d.code       AS direction_code,
        d.name       AS direction_name,
        d.education_level,
        p.name       AS profile_name,
        u.last_name    AS supervisor_last_name,
        u.first_name   AS supervisor_first_name,
        u.middle_name  AS supervisor_middle_name,
        u.degree       AS supervisor_degree,
        u.position     AS supervisor_position,
        s.defense_date_id,
        dd.defense_date,
        rv.id          AS reviewer_id,
        rv.last_name   AS reviewer_last_name,
        rv.first_name  AS reviewer_first_name,
        rv.middle_name AS reviewer_middle_name,
        req.resolved_at
      FROM students s
      LEFT JOIN vkr v            ON v.student_id = s.id
      LEFT JOIN groups g         ON g.id = s.group_id
      LEFT JOIN directions d     ON d.id = g.direction_id
      LEFT JOIN profiles p       ON p.id = g.profile_id
      LEFT JOIN users u          ON u.id = v.supervisor_id
      LEFT JOIN reviewers rv     ON rv.student_id = s.id
      LEFT JOIN defense_dates dd ON dd.id = s.defense_date_id
      LEFT JOIN LATERAL (
        SELECT resolved_at FROM vkr_requests
        WHERE vkr_id = v.id AND resolved_at IS NOT NULL
        ORDER BY resolved_at DESC LIMIT 1
      ) req ON true
      ORDER BY g.name, s.last_name
    `)
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения списка тем ВКР' })
  }
}

export const getMyThesis = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM vkr WHERE student_id = $1`, [req.user.id])
    res.json(result.rows[0] || null)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения ВКР' })
  }
}

export const deleteStudent = async (req, res) => {
  try {
    await db.query('DELETE FROM students WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления студента' })
  }
}

export const updateStudentAndThesis = async (req, res) => {
  try {
    const { id } = req.params
    const { last_name, first_name, middle_name, email, phone, topic, practice_place, company_supervisor, defense_date_id } = req.body

    await db.query(
      `UPDATE students SET last_name=$1, first_name=$2, middle_name=$3, email=$4, phone=$5, defense_date_id=$6 WHERE id=$7`,
      [last_name, first_name, middle_name || null, email || null, normalizePhone(phone), defense_date_id || null, id],
    )

    await db.query(
      `UPDATE vkr SET topic=$1, practice_place=$2, company_supervisor=$3, updated_at=NOW()
       WHERE student_id=$4`,
      [topic || null, practice_place || null, company_supervisor || null, id],
    )

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления данных студента' })
  }
}

export const saveThesis = async (req, res) => {
  try {
    const { topic, practice_place, company_supervisor } = req.body

    if (!topic) {
      return res.status(400).json({ message: 'Тема обязательна' })
    }

    const existing = await db.query(`SELECT id FROM vkr WHERE student_id = $1`, [req.user.id])

    if (existing.rowCount > 0) {
      const result = await db.query(
        `UPDATE vkr
         SET topic = $1, practice_place = $2, company_supervisor = $3, updated_at = NOW()
         WHERE student_id = $4
         RETURNING *`,
        [topic, practice_place, company_supervisor, req.user.id],
      )
      return res.json(result.rows[0])
    }

    const result = await db.query(
      `INSERT INTO vkr (student_id, topic, practice_place, company_supervisor, status)
       VALUES ($1, $2, $3, $4, 'UNASSIGNED')
       RETURNING *`,
      [req.user.id, topic, practice_place, company_supervisor],
    )

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка сохранения ВКР' })
  }
}
