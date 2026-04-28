import { Layout, Menu, Dropdown, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getRole } from '../../shared/lib/auth'

const { Header, Sider, Content } = Layout

export const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const role = getRole()

  const profileMenu = [
    {
      key: 'profile',
      label: 'Профиль',
      onClick: () => navigate('/profile'),
    },

    ...(role === 'SECRETARY'
      ? [
          {
            key: 'groups',
            label: 'Группы',
            onClick: () => navigate('/groups'),
          },
        ]
      : []),

    {
      key: 'logout',
      label: 'Выход',
      onClick: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      },
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={80}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 10,
        }}
      >
        <Dropdown menu={{ items: profileMenu }}>
          <Avatar
            size={44}
            style={{
              cursor: 'pointer',
              backgroundColor: '#1677ff',
            }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          }}
        >
          <Menu
            mode="horizontal"
            selectedKeys={[`/${location.pathname.split('/')[1]}`]}
            onClick={(e) => navigate(e.key)}
            items={[
              { key: '/documents', label: 'Справочный материал' },
            ]}
          />
        </Header>

        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}