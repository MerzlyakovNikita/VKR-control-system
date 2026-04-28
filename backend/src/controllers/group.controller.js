import { db } from '../db/index.js'

export const createGroup = async (req, res) => {
  try {
    const {
      name,
      direction,
      direction_code,
      profile,
      education_form,
      education_level,
      course
    } = req.body

    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    if (
      !name ||
      !direction ||
      !direction_code ||
      !profile ||
      !education_form ||
      !education_level ||
      !course
    ) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    const result = await db.query(
      `INSERT INTO groups 
      (name, direction, direction_code, profile, education_form, education_level, course)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [name, direction, direction_code, profile, education_form, education_level, course]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка добавления группы' })
  }
}

export const getGroups = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM groups ORDER BY name ASC'
    )

    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Ошибка получения групп' })
  }
}

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params

    const {
      name,
      direction,
      direction_code,
      profile,
      education_form,
      education_level,
      course
    } = req.body

    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    if (
      !name ||
      !direction ||
      !direction_code ||
      !profile ||
      !education_form ||
      !education_level ||
      !course
    ) {
      return res.status(400).json({ error: 'Все поля обязательны' })
    }

    const result = await db.query(
      `UPDATE groups
       SET 
         name = $1,
         direction = $2,
         direction_code = $3,
         profile = $4,
         education_form = $5,
         education_level = $6,
         course = $7
       WHERE id = $8
       RETURNING *`,
      [name, direction, direction_code, profile, education_form, education_level, course, id]
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