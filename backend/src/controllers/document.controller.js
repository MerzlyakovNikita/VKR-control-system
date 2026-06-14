import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = resolve(__dirname, '../templates/direction.template.docx')

export const getReviewDirectionTemplate = async (req, res) => {
  try {
    const { studentId } = req.params

    const { rows, rowCount } = await db.query(
      `SELECT s.last_name, s.first_name, s.middle_name,
              s.reviewer_assigned_at,
              v.topic,
              d.name AS direction_name,
              rv.last_name   AS reviewer_last_name,
              rv.first_name  AS reviewer_first_name,
              rv.middle_name AS reviewer_middle_name,
              rv.email AS reviewer_email,
              rv.phone AS reviewer_phone
       FROM students s
       LEFT JOIN vkr v        ON v.student_id = s.id
       LEFT JOIN groups g     ON g.id = s.group_id
       LEFT JOIN directions d ON d.id = g.direction_id
       LEFT JOIN reviewers rv ON rv.id = s.reviewer_id
       WHERE s.id = $1`,
      [studentId],
    )

    if (rowCount === 0) return res.status(404).json({ message: 'Студент не найден' })
    const row = rows[0]
    if (!row.reviewer_last_name) return res.status(400).json({ message: 'Рецензент не назначен' })

    const headRows = await db.query(
      `SELECT u.last_name, u.first_name, u.middle_name
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE ur.role = 'HEAD_OF_DEPARTMENT'
       ORDER BY u.id LIMIT 1`,
    )
    const head = headRows.rows[0]

    const assignedAt = row.reviewer_assigned_at
      ? new Date(row.reviewer_assigned_at).toLocaleDateString('ru-RU', {
          day: '2-digit', month: 'long', year: 'numeric',
        })
      : '___'

    const data = {
      reviewerFio: [row.reviewer_last_name, row.reviewer_first_name, row.reviewer_middle_name]
        .filter(Boolean)
        .join(' '),
      contacts: [row.reviewer_phone, row.reviewer_email].filter(Boolean).join(', '),
      studentFio: [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' '),
      directionName: row.direction_name || '',
      topic: row.topic || '',
      headShort: head
        ? `${head.first_name?.[0] ?? ''}.${head.middle_name?.[0] ?? ''}. ${head.last_name}`
        : '___',
      assignedAt,
    }

    const content = readFileSync(TEMPLATE_PATH, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    doc.render(data)

    const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

    const nameSlug = `${row.last_name}${row.first_name?.[0] ?? ''}${row.middle_name?.[0] ?? ''}`
    const filename = `Направление_tmpl_${nameSlug}.docx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    )
    res.send(buffer)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка формирования документа (template)' })
  }
}
