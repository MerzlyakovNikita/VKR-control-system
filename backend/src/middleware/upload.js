import multer from 'multer'
import path from 'path'
import crypto from 'crypto'

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = crypto.randomUUID() + ext
    cb(null, filename)
  },
})

export const upload = multer({ storage })