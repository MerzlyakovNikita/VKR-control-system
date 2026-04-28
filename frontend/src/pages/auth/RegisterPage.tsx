import { Form, Input, Button, Card, message } from 'antd'
import { api } from '../../shared/api/axios'
import { useNavigate } from 'react-router-dom'
import './AuthPage.css'

export default function RegisterPage() {
  const navigate = useNavigate()

  const onFinish = async (values: any) => {
    try {
      const { data } = await api.post('/auth/register', values)

      localStorage.setItem('token', data.token)

      message.success('Успешная регистрация')

      navigate('/profile')
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Ошибка регистрации')
    }
  }

  return (
    <div className="auth-container">
      <Card title="Регистрация" className="auth-card">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Фамилия" name="lastName" required>
            <Input />
          </Form.Item>

          <Form.Item label="Имя" name="firstName" required>
            <Input />
          </Form.Item>

          <Form.Item label="Отчество" name="middleName">
            <Input />
          </Form.Item>

          <Form.Item label="Email" name="email" required>
            <Input />
          </Form.Item>

          <Form.Item label="Телефон" name="phone">
            <Input />
          </Form.Item>

          <Form.Item label="Пароль" name="password" required>
            <Input.Password />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Зарегистрироваться
          </Button>
        </Form>
      </Card>
    </div>
  )
}
