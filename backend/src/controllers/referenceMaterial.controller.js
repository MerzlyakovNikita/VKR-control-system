import { db } from '../db/index.js'
import iconv from 'iconv-lite'
import path from 'path'
import fs from 'fs'

export const getAllMaterials = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM reference_materials ORDER BY name ASC`)

    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка получения материалов' })
  }
}

export const createMultipleMaterials = async (req, res) => {
  try {
    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const files = req.files
    const { folder_id } = req.body

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Файлы не загружены' })
    }

    const uploaded = []
    const skipped = []

    for (const file of files) {
      const originalName = iconv.decode(Buffer.from(file.originalname, 'latin1'), 'utf8')

      const exists = await db.query(
        `
        SELECT id FROM reference_materials
        WHERE name = $1
        AND folder_id IS NOT DISTINCT FROM $2::uuid
        `,
        [originalName, folder_id || null],
      )

      if (exists.rowCount > 0) {
        fs.unlinkSync(path.resolve('uploads', file.filename))
        skipped.push(originalName)
        continue
      }

      await db.query(
        `
        INSERT INTO reference_materials
        (name, file_name, published_at, created_by, folder_id)
        VALUES ($1, $2, NOW(), $3, $4)
        `,
        [originalName, file.filename, req.user.id, folder_id || null],
      )

      uploaded.push(originalName)
    }

    res.json({
      uploaded,
      skipped,
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки' })
  }
}

export const downloadMaterial = async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM reference_materials WHERE id = $1`, [
      req.params.id,
    ])

    const file = result.rows[0]

    if (!file) {
      return res.status(404).json({ message: 'Файл не найден' })
    }

    const filePath = path.resolve('uploads', file.file_name)

    res.download(filePath, file.name)
  } catch (e) {
    res.status(500).json({ message: 'Ошибка скачивания' })
  }
}

export const deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'SECRETARY') {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params

    const result = await db.query(`SELECT * FROM reference_materials WHERE id = $1`, [id])

    const file = result.rows[0]

    if (!file) {
      return res.status(404).json({ message: 'Файл не найден' })
    }

    const filePath = path.resolve('uploads', file.file_name)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    await db.query(`DELETE FROM reference_materials WHERE id = $1`, [id])

    res.json({ message: 'Файл удалён' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка удаления файла' })
  }
}
