import { Layout, Menu, Dropdown, Avatar } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { getRole } from '../../shared/lib/auth'
import './MainLayout.css'

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
    <Layout className="main-layout">
      <Sider width={80} className="main-sider">
        <Dropdown menu={{ items: profileMenu }}>
          <Avatar size={44} className="main-avatar" icon={<UserOutlined />} />
        </Dropdown>
      </Sider>

      <Layout>
        <Header className="main-header">
          <Menu
            mode="horizontal"
            selectedKeys={[`/${location.pathname.split('/')[1]}`]}
            onClick={(e) => navigate(e.key)}
            items={[{ key: '/documents', label: 'Справочный материал' }]}
          />
        </Header>

        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
