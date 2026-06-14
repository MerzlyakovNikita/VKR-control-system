import { Form, Input, Button, Card, message, Typography } from 'antd'
import { api } from '../../shared/api/axios'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

const { Text } = Typography

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
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Введите email' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Войти
          </Button>

          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
            Забыли пароль? Обратитесь к секретарю кафедры
          </Text>

          <Button type="link" block onClick={() => navigate('/register')} style={{ marginTop: 4 }}>
            Нет аккаунта? Зарегистрироваться
          </Button>
        </Form>
      </Card>
    </div>
  )
}
