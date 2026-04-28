import { useEffect, useState } from 'react'
import { Card, Select, Button, message } from 'antd'
import { api } from '../../shared/api/axios'
import './ProfilePage.css'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [initialGroupId, setInitialGroupId] = useState<string | null>(null)
  const [thesisForm, setThesisForm] = useState({
    topic: '',
    practice_place: '',
    supervisor_name: '',
    company_supervisor_name: '',
  })
  const [isEditing, setIsEditing] = useState(false)
  const [hasThesis, setHasThesis] = useState(false)
  const [initialThesis, setInitialThesis] = useState<any>(null)

  const disabled = hasThesis && !isEditing

  const isChanged = () => {
    return JSON.stringify(thesisForm) !== JSON.stringify(initialThesis)
  }

  useEffect(() => {
    loadUser()
    loadGroups()
    loadThesis()
  }, [])

  const loadUser = async () => {
    const { data } = await api.get('/users/me')

    setUser(data)
    setSelectedGroupId(data.group_id || null)
    setInitialGroupId(data.group_id || null)
  }

  const loadGroups = async () => {
    const { data } = await api.get('/groups')

    setGroups(data)
  }

  const handleGroupChange = (value: string) => {
    setSelectedGroupId(value)

    const group = groups.find((g) => g.id === value)
    setSelectedGroup(group)
  }

  const handleSave = async () => {
    try {
      if (selectedGroupId === initialGroupId) {
        return
      }

      await api.put('/users/me', {
        group_id: selectedGroupId,
      })
      message.success('Группа успешно сохранена')

      setInitialGroupId(selectedGroupId)
      loadUser()
    } catch (e) {
      message.error('Ошибка при сохранении группы')
    }
  }

  const loadThesis = async () => {
    const { data } = await api.get('/thesis/me')

    if (data) {
      setHasThesis(true)

      const normalized = {
        topic: data.topic || '',
        practice_place: data.practice_place || '',
        supervisor_name: data.supervisor_name || '',
        company_supervisor_name: data.company_supervisor_name || '',
      }

      setThesisForm(normalized)
      setInitialThesis(normalized)
    }
  }

  const handleThesisChange = (e: any) => {
    setThesisForm({
      ...thesisForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveThesis = async () => {
    try {
      if (hasThesis && !isChanged()) {
        setIsEditing(false)
        return
      }
      await api.post('/thesis/me', thesisForm)

      message.success('ВКР сохранена')

      setHasThesis(true)
      setIsEditing(false)
      setInitialThesis(thesisForm)
    } catch (e) {
      message.error('Ошибка при сохранении ВКР')
    }
  }

  useEffect(() => {
    if (user?.group_id && groups.length) {
      const group = groups.find((g) => g.id === user.group_id)
      setSelectedGroup(group)
    }
  }, [user, groups])

  if (!user) return null

  return (
    <div className="profile-page">
      <h2>Профиль</h2>

      <Card className="profile-card">
        <div className="profile-content">
          <div className="left-block">
            <div className="info-row">
              <div className="label">ФИО</div>
              <div className="value">{user.last_name} {user.first_name} {user.middle_name}</div>
            </div>

            <div className="info-row">
              <div className="label">Почта</div>
              <div className="value">{user.email}</div>
            </div>

            <div className="info-row">
              <div className="label">Телефон</div>
              <div className="value">{user.phone}</div>
            </div>

            {user.role === 'STUDENT' && (
              <>
                <div className="info-row">
                  <div className="label">Группа</div>

                  <div className="group-row">
                    <Select
                      value={selectedGroupId || undefined}
                      onChange={handleGroupChange}
                      options={groups.map((g) => ({
                        label: `${g.name} (${g.direction_code})`,
                        value: g.id,
                      }))}
                    />

                    <Button
                      type="primary"
                      onClick={handleSave}
                      disabled={!selectedGroupId || selectedGroupId === initialGroupId}
                    >
                      Сохранить
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedGroup && (
            <div className="right-block">
              <div className="info-row">
                <div className="label">Группа</div>
                <div className="value">{selectedGroup.name}</div>
              </div>

              <div className="info-row">
                <div className="label">Направление</div>
                <div className="value">
                  {selectedGroup.direction} ({selectedGroup.direction_code})
                </div>
              </div>

              <div className="info-row">
                <div className="label">Профиль</div>
                <div className="value">{selectedGroup.profile}</div>
              </div>

              <div className="info-row">
                <div className="label">Обучение</div>
                <div className="value">
                  {selectedGroup.education_level}, {selectedGroup.course} курс, {selectedGroup.education_form}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {user.role === 'STUDENT' && (
        <>
          <Card title="Моя ВКР" className="thesis-card">
            <div className="thesis-form">
              <div className="form-row">
                <label>Тема</label>
                <textarea
                  name="topic"
                  value={thesisForm.topic}
                  onChange={handleThesisChange}
                  disabled={disabled}
                />
              </div>

              <div className="form-row">
                <label>Руководитель от кафедры</label>
                <input
                  name="supervisor_name"
                  value={thesisForm.supervisor_name}
                  onChange={handleThesisChange}
                  disabled={disabled}
                />
              </div>

              <div className="form-row">
                <label>Место выполнения</label>
                <input
                  name="practice_place"
                  value={thesisForm.practice_place}
                  onChange={handleThesisChange}
                  disabled={disabled}
                />
              </div>

              <div className="form-row">
                <label>Руководитель от предприятия</label>
                <input
                  name="company_supervisor_name"
                  value={thesisForm.company_supervisor_name}
                  onChange={handleThesisChange}
                  disabled={disabled}
                />
              </div>

              <div className="form-actions">
                {!hasThesis && (
                  <Button type="primary" onClick={handleSaveThesis}>
                    Сохранить ВКР
                  </Button>
                )}

                {hasThesis && !isEditing && (
                  <Button onClick={() => setIsEditing(true)}>
                    Редактировать
                  </Button>
                )}

                {hasThesis && isEditing && (
                  <Button type="primary" onClick={handleSaveThesis}>
                    Сохранить изменения
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}