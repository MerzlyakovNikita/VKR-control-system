import { Router } from 'express'
import multer from 'multer'
import auth from '../middleware/auth.middleware.js'
import {
  getMyThesis,
  saveThesis,
  getAllTheses,
  updateStudentAndThesis,
  deleteStudent,
  importStudents,
  assignSupervisor,
  createStudent,
  getThesisSupervisors,
  setThesisSupervisor,
  submitApproval,
  directApprove,
  updateApprovalDate,
  getApprovalHistory,
  getDefenseDatesByGroup,
} from '../controllers/thesis.controller.js'

const memUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ok =
      file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    cb(ok ? null : new Error('Только файлы .xlsx'), ok)
  },
})

const router = Router()

router.post('/import', auth, memUpload.single('file'), importStudents)
router.get('/supervisors', auth, getThesisSupervisors)
router.put('/student/:id/supervisor', auth, setThesisSupervisor)
router.get('/me', auth, getMyThesis)
router.post('/me', auth, saveThesis)
router.get('/all', auth, getAllTheses)
router.put('/student/:id', auth, updateStudentAndThesis)
router.post('/student', auth, createStudent)
router.delete('/student/:id', auth, deleteStudent)
router.post('/student/:id/assign', auth, assignSupervisor)
router.post('/student/:id/submit-approval', auth, submitApproval)
router.post('/student/:id/direct-approve', auth, directApprove)
router.patch('/student/:id/approval-date', auth, updateApprovalDate)
router.get('/student/:id/approval-history', auth, getApprovalHistory)
router.get('/defense-dates/group/:groupId', auth, getDefenseDatesByGroup)

export default router
