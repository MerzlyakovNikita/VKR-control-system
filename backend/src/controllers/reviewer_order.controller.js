import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'
import { getCurrentGraduationYear } from '../shared/graduationYear.js'
import { DEGREE_GEN, POSITION_GEN, getCourse } from '../shared/constants.js'
import { toAccusative, declineWorkplace } from '../shared/declension.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = resolve(__dirname, '../templates/reviewer_order.template.docx')

export const getReviewerOrderDocument = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || getCurrentGraduationYear()

    const { rows } = await db.query(
      `SELECT DISTINCT
         d.id AS direction_id,
         d.code, d.name AS direction_name, d.education_level,
         g.education_form,
         r.id AS reviewer_id,
         r.last_name, r.first_name, r.middle_name,
         r.degree, r.position, r.workplace,
         CASE d.education_level WHEN 'MASTER' THEN 0 ELSE 1 END AS edu_order
       FROM students s
       JOIN groups g ON g.id = s.group_id
       JOIN directions d ON d.id = g.direction_id
       JOIN reviewers r ON r.id = s.reviewer_id
       WHERE g.graduation_year = $1 AND r.is_active = true
       ORDER BY edu_order, d.code, g.education_form, r.last_name, r.first_name`,
      [year],
    )

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Нет назначенных рецензентов за этот год' })
    }

    const sectionsMap = new Map()
    for (const row of rows) {
      const key = `${row.direction_id}_${row.education_form}`
      if (!sectionsMap.has(key)) {
        sectionsMap.set(key, {
          code: row.code,
          direction_name: row.direction_name,
          education_level: row.education_level,
          education_form: row.education_form,
          reviewers: [],
        })
      }
      const sec = sectionsMap.get(key)
      if (!sec.reviewers.find((r) => r.reviewer_id === row.reviewer_id)) {
        sec.reviewers.push(row)
      }
    }

    const sections = [...sectionsMap.values()].map((sec, idx) => {
      const isMaster = sec.education_level === 'MASTER'
      const programType = isMaster ? 'магистратуры' : 'бакалавриата'
      const workType = isMaster ? '(магистерских диссертаций) ' : ''
      const course = getCourse(sec.education_level, sec.education_form)

      return {
        section_num: idx + 1,
        direction_header:
          `Утвердить рецензентами выпускных квалификационных работ ${workType}` +
          `студентов ${course} курса электротехнического факультета обучающихся по ` +
          `программе ${programType} направления подготовки ${sec.code} ${sec.direction_name}:`,
        reviewers: sec.reviewers.map((r, rIdx) => {
          const fio = toAccusative(r.last_name, r.first_name, r.middle_name)
          const parts = [fio]
          if (r.degree) parts.push(DEGREE_GEN[r.degree] ?? r.degree)
          const posWork = [POSITION_GEN[r.position], declineWorkplace(r.workplace)]
            .filter(Boolean)
            .join(' ')
          if (posWork) parts.push(posWork)
          return {
            num: rIdx + 1,
            fio_and_details: parts.join(', '),
            sep: rIdx === sec.reviewers.length - 1 ? '.' : ',',
          }
        }),
      }
    })

    const content = readFileSync(TEMPLATE_PATH, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    doc.render({ sections })

    const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })

    const filename = `Приказ_рецензенты_${year}.docx`
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
    res.status(500).json({ message: 'Ошибка формирования приказа' })
  }
}
