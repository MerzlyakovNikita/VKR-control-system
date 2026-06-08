import { useEffect, useMemo, useState } from 'react'
import { Table, Radio, Input, Empty, Button, Modal, Form, Select, Switch, message } from 'antd'
import { SearchOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import { hasRole } from '../../shared/lib/auth'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editingReviewer, setEditingReviewer] = useState<Reviewer | null>(null)
  const [form] = Form.useForm()
  const isSecretary = hasRole('SECRETARY')
  const [studentsModal, setStudentsModal] = useState<{
    open: boolean
    reviewer: Reviewer | null
    students: {
      id: number
      last_name: string
      first_name: string
      middle_name: string | null
      group_name: string
    }[]
    loading: boolean
  }>({ open: false, reviewer: null, students: [], loading: false })

  const openStudents = async (r: Reviewer) => {
    setStudentsModal({ open: true, reviewer: r, students: [], loading: true })
    try {
      const { data } = await api.get(`/reviewers/${r.id}/students`)
      setStudentsModal((prev) => ({ ...prev, students: data, loading: false }))
    } catch {
      message.error('Ошибка загрузки студентов')
      setStudentsModal((prev) => ({ ...prev, loading: false }))
    }
  }

  const load = () => {
    setLoading(true)
    api
      .get('/reviewers')
      .then(({ data }) => setReviewers(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditingReviewer(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (r: Reviewer) => {
    setEditingReviewer(r)
    form.setFieldsValue({
      last_name: r.last_name,
      first_name: r.first_name,
      middle_name: r.middle_name ?? '',
      degree: r.degree,
      position: r.position,
      workplace: r.workplace,
      email: r.email ?? '',
      phone: r.phone ?? '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)
      if (editingReviewer) {
        await api.put(`/reviewers/${editingReviewer.id}`, values)
        message.success('Данные рецензента обновлены')
      } else {
        await api.post('/reviewers', values)
        message.success('Рецензент добавлен')
      }
      setModalOpen(false)
      form.resetFields()
      load()
    } catch {
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleActive = async (reviewer: Reviewer, checked: boolean) => {
    try {
      await api.patch(`/reviewers/${reviewer.id}/active`, { is_active: checked })
      setReviewers((prev) =>
        prev.map((r) => (r.id === reviewer.id ? { ...r, is_active: checked } : r)),
      )
    } catch {
      message.error('Ошибка обновления статуса')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return reviewers.filter((r) => {
      if (filter === 'active' && !r.is_active) return false
      if (filter === 'inactive' && r.is_active) return false
      if (q && !fio(r).toLowerCase().includes(q)) return false
      return true
    })
  }, [reviewers, search, filter])

  const nowrap = { onCell: () => ({ style: { whiteSpace: 'nowrap' as const } }) }

  const columns = [
    {
      title: 'ФИО',
      key: 'fio',
      width: 260,
      ...nowrap,
      render: (r: Reviewer) => fio(r),
    },
    {
      title: 'Учёная степень',
      dataIndex: 'degree',
      key: 'degree',
      width: 270,
      ...nowrap,
      render: (v: string | null) => (v ? (DEGREE_LABELS[v] ?? v) : '—'),
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      ...nowrap,
      render: (v: string | null) => (v ? (POSITION_LABELS[v] ?? v) : '—'),
    },
    {
      title: 'Место работы',
      dataIndex: 'workplace',
      key: 'workplace',
      width: 380,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 240,
      ...nowrap,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      ...nowrap,
      render: (v: string | null) => (v ? formatPhone(v) : '—'),
    },
    {
      title: 'Студентов',
      key: 'student_count',
      width: 100,
      align: 'center' as const,
      ...nowrap,
      render: (r: Reviewer) =>
        r.student_count > 0 ? (
          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openStudents(r)}>
            {r.student_count}
          </Button>
        ) : (
          <span>0</span>
        ),
    },
    {
      title: 'Этот год',
      key: 'is_active',
      width: 90,
      align: 'center' as const,
      render: (r: Reviewer) => (
        <Switch
          checked={r.is_active}
          onChange={(checked) => handleToggleActive(r, checked)}
          size="small"
        />
      ),
    },
    ...(isSecretary
      ? [
          {
            key: 'actions',
            width: 48,
            render: (r: Reviewer) => (
              <EditOutlined className="reviewer-edit-icon" onClick={() => openEdit(r)} />
            ),
          },
        ]
      : []),
  ]

  const required = (msg: string) => [{ required: true, message: msg }]

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
            { value: 'active', label: 'Этот год' },
            { value: 'inactive', label: 'Неактивные' },
            { value: 'all', label: 'Все' },
          ]}
        />
        {isSecretary && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Добавить рецензента
          </Button>
        )}
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: <Empty description="Рецензенты отсутствуют" /> }}
      />

      <Modal
        open={studentsModal.open}
        centered
        title={
          studentsModal.reviewer ? `Студенты рецензента — ${fio(studentsModal.reviewer)}:` : ''
        }
        footer={null}
        onCancel={() => setStudentsModal((prev) => ({ ...prev, open: false }))}
      >
        <Table
          dataSource={studentsModal.students}
          rowKey="id"
          loading={studentsModal.loading}
          pagination={false}
          size="small"
          locale={{ emptyText: <Empty description="Студенты не назначены" /> }}
          columns={[
            {
              title: 'ФИО',
              key: 'fio',
              render: (s: any) =>
                [s.last_name, s.first_name, s.middle_name].filter(Boolean).join(' '),
            },
            { title: 'Группа', dataIndex: 'group_name', key: 'group_name', width: 120 },
          ]}
        />
      </Modal>

      <Modal
        open={modalOpen}
        centered
        title={editingReviewer ? 'Редактировать рецензента' : 'Добавить рецензента'}
        okText={editingReviewer ? 'Сохранить' : 'Добавить'}
        cancelText="Отмена"
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="last_name" label="Фамилия" rules={required('Введите фамилию')}>
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label="Имя" rules={required('Введите имя')}>
            <Input />
          </Form.Item>
          <Form.Item name="middle_name" label="Отчество" rules={required('Введите отчество')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="degree"
            label="Учёная степень"
            rules={required('Выберите учёную степень')}
          >
            <Select
              placeholder="Выберите степень"
              options={Object.entries(DEGREE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="position" label="Должность" rules={required('Выберите должность')}>
            <Select
              placeholder="Выберите должность"
              options={Object.entries(POSITION_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="workplace" label="Место работы" rules={required('Введите место работы')}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={required('Введите email')}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Телефон" rules={required('Введите телефон')}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
