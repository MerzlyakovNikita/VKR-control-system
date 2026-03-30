import { Button, Table } from 'antd'

export default function SecretaryThesisPage() {
  return (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }}>
        Сформировать приказ
      </Button>

      <Table columns={[{ title: 'Тема' }]} dataSource={[]} />
    </div>
  )
}