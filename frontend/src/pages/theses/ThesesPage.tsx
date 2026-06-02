import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Table, Input, Select, Button, Tag, message, Modal, Upload } from 'antd'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import { SearchOutlined, FileTextOutlined, UserOutlined, EditOutlined, CheckOutlined, CloseOutlined, LoadingOutlined, DeleteOutlined, ImportOutlined, UploadOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { hasRole } from '../../shared/lib/auth'
import { formatPhone } from '../../shared/lib/normalize'
import {
  VKR_STATUS_LABELS,
  EDUCATION_LEVEL_LABELS,
  EDUCATION_FORM_LABELS,
} from '../../shared/lib/constants'
import './ThesesPage.css'

function StaticRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="desc-row">
      <div className="desc-label">{label}</div>
      <div className="desc-value">{children ?? '—'}</div>
    </div>
  )
}

function EditableRow({ label, value, displayValue, multiline, onSave, validate }: {
  label: string
  value?: string | null
  displayValue?: string | null
  multiline?: boolean
  onSave: (value: string) => Promise<void>
  validate?: (value: string) => string | null
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) setDraft(value ?? '')
  }, [value, editing])

  const save = async () => {
    if (validate) {
      const err = validate(draft)
      if (err) { setError(err); return }
    }
    setError(null)
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => { setDraft(value ?? ''); setError(null); setEditing(false) }

  return (
    <div className={`desc-row desc-row-editable${editing ? ' desc-row-active' : ''}`}>
      <div className="desc-label">{label}</div>
      <div className="desc-value">
        {editing ? (
          <div className="desc-edit-field">
            {multiline ? (
              <Input.TextArea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(null) }}
                autoSize={{ minRows: 2, maxRows: 5 }}
                autoFocus
                status={error ? 'error' : undefined}
              />
            ) : (
              <Input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(null) }}
                autoFocus
                onPressEnter={save}
                status={error ? 'error' : undefined}
              />
            )}
            <div className="desc-edit-icons">
              {saving
                ? <LoadingOutlined className="desc-icon-save" />
                : <CheckOutlined className="desc-icon-save" onClick={save} />}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            <span>{displayValue ?? value ?? '—'}</span>
            <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />
          </div>
        )}
        {error && <div className="desc-field-error">{error}</div>}
      </div>
    </div>
  )
}

