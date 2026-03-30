import { Layout, Menu, Dropdown, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { Outlet, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

export const MainLayout = () => {
  const navigate = useNavigate()

  const profileMenu = [
    {
      key: 'profile',
      label: 'Профиль',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      label: 'Выход',
      onClick: () => navigate('/login'),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu
          theme="dark"
          mode="inline"
          onClick={(e) => navigate(e.key)}
          items={[
            { key: '/thesis', label: 'ВКР' },
            { key: '/documents', label: 'Справочный материал' },
          ]}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          <div onClick={() => navigate('/thesis')} style={{ cursor: 'pointer' }}>
            Система управления ВКР
          </div>

          <Dropdown menu={{ items: profileMenu }}>
            <Avatar
              style={{ cursor: 'pointer' }}
              icon={<UserOutlined />}
            />
          </Dropdown>
        </Header>

        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}