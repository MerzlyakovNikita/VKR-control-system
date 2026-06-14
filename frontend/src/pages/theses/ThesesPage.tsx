import { useEffect, useState, useMemo, useRef, type ReactNode } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Table,
  Input,
  Select,
  Button,
  Tag,
  message,
  Modal,
  Upload,
  Switch,
  Popover,
  Spin,
  Badge,
  DatePicker,
} from 'antd'
import type { UploadFile } from 'antd'
import dayjs from 'dayjs'
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  DeleteOutlined,
  ImportOutlined,
  UploadOutlined,
  PlusOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { hasRole, getUser } from '../../shared/lib/auth'
import { formatPhone } from '../../shared/lib/normalize'
import { VKR_STATUS_LABELS, POSITION_LABELS, DEGREE_LABELS } from '../../shared/lib/constants'
import './ThesesPage.css'

const hasDegree = (position?: string) =>
  position === 'ASSOCIATE_PROFESSOR' || position === 'PROFESSOR'

const toShortFio = (fullFio: string) => {
  const [last = '', first = '', middle = ''] = fullFio.trim().split(/\s+/)
  return [last, first ? first[0] + '.' : '', middle ? middle[0] + '.' : '']
    .filter(Boolean)
    .join(' ')
}

function StaticRow({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="desc-row">
      <div className="desc-label">{label}</div>
      <div className="desc-value">{children || '—'}</div>
    </div>
  )
}

