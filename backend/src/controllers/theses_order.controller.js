import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { db } from '../db/index.js'
import { getCurrentGraduationYear } from '../shared/graduationYear.js'
import { DEGREE_SHORT, POSITION_NOM } from '../shared/constants.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = resolve(__dirname, '../templates/theses_order.template.docx')

export const getThesesOrderDocument = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || getCurrentGraduationYear()

    const { rows } = await db.query(
      `SELECT
         s.last_name, s.first_name, s.middle_name,
         v.topic,
         g.id          AS group_id,
         g.name        AS group_name,
         g.course,
         g.education_form,
         d.code        AS direction_code,
         d.name        AS direction_name,
         d.education_level,
         p.name        AS profile_name,
         u.id          AS sup_id,
         u.last_name   AS sup_last,
         u.first_name  AS sup_first,
         u.middle_name AS sup_middle,
         u.degree      AS sup_degree,
         u.position    AS sup_position
       FROM students s
       JOIN groups g    ON g.id = s.group_id
       JOIN directions d ON d.id = g.direction_id
       LEFT JOIN profiles p ON p.id = g.profile_id
       JOIN vkr v       ON v.student_id = s.id
       JOIN users u     ON u.id = v.supervisor_id
       WHERE g.graduation_year = $1
         AND v.topic IS NOT NULL
       ORDER BY
         CASE g.education_form WHEN 'FULL_TIME' THEN 0 ELSE 1 END,
         CASE d.education_level WHEN 'BACHELOR' THEN 0 ELSE 1 END,
         d.code, g.name,
         u.last_name, u.first_name,
         s.last_name, s.first_name`,
      [year],
    )

    if (rows.length === 0) {
      return res
        .status(400)
        .json({ message: 'Нет студентов с назначенными руководителями и темами' })
    }

    const groupsMap = new Map()
    for (const row of rows) {
      if (!groupsMap.has(row.group_id)) {
        groupsMap.set(row.group_id, {
          group_name: row.group_name,
          course: row.course,
          education_form: row.education_form,
          education_level: row.education_level,
          direction_code: row.direction_code,
          direction_name: row.direction_name,
          profile_name: row.profile_name,
          supervisors: new Map(),
        })
      }
      const group = groupsMap.get(row.group_id)
      if (!group.supervisors.has(row.sup_id)) {
        group.supervisors.set(row.sup_id, {
          sup_last: row.sup_last,
          sup_first: row.sup_first,
          sup_middle: row.sup_middle,
          sup_degree: row.sup_degree,
          sup_position: row.sup_position,
          students: [],
        })
      }
      group.supervisors.get(row.sup_id).students.push({
        last_name: row.last_name,
        first_name: row.first_name,
        middle_name: row.middle_name,
        topic: row.topic,
      })
    }

    const buildSection = (group, sectionNum) => {
      const formText = group.education_form === 'FULL_TIME' ? 'очной' : 'заочной'
      const programText = group.education_level === 'MASTER' ? 'магистратуры' : 'бакалавриата'
      const profilePart = group.profile_name ? ` (профиль: ${group.profile_name})` : ''

      const section_header =
        `Утвердить темы и руководителей выпускных квалификационных работ студентам ` +
        `${group.course} курса ЭТФ ${formText} формы, обучающимся по программе ${programText}, ` +
        `направление подготовки ${group.direction_code} ${group.direction_name}${profilePart}, ` +
        `группа `
      const group_name = group.group_name

      const supervisors = [...group.supervisors.values()].map((sup) => {
        const fio = [sup.sup_last.toUpperCase(), sup.sup_first, sup.sup_middle]
          .filter(Boolean)
          .join(' ')
        const degreeStr = sup.sup_degree ? (DEGREE_SHORT[sup.sup_degree] ?? null) : null
        const posStr = sup.sup_position
          ? (POSITION_NOM[sup.sup_position] ?? sup.sup_position)
          : null
        const parts = [fio]
        if (degreeStr) parts.push(degreeStr)
        parts.push([posStr, 'кафедры ИТАС'].filter(Boolean).join(' '))

        return {
          supervisor_name: parts.join(', ') + '.',
          students: sup.students.map((st, sIdx) => ({
            student_num: sIdx + 1,
            student_name: [st.last_name, st.first_name, st.middle_name]
              .filter(Boolean)
              .join(' ')
              .toUpperCase(),
            topic: st.topic,
          })),
        }
      })

      return { section_num: sectionNum, section_header, group_name, supervisors }
    }

    const allGroups = [...groupsMap.values()]
    const fullTime = allGroups.filter((g) => g.education_form === 'FULL_TIME')
    const partTime = allGroups.filter((g) => g.education_form !== 'FULL_TIME')

    let sectionNum = 0
    const form_blocks = []

    if (fullTime.length > 0) {
      form_blocks.push({
        form_label: 'Очная форма',
        sections: fullTime.map((g) => buildSection(g, ++sectionNum)),
      })
    }
    if (partTime.length > 0) {
      form_blocks.push({
        form_label: 'Заочная форма',
        sections: partTime.map((g) => buildSection(g, ++sectionNum)),
      })
    }

    const content = readFileSync(TEMPLATE_PATH, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    doc.render({ form_blocks })

    const buffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    const filename = `Приказ_темы_${year}.docx`
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
