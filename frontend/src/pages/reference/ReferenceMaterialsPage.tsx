import { useEffect, useState } from 'react'
import { Card, Button, Upload, message, Modal } from 'antd'
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
} from '@ant-design/icons'
import { api } from '../../shared/api/axios'
import './ReferenceMaterialsPage.css'

export default function ReferenceMaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [fileList, setFileList] = useState<any[]>([])

    const loadMaterials = async () => {
        const { data } = await api.get('/reference-materials')
        setMaterials(data)
    }

    const loadUser = async () => {
        const { data } = await api.get('/users/me')
        setUser(data)
    }

    useEffect(() => {
        loadMaterials()
        loadUser()
    }, [])

    const handleAdd = async () => {
        if (fileList.length === 0) {
            return message.warning('Выберите файлы')
        }

        const formData = new FormData()

        fileList.forEach((file) => {
            formData.append('files', file)
        })

        try {
            const { data } = await api.post('/reference-materials/multiple', formData)

            const { uploaded, skipped } = data
            console.log('uploaded:', uploaded)
            console.log('skipped:', skipped)

            if (uploaded.length > 0 && skipped.length === 0) {
                message.success({
                    content: `Загружены: ${uploaded.join(', ')}`,
                    duration: 6,
                })
            } else if (uploaded.length > 0 && skipped.length > 0) {
                message.warning({
                    content: `Загружены: ${uploaded.join(', ')}. Уже существуют: ${skipped.join(', ')}`,
                    duration: 6,
                })
            } else if (uploaded.length === 0 && skipped.length > 0) {
                message.error({
                    content: `Эти файлы уже существуют: ${skipped.join(', ')}`,
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
            const response = await api.get(
                `/reference-materials/download/${id}`,
                { responseType: 'blob' }
            )

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

    return (
        <div className="reference-page">
            <div className="reference-layout">
                <div className="reference-left">
                    <Card className="materials-container">
                        {materials.length === 0 ? (
                            <div className="materials-empty">
                                <span className="empty-icon">📁</span>
                                <div className="empty-text">Пока нет загруженных материалов</div>
                            </div>
                        ) : (
                            <div className="materials-list">
                                {materials.map((item) => (
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

                                            {user?.role === 'SECRETARY' && (
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

                {user?.role === 'SECRETARY' && (
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
                                    setFileList((prev) =>
                                    prev.filter((f) => f.uid !== file.uid)
                                    )
                                }}
                            >
                                <Button icon={<UploadOutlined />}>
                                    Выбрать файлы
                                </Button>
                            </Upload>

                            <Button
                                type="primary"
                                onClick={handleAdd}
                                className="upload-button"
                            >
                                Загрузить
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}