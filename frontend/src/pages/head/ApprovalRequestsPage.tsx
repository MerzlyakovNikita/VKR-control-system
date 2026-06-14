import { useEffect, useState, useMemo } from 'react'
import { Table, Button, Modal, Input, message, Empty, Typography, Tooltip } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import './AssignmentRequestsPage.css'

const { Text, Paragraph } = Typography

interface ApprovalRequest {
  id: number
  created_at: string
  topic: string | null
  goal: string | null
  tasks: string | null
  student_last_name: string
  student_first_name: string
  student_middle_name: string | null
  group_name: string
  supervisor_last_name: string
  supervisor_first_name: string
  supervisor_middle_name: string | null
  supervisor_student_count: number
}

interface HeaderRow {
  _isHeader: true
  id: string
  supervisor_last_name: string
  supervisor_first_name: string
  supervisor_middle_name: string | null
  supervisor_student_count: number
}

interface StudentRow extends ApprovalRequest {
  _isHeader: false
}

type RowData = HeaderRow | StudentRow

const fio = (last: string, first: string, middle: string | null) =>
  [last, first, middle].filter(Boolean).join(' ')

const shortFio = (last: string, first: string, middle: string | null) =>
  [last, first ? first[0] + '.' : '', middle ? middle[0] + '.' : ''].filter(Boolean).join(' ')

const supFio = (item: {
  supervisor_last_name: string
  supervisor_first_name: string
  supervisor_middle_name: string | null
}) => fio(item.supervisor_last_name, item.supervisor_first_name, item.supervisor_middle_name)

const supShort = (item: {
  supervisor_last_name: string
  supervisor_first_name: string
  supervisor_middle_name: string | null
}) => shortFio(item.supervisor_last_name, item.supervisor_first_name, item.supervisor_middle_name)

const COL_COUNT = 3

