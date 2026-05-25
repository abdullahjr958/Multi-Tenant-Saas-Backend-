import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import logger from './middleware/logger.middleware'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/users.routes'
import tenantRoutes from './routes/tenants.routes'
import errorHandler from './middleware/error.middleware'

const app = express()

app.use(helmet())
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, please try again later"
}))

app.use(express.json())
app.use(cookieParser())
app.use(logger)

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/tenants', tenantRoutes)

app.use(errorHandler)

export default app;

// app.use((req, res, next) => {
//   let data = '';
//   req.on('data', chunk => data += chunk);
//   req.on('end', () => {
//     console.log("RAW BODY:", data);
//     next();
//   });
// });

// console.log(typeof process.env.DATABASE_URL)
// console.log(process.env.DATABASE_URL)