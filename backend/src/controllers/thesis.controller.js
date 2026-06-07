import * as XLSX from 'xlsx'
import { db } from '../db/index.js'
import { normalizePhone, normalizeEmail, capitalize } from '../shared/normalize.js'

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
        v.goal,
        v.tasks,
        v.status,
        v.supervisor_id,
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
        req.resolved_at,
        EXISTS(
          SELECT 1 FROM vkr_requests r
          WHERE r.vkr_id = v.id
            AND r.supervisor_id = $1
            AND r.type = 'ASSIGNMENT'
            AND r.status = 'PENDING'
        ) AS has_pending_request
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
    `, [req.user.id])
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
    const { last_name, first_name, middle_name, email, phone, topic, goal, tasks, practice_place, company_supervisor, defense_date_id } = req.body

    await db.query(
      `UPDATE students SET last_name=$1, first_name=$2, middle_name=$3, email=$4, phone=$5, defense_date_id=$6 WHERE id=$7`,
      [last_name, first_name, middle_name || null, email || null, normalizePhone(phone), defense_date_id || null, id],
    )

    await db.query(
      `UPDATE vkr SET topic=$1, goal=$2, tasks=$3, practice_place=$4, company_supervisor=$5, updated_at=NOW()
       WHERE student_id=$6`,
      [topic || null, goal || null, tasks || null, practice_place || null, company_supervisor || null, id],
    )

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка обновления данных студента' })
  }
}

export const createStudent = async (req, res) => {
  try {
    const { group_id, last_name, first_name, middle_name, email, phone, topic } = req.body
    if (!group_id || !last_name?.trim() || !first_name?.trim()) {
      return res.status(400).json({ message: 'Группа, фамилия и имя обязательны' })
    }

    const { rows: [student] } = await db.query(
      'INSERT INTO students (last_name, first_name, middle_name, email, phone, group_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [capitalize(last_name.trim()), capitalize(first_name.trim()), middle_name?.trim() ? capitalize(middle_name.trim()) : null, normalizeEmail(email), normalizePhone(phone), group_id],
    )

    await db.query("INSERT INTO vkr (student_id, topic, status) VALUES ($1,$2,'UNASSIGNED')", [
      student.id,
      topic?.trim() || null,
    ])

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка при добавлении студента' })
  }
}

export const assignSupervisor = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const roles = req.user.roles || []

    if (!roles.includes('THESIS_SUPERVISOR')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const profileResult = await db.query('SELECT position, degree FROM users WHERE id = $1', [userId])
    const { position, degree } = profileResult.rows[0]
    if (!position?.trim()) {
      return res.status(400).json({ message: 'Для закрепления студентов необходимо указать должность в профиле.', needsProfile: true })
    }
    if (!degree?.trim()) {
      return res.status(400).json({ message: 'Для закрепления студентов необходимо указать учёную степень в профиле.', needsProfile: true })
    }

    const vkrResult = await db.query('SELECT id FROM vkr WHERE student_id = $1', [id])
    if (vkrResult.rowCount === 0) {
      return res.status(404).json({ message: 'ВКР не найдена' })
    }
    const vkrId = vkrResult.rows[0].id

    if (roles.includes('HEAD_OF_DEPARTMENT')) {
      await db.query('UPDATE vkr SET supervisor_id = $1, updated_at = NOW() WHERE id = $2', [userId, vkrId])
      return res.json({ mode: 'assigned' })
    }

    const existing = await db.query(
      "SELECT id FROM vkr_requests WHERE vkr_id = $1 AND supervisor_id = $2 AND type = 'ASSIGNMENT' AND status = 'PENDING'",
      [vkrId, userId],
    )
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'Заявка на закрепление уже отправлена' })
    }

    await db.query(
      "INSERT INTO vkr_requests (vkr_id, supervisor_id, type, status) VALUES ($1, $2, 'ASSIGNMENT', 'PENDING')",
      [vkrId, userId],
    )

    res.json({ mode: 'requested' })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка при закреплении' })
  }
}

export const importStudents = async (req, res) => {
  try {
    const groupId = parseInt(req.body.group_id)
    if (!groupId || !req.file) {
      return res.status(400).json({ message: 'Не указана группа или файл' })
    }

    const groupResult = await db.query('SELECT name FROM groups WHERE id = $1', [groupId])
    if (groupResult.rowCount === 0) {
      return res.status(404).json({ message: 'Группа не найдена' })
    }
    const groupName = groupResult.rows[0].name

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames.find((n) => n.trim() === groupName.trim())
    if (!sheetName) {
      return res.status(400).json({
        message: `Лист "${groupName}" не найден в файле. Доступные листы: ${workbook.SheetNames.join(', ')}`,
      })
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })
    if (rows.length === 0) {
      return res.status(400).json({ message: 'Лист не содержит данных' })
    }

    const getVal = (row, key) => {
      for (const k of Object.keys(row)) {
        if (k.trim().toLowerCase() === key.toLowerCase()) return String(row[k]).trim()
      }
      return ''
    }

    let added = 0
    let skipped = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const fio = getVal(row, 'фио')
      if (!fio) continue

      const parts = fio.split(/\s+/)
      if (parts.length < 2) {
        errors.push(`Строка ${rowNum}: некорректное ФИО "${fio}" (ожидается минимум Фамилия Имя)`)
        skipped++
        continue
      }

      const lastName = capitalize(parts[0])
      const firstName = capitalize(parts[1])
      const middleName = parts.length > 2 ? parts.slice(2).map(capitalize).join(' ') : null
      const email = normalizeEmail(getVal(row, 'email'))
      const phone = normalizePhone(getVal(row, 'телефон'))
      const topic = getVal(row, 'тема вкр') || null

      try {
        const existing = await db.query(
          `SELECT id FROM students
           WHERE lower(last_name) = $1
             AND lower(first_name) = $2
             AND group_id = $3
             AND (middle_name IS NULL OR $4::text IS NULL OR lower(middle_name) = lower($4))`,
          [lastName.toLowerCase(), firstName.toLowerCase(), groupId, middleName],
        )
        if (existing.rowCount > 0) {
          skipped++
          continue
        }

        const {
          rows: [student],
        } = await db.query(
          'INSERT INTO students (last_name, first_name, middle_name, email, phone, group_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [lastName, firstName, middleName, email, phone, groupId],
        )

        await db.query("INSERT INTO vkr (student_id, topic, status) VALUES ($1,$2,'UNASSIGNED')", [
          student.id,
          topic,
        ])

        added++
      } catch (err) {
        errors.push(`Строка ${rowNum}: ${err.message}`)
        skipped++
      }
    }

    res.json({ added, skipped, errors })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка при импорте файла' })
  }
}

export const getThesisSupervisors = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT DISTINCT u.id, u.last_name, u.first_name, u.middle_name
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      WHERE ur.role = 'THESIS_SUPERVISOR'
      ORDER BY u.last_name, u.first_name
    `)
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки руководителей' })
  }
}

