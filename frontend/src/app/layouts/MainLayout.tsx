import { useEffect, useState } from 'react'
import { Layout, Menu, Avatar, Tooltip, Modal } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { hasRole } from '../../shared/lib/auth'
import { api } from '../../shared/api/axios'
import './MainLayout.css'

const { Header, Sider, Content } = Layout

export const MainLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isPracticeSupervisor = hasRole('PRACTICE_SUPERVISOR')
  const isHead = hasRole('HEAD_OF_DEPARTMENT')
  const isSecretary = hasRole('SECRETARY')

  const [pendingCounts, setPendingCounts] = useState({ assignment: 0, approval: 0 })

  const refreshCounts = () => {
    if (!isHead) return
    api.get('/requests/counts').then(({ data }) => setPendingCounts(data)).catch(() => {})
  }

  useEffect(() => {
    refreshCounts()
  }, [location.pathname])

  useEffect(() => {
    window.addEventListener('requests-updated', refreshCounts)
    return () => window.removeEventListener('requests-updated', refreshCounts)
  }, [])

  const navItems = [
    { key: '/theses', label: 'Темы ВКР' },
    ...(isPracticeSupervisor || isSecretary ? [{ key: '/groups', label: 'Учебные группы' }] : []),
    ...(isHead || isSecretary ? [{ key: '/reviewers', label: 'Рецензенты' }] : []),
    ...(isSecretary || isHead ? [{ key: '/schedule', label: 'График' }] : []),
    ...(isHead
      ? [
          {
            key: '/requests/assignment',
            label: `Заявки на закрепление${pendingCounts.assignment > 0 ? ` (${pendingCounts.assignment})` : ''}`,
          },
          {
            key: '/requests/approval',
            label: `Заявки на утверждение${pendingCounts.approval > 0 ? ` (${pendingCounts.approval})` : ''}`,
          },
        ]
      : []),
    ...(isSecretary ? [{ key: '/administration', label: 'Администрирование' }] : []),
  ]

  const handleLogout = () => {
    Modal.confirm({
      title: 'Выход из системы',
      content: 'Вы уверены, что хотите выйти?',
      okText: 'Выйти',
      cancelText: 'Отмена',
      okType: 'danger',
      onOk: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      },
    })
  }

  return (
    <Layout className="main-layout">
      <Sider width={80} className="main-sider">
        <Avatar
          size={44}
          className="main-avatar"
          icon={<UserOutlined />}
          onClick={() => navigate('/profile')}
        />

        <Tooltip title="Выйти" placement="right">
          <LogoutOutlined className="logout-icon" onClick={handleLogout} />
        </Tooltip>
      </Sider>

      <Layout>
        <Header className="main-header">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            onClick={(e) => navigate(e.key)}
            items={navItems}
            style={{ flex: 1, minWidth: 0 }}
          />
        </Header>

        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
