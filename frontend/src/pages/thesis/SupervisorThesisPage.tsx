import { Table, Button } from 'antd'

export default function SupervisorThesisPage() {
  return (
    <Table
      columns={[
        { title: 'Студент', dataIndex: 'student' },
        { title: 'Тема', dataIndex: 'topic' },
        {
          title: 'Действия',
          render: () => (
            <>
              <Button type="primary">Принять</Button>
              <Button danger>Отклонить</Button>
            </>
          ),
        },
      ]}
      dataSource={[]}
    />
  )
}