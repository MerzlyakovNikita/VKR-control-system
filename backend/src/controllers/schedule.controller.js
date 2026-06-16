import PizZip from 'pizzip'
import multer from 'multer'
import XLSX from 'xlsx'
import { db } from '../db/index.js'
import { getCurrentGraduationYear } from '../shared/graduationYear.js'

export const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file')

function getCellText(cellXml) {
  return [...cellXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join('')
    .trim()
}

function parseDocx(buffer) {
  const zip = new PizZip(buffer)
  const xml = zip.files['word/document.xml'].asText()

  const tblStart = xml.indexOf('<w:tbl>')
  if (tblStart === -1) throw new Error('Таблица не найдена в документе')
  const tblEnd = xml.indexOf('</w:tbl>', tblStart) + 8
  const tableXml = xml.slice(tblStart, tblEnd)

  const entries = []

  let rowCount = 0
  for (const rowMatch of tableXml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)) {
    const cells = [...rowMatch[0].matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map((m) =>
      getCellText(m[0]),
    )

    if (cells.length < 9) continue
    if (!['К', 'ГЭ', 'ВКР'].includes(cells[5])) continue

    rowCount++
    if (cells[5] !== 'ВКР') continue

    const dateParts = cells[6].split('.')
    if (dateParts.length !== 3) continue

    const month = parseInt(dateParts[1], 10)
    if (![5, 6, 7].includes(month)) continue

    const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]

    entries.push({
      group: cells[4].trim(),
      capacity: parseInt(cells[3], 10) || null,
      date: `${year}-${dateParts[1]}-${dateParts[0]}`,
      time: cells[7].trim(),
      room: cells[8].trim(),
    })
  }

  return entries
}

export const importSchedule = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Файл не загружен' })

    let entries
    try {
      entries = parseDocx(req.file.buffer)
    } catch (e) {
      return res.status(400).json({ message: e.message })
    }

    if (entries.length === 0) {
      return res.status(400).json({ message: 'Не найдено строк с защитой ВКР в мае-июле' })
    }

    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {}
    for (const e of entries) {
      if (mapping[e.group]) e.group = mapping[e.group]
    }

    const scheduleYear = parseInt(entries[0].date.slice(0, 4), 10)

    const groupNames = [...new Set(entries.map((e) => e.group))]
    const { rows: foundGroups } = await db.query(
      'SELECT id, name FROM groups WHERE name = ANY($1) AND graduation_year = $2',
      [groupNames, scheduleYear],
    )

    const missing = groupNames.filter((n) => !foundGroups.some((g) => g.name === n))
    if (missing.length > 0) {
      return res.status(400).json({ message: 'Группы не найдены в системе', missing, scheduleYear })
    }

    const groupMap = Object.fromEntries(foundGroups.map((g) => [g.name, g.id]))
    const groupIds = foundGroups.map((g) => g.id)

    const { rows: existingDates } = await db.query(
      `SELECT id, group_id, to_char(defense_date, 'YYYY-MM-DD') AS defense_date
       FROM defense_dates WHERE group_id = ANY($1)`,
      [groupIds],
    )

    const fileKeys = new Set(entries.map((e) => `${groupMap[e.group]}_${e.date}`))
    const staleIds = existingDates
      .filter((d) => !fileKeys.has(`${d.group_id}_${d.defense_date}`))
      .map((d) => d.id)

    let removed = 0
    if (staleIds.length > 0) {
      await db.query('DELETE FROM defense_dates WHERE id = ANY($1)', [staleIds])
      removed = staleIds.length
    }

    let inserted = 0
    let updated = 0

    for (const e of entries) {
      const groupId = groupMap[e.group]
      const { rows: existing } = await db.query(
        'SELECT id FROM defense_dates WHERE group_id = $1 AND defense_date = $2',
        [groupId, e.date],
      )
      if (existing.length > 0) {
        await db.query(
          'UPDATE defense_dates SET defense_time = $1, room = $2, capacity = $3 WHERE id = $4',
          [e.time, e.room, e.capacity, existing[0].id],
        )
        updated++
      } else {
        await db.query(
          'INSERT INTO defense_dates (group_id, defense_date, defense_time, room, capacity) VALUES ($1, $2, $3, $4, $5)',
          [groupId, e.date, e.time, e.room, e.capacity],
        )
        inserted++
      }
    }

    res.json({ ok: true, inserted, updated, removed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка при импорте расписания' })
  }
}

