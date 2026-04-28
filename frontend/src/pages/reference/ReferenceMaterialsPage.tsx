import { useEffect, useState } from 'react'
import { Card, Button, Upload, message, Modal, Tree, Input } from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FolderOutlined,
  FileOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import './ReferenceMaterialsPage.css'

export default function ReferenceMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [fileList, setFileList] = useState<any[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const isSecretary = user?.role === 'SECRETARY'

  useEffect(() => {
    loadMaterials()
    loadFolders()
    loadUser()
  }, [])

  const loadMaterials = async () => {
    const { data } = await api.get('/reference-materials')
    setMaterials(data)
  }

  const loadUser = async () => {
    const { data } = await api.get('/users/me')
    setUser(data)
  }

  const loadFolders = async () => {
    const { data } = await api.get('/folders')
    setFolders(data)
  }

  const buildTree = (list: any[]) => {
    const map = new Map()
    const roots: any[] = []

    list.forEach((item) => {
      map.set(item.id, {
        key: item.id,
        title: item.name,
        children: [],
      })
    })

    list.forEach((item) => {
      if (item.parent_id && map.has(item.parent_id)) {
        map.get(item.parent_id).children.push(map.get(item.id))
      } else {
        roots.push(map.get(item.id))
      }
    })

    return roots
  }

  const filteredMaterials = selectedFolderId
    ? materials.filter((m) => m.folder_id === selectedFolderId)
    : materials.filter((m) => !m.folder_id)

  const handleAdd = async () => {
    if (fileList.length === 0) {
      return message.warning('Выберите файлы')
    }

    const formData = new FormData()

    fileList.forEach((file) => {
      formData.append('files', file)
    })

    if (selectedFolderId) {
      formData.append('folder_id', selectedFolderId)
    }

    try {
      const { data } = await api.post('/reference-materials/multiple', formData)

      const { uploaded, skipped } = data

      if (uploaded.length > 0 && skipped.length === 0) {
        message.success({
          content: `Все файлы загружены`,
          duration: 6,
        })
      } else if (uploaded.length > 0 && skipped.length > 0) {
        message.warning({
          content: `Загружены: ${uploaded.join(', ')}. Уже существуют: ${skipped.join(', ')}`,
          duration: 6,
        })
      } else if (uploaded.length === 0 && skipped.length > 0) {
        message.error({
          content: `Все загружаемые файлы уже существуют`,
          duration: 6,
        })
      } else {
        message.error('Неизвестный результат загрузки')
      }

      setFileList([])
      loadMaterials()
    } catch (e: any) {
      message.error(e.response?.data?.message || 'Ошибка загрузки')
    }
  }

  const handleDownload = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/reference-materials/download/${id}`, {
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))

      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()

      link.remove()
    } catch {
      message.error('Ошибка скачивания')
    }
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Удалить файл?',
      content: 'Это действие нельзя отменить',
      okText: 'Удалить',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await api.delete(`/reference-materials/${id}`)
          message.success('Файл удалён')
          loadMaterials()
        } catch {
          message.error('Ошибка удаления')
        }
      },
    })
  }

  const getFileIcon = (name: string) => {
    const lower = name.toLowerCase()

    if (lower.endsWith('.pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />
    if (lower.endsWith('.doc') || lower.endsWith('.docx'))
      return <FileWordOutlined style={{ color: '#2b579a' }} />
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx'))
      return <FileExcelOutlined style={{ color: '#217346' }} />
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx'))
      return <FilePptOutlined style={{ color: '#d24726' }} />

    return <FileOutlined />
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()

    if (!name) {
      message.warning('Введите название папки')
      return
    }

    try {
      setCreating(true)

      await api.post('/folders', {
        name,
        parent_id: selectedFolderId || null,
      })

      message.success('Папка создана')

      setIsFolderModalOpen(false)
      setNewFolderName('')

      loadFolders()
    } catch (e: any) {
      if (e.response?.status === 400) {
        message.error(e.response.data.message)
      } else {
        message.error('Ошибка создания папки')
      }
    } finally {
      setCreating(false)
    }
  }

  const confirmDeleteFolder = (folderId: string) => {
    Modal.confirm({
      title: 'Удалить папку?',
      content: 'Все вложенные папки и файлы будут удалены',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',

      onOk: async () => {
        try {
          await api.delete(`/folders/${folderId}`)

          message.success('Папка удалена')

          if (selectedFolderId === folderId) {
            setSelectedFolderId(null)
          }

          loadFolders()
          loadMaterials()
        } catch {
          message.error('Ошибка удаления')
        }
      },
    })
  }

  return (
    <div className="reference-page">
      <div className="reference-layout">
        <div className="reference-left">
          <Card className="folders-tree">
            <Tree
              treeData={buildTree(folders)}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys as string[])}
              onSelect={(keys) => setSelectedFolderId(keys[0] as string)}
              showIcon={false}
              titleRender={(nodeData) => {
                const isSelected = selectedFolderId === nodeData.key

                return (
                  <div className={`material-item ${isSelected ? 'selected-folder' : ''}`}>
                    <div className="material-left">
                      <span className="file-icon">
                        <FolderOutlined />
                      </span>
                      <span className="material-name">{nodeData.title}</span>
                    </div>
                    {isSecretary && (
                      <div className="material-actions">
                        <DeleteOutlined
                          className="delete-icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            confirmDeleteFolder(nodeData.key)
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {isSecretary && (
              <div className="folders-header">
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => setIsFolderModalOpen(true)}
                >
                  Новая папка
                </Button>
              </div>
            )}
          </Card>
          <Card className="materials-container">
            {filteredMaterials.length === 0 ? (
              <div className="materials-empty">
                <span className="empty-icon">📁</span>
                <div className="empty-text">Пока нет загруженных материалов</div>
              </div>
            ) : (
              <div className="materials-list">
                {filteredMaterials.map((item) => (
                  <div key={item.id} className="material-item">
                    <div className="material-left">
                      <span className="file-icon">{getFileIcon(item.name)}</span>
                      <span className="material-name">{item.name}</span>
                    </div>

                    <div className="material-actions">
                      <DownloadOutlined
                        className="download-icon"
                        onClick={() => handleDownload(item.id, item.name)}
                      />

                      {isSecretary && (
                        <DeleteOutlined
                          className="delete-icon"
                          onClick={() => handleDelete(item.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {isSecretary && (
          <div className="reference-right">
            <Card title="Добавить файлы" className="reference-add-card">
              <Upload
                multiple
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList((prev) => [...prev, file])
                  return false
                }}
                onRemove={(file) => {
                  setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
                }}
              >
                <Button icon={<UploadOutlined />}>Выбрать файлы</Button>
              </Upload>

              <Button type="primary" onClick={handleAdd} className="upload-button">
                Загрузить
              </Button>
            </Card>
          </div>
        )}
      </div>
      {isSecretary && (
        <Modal
          title="Создать папку"
          open={isFolderModalOpen}
          onCancel={() => {
            setIsFolderModalOpen(false)
            setNewFolderName('')
          }}
          onOk={handleCreateFolder}
          okText="Создать"
          cancelText="Отмена"
          confirmLoading={creating}
        >
          <Input
            placeholder="Название папки"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onPressEnter={handleCreateFolder}
          />
        </Modal>
      )}
    </div>
  )
}
