import { useEffect, useMemo, useState } from 'react'
import { Table, Radio, Input, Empty } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { DEGREE_LABELS, POSITION_LABELS } from '../../shared/lib/constants'
import { formatPhone } from '../../shared/lib/normalize'
import './ReviewersPage.css'

interface Reviewer {
  id: number
  last_name: string
  first_name: string
  middle_name: string | null
  degree: string | null
  position: string | null
  workplace: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  student_count: number
}

const fio = (r: Reviewer) => [r.last_name, r.first_name, r.middle_name].filter(Boolean).join(' ')

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  useEffect(() => {
    setLoading(true)
    api
      .get('/reviewers')
      .then(({ data }) => setReviewers(data))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviewers.filter((r) => {
      if (filter === 'active' && !r.is_active) return false
      if (filter === 'inactive' && r.is_active) return false
      if (q && !fio(r).toLowerCase().includes(q)) return false
      return true
    })
  }, [reviewers, search, filter])

  const columns = [
    {
      title: 'ФИО',
      key: 'fio',
      render: (r: Reviewer) => fio(r),
    },
    {
      title: 'Учёная степень',
      dataIndex: 'degree',
      key: 'degree',
      render: (v: string | null) => (v ? (DEGREE_LABELS[v] ?? v) : '—'),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      render: (v: string | null) => (v ? (POSITION_LABELS[v] ?? v) : '—'),
    },
    {
      title: 'Место работы',
      dataIndex: 'workplace',
      key: 'workplace',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string | null) => (v ? formatPhone(v) : '—'),
    },
    {
      title: 'Студентов',
      dataIndex: 'student_count',
      key: 'student_count',
      width: 110,
      align: 'center' as const,
    },
  ]

  return (
    <div className="reviewers-page">
      <div className="reviewers-toolbar">
        <Input
          placeholder="Поиск по ФИО"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="reviewers-search"
        />
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={[
            { value: 'active', label: 'Действующие' },
            { value: 'inactive', label: 'Неактивные' },
            { value: 'all', label: 'Все' },
          ]}
        />
      </div>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{ emptyText: <Empty description="Рецензенты отсутствуют" /> }}
      />
    </div>
  )
}
