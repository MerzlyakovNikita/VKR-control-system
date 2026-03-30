import { Form, Input, Button, Card, message } from 'antd'
import { api } from '../../shared/api/axios'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      const { data } = await api.post('/auth/login', values)

      localStorage.setItem('token', data.token)

      message.success('Вход выполнен')

      navigate('/thesis')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Ошибка входа')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
      <Card title="Авторизация" style={{ width: 400 }}>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Email" name="email" required>
            <Input />
          </Form.Item>

          <Form.Item label="Пароль" name="password" required>
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Войти
          </Button>
        </Form>
      </Card>
    </div>
  )
}