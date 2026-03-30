import { Form, Input, Button, Card } from 'antd'

export default function LoginPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
      <Card title="Вход" style={{ width: 300 }}>
        <Form>
          <Form.Item name="email">
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item name="password">
            <Input.Password placeholder="Пароль" />
          </Form.Item>

          <Button type="primary" block>
            Войти
          </Button>
        </Form>
      </Card>
    </div>
  )
}