function EditableRow({
  label,
  value,
  displayValue,
  multiline,
  disabled,
  onSave,
  validate,
  renderDisplay,
}: {
  label: string
  value?: string | null
  displayValue?: string | null
  multiline?: boolean
  disabled?: boolean
  onSave: (value: string) => Promise<void>
  validate?: (value: string) => string | null
  renderDisplay?: (value: string | null | undefined) => ReactNode
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
      if (err) {
        setError(err)
        return
      }
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

  const cancel = () => {
    setDraft(value ?? '')
    setError(null)
    setEditing(false)
  }

  return (
    <div
      className={`desc-row${!disabled ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}
    >
      <div className="desc-label">{label}</div>
      <div className="desc-value">
        {editing ? (
          <div className="desc-edit-field">
            {multiline ? (
              <Input.TextArea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setError(null)
                }}
                autoSize={{ minRows: 2, maxRows: 5 }}
                autoFocus
                status={error ? 'error' : undefined}
              />
            ) : (
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value)
                  setError(null)
                }}
                autoFocus
                onPressEnter={save}
                status={error ? 'error' : undefined}
              />
            )}
            <div className="desc-edit-icons">
              {saving ? (
                <LoadingOutlined className="desc-icon-save" />
              ) : (
                <CheckOutlined className="desc-icon-save" onClick={save} />
              )}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            {renderDisplay ? renderDisplay(value) : <span>{displayValue ?? value ?? '—'}</span>}
            {!disabled && (
              <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />
            )}
          </div>
        )}
        {error && <div className="desc-field-error">{error}</div>}
      </div>
    </div>
  )
}

function ReviewerRow({
  reviewerFio,
  reviewerId,
  reviewers,
  onSave,
  onGenerate,
  canEdit,
}: {
  reviewerFio?: string
  reviewerId?: number | null
  reviewers: { id: number; fio: string }[]
  onSave: (id: number | null) => Promise<void>
  onGenerate?: () => void
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
    try {
      await onSave(selected)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setSelected(reviewerId ?? null)
    setEditing(false)
  }

  return (
    <div
      className={`desc-row${canEdit ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}
    >
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
              {saving ? (
                <LoadingOutlined className="desc-icon-save" />
              ) : (
                <CheckOutlined className="desc-icon-save" onClick={save} />
              )}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            <span>{reviewerFio || '—'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {canEdit && reviewerId && (
                <Button size="small" className="row-doc-btn" onClick={onGenerate}>
                  Направление на рецензию
                </Button>
              )}
              {canEdit && (
                <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DefenseDateRow({
  value,
  dateId,
  options,
  onSave,
  canEdit,
}: {
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
    try {
      await onSave(selected)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setSelected(dateId ?? null)
    setEditing(false)
  }

  return (
    <div
      className={`desc-row${canEdit ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}
    >
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
              {saving ? (
                <LoadingOutlined className="desc-icon-save" />
              ) : (
                <CheckOutlined className="desc-icon-save" onClick={save} />
              )}
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

function SupervisorRow({
  supervisorFio,
  supervisorId,
  supervisors,
  currentUserId,
  isHead,
  isSupervisor,
  hasPendingRequest,
  canAssign,
  canClear,
  onSaveAsHead,
  onAssign,
  onGoToRequests,
}: {
  supervisorFio: string
  supervisorId: number | null
  supervisors: { id: number; fio: string }[]
  currentUserId: number | undefined
  isHead: boolean
  isSupervisor: boolean
  hasPendingRequest: boolean
  canAssign: boolean
  canClear: boolean
  onSaveAsHead: (id: number | null) => Promise<void>
  onAssign: () => void
  onGoToRequests: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<number | null>(supervisorId)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!editing) setSelected(supervisorId)
  }, [supervisorId, editing])

  const options = useMemo(() => {
    const me = supervisors.find((s) => s.id === currentUserId)
    const others = supervisors.filter((s) => s.id !== currentUserId)
    return [
      ...(me ? [{ value: me.id, label: `Вы (${me.fio})` }] : []),
      ...others.map((s) => ({ value: s.id, label: s.fio })),
    ]
  }, [supervisors, currentUserId])

  const save = async () => {
    setSaving(true)
    try {
      await onSaveAsHead(selected)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setSelected(supervisorId)
    setEditing(false)
  }

  return (
    <div
      className={`desc-row${isHead ? ' desc-row-editable' : ''}${editing ? ' desc-row-active' : ''}`}
    >
      <div className="desc-label">Руководитель от кафедры</div>
      <div className="desc-value">
        {editing ? (
          <div className="desc-edit-field">
            <Select
              value={selected}
              onChange={(v) => setSelected(v ?? null)}
              options={options}
              allowClear={canClear}
              showSearch
              optionFilterProp="label"
              placeholder="Выберите руководителя"
              style={{ flex: 1 }}
            />
            <div className="desc-edit-icons">
              {saving ? (
                <LoadingOutlined className="desc-icon-save" />
              ) : (
                <CheckOutlined className="desc-icon-save" onClick={save} />
              )}
              <CloseOutlined className="desc-icon-cancel" onClick={cancel} />
            </div>
          </div>
        ) : (
          <div className="desc-display">
            <span>{supervisorFio || '—'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isSupervisor &&
                !isHead &&
                canAssign &&
                supervisorId !== currentUserId &&
                (hasPendingRequest ? (
                  <Button size="small" disabled>
                    Заявка на рассмотрении
                  </Button>
                ) : (
                  <Button size="small" onClick={onAssign}>
                    Закрепить за собой
                  </Button>
                ))}
              {isHead && hasPendingRequest && (
                <Button size="small" onClick={onGoToRequests}>
                  Заявка
                </Button>
              )}
              {isHead && (
                <EditOutlined className="row-edit-icon" onClick={() => setEditing(true)} />
              )}
            </div>
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
  const navigate = useNavigate()
  const [theses, setTheses] = useState<any[]>([])
  const [allGroups, setAllGroups] = useState<{ name: string; graduation_year: number }[]>([])
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string[]>(() => {
    const g = searchParams.get('group')
    return g ? [g] : []
  })
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [yearFilter, setYearFilter] = useState<number | null>(() => {
    const y = searchParams.get('graduation_year')
    return y ? parseInt(y, 10) : null
  })
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [reviewers, setReviewers] = useState<{ id: number; fio: string }[]>([])
  const [groupDefenseDates, setGroupDefenseDates] = useState<any[]>([])
  const [allGroupsFull, setAllGroupsFull] = useState<
    { id: number; name: string; graduation_year: number }[]
  >([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importGroupId, setImportGroupId] = useState<number | null>(null)
  const [importFileList, setImportFileList] = useState<UploadFile[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [addStudentGroupId, setAddStudentGroupId] = useState<number | null>(null)
  const [addStudentGroupName, setAddStudentGroupName] = useState('')
  const [addStudentForm, setAddStudentForm] = useState({
    last_name: '',
    first_name: '',
    middle_name: '',
    email: '',
    phone: '',
    topic: '',
  })
  const [addStudentLoading, setAddStudentLoading] = useState(false)
  const [thesisSupervisors, setThesisSupervisors] = useState<{ id: number; fio: string }[]>([])
  const [profileFillModal, setProfileFillModal] = useState<{
    open: boolean
    supervisorId: number | null
    supervisorFio: string
    position: string
    degree: string
  }>({ open: false, supervisorId: null, supervisorFio: '', position: '', degree: '' })
  const isSecretary = hasRole('SECRETARY')
  const isHead = hasRole('HEAD_OF_DEPARTMENT')
  const isPracticeSupervisor = hasRole('PRACTICE_SUPERVISOR')
  const isSupervisor = hasRole('THESIS_SUPERVISOR')
  const currentUserId = getUser()?.id
  const [onlyMine, setOnlyMine] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [bellHistory, setBellHistory] = useState<{ comment: string; resolved_at: string }[]>([])
  const [bellLoading, setBellLoading] = useState(false)
  const [bellStudentId, setBellStudentId] = useState<number | null>(null)
  const approvalDatePickerRef = useRef<any>(null)
  const [approvalDatePickerOpen, setApprovalDatePickerOpen] = useState(false)

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
      setAllGroups(sorted.map((g: any) => ({ name: g.name, graduation_year: g.graduation_year })))
      setAllGroupsFull(
        sorted.map((g: any) => ({ id: g.id, name: g.name, graduation_year: g.graduation_year })),
      )
    } catch {
      message.error('Ошибка загрузки групп')
    }
  }

  const loadReviewers = async () => {
    try {
      const { data } = await api.get('/reviewers')
      setReviewers(
        data
          .filter((r: any) => r.is_active)
          .map((r: any) => ({
            id: r.id,
            fio: [r.last_name, r.first_name, r.middle_name].filter(Boolean).join(' '),
          })),
      )
    } catch {
      message.error('Ошибка загрузки рецензентов')
    }
  }

  const loadThesisSupervisors = async () => {
    if (!isHead) return
    try {
      const { data } = await api.get('/thesis/supervisors')
      setThesisSupervisors(
        data.map((u: any) => ({
          id: u.id,
          fio: [u.last_name, u.first_name, u.middle_name].filter(Boolean).join(' '),
        })),
      )
    } catch {}
  }

  const handleSupervisorSave = async (supervisorId: number | null) => {
    if (!selectedStudent) return
    try {
      await api.put(`/thesis/student/${selectedStudent.id}/supervisor`, {
        supervisor_id: supervisorId,
      })
      message.success(supervisorId ? 'Руководитель назначен' : 'Руководитель откреплён')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === selectedStudent.id)
        if (student) setSelectedStudent(student)
      }
    } catch (err: any) {
      if (err.response?.data?.incompleteProfile) {
        const { currentPosition, currentDegree } = err.response.data
        const supervisorFio = thesisSupervisors.find((s) => s.id === supervisorId)?.fio ?? ''
        setProfileFillModal({
          open: true,
          supervisorId,
          supervisorFio,
          position: currentPosition || '',
          degree: currentDegree || '',
        })
      } else {
        message.error(err.response?.data?.message ?? 'Ошибка при назначении руководителя')
      }
    }
  }

  const handleProfileFillAndSave = async () => {
    if (!profileFillModal.supervisorId || !selectedStudent) return
    if (
      !profileFillModal.position ||
      (hasDegree(profileFillModal.position) && !profileFillModal.degree)
    ) {
      message.warning('Укажите должность и учёную степень')
      return
    }
    try {
      await api.put(`/thesis/student/${selectedStudent.id}/supervisor`, {
        supervisor_id: profileFillModal.supervisorId,
        position: profileFillModal.position,
        degree: profileFillModal.degree,
      })
      message.success('Руководитель назначен')
      setProfileFillModal({
        open: false,
        supervisorId: null,
        supervisorFio: '',
        position: '',
        degree: '',
      })
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === selectedStudent.id)
        if (student) setSelectedStudent(student)
      }
    } catch (err: any) {
      message.error(err.response?.data?.message ?? 'Ошибка при назначении руководителя')
    }
  }

  useEffect(() => {
    if (!selectedStudent?.group_id) {
      setGroupDefenseDates([])
      return
    }
    api
      .get(`/thesis/defense-dates/group/${selectedStudent.group_id}`)
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
        goal: updated.goal,
        tasks: updated.tasks,
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

  const handleGenerateDirection = async (
    studentId: number,
    lastName: string,
    firstName: string,
    middleName: string | null,
  ) => {
    try {
      const { data } = await api.get(`/documents/review-direction/${studentId}`, {
        responseType: 'blob',
      })
      const nameSlug = `${lastName}${firstName?.[0] ?? ''}${middleName?.[0] ?? ''}`
      const url = URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `Направление_${nameSlug}.docx`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Ошибка формирования документа')
    }
  }

  const handleReviewerSave = async (reviewerId: number | null) => {
    if (!selectedStudent) return
    try {
      await api.put(`/reviewers/student/${selectedStudent.id}`, { reviewer_id: reviewerId })
      message.success(reviewerId ? 'Рецензент назначен' : 'Рецензент откреплён')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === selectedStudent.id)
        if (student) setSelectedStudent(student)
      }
    } catch {
      message.error('Ошибка при назначении рецензента')
    }
  }

  useEffect(() => {
    setBellOpen(false)
    setBellHistory([])
    setBellStudentId(null)
  }, [selectedStudent?.id])

  const handleOpenBell = async () => {
    if (!selectedStudent || bellStudentId === selectedStudent.id) return
    setBellLoading(true)
    setBellHistory([])
    try {
      const { data } = await api.get(`/thesis/student/${selectedStudent.id}/approval-history`)
      setBellHistory(data)
      setBellStudentId(selectedStudent.id)
    } catch {
      message.error('Ошибка загрузки истории отклонений')
    } finally {
      setBellLoading(false)
    }
  }

  const handleSubmitApproval = (studentId: number, isResubmit = false) => {
    Modal.confirm({
      title: isResubmit
        ? 'Отправить тему повторно на утверждение?'
        : 'Отправить тему на утверждение?',
      content:
        'После отправки изменение данных ВКР будет заблокировано до решения заведующего кафедрой.',
      okText: 'Отправить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.post(`/thesis/student/${studentId}/submit-approval`)
          message.success('Тема отправлена на утверждение')
          const fresh = await loadTheses(true)
          if (fresh) {
            const student = fresh.find((t: any) => t.id === studentId)
            if (student) setSelectedStudent(student)
          }
        } catch (err: any) {
          message.error(err.response?.data?.message ?? 'Ошибка при отправке')
        }
      },
    })
  }

  const handleUpdateApprovalDate = async (studentId: number, date: dayjs.Dayjs) => {
    try {
      await api.patch(`/thesis/student/${studentId}/approval-date`, { date: date.toISOString() })
      message.success('Дата утверждения обновлена')
      const fresh = await loadTheses(true)
      if (fresh) {
        const student = fresh.find((t: any) => t.id === studentId)
        if (student) setSelectedStudent(student)
      }
    } catch {
      message.error('Ошибка при обновлении даты')
    }
  }

  const handleDirectApprove = (studentId: number) => {
    Modal.confirm({
      title: 'Утвердить тему?',
      content: 'Тема будет переведена в статус «Утверждена» без отправки заявки.',
      okText: 'Утвердить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.post(`/thesis/student/${studentId}/direct-approve`)
          message.success('Тема утверждена')
          const fresh = await loadTheses(true)
          if (fresh) {
            const student = fresh.find((t: any) => t.id === studentId)
            if (student) setSelectedStudent(student)
          }
        } catch (err: any) {
          message.error(err.response?.data?.message ?? 'Ошибка при утверждении')
        }
      },
    })
  }

  const handleAssign = () => {
    if (!selectedStudent) return
    Modal.confirm({
      title: 'Закрепить за собой?',
      content: isHead ? (
        <span>
          <strong>
            {selectedStudent.last_name} {selectedStudent.first_name}
          </strong>{' '}
          будет закреплён за вами.
        </span>
      ) : (
        `Заявка на закрепление будет отправлена заведующему кафедрой.`
      ),
      okText: 'Закрепить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const { data } = await api.post(`/thesis/student/${selectedStudent.id}/assign`)
          message.success(
            data.mode === 'assigned'
              ? 'Студент закреплён за вами'
              : 'Заявка на закрепление отправлена',
          )
          const fresh = await loadTheses(true)
          if (fresh) {
            const student = fresh.find((t: any) => t.id === selectedStudent.id)
            if (student) setSelectedStudent(student)
          }
        } catch (err: any) {
          if (err.response?.data?.needsProfile) {
            Modal.warning({
              title: 'Необходимо заполнить профиль',
              content: err.response.data.message,
              okText: 'Перейти в профиль',
              cancelText: 'Закрыть',
              onOk: () => navigate('/profile'),
            })
          } else {
            message.error(err.response?.data?.message ?? 'Ошибка при закреплении')
          }
        }
      },
    })
  }

  const handleDeleteStudent = () => {
    if (!selectedStudent) return
    Modal.confirm({
      title: 'Удалить студента?',
      content: (
        <span>
          <strong>
            {selectedStudent.last_name} {selectedStudent.first_name}
          </strong>{' '}
          и все его данные по ВКР будут удалены безвозвратно.
        </span>
      ),
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
        goal: updated.goal,
        tasks: updated.tasks,
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

  const handleAddStudent = async () => {
    if (!addStudentGroupId || !addStudentForm.last_name.trim() || !addStudentForm.first_name.trim())
      return
    setAddStudentLoading(true)
    try {
      await api.post('/thesis/student', { ...addStudentForm, group_id: addStudentGroupId })
      message.success('Студент добавлен')
      setAddStudentOpen(false)
      loadTheses()
    } catch (err: any) {
      message.error(err.response?.data?.message ?? 'Ошибка при добавлении')
    } finally {
      setAddStudentLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importGroupId || importFileList.length === 0) return
    setImportLoading(true)
    try {
      const formData = new FormData()
      formData.append('group_id', String(importGroupId))
      formData.append('file', importFileList[0] as unknown as File)
      const { data } = await api.post('/thesis/import', formData)

      let msg = `Импортировано: ${data.added}`
      if (data.skipped > 0) msg += `, пропущено (уже существуют): ${data.skipped}`
      message.success(msg)

      if (data.errors?.length > 0) {
        Modal.warning({
          title: 'Часть строк не была импортирована',
          content: (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {data.errors.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ),
        })
      }

      setImportModalOpen(false)
      setImportGroupId(null)
      setImportFileList([])
      loadTheses()
    } catch (err: any) {
      message.error(err.response?.data?.message ?? 'Ошибка при импорте')
    } finally {
      setImportLoading(false)
    }
  }

  useEffect(() => {
    loadTheses()
    loadGroups()
    loadReviewers()
    loadThesisSupervisors()
    if (!searchParams.get('graduation_year')) {
      api
        .get('/groups/current-year')
        .then(({ data }) => setYearFilter(data.year))
        .catch(() => {})
    }
  }, [])

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
    const matchYear =
      yearFilter === null ||
      allGroupsFull.find((g) => g.name === t.group_name)?.graduation_year === yearFilter
    const matchStatus = statusFilter.length === 0 || statusFilter.includes(t.status)
    const matchMine = !onlyMine || t.supervisor_id === currentUserId

    return matchSearch && matchGroup && matchYear && matchStatus && matchMine
  })

  const tableData = (() => {
    const rows: any[] = []
    const visibleGroups = allGroupsFull.filter((g) => {
      if (yearFilter !== null && g.graduation_year !== yearFilter) return false
      if (groupFilter.length > 0 && !groupFilter.includes(g.name)) return false
      return true
    })
    const hasActiveFilter = onlyMine || !!search || statusFilter.length > 0
    for (const group of visibleGroups) {
      const groupRows = filtered.filter((t) => t.group_name === group.name)
      if (hasActiveFilter && groupRows.length === 0) continue
      rows.push({
        _isGroupHeader: true,
        _groupName: group.name,
        _groupId: group.id,
        id: `header-${group.name}`,
      })
      if (groupRows.length === 0) {
        rows.push({ _isEmptyGroup: true, id: `empty-${group.name}` })
      } else {
        rows.push(...groupRows.map((r, i) => ({ ...r, _groupIndex: i + 1 })))
      }
    }
    rows.push(
      ...filtered.filter((t) => !t.group_name).map((r, i) => ({ ...r, _groupIndex: i + 1 })),
    )
    return rows
  })()

  const firstCell = (row: any) =>
    row._isGroupHeader || row._isEmptyGroup ? { colSpan: COL_COUNT } : {}
  const dataCell = (row: any) => (row._isGroupHeader || row._isEmptyGroup ? { colSpan: 0 } : {})

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 48,
      onCell: firstCell,
      render: (row: any) =>
        row._isEmptyGroup ? (
          <div style={{ textAlign: 'center' }}>
            <span className="no-data">Студенты отсутствуют</span>
          </div>
        ) : row._isGroupHeader ? (
          <div className="group-header-cell">
            <span className="group-header-label">Группа {row._groupName}</span>
            <PlusOutlined
              className="group-add-icon"
              onClick={() => {
                setAddStudentGroupId(row._groupId)
                setAddStudentGroupName(row._groupName)
                setAddStudentForm({
                  last_name: '',
                  first_name: '',
                  middle_name: '',
                  email: '',
                  phone: '',
                  topic: '',
                })
                setAddStudentOpen(true)
              }}
            />
          </div>
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
          <UserOutlined className="student-profile-icon" onClick={() => setSelectedStudent(row)} />
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
      key: 'status',
      width: 150,
      onCell: dataCell,
      render: (_: any, row: any) => {
        if (!row.status) return <span className="no-data">—</span>
        const s = VKR_STATUS_LABELS[row.status] || { label: row.status, color: 'default' }
        return (
          <div style={{ textAlign: 'center' }}>
            <Tag color={s.color}>{s.label}</Tag>
            {row.status === 'APPROVED' && row.approved_at && (
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11, marginTop: 2 }}>
                {dayjs(row.approved_at).format('DD.MM.YY')}
              </div>
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
          placeholder="Год выпуска"
          allowClear
          style={{ minWidth: 130 }}
          value={yearFilter}
          onChange={(val) => {
            setYearFilter(val ?? null)
            setGroupFilter([])
          }}
          options={[...new Set(allGroups.map((g) => g.graduation_year))]
            .sort()
            .map((y) => ({ value: y, label: `Выпуск ${y}` }))}
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
          options={allGroups
            .filter((g) => yearFilter === null || g.graduation_year === yearFilter)
            .map((g) => ({ value: g.name, label: g.name }))}
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
        {isSupervisor && (
          <Switch
            checked={onlyMine}
            onChange={setOnlyMine}
            checkedChildren="Мои студенты"
            unCheckedChildren="Все темы"
          />
        )}
        {isSecretary && (
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            onClick={async () => {
              try {
                const { data } = await api.get('/documents/theses-order', {
                  params: { year: yearFilter || undefined },
                  responseType: 'blob',
                })
                const url = URL.createObjectURL(new Blob([data]))
                const link = document.createElement('a')
                link.href = url
                link.download = `Приказ_темы_${yearFilter}.docx`
                link.click()
                URL.revokeObjectURL(url)
              } catch {
                message.error('Ошибка формирования приказа')
              }
            }}
          >
            Сформировать приказ
          </Button>
        )}
        {isPracticeSupervisor && (
          <Button type="primary" icon={<ImportOutlined />} onClick={() => setImportModalOpen(true)}>
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
        locale={{ emptyText: 'Студенты отсутствуют' }}
        onRow={(row) => ({ className: row._isGroupHeader ? 'group-header-row' : '' })}
      />
      <Modal
        open={!!selectedStudent}
        onCancel={() => setSelectedStudent(null)}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: 36 }}>
            <div className="student-modal-title" style={{ flex: 1 }}>
              <span>Профиль студента</span>
              <DeleteOutlined className="student-modal-delete" onClick={handleDeleteStudent} />
            </div>
            {selectedStudent?.approval_comment && (
              <Popover
                open={bellOpen}
                onOpenChange={(open) => {
                  setBellOpen(open)
                  if (open) handleOpenBell()
                }}
                trigger="click"
                title="История отклонений"
                placement="bottomRight"
                getPopupContainer={(trigger) =>
                  (trigger.closest('.ant-modal-content') as HTMLElement) ?? document.body
                }
                content={
                  bellLoading ? (
                    <div style={{ padding: '8px 0', textAlign: 'center' }}>
                      <Spin size="small" />
                    </div>
                  ) : bellHistory.length === 0 ? (
                    <span style={{ color: '#bfbfbf' }}>Нет записей</span>
                  ) : (
                    <div
                      style={{
                        maxWidth: 320,
                        maxHeight: 260,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      {bellHistory.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            borderBottom: i < bellHistory.length - 1 ? '1px solid #f0f0f0' : 'none',
                            paddingBottom: i < bellHistory.length - 1 ? 10 : 0,
                          }}
                        >
                          <div style={{ color: '#888', fontSize: 12 }}>
                            {dayjs(item.resolved_at).format('DD.MM.YYYY HH:mm')}
                          </div>
                          <div style={{ marginTop: 3 }}>{item.comment}</div>
                        </div>
                      ))}
                    </div>
                  )
                }
              >
                <Badge dot offset={[-2, 2]}>
                  <BellOutlined
                    style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', cursor: 'pointer' }}
                  />
                </Badge>
              </Popover>
            )}
          </div>
        }
        width={800}
        centered
        destroyOnHidden
        className="student-profile-modal"
      >
        {selectedStudent &&
          (() => {
            const s = selectedStudent
            const supervisorFio = [
              s.supervisor_last_name,
              s.supervisor_first_name,
              s.supervisor_middle_name,
            ]
              .filter(Boolean)
              .join(' ')
            const status = s.status ? VKR_STATUS_LABELS[s.status] : null
            const save = (field: string) => (value: string) => handleFieldSave(field, value)
            const supervisorLocked =
              isSupervisor &&
              !isHead &&
              ((s.supervisor_id !== null && s.supervisor_id !== currentUserId) ||
                s.status === 'ON_APPROVAL' ||
                s.status === 'APPROVED')
            const canSubmitApproval =
              isSupervisor &&
              !isHead &&
              s.supervisor_id === currentUserId &&
              (s.status === 'ASSIGNED' || s.status === 'REJECTED')
            return (
              <>
                <div className="desc-table">
                  <EditableRow
                    label="Фамилия"
                    value={s.last_name}
                    disabled={supervisorLocked}
                    onSave={save('last_name')}
                  />
                  <EditableRow
                    label="Имя"
                    value={s.first_name}
                    disabled={supervisorLocked}
                    onSave={save('first_name')}
                  />
                  <EditableRow
                    label="Отчество"
                    value={s.middle_name}
                    disabled={supervisorLocked}
                    onSave={save('middle_name')}
                  />
                  <EditableRow
                    label="Email"
                    value={s.email}
                    disabled={supervisorLocked}
                    onSave={save('email')}
                  />
                  <EditableRow
                    label="Телефон"
                    value={s.phone}
                    displayValue={formatPhone(s.phone)}
                    disabled={supervisorLocked}
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
                </div>

                <div className="desc-section-title">ВКР</div>
                <div className="desc-table">
                  <EditableRow
                    label="Тема"
                    value={s.topic}
                    multiline
                    disabled={supervisorLocked}
                    onSave={save('topic')}
                  />
                  <EditableRow
                    label="Цель"
                    value={s.goal}
                    multiline
                    disabled={supervisorLocked}
                    onSave={save('goal')}
                  />
                  <EditableRow
                    label="Задачи"
                    value={s.tasks}
                    multiline
                    disabled={supervisorLocked}
                    onSave={save('tasks')}
                    renderDisplay={(v) =>
                      v ? (
                        <span
                          style={{
                            whiteSpace: 'pre-wrap',
                            maxHeight: 140,
                            overflowY: 'auto',
                            display: 'block',
                          }}
                        >
                          {v}
                        </span>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <StaticRow label="Статус">
                    <div className="desc-display">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {status ? (
                          <Tag color={status.color} style={{ margin: 0 }}>
                            {status.label}
                          </Tag>
                        ) : (
                          '—'
                        )}
                        {s.status === 'APPROVED' &&
                          s.approved_at &&
                          (isHead ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <DatePicker
                                ref={approvalDatePickerRef}
                                open={approvalDatePickerOpen}
                                onOpenChange={(o) => {
                                  if (!o) setApprovalDatePickerOpen(false)
                                }}
                                value={dayjs(s.approved_at)}
                                onChange={(date) => {
                                  if (!date || dayjs(s.approved_at).isSame(date, 'day')) return
                                  handleUpdateApprovalDate(s.id, date)
                                }}
                                format="DD.MM.YY"
                                size="small"
                                variant="borderless"
                                allowClear={false}
                                suffixIcon={null}
                                className="approval-date-picker"
                              />
                              <EditOutlined
                                className="approval-date-edit-icon"
                                onClick={() => setApprovalDatePickerOpen(true)}
                              />
                            </span>
                          ) : (
                            <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
                              {dayjs(s.approved_at).format('DD.MM.YY')}
                            </span>
                          ))}
                      </span>
                      {canSubmitApproval && (
                        <Button
                          size="small"
                          style={{ flexShrink: 0 }}
                          onClick={() => handleSubmitApproval(s.id, s.status === 'REJECTED')}
                        >
                          {s.status === 'REJECTED'
                            ? 'Отправить повторно'
                            : 'Отправить на утверждение'}
                        </Button>
                      )}
                      {isHead && (s.status === 'ASSIGNED' || s.status === 'REJECTED') && (
                        <Button
                          size="small"
                          style={{ flexShrink: 0 }}
                          onClick={() => handleDirectApprove(s.id)}
                        >
                          Утвердить
                        </Button>
                      )}
                    </div>
                  </StaticRow>
                  <SupervisorRow
                    supervisorFio={supervisorFio}
                    supervisorId={s.supervisor_id ?? null}
                    supervisors={thesisSupervisors}
                    currentUserId={currentUserId}
                    isHead={isHead}
                    isSupervisor={isSupervisor}
                    hasPendingRequest={!!s.has_pending_request}
                    canAssign={s.status === 'UNASSIGNED'}
                    canClear={s.status !== 'APPROVED'}
                    onSaveAsHead={handleSupervisorSave}
                    onAssign={handleAssign}
                    onGoToRequests={() => {
                      setSelectedStudent(null)
                      navigate('/requests/assignment')
                    }}
                  />
                  {s.education_level === 'MASTER' && (
                    <ReviewerRow
                      reviewerFio={
                        [s.reviewer_last_name, s.reviewer_first_name, s.reviewer_middle_name]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                      reviewerId={s.reviewer_id}
                      reviewers={reviewers}
                      onSave={handleReviewerSave}
                      onGenerate={() =>
                        handleGenerateDirection(s.id, s.last_name, s.first_name, s.middle_name)
                      }
                      canEdit={isHead}
                    />
                  )}
                  <EditableRow
                    label="Место выполнения"
                    value={s.practice_place}
                    disabled={supervisorLocked}
                    onSave={save('practice_place')}
                  />
                  <EditableRow
                    label="Руководитель от предприятия"
                    value={s.company_supervisor}
                    disabled={supervisorLocked}
                    onSave={save('company_supervisor')}
                  />
                  {s.status === 'APPROVED' && (
                    <DefenseDateRow
                      value={s.defense_date}
                      dateId={s.defense_date_id}
                      options={groupDefenseDates}
                      onSave={handleDefenseDateSave}
                      canEdit={isHead || isSecretary}
                    />
                  )}
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
        onOk={handleImport}
        okText="Импортировать"
        cancelText="Отмена"
        title="Импортировать список студентов"
        okButtonProps={{
          disabled: !importGroupId || importFileList.length === 0,
          loading: importLoading,
        }}
        destroyOnHidden
      >
        <div className="import-modal-body">
          <div className="import-field">
            <div className="import-label">
              Учебная группа <span className="import-required">*</span>
            </div>
            <Select
              placeholder="Выберите группу"
              value={importGroupId}
              onChange={setImportGroupId}
              options={allGroupsFull.map((g) => ({ value: g.id, label: g.name }))}
              style={{ width: '100%' }}
            />
          </div>
          <div className="import-field">
            <div className="import-label">
              Файл со списком <span className="import-required">*</span>
            </div>
            <Upload
              accept=".xlsx,.xls,.csv"
              maxCount={1}
              beforeUpload={(file) => {
                setImportFileList([file])
                return false
              }}
              fileList={importFileList}
              onRemove={() => setImportFileList([])}
            >
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
            <div className="import-hint">
              Формат: .xlsx · Столбцы: ФИО, Email, Телефон, Тема ВКР
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={addStudentOpen}
        onCancel={() => setAddStudentOpen(false)}
        onOk={handleAddStudent}
        okText="Добавить"
        cancelText="Отмена"
        title={`Добавить студента — группа ${addStudentGroupName}`}
        okButtonProps={{
          disabled: !addStudentForm.last_name.trim() || !addStudentForm.first_name.trim(),
          loading: addStudentLoading,
        }}
        destroyOnHidden
      >
        <div className="import-modal-body">
          <div className="import-field">
            <div className="import-label">
              Фамилия <span className="import-required">*</span>
            </div>
            <Input
              value={addStudentForm.last_name}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
          <div className="import-field">
            <div className="import-label">
              Имя <span className="import-required">*</span>
            </div>
            <Input
              value={addStudentForm.first_name}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div className="import-field">
            <div className="import-label">Отчество</div>
            <Input
              value={addStudentForm.middle_name}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, middle_name: e.target.value }))}
            />
          </div>
          <div className="import-field">
            <div className="import-label">Email</div>
            <Input
              value={addStudentForm.email}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="import-field">
            <div className="import-label">Телефон</div>
            <Input
              value={addStudentForm.phone}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="import-field">
            <div className="import-label">Тема ВКР</div>
            <Input.TextArea
              value={addStudentForm.topic}
              onChange={(e) => setAddStudentForm((f) => ({ ...f, topic: e.target.value }))}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={profileFillModal.open}
        title="Профиль руководителя не заполнен"
        okText="Сохранить и назначить"
        cancelText="Отмена"
        okButtonProps={{
          disabled:
            !profileFillModal.position ||
            (hasDegree(profileFillModal.position) && !profileFillModal.degree),
        }}
        onOk={handleProfileFillAndSave}
        onCancel={() =>
          setProfileFillModal({
            open: false,
            supervisorId: null,
            supervisorFio: '',
            position: '',
            degree: '',
          })
        }
        destroyOnHidden
      >
        <p style={{ marginBottom: 16, color: 'rgba(0,0,0,0.65)' }}>
          У руководителя <strong>{toShortFio(profileFillModal.supervisorFio)}</strong> не заполнен
          профиль. Укажите должность
          {hasDegree(profileFillModal.position) ? ' и учёную степень' : ''}, чтобы продолжить.
        </p>
        <div className="import-modal-body">
          <div className="import-field">
            <div className="import-label">
              Должность <span className="import-required">*</span>
            </div>
            <Select
              style={{ width: '100%' }}
              placeholder="Выберите должность"
              value={profileFillModal.position || undefined}
              onChange={(v) => {
                const pos = v ?? ''
                setProfileFillModal((m) => ({
                  ...m,
                  position: pos,
                  degree: hasDegree(pos) ? m.degree : '',
                }))
              }}
              options={Object.entries(POSITION_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          {hasDegree(profileFillModal.position) && (
            <div className="import-field">
              <div className="import-label">
                Учёная степень <span className="import-required">*</span>
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Выберите учёную степень"
                value={profileFillModal.degree || undefined}
                onChange={(v) => setProfileFillModal((m) => ({ ...m, degree: v ?? '' }))}
                options={Object.entries(DEGREE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
