import { Form, Input, Button, Card } from 'antd'

export default function StudentThesisPage() {
  return (
    <Card title="Моя ВКР">
      <Form layout="vertical">
        <Form.Item label="Тема ВКР">
          <Input.TextArea />
        </Form.Item>

        <Form.Item label="Руководитель от кафедры">
          <Input />
        </Form.Item>

        <Form.Item label="Место выполнения ВКР">
          <Input />
        </Form.Item>

        <Form.Item label="Руководитель от предприятия">
          <Input />
        </Form.Item>

        <Button type="primary">Сохранить</Button>
      </Form>
    </Card>
  )
}