function ReviewerRow({ reviewerFio, reviewerId, reviewers, onSave, canEdit }: {
  reviewerFio?: string
  reviewerId?: number | null
  reviewers: { id: number; fio: string }[]
  onSave: (id: number | null) => Promise<void>
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<number | null>(reviewerId ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setSelected(reviewerId ?? null)
  }, [reviewerId, editing])

  const save = async () => {
    setSaving(true)
    try { await onSave(selected); setEditing(false) }
    finally { setSaving(false) }
  }

  const cancel = () => { setSelected(reviewerId ?? null); setEditing(false) }

  return (
    <div className={`desc-row${canEdit ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}>
      <div className="desc-label">Рецензент</div>
      <div className="desc-value">
        {editing ? (
          <div className="desc-edit-field">
            <Select
              value={selected}
              onChange={(v) => setSelected(v ?? null)}
              options={reviewers.map((r) => ({ value: r.id, label: r.fio }))}
              allowClear
              placeholder="Выберите рецензента"
              style={{ flex: 1 }}
            />
            <div className="desc-edit-icons">
              {saving
                ? <LoadingOutlined className="desc-icon-save" />
                : <CheckOutlined className="desc-icon-save" onClick={save} />}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            <span>{reviewerFio || '—'}</span>
            {canEdit && <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />}
          </div>
        )}
      </div>
    </div>
  )
}

function DefenseDateRow({ value, dateId, options, onSave, canEdit }: {
  value?: string | null
  dateId?: number | null
  options: { id: number; defense_date: string }[]
  onSave: (id: number | null) => Promise<void>
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<number | null>(dateId ?? null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setSelected(dateId ?? null)
  }, [dateId, editing])

  const save = async () => {
    setSaving(true)
    try { await onSave(selected); setEditing(false) }
    finally { setSaving(false) }
  }

  const cancel = () => { setSelected(dateId ?? null); setEditing(false) }

  return (
    <div className={`desc-row${canEdit ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}>
      <div className="desc-label">Дата защиты</div>
      <div className="desc-value">
        {editing ? (
          <div className="desc-edit-field">
            <Select
              value={selected}
              onChange={(v) => setSelected(v ?? null)}
              options={options.map((d) => ({
                value: d.id,
                label: dayjs(d.defense_date).format('DD.MM.YY'),
              }))}
              allowClear
              placeholder="Выберите дату"
              style={{ flex: 1 }}
            />
            <div className="desc-edit-icons">
              {saving
                ? <LoadingOutlined className="desc-icon-save" />
                : <CheckOutlined className="desc-icon-save" onClick={save} />}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            <span>{value ? dayjs(value).format('DD.MM.YY') : '—'}</span>
            {canEdit && <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />}
          </div>
        )}
      </div>
    </div>
  )
}

const ALL_STATUSES = Object.keys(VKR_STATUS_LABELS)
const COL_COUNT = 7

export default function ThesesPage() {
  const [searchParams] = useSearchParams()
  const [theses, setTheses] = useState<any[]>([])
  const [allGroups, setAllGroups] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string[]>(() => {
    const g = searchParams.get('group')
    return g ? [g] : []
  })
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [reviewers, setReviewers] = useState<{ id: number; fio: string }[]>([])
  const [groupDefenseDates, setGroupDefenseDates] = useState<any[]>([])
  const [allGroupsFull, setAllGroupsFull] = useState<{ id: number; name: string }[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importGroupId, setImportGroupId] = useState<number | null>(null)
  const [importFileList, setImportFileList] = useState<UploadFile[]>([])
  const isSecretary = hasRole('SECRETARY')
  const isHead = hasRole('HEAD_OF_DEPARTMENT')
  const isPracticeSupervisor = hasRole('PRACTICE_SUPERVISOR')

  const loadTheses = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await api.get('/thesis/all')
      setTheses(data)
      return data as any[]
    } catch {
      message.error('Ошибка загрузки тем ВКР')
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/groups')
      const sorted = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name, 'ru'))
      setAllGroups(sorted.map((g: any) => g.name))
      setAllGroupsFull(sorted.map((g: any) => ({ id: g.id, name: g.name })))
    } catch {
      message.error('Ошибка загрузки групп')
    }
  }

  const loadReviewers = async () => {
    try {
      const { data } = await api.get('/reviewers')
      setReviewers(
        data.map((r: any) => ({
          id: r.id,
          fio: [r.last_name, r.first_name, r.middle_name].filter(Boolean).join(' '),
        })),
      )
    } catch {
      message.error('Ошибка загрузки рецензентов')
    }
  }

  useEffect(() => {
    if (!selectedStudent?.group_id) { setGroupDefenseDates([]); return }
    api.get(`/thesis/defense-dates/group/${selectedStudent.group_id}`)
      .then(({ data }) => setGroupDefenseDates(data))
      .catch(() => setGroupDefenseDates([]))
  }, [selectedStudent?.group_id])

  const handleDefenseDateSave = async (dateId: number | null) => {
    const updated = { ...selectedStudent, defense_date_id: dateId }
    setSelectedStudent(updated)
    try {
      await api.put(`/thesis/student/${updated.id}`, {
        last_name: updated.last_name,
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        email: updated.email,
        phone: updated.phone,
        topic: updated.topic,
        practice_place: updated.practice_place,
        company_supervisor: updated.company_supervisor,
        defense_date_id: dateId,
      })
      message.success('Дата защиты назначена')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === updated.id)
        if (student) setSelectedStudent(student)
      }
    } catch {
      message.error('Ошибка при назначении даты защиты')
    }
  }

  const handleReviewerSave = async (reviewerId: number | null) => {
    if (!selectedStudent) return
    try {
      await api.put(`/reviewers/student/${selectedStudent.id}`, { reviewer_id: reviewerId })
      message.success('Рецензент назначен')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === selectedStudent.id)
        if (student) setSelectedStudent(student)
      }
    } catch {
      message.error('Ошибка при назначении рецензента')
    }
  }

  const handleDeleteStudent = () => {
    if (!selectedStudent) return
    Modal.confirm({
      title: 'Удалить студента?',
      content: `${selectedStudent.last_name} ${selectedStudent.first_name} и все его данные по ВКР будут удалены безвозвратно.`,
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/thesis/student/${selectedStudent.id}`)
          message.success('Студент удалён')
          setSelectedStudent(null)
          loadTheses()
        } catch {
          message.error('Ошибка удаления')
        }
      },
    })
  }

  const handleFieldSave = async (field: string, value: string) => {
    const updated = { ...selectedStudent, [field]: value }
    setSelectedStudent(updated)
    try {
      await api.put(`/thesis/student/${updated.id}`, {
        last_name: updated.last_name,
        first_name: updated.first_name,
        middle_name: updated.middle_name,
        email: updated.email,
        phone: updated.phone,
        topic: updated.topic,
        practice_place: updated.practice_place,
        company_supervisor: updated.company_supervisor,
        defense_date_id: updated.defense_date_id,
      })
      message.success('Сохранено')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === updated.id)
        if (student) setSelectedStudent(student)
      }
    } catch {
      message.error('Ошибка при сохранении')
    }
  }

  useEffect(() => {
    loadTheses()
    loadGroups()
    loadReviewers()
  }, [])

  const groups = Array.from(new Set(theses.map((t) => t.group_name).filter(Boolean))).sort()

  const filtered = theses.filter((t) => {
    const query = search.toLowerCase()
    const supervisorFio = [
      t.supervisor_last_name,
      t.supervisor_first_name,
      t.supervisor_middle_name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchSearch =
      !query ||
      `${t.last_name} ${t.first_name} ${t.middle_name || ''}`.toLowerCase().includes(query) ||
      (t.topic || '').toLowerCase().includes(query) ||
      supervisorFio.includes(query)

    const matchGroup = groupFilter.length === 0 || groupFilter.includes(t.group_name)
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(t.status)

    return matchSearch && matchGroup && matchStatus
  })

  const tableData = (() => {
    const rows: any[] = []
    for (const group of groups) {
      const groupRows = filtered.filter((t) => t.group_name === group)
      if (groupRows.length === 0) continue
      rows.push({ _isGroupHeader: true, _groupName: group, id: `header-${group}` })
      rows.push(...groupRows.map((r, i) => ({ ...r, _groupIndex: i + 1 })))
    }
    rows.push(
      ...filtered.filter((t) => !t.group_name).map((r, i) => ({ ...r, _groupIndex: i + 1 })),
    )
    return rows
  })()

  const firstCell = (row: any) => (row._isGroupHeader ? { colSpan: COL_COUNT } : {})
  const dataCell = (row: any) => (row._isGroupHeader ? { colSpan: 0 } : {})

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 48,
      onCell: firstCell,
      render: (row: any) =>
        row._isGroupHeader ? (
          <span className="group-header-label">Группа {row._groupName}</span>
        ) : (
          <span className="row-index">{row._groupIndex}</span>
        ),
    },
    {
      title: 'ФИО студента',
      key: 'fio',
      width: 220,
      onCell: dataCell,
      render: (row: any) => (
        <span className="fio-cell">
          {`${row.last_name} ${row.first_name} ${row.middle_name || ''}`.trim()}
          <UserOutlined
            className="student-profile-icon"
            onClick={() => setSelectedStudent(row)}
          />
        </span>
      ),
    },
    {
      title: 'Тема ВКР',
      dataIndex: 'topic',
      key: 'topic',
      onCell: dataCell,
      render: (v: string) => v || <span className="no-data">Не указана</span>,
    },
    {
      title: 'Руководитель от кафедры',
      key: 'supervisor',
      width: 180,
      onCell: dataCell,
      render: (row: any) => {
        const fio = [
          row.supervisor_last_name,
          row.supervisor_first_name,
          row.supervisor_middle_name,
        ]
          .filter(Boolean)
          .join(' ')
        return fio || <span className="no-data">—</span>
      },
    },
    {
      title: 'Место выполнения ВКР',
      dataIndex: 'practice_place',
      key: 'practice_place',
      width: 160,
      onCell: dataCell,
      render: (v: string) => v || <span className="no-data">—</span>,
    },
    {
      title: 'Руководитель от предприятия',
      dataIndex: 'company_supervisor',
      key: 'company_supervisor',
      width: 180,
      onCell: dataCell,
      render: (v: string) => v || <span className="no-data">—</span>,
    },
    {
      title: 'Статус темы',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      onCell: dataCell,
      render: (status: string, row: any) => {
        if (!status) return <span className="no-data">—</span>
        const s = VKR_STATUS_LABELS[status] || { label: status, color: 'default' }
        return (
          <div>
            <Tag color={s.color}>{s.label}</Tag>
            {row.resolved_at && (
              <div className="status-date">{dayjs(row.resolved_at).format('DD.MM.YY')}</div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="theses-page">
      <div className="theses-toolbar">
        <Input
          placeholder="Поиск по студенту, теме или руководителю..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="theses-search"
        />
        <Select
          mode="multiple"
          placeholder="Учебная группа"
          allowClear
          style={{ minWidth: 170, maxWidth: 400 }}
          value={groupFilter}
          onChange={setGroupFilter}
          maxTagCount={0}
          maxTagPlaceholder={(omitted) => `Групп: ${omitted.length}`}
          options={allGroups.map((g) => ({ value: g, label: g }))}
        />
        <Select
          mode="multiple"
          placeholder="Статус темы"
          allowClear
          style={{ minWidth: 170, maxWidth: 400 }}
          value={statusFilter}
          onChange={setStatusFilter}
          maxTagCount={0}
          maxTagPlaceholder={(omitted) => `Статусов: ${omitted.length}`}
          options={ALL_STATUSES.map((key) => ({
            value: key,
            label: VKR_STATUS_LABELS[key].label,
          }))}
        />
        {isSecretary && (
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => message.info('Формирование приказа...')}
          >
            Сформировать приказ
          </Button>
        )}
        {isPracticeSupervisor && (
          <Button
            type="primary"
            icon={<ImportOutlined />}
            onClick={() => setImportModalOpen(true)}
          >
            Импортировать список
          </Button>
        )}
      </div>

      <Table
        dataSource={tableData}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        tableLayout="fixed"
        locale={{ emptyText: 'Темы не найдены' }}
        onRow={(row) => ({ className: row._isGroupHeader ? 'group-header-row' : '' })}
      />
      <Modal
        open={!!selectedStudent}
        onCancel={() => setSelectedStudent(null)}
        footer={null}
        title={
          <div className="student-modal-title">
            <span>Профиль студента</span>
            <DeleteOutlined className="student-modal-delete" onClick={handleDeleteStudent} />
          </div>
        }
        width={800}
        centered
        destroyOnHidden
        className="student-profile-modal"
      >
        {selectedStudent && (() => {
          const s = selectedStudent
          const supervisorFio = [s.supervisor_last_name, s.supervisor_first_name, s.supervisor_middle_name]
            .filter(Boolean).join(' ')
          const status = s.status ? VKR_STATUS_LABELS[s.status] : null
          const save = (field: string) => (value: string) => handleFieldSave(field, value)
          return (
            <>
              <div className="desc-table">
                <EditableRow label="Фамилия" value={s.last_name} onSave={save('last_name')} />
                <EditableRow label="Имя" value={s.first_name} onSave={save('first_name')} />
                <EditableRow label="Отчество" value={s.middle_name} onSave={save('middle_name')} />
                <EditableRow label="Email" value={s.email} onSave={save('email')} />
                <EditableRow
                  label="Телефон"
                  value={s.phone}
                  displayValue={formatPhone(s.phone)}
                  onSave={save('phone')}
                  validate={(v) => {
                    if (!v.trim()) return null
                    const digits = v.replace(/\D/g, '')
                    return digits.length === 10 || digits.length === 11
                      ? null
                      : 'Неверный формат номера телефона'
                  }}
                />
                <StaticRow label="Группа">{s.group_name}</StaticRow>
                <StaticRow label="Направление">
                  {s.direction_code && s.direction_name ? `${s.direction_code} — ${s.direction_name}` : null}
                </StaticRow>
                <StaticRow label="Профиль">{s.profile_name}</StaticRow>
                <StaticRow label="Уровень образования">{EDUCATION_LEVEL_LABELS[s.education_level]}</StaticRow>
                <StaticRow label="Курс">{s.course != null ? String(s.course) : null}</StaticRow>
                <StaticRow label="Форма обучения">{EDUCATION_FORM_LABELS[s.education_form]}</StaticRow>
              </div>

              <div className="desc-section-title">ВКР</div>
              <div className="desc-table">
                <EditableRow label="Тема" value={s.topic} multiline onSave={save('topic')} />
                <StaticRow label="Статус">
                  {status ? (
                    <span>
                      <Tag color={status.color}>{status.label}</Tag>
                      {s.resolved_at && (
                        <span className="status-date">{dayjs(s.resolved_at).format('DD.MM.YY')}</span>
                      )}
                    </span>
                  ) : null}
                </StaticRow>
                <StaticRow label="Руководитель от кафедры">{supervisorFio}</StaticRow>
                {s.education_level === 'MASTER' && (
                  <ReviewerRow
                    reviewerFio={[s.reviewer_last_name, s.reviewer_first_name, s.reviewer_middle_name].filter(Boolean).join(' ') || undefined}
                    reviewerId={s.reviewer_id}
                    reviewers={reviewers}
                    onSave={handleReviewerSave}
                    canEdit={isHead}
                  />
                )}
                <EditableRow label="Место выполнения" value={s.practice_place} onSave={save('practice_place')} />
                <EditableRow label="Руководитель от предприятия" value={s.company_supervisor} onSave={save('company_supervisor')} />
                <DefenseDateRow
                  value={s.defense_date}
                  dateId={s.defense_date_id}
                  options={groupDefenseDates}
                  onSave={handleDefenseDateSave}
                  canEdit={isHead || isSecretary}
                />
              </div>
            </>
          )
        })()}
      </Modal>

      <Modal
        open={importModalOpen}
        onCancel={() => {
          setImportModalOpen(false)
          setImportGroupId(null)
          setImportFileList([])
        }}
        onOk={() => {
          message.info('Импорт будет реализован позже')
          setImportModalOpen(false)
          setImportGroupId(null)
          setImportFileList([])
        }}
        okText="Импортировать"
        cancelText="Отмена"
        title="Импортировать список студентов"
        okButtonProps={{ disabled: !importGroupId || importFileList.length === 0 }}
        destroyOnHidden
      >
        <div className="import-modal-body">
          <div className="import-field">
            <div className="import-label">Учебная группа <span className="import-required">*</span></div>
            <Select
              placeholder="Выберите группу"
              value={importGroupId}
              onChange={setImportGroupId}
              options={allGroupsFull.map((g) => ({ value: g.id, label: g.name }))}
              style={{ width: '100%' }}
            />
          </div>
          <div className="import-field">
            <div className="import-label">Файл со списком <span className="import-required">*</span></div>
            <Upload
              accept=".xlsx,.xls,.csv"
              maxCount={1}
              beforeUpload={(file) => { setImportFileList([file]); return false }}
              fileList={importFileList}
              onRemove={() => setImportFileList([])}
            >
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
            <div className="import-hint">
              Форматы: .xlsx, .xls, .csv · Столбцы: ФИО, Email, Телефон, Тема ВКР
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
