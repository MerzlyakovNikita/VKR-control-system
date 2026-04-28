import { Form, Input, Button, Card, message } from 'antd'
import { api } from '../../shared/api/axios'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

export default function LoginPage() {
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      const { data } = await api.post('/auth/login', values)

      localStorage.setItem('token', data.token)
      const me = await api.get('/users/me')
      localStorage.setItem('user', JSON.stringify(me.data))

      message.success('Вход выполнен')

      navigate('/profile')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Ошибка входа')
    }
  }

  return (
    <div className="auth-container">
      <Card title="Авторизация" className="auth-card">
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