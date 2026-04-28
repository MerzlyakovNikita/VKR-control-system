import { db } from '../db/index.js'
import path from 'path'
import fs from 'fs'

export const createFolder = async (req, res) => {
  try {
    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { name, parent_id } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Название обязательно' })
    }

    const existing = await db.query(
      `
      SELECT * FROM folders
      WHERE name = $1
      AND parent_id IS NOT DISTINCT FROM $2::uuid
      `,
      [name, parent_id || null],
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: 'Папка с таким названием уже существует',
      })
    }

    const result = await db.query(
      `INSERT INTO folders (name, parent_id)
       VALUES ($1, $2)
       RETURNING *`,
      [name, parent_id || null],
    )

    res.json(result.rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка создания папки' })
  }
}

export const getFolders = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM folders ORDER BY created_at`)

    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ message: 'Ошибка получения папок' })
  }
}

export const deleteFolder = async (req, res) => {
  try {
    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params

    const files = await db.query(
      `
      WITH RECURSIVE subfolders AS (
        SELECT id FROM folders WHERE id = $1::uuid
        UNION ALL
        SELECT f.id
        FROM folders f
        JOIN subfolders sf ON f.parent_id = sf.id
      )
      SELECT file_name FROM reference_materials
      WHERE folder_id IN (SELECT id FROM subfolders)
      `,
      [id],
    )

    for (const file of files.rows) {
      const filePath = path.resolve('uploads', file.file_name)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await db.query('DELETE FROM folders WHERE id = $1::uuid', [id])

    res.json({ message: 'Папка удалена' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления папки' })
  }
}
