import { useEffect, useState } from 'react'
import { Table, Button, Upload, message, Alert, Typography, Select, Space } from 'antd'
import { UploadOutlined, ScheduleOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../../shared/api/axios'
import { hasRole } from '../../shared/lib/auth'
import { EDUCATION_FORM_LABELS } from '../../shared/lib/constants'
import './SchedulePage.css'

const { Text } = Typography

interface ScheduleRow {
  id: number
  group_name: string
  direction_code: string
  education_form: string
  capacity: number | null
  defense_date: string
  defense_time: string
  room: string
}

export default function SchedulePage() {
  const isSecretary = hasRole('SECRETARY')
  const [rows, setRows] = useState<ScheduleRow[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [autoAssigning, setAutoAssigning] = useState(false)
  const [year, setYear] = useState<number>(0)
  const [availableYears, setAvailableYears] = useState<number[]>([])

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [missingGroups, setMissingGroups] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [scheduleYear, setScheduleYear] = useState<number | null>(null)
  const [allGroups, setAllGroups] = useState<{ name: string; graduation_year: number }[]>([])

  const load = async (y: number) => {
    setLoading(true)
    try {
      const { data } = await api.get('/schedule', { params: { year: y } })
      setRows(data)
    } catch {
      message.error('Ошибка загрузки расписания')
    } finally {
      setLoading(false)
    }
  }

  const loadYears = async () => {
    try {
      const { data } = await api.get('/schedule/years')
      setAvailableYears(data)
    } catch {}
  }

  useEffect(() => {
    api.get('/groups/current-year').then(({ data }) => {
      setYear(data.year)
      load(data.year)
    })
    loadYears()
    if (isSecretary) {
      api
        .get('/groups')
        .then(({ data }) => {
          setAllGroups(
            [...data].sort((a: any, b: any) => a.name.localeCompare(b.name, 'ru')).map((g: any) => ({
              name: g.name,
              graduation_year: g.graduation_year,
            })),
          )
        })
        .catch(() => {})
    }
  }, [])

  const handleYearChange = (y: number) => {
    setYear(y)
    load(y)
  }

  const doImport = async (file: File, groupMapping: Record<string, string>) => {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (Object.keys(groupMapping).length > 0) {
        formData.append('mapping', JSON.stringify(groupMapping))
      }
      const { data } = await api.post('/schedule/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const parts = []
      if (data.inserted) parts.push(`добавлено: ${data.inserted}`)
      if (data.updated) parts.push(`обновлено: ${data.updated}`)
      message.success(`Импорт завершён${parts.length ? ` (${parts.join(', ')})` : ''}`)
      setPendingFile(null)
      setMissingGroups([])
      setMapping({})
      setScheduleYear(null)
      load(year)
      loadYears()
    } catch (e: any) {
      const resp = e.response?.data
      if (resp?.missing?.length) {
        setMissingGroups(resp.missing)
        setScheduleYear(resp.scheduleYear ?? null)
        setMapping((prev) => {
          const next = { ...prev }
          for (const name of resp.missing) {
            if (!next[name]) next[name] = ''
          }
          return next
        })
      } else {
        message.error(resp?.message || 'Ошибка импорта')
      }
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    try {
      const { data } = await api.get('/schedule/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.download = 'График_защит.xlsx'
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      message.error('Ошибка при выгрузке файла')
    }
  }

  const handleAutoAssign = async () => {
    setAutoAssigning(true)
    try {
      const { data } = await api.post('/schedule/auto-assign')
      if (data.overflowGroups?.length) {
        message.warning(
          `Назначено: ${data.assigned}. Не хватило мест для групп: ${data.overflowGroups.join(', ')}`,
          6,
        )
      } else if (data.assigned === 0) {
        message.info('Все студенты уже распределены по датам защит')
      } else {
        message.success(`Автораспределение завершено, назначено студентов: ${data.assigned}`)
      }
    } catch {
      message.error('Ошибка при автораспределении')
    } finally {
      setAutoAssigning(false)
    }
  }

  const handleUpload = (file: File) => {
    setPendingFile(file)
    setMissingGroups([])
    setMapping({})
    setScheduleYear(null)
    doImport(file, {})
    return false
  }

  const handleConfirm = () => {
    if (!pendingFile) return
    const incomplete = missingGroups.some((g) => !mapping[g])
    if (incomplete) {
      message.warning('Выберите соответствие для всех групп')
      return
    }
    doImport(pendingFile, mapping)
  }

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 44,
      align: 'center' as const,
      render: (_: any, __: any, i: number) => i + 1,
    },
    {
      title: 'Код направления',
      dataIndex: 'direction_code',
      key: 'direction_code',
      width: 140,
      align: 'center' as const,
    },
    {
      title: 'Форма обучения',
      dataIndex: 'education_form',
      key: 'education_form',
      width: 110,
      align: 'center' as const,
      render: (v: string) => EDUCATION_FORM_LABELS[v] ?? v,
    },
    {
      title: 'Контингент студентов',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 90,
      align: 'center' as const,
    },
    {
      title: 'Группа',
      dataIndex: 'group_name',
      key: 'group_name',
      width: 130,
      align: 'center' as const,
    },
    {
      title: 'Дата защиты',
      dataIndex: 'defense_date',
      key: 'defense_date',
      width: 110,
      align: 'center' as const,
      render: (v: string) => dayjs(v).format('DD.MM.YY'),
    },
    {
      title: 'Время',
      dataIndex: 'defense_time',
      key: 'defense_time',
      width: 70,
      align: 'center' as const,
      render: (v: string) => v?.slice(0, 5),
    },
    { title: 'Аудитория', dataIndex: 'room', key: 'room', width: 90, align: 'center' as const },
  ]

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h2>График защит ВКР</h2>
        <Space>
          {isSecretary && (
            <>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                Выгрузить список
              </Button>
              <Button
                type="primary"
                icon={<ScheduleOutlined />}
                loading={autoAssigning}
                onClick={handleAutoAssign}
              >
                Автораспределить студентов
              </Button>
              <Upload accept=".docx" showUploadList={false} beforeUpload={handleUpload}>
                <Button type="primary" icon={<UploadOutlined />} loading={importing}>
                  Импортировать расписание
                </Button>
              </Upload>
            </>
          )}
          {availableYears.length > 0 && (
            <Select
              value={year || undefined}
              onChange={handleYearChange}
              style={{ width: 100 }}
              options={availableYears.map((y) => ({ value: y, label: String(y) }))}
            />
          )}
        </Space>
      </div>

      {missingGroups.length > 0 && (
        <Alert
          type="warning"
          className="schedule-alert"
          message="Некоторые группы из графика не найдены в системе — укажите соответствие:"
          description={
            <div className="schedule-mapping-list">
              {missingGroups.map((name) => (
                <div key={name} className="schedule-mapping-row">
                  <Text code className="schedule-mapping-label">
                    {name}
                  </Text>
                  <Text type="secondary">→</Text>
                  <Select
                    className="schedule-mapping-select"
                    placeholder="Выберите группу в системе"
                    value={mapping[name] || undefined}
                    onChange={(v) => setMapping((prev) => ({ ...prev, [name]: v }))}
                    showSearch
                    options={allGroups
                      .filter((g) => !scheduleYear || g.graduation_year === scheduleYear)
                      .map((g) => ({ value: g.name, label: g.name }))}
                  />
                </div>
              ))}
              <Space className="schedule-mapping-actions">
                <Button type="primary" loading={importing} onClick={handleConfirm}>
                  Подтвердить и импортировать
                </Button>
                <Button
                  onClick={() => {
                    setMissingGroups([])
                    setMapping({})
                    setPendingFile(null)
                    setScheduleYear(null)
                  }}
                >
                  Отмена
                </Button>
              </Space>
            </div>
          }
        />
      )}

      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={false}
        locale={{ emptyText: 'Расписание не загружено' }}
      />
    </div>
  )
}