export const getScheduleYears = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT DISTINCT g.graduation_year
      FROM defense_dates dd
      JOIN groups g ON g.id = dd.group_id
      ORDER BY g.graduation_year DESC
    `)
    res.json(rows.map((r) => r.graduation_year))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка загрузки годов' })
  }
}

export const autoAssign = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || getCurrentGraduationYear()
    const { rows: groups } = await db.query(
      'SELECT DISTINCT dd.group_id FROM defense_dates dd JOIN groups g ON g.id = dd.group_id WHERE g.graduation_year = $1',
      [year],
    )

    let assigned = 0
    const overflowGroups = []

    for (const { group_id } of groups) {
      const { rows: dates } = await db.query(
        `SELECT dd.id, dd.capacity FROM defense_dates dd
         JOIN groups g ON g.id = dd.group_id
         WHERE dd.group_id = $1 AND g.graduation_year = $2
         ORDER BY dd.defense_date ASC`,
        [group_id, year],
      )

      const { rows: students } = await db.query(
        `SELECT s.id FROM students s
         JOIN vkr v ON v.student_id = s.id
         WHERE s.group_id = $1 AND v.status = 'APPROVED' AND s.defense_date_id IS NULL
         ORDER BY s.last_name, s.first_name`,
        [group_id],
      )

      if (students.length === 0) continue

      let idx = 0
      for (const date of dates) {
        if (idx >= students.length) break

        const {
          rows: [{ count }],
        } = await db.query('SELECT COUNT(*) FROM students WHERE defense_date_id = $1', [date.id])
        const slots = (date.capacity ?? 0) - parseInt(count)
        if (slots <= 0) continue

        const batch = students.slice(idx, idx + slots).map((s) => s.id)
        await db.query('UPDATE students SET defense_date_id = $1 WHERE id = ANY($2)', [
          date.id,
          batch,
        ])
        idx += batch.length
        assigned += batch.length
      }

      if (idx < students.length) {
        const {
          rows: [g],
        } = await db.query('SELECT name FROM groups WHERE id = $1', [group_id])
        overflowGroups.push(g.name)
      }
    }

    res.json({ ok: true, assigned, overflowGroups })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка при автораспределении' })
  }
}

export const exportSchedule = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || getCurrentGraduationYear()
    const { rows } = await db.query(
      `
      SELECT
        s.last_name, s.first_name, s.middle_name,
        g.name AS group_name,
        dd.defense_date, dd.defense_time, dd.room
      FROM students s
      JOIN groups g        ON g.id = s.group_id
      JOIN defense_dates dd ON dd.id = s.defense_date_id
      WHERE s.defense_date_id IS NOT NULL AND g.graduation_year = $1
      ORDER BY g.name, dd.defense_date, dd.defense_time, s.last_name, s.first_name
    `,
      [year],
    )

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Нет распределённых студентов' })
    }

    const byGroup = {}
    for (const row of rows) {
      if (!byGroup[row.group_name]) byGroup[row.group_name] = []
      byGroup[row.group_name].push(row)
    }

    const wb = XLSX.utils.book_new()

    for (const [groupName, students] of Object.entries(byGroup)) {
      const sheetData = [
        ['№', 'ФИО студента', 'Дата защиты', 'Время', 'Аудитория'],
        ...students.map((s, i) => [
          i + 1,
          [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(' '),
          new Date(s.defense_date).toLocaleDateString('ru-RU'),
          s.defense_time?.slice(0, 5) ?? '',
          s.room,
        ]),
      ]

      const ws = XLSX.utils.aoa_to_sheet(sheetData)
      ws['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 14 }, { wch: 7 }, { wch: 10 }]

      const safeName = groupName.replace(/[[\]:*?/\\]/g, '').slice(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, safeName)
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent('График_защит.xlsx')}`,
    )
    res.send(buffer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка при формировании файла' })
  }
}

export const getSchedule = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || getCurrentGraduationYear()
    const { rows } = await db.query(
      `
      SELECT
        dd.id,
        dd.defense_date,
        dd.defense_time,
        dd.room,
        dd.capacity,
        g.name  AS group_name,
        d.code  AS direction_code,
        g.education_form
      FROM defense_dates dd
      JOIN groups g       ON g.id = dd.group_id
      LEFT JOIN directions d ON d.id = g.direction_id
      WHERE g.graduation_year = $1
      ORDER BY MIN(dd.defense_date) OVER (PARTITION BY g.direction_id, g.education_form),
               CASE d.education_level WHEN 'MASTER' THEN 0 ELSE 1 END,
               d.code,
               MIN(dd.defense_date) OVER (PARTITION BY dd.group_id),
               g.name, dd.defense_date, dd.defense_time
    `,
      [year],
    )
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Ошибка загрузки расписания' })
  }
}
