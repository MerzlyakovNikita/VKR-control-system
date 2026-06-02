import { Form, Input, Button, Card, message } from 'antd'
import { api } from '../../shared/api/axios'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      const { data } = await api.post('/auth/register', values)
      message.success(data.message)
      navigate('/login')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Ошибка отправки заявки')
    }
  }

  return (
    <div className="auth-container">
      <Card title="Регистрация" className="auth-card">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Фамилия"
            name="lastName"
            rules={[{ required: true, message: 'Введите фамилию' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Имя"
            name="firstName"
            rules={[{ required: true, message: 'Введите имя' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Отчество" name="middleName">
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Некорректный email' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input />
          </Form.Item>

          <Form.Item
            label="Пароль"
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Минимум 6 символов' },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Отправить заявку
          </Button>

          <Button type="link" block onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
            Уже есть аккаунт? Войти
          </Button>
        </Form>
      </Card>
    </div>
  )
}
