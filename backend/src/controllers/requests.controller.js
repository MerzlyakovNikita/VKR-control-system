import { db } from '../db/index.js'

export const getAssignmentRequests = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.id,
        r.created_at,
        v.topic,
        v.goal,
        v.tasks,
        s.last_name    AS student_last_name,
        s.first_name   AS student_first_name,
        s.middle_name  AS student_middle_name,
        g.name         AS group_name,
        u.last_name    AS supervisor_last_name,
        u.first_name   AS supervisor_first_name,
        u.middle_name  AS supervisor_middle_name,
        u.degree       AS supervisor_degree,
        u.position     AS supervisor_position,
        (SELECT COUNT(*) FROM vkr WHERE supervisor_id = r.supervisor_id) AS supervisor_student_count
      FROM vkr_requests r
      JOIN vkr v    ON v.id = r.vkr_id
      JOIN students s ON s.id = v.student_id
      JOIN groups g   ON g.id = s.group_id
      JOIN users u    ON u.id = r.supervisor_id
      WHERE r.type = 'ASSIGNMENT' AND r.status = 'PENDING'
      ORDER BY r.created_at ASC
    `)
    res.json(result.rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка загрузки заявок' })
  }
}

export const approveAssignmentRequest = async (req, res) => {
  try {
    const roles = req.user.roles || []
    if (!roles.includes('HEAD_OF_DEPARTMENT')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params
    const { rows } = await db.query('SELECT vkr_id, supervisor_id FROM vkr_requests WHERE id = $1', [id])
    if (rows.length === 0) return res.status(404).json({ message: 'Заявка не найдена' })
    const { vkr_id, supervisor_id } = rows[0]

    await db.query("UPDATE vkr SET supervisor_id = $1, status = 'ASSIGNED', updated_at = NOW() WHERE id = $2", [supervisor_id, vkr_id])
    await db.query("UPDATE vkr_requests SET status = 'APPROVED', resolved_at = NOW() WHERE id = $1", [id])
    await db.query(
      "UPDATE vkr_requests SET status = 'REJECTED', resolved_at = NOW() WHERE vkr_id = $1 AND id != $2 AND status = 'PENDING' AND type = 'ASSIGNMENT'",
      [vkr_id, id],
    )

    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка одобрения заявки' })
  }
}

export const rejectAssignmentRequest = async (req, res) => {
  try {
    const roles = req.user.roles || []
    if (!roles.includes('HEAD_OF_DEPARTMENT')) {
      return res.status(403).json({ message: 'Нет доступа' })
    }

    const { id } = req.params
    const { comment } = req.body
    await db.query("UPDATE vkr_requests SET status = 'REJECTED', resolved_at = NOW(), comment = $2 WHERE id = $1", [id, comment || null])
    res.json({ ok: true })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка отклонения заявки' })
  }
}