const DEGREE_POSITIONS = ['ASSOCIATE_PROFESSOR', 'PROFESSOR']
const needsDegree = (pos) => DEGREE_POSITIONS.includes(pos)

export const setThesisSupervisor = async (req, res) => {
  try {
    const roles = req.user.roles || []
    if (!roles.includes('HEAD_OF_DEPARTMENT')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params
    const { supervisor_id, position, degree } = req.body

    const vkrResult = await db.query('SELECT id FROM vkr WHERE student_id = $1', [id])
    if (vkrResult.rowCount === 0) return res.status(404).json({ message: 'ВКР не найдена' })
    const vkrId = vkrResult.rows[0].id

    if (supervisor_id) {
      const profResult = await db.query('SELECT position, degree FROM users WHERE id = $1', [supervisor_id])
      if (profResult.rowCount === 0) return res.status(404).json({ message: 'Руководитель не найден' })
      const prof = profResult.rows[0]

      const finalPosition = position?.trim() || prof.position?.trim()
      const finalDegree = degree?.trim() || prof.degree?.trim()

      if (!finalPosition || (needsDegree(finalPosition) && !finalDegree)) {
        return res.status(400).json({
          incompleteProfile: true,
          message: 'У выбранного руководителя не заполнен профиль.',
          currentPosition: prof.position || null,
          currentDegree: prof.degree || null,
        })
      }

      if (position?.trim()) {
        await db.query('UPDATE users SET position = $1 WHERE id = $2', [position, supervisor_id])
        if (!needsDegree(position)) {
          await db.query('UPDATE users SET degree = NULL WHERE id = $1', [supervisor_id])
        }
      }
      if (degree?.trim() && needsDegree(finalPosition)) {
        await db.query('UPDATE users SET degree = $1 WHERE id = $2', [degree, supervisor_id])
      }
    }

    const newStatus = supervisor_id ? 'ASSIGNED' : 'UNASSIGNED'
    await db.query(
      'UPDATE vkr SET supervisor_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [supervisor_id || null, newStatus, vkrId],
    )

    if (supervisor_id) {
      await db.query(
        "UPDATE vkr_requests SET status = 'REJECTED', resolved_at = NOW() WHERE vkr_id = $1 AND type = 'ASSIGNMENT' AND status = 'PENDING'",
        [vkrId],
      )
    }

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка при назначении руководителя' })
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
