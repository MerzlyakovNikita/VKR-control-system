import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import groupRoutes from './routes/group.routes.js'
import thesisRoutes from './routes/thesis.routes.js'
import directionRoutes from './routes/direction.routes.js'
import reviewerRoutes from './routes/reviewer.routes.js'
import requestsRoutes from './routes/requests.routes.js'
import documentRoutes from './routes/document.routes.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/groups', groupRoutes)
app.use('/thesis', thesisRoutes)
app.use('/directions', directionRoutes)
app.use('/reviewers', reviewerRoutes)
app.use('/requests', requestsRoutes)
app.use('/documents', documentRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})
