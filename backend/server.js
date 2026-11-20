import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import chatRouter from './routes/chatRoute.js'

// app config
const app = express()
const port = process.env.PORT || 4000

// Connect to database (CALL THE FUNCTION)
connectDB()

// middlewares
app.use(express.json())
app.use(cors())
app.use('/uploads', express.static('uploads'))

// api endpoints
app.use('/api/admin', adminRouter)
app.use('/api/doctor', doctorRouter)
app.use("/api/user", userRouter)
app.use('/api/chat', chatRouter)


app.get("/", (req, res) => {
  res.send("API Working")
});

app.get('/test-db', (req, res) => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (state === 1) {
    res.send('Database is connected');
  } else {
    res.status(500).send('Database is NOT connected');
  }
});


app.listen(port, () => console.log(`Server started on PORT:${port}`))