export default function ApprovalRequestsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState<{
    open: boolean
    item: StudentRow | null
    comment: string
  }>({
    open: false,
    item: null,
    comment: '',
  })
  const [rejectLoading, setRejectLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/requests/approval')
      setRequests(data)
    } catch {
      message.error('Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const tableData = useMemo<RowData[]>(() => {
    const sorted = [...requests].sort((a, b) => supFio(a).localeCompare(supFio(b), 'ru'))
    const result: RowData[] = []
    let lastKey = ''
    for (const item of sorted) {
      const key = supFio(item)
      if (key !== lastKey) {
        result.push({
          _isHeader: true,
          id: `header-${key}`,
          supervisor_last_name: item.supervisor_last_name,
          supervisor_first_name: item.supervisor_first_name,
          supervisor_middle_name: item.supervisor_middle_name,
          supervisor_student_count: item.supervisor_student_count,
        })
        lastKey = key
      }
      result.push({ ...item, _isHeader: false })
    }
    return result
  }, [requests])

  const handleApprove = (item: ApprovalRequest) => {
    Modal.confirm({
      title: 'Утвердить тему ВКР?',
      content: (
        <span>
          Тема студента{' '}
          <strong>
            {shortFio(item.student_last_name, item.student_first_name, item.student_middle_name)}
          </strong>{' '}
          будет утверждена.
        </span>
      ),
      okText: 'Утвердить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.post(`/requests/approval/${item.id}/approve`)
          message.success('Тема утверждена')
          load()
          window.dispatchEvent(new CustomEvent('requests-updated'))
        } catch {
          message.error('Ошибка утверждения')
        }
      },
    })
  }

  const handleReject = (item: StudentRow) => {
    setRejectModal({ open: true, item, comment: '' })
  }

  const doReject = async () => {
    if (!rejectModal.item) return
    setRejectLoading(true)
    try {
      await api.post(`/requests/approval/${rejectModal.item.id}/reject`, {
        comment: rejectModal.comment.trim() || null,
      })
      message.success('Тема отклонена')
      setRejectModal({ open: false, item: null, comment: '' })
      load()
      window.dispatchEvent(new CustomEvent('requests-updated'))
    } catch {
      message.error('Ошибка отклонения')
    } finally {
      setRejectLoading(false)
    }
  }

  const columns = [
    {
      title: 'Студент',
      key: 'student',
      width: 280,
      onCell: (row: RowData) => (row._isHeader ? { colSpan: COL_COUNT } : {}),
      render: (row: RowData) => {
        if (row._isHeader) {
          return (
            <div className="supervisor-header-cell">
              <span>{supFio(row)}</span>
            </div>
          )
        }
        const item = row as StudentRow
        const studentFio = fio(
          item.student_last_name,
          item.student_first_name,
          item.student_middle_name,
        )
        return (
          <div>
            <Tooltip title={studentFio} mouseEnterDelay={0.5}>
              <div className="student-fio-oneline">{studentFio}</div>
            </Tooltip>
            <Text type="secondary" className="student-group-name">
              {item.group_name}
            </Text>
          </div>
        )
      },
    },
    {
      title: 'Тема ВКР',
      key: 'topic',
      onCell: (row: RowData) => (row._isHeader ? { colSpan: 0 } : {}),
      render: (row: RowData) => {
        if (row._isHeader) return null
        const item = row as StudentRow
        return item.topic ? (
          <Paragraph ellipsis={{ rows: 3 }} className="topic-paragraph">
            {item.topic}
          </Paragraph>
        ) : (
          <span className="no-value">—</span>
        )
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      onCell: (row: RowData) => (row._isHeader ? { colSpan: 0 } : {}),
      render: (row: RowData) => {
        if (row._isHeader) return null
        const item = row as StudentRow
        return (
          <div className="request-actions">
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              title="Утвердить"
              onClick={() => handleApprove(item)}
            />
            <Button
              danger
              icon={<CloseOutlined />}
              size="small"
              title="Отклонить"
              onClick={() => handleReject(item)}
            />
          </div>
        )
      },
    },
  ]

  const expandedRowRender = (row: RowData) => {
    if (row._isHeader) return null
    const item = row as StudentRow
    return (
      <div className="request-expanded">
        {item.goal || item.tasks ? (
          <>
            <div className="request-expand-section">
              <div className="request-expand-label">Цель</div>
              <div className="request-expand-text">
                {item.goal ?? <span className="no-value">—</span>}
              </div>
            </div>
            <div className="request-expand-section">
              <div className="request-expand-label">Задачи</div>
              <div className="request-expand-text">
                {item.tasks ?? <span className="no-value">—</span>}
              </div>
            </div>
          </>
        ) : (
          <Text type="secondary">Цель и задачи не указаны</Text>
        )}
      </div>
    )
  }

  return (
    <div className="assignment-requests-page">
      <Modal
        open={rejectModal.open}
        title="Отклонить тему ВКР?"
        okText="Отклонить"
        okButtonProps={{ danger: true, loading: rejectLoading }}
        cancelText="Отмена"
        onOk={doReject}
        onCancel={() => setRejectModal({ open: false, item: null, comment: '' })}
      >
        {rejectModal.item && (
          <p className="reject-modal-text">
            Тема студента{' '}
            <strong>
              {shortFio(
                rejectModal.item.student_last_name,
                rejectModal.item.student_first_name,
                rejectModal.item.student_middle_name,
              )}
            </strong>{' '}
            (рук.{' '}
            <strong>{supShort(rejectModal.item)}</strong>) будет отклонена.
          </p>
        )}
        <Input.TextArea
          placeholder="Причина отказа (необязательно)"
          rows={3}
          value={rejectModal.comment}
          onChange={(e) => setRejectModal((prev) => ({ ...prev, comment: e.target.value }))}
        />
      </Modal>

      {requests.length === 0 && !loading ? (
        <Empty description="Заявок на утверждение нет" />
      ) : (
        <Table
          dataSource={tableData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          showHeader={false}
          rowClassName={(row) => (row._isHeader ? 'supervisor-header-row' : '')}
          expandable={{
            expandedRowRender,
            rowExpandable: (row) => !row._isHeader,
          }}
        />
      )}
    </div>
  )
}
