import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Table, Card, Input } from 'antd'
import { api } from '../../shared/api/axios'
import { SearchOutlined } from '@ant-design/icons'
import './GroupPage.css'

export default function GroupPage() {
  const { id } = useParams()
  const [students, setStudents] = useState([])
  const [groupName, setGroupName] = useState('')
  const [search, setSearch] = useState('')

  const loadStudents = async () => {
    const { data } = await api.get(`/groups/${id}/students`)
    setStudents(data)
  }

  const loadGroup = async () => {
    const { data } = await api.get(`/groups/${id}`)
    setGroupName(data.name)
  }

  useEffect(() => {
    loadGroup()
    loadStudents()
  }, [id])

  const filteredStudents = students.filter((s: any) => {
    const query = search.toLowerCase()

    return (
      `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.toLowerCase().includes(query) ||
      (s.topic || '').toLowerCase().includes(query) ||
      (s.supervisor_name || '').toLowerCase().includes(query)
    )
  })

  const columns = [
    {
      title: 'ФИО студента',
      key: 'fio',
      width: 140,
      render: (row: any) => `${row.last_name} ${row.first_name} ${row.middle_name || ''}`,
    },
    {
      title: 'Телефон, почта',
      key: 'contacts',
      width: 180,
      render: (row: any) => (
        <div>
          <div>{row.phone || '-'}</div>
          <div>{row.email}</div>
        </div>
      ),
    },
    {
      title: 'Планируемая тема ВКР',
      dataIndex: 'topic',
      key: 'topic',
      width: 320,
    },
    {
      title: 'Руководитель от кафедры',
      dataIndex: 'supervisor_name',
      key: 'supervisor_name',
      width: 220,
    },
    {
      title: (
        <>
          Место выполнения ВКР
          <br />
          (преддипломная практика)
        </>
      ),
      dataIndex: 'practice_place',
      key: 'practice_place',
      width: 180,
    },
    {
      title: (
        <>
          Руководитель от предприятия
          <br />
          (ФИО, телефон)
        </>
      ),
      dataIndex: 'company_supervisor_name',
      key: 'company_supervisor_name',
      width: 220,
    },
  ]

  return (
    <div className="group-page">
      <Card title={`Студенты группы ${groupName}`}>
        <div className="group-search">
          <Input
            placeholder="Поиск по студентам, теме ВКР..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>
        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="id"
          pagination={false}
          tableLayout="fixed"
        />
      </Card>
    </div>
  )
}
