import Express from 'express'
import authRoutes from './routes/auth.routes'
import cookieParser from 'cookie-parser'

const app = Express()

app.use(Express.json())
app.use(cookieParser())

app.use('/auth', authRoutes)

export default app;