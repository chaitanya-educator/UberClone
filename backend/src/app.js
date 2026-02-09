import express from 'express';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }));


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
})

app.use("/api/auth", authRoutes)


export default app;