import express from 'express'
import authRoutes from './routes/auth.routes'
import cookieParser from 'cookie-parser'
import logger from './middleware/logger.middleware'

const app = express()

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
app.use(express.json())
app.use(cookieParser())
app.use(logger)

console.log("FROM app.ts before auth routes: ");
app.use('/auth', authRoutes)

export default app;