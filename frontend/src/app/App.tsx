import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import ru_RU from 'antd/es/locale/ru_RU'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { AppRouter } from './providers/router'
import { QueryProvider } from './providers/query-client'
import { api } from '../shared/api/axios'

dayjs.locale('ru')

export default function App() {
  useEffect(() => {
    if (localStorage.getItem('token')) {
      api
        .post('/auth/refresh')
        .then(({ data }) => localStorage.setItem('token', data.token))
        .catch(() => {})
    }
  }, [])

  return (
    <QueryProvider>
      <ConfigProvider locale={ru_RU}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ConfigProvider>
    </QueryProvider>
  )
}
