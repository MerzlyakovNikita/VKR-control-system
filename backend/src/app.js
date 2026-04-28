import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import groupRoutes from './routes/group.routes.js'
import thesisRoutes from './routes/thesis.routes.js'
import referenceMaterialRoutes from './routes/referenceMaterial.routes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/groups', groupRoutes)
app.use('/thesis', thesisRoutes)
app.use('/reference-materials', referenceMaterialRoutes)
app.use('/uploads', express.static('uploads'))

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})
