import { db } from '../db/index.js'
import { getCurrentGraduationYear } from '../shared/graduationYear.js'

export const getCurrentYear = (_req, res) => {
  res.json({ year: getCurrentGraduationYear() })
}

export const createGroup = async (req, res) => {
  try {
    const isSecretary = req.user.roles?.includes('SECRETARY')
    const isPracticeSupervisor = req.user.roles?.includes('PRACTICE_SUPERVISOR')
    if (!isSecretary && !isPracticeSupervisor) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const { name, direction_id, profile_id, education_form, course, graduation_year } = req.body

    if (!name || !direction_id || !education_form || !course || !graduation_year) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' })
    }

    const existing = await db.query('SELECT id FROM groups WHERE name = $1', [name])
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'Группа с таким названием уже существует' })
    }

    const result = await db.query(
      `INSERT INTO groups (direction_id, profile_id, education_form, name, course, graduation_year)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [direction_id, profile_id || null, education_form, name, course, graduation_year],
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка добавления группы' })
  }
}

export const getGroups = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        g.id,
        g.name,
        g.course,
        g.education_form,
        g.graduation_year,
        g.direction_id,
        g.profile_id,
        d.code  AS direction_code,
        d.name  AS direction_name,
        d.education_level,
        p.name  AS profile_name
      FROM groups g
      JOIN directions d ON d.id = g.direction_id
      LEFT JOIN profiles p ON p.id = g.profile_id
      ORDER BY g.name ASC
    `)
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка получения групп' })
  }
}

export const updateGroup = async (req, res) => {
  try {
    const isSecretary = req.user.roles?.includes('SECRETARY')
    const isPracticeSupervisor = req.user.roles?.includes('PRACTICE_SUPERVISOR')
    if (!isSecretary && !isPracticeSupervisor) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const { id } = req.params
    const { name, direction_id, profile_id, education_form, course, graduation_year } = req.body

    if (!name || !direction_id || !education_form || !course || !graduation_year) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' })
    }

    const result = await db.query(
      `UPDATE groups
       SET name = $1, direction_id = $2, profile_id = $3,
           education_form = $4, course = $5, graduation_year = $6
       WHERE id = $7
       RETURNING *`,
      [name, direction_id, profile_id || null, education_form, course, graduation_year, id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Группа не найдена' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка обновления группы' })
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const isSecretary = req.user.roles?.includes('SECRETARY')
    const isPracticeSupervisor = req.user.roles?.includes('PRACTICE_SUPERVISOR')
    if (!isSecretary && !isPracticeSupervisor) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    await db.query('DELETE FROM groups WHERE id = $1', [req.params.id])
    res.json({ message: 'Группа удалена' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления группы' })
  }
}

export const getGroupById = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT g.id, g.name, g.course, g.education_form,
             d.code AS direction_code, d.name AS direction_name, d.education_level,
             p.name AS profile_name
      FROM groups g
      JOIN directions d ON d.id = g.direction_id
      LEFT JOIN profiles p ON p.id = g.profile_id
      WHERE g.id = $1
    `,
      [req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Группа не найдена' })
    }

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения группы' })
  }
}

export const getGroupStudents = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        s.id,
        s.last_name,
        s.first_name,
        s.middle_name,
        s.phone,
        s.email,
        v.topic,
        v.status,
        v.practice_place,
        v.company_supervisor,
        u.last_name  AS supervisor_last_name,
        u.first_name AS supervisor_first_name,
        u.middle_name AS supervisor_middle_name
      FROM students s
      LEFT JOIN vkr v ON v.student_id = s.id
      LEFT JOIN users u ON u.id = v.supervisor_id
      WHERE s.group_id = $1
      ORDER BY s.last_name
    `,
      [req.params.id],
    )

    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения данных группы' })
  }
}
