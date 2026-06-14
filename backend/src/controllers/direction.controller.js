import { db } from '../db/index.js'

export const getDirections = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        d.id, d.code, d.name, d.education_level,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'name', p.name) ORDER BY p.name)
          FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) AS profiles
      FROM directions d
      LEFT JOIN profiles p ON p.direction_id = d.id
      GROUP BY d.id
      ORDER BY d.code
    `)
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки направлений' })
  }
}

export const createDirection = async (req, res) => {
  try {
    const { code, name, education_level, profiles = [] } = req.body
    if (!code?.trim() || !name?.trim() || !education_level) {
      return res.status(400).json({ message: 'Код, название и уровень образования обязательны' })
    }
    const { rows: [dir] } = await db.query(
      'INSERT INTO directions (code, name, education_level) VALUES ($1, $2, $3) RETURNING id',
      [code.trim(), name.trim(), education_level],
    )
    for (const profileName of profiles) {
      if (profileName?.trim()) {
        await db.query('INSERT INTO profiles (direction_id, name) VALUES ($1, $2)', [dir.id, profileName.trim()])
      }
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка создания направления' })
  }
}

export const updateDirection = async (req, res) => {
  try {
    const { code, name, education_level } = req.body
    if (!code?.trim() || !name?.trim() || !education_level) {
      return res.status(400).json({ message: 'Код, название и уровень образования обязательны' })
    }
    await db.query(
      'UPDATE directions SET code = $1, name = $2, education_level = $3 WHERE id = $4',
      [code.trim(), name.trim(), education_level, req.params.id],
    )
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления направления' })
  }
}

export const deleteDirection = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM groups WHERE direction_id = $1', [req.params.id])
    if (Number(rows[0].count) > 0) {
      return res.status(400).json({ message: 'Направление используется в учебных группах — удаление невозможно' })
    }
    await db.query('DELETE FROM profiles WHERE direction_id = $1', [req.params.id])
    await db.query('DELETE FROM directions WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления направления' })
  }
}

export const getProfiles = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM profiles WHERE direction_id = $1 ORDER BY name', [
      req.params.id,
    ])
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки профилей' })
  }
}

export const createProfile = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Название профиля обязательно' })
    await db.query('INSERT INTO profiles (direction_id, name) VALUES ($1, $2)', [req.params.id, name.trim()])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка добавления профиля' })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Название профиля обязательно' })
    await db.query('UPDATE profiles SET name = $1 WHERE id = $2', [name.trim(), req.params.profileId])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления профиля' })
  }
}

export const deleteProfile = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT COUNT(*) FROM groups WHERE profile_id = $1', [req.params.profileId])
    if (Number(rows[0].count) > 0) {
      return res.status(400).json({ message: 'Профиль используется в учебных группах — удаление невозможно' })
    }
    await db.query('DELETE FROM profiles WHERE id = $1', [req.params.profileId])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления профиля' })
  }
}
