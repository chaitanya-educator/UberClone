import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profile/profile.routes.js'


const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs/json'
  }
}));

// Alternative JSON spec endpoint
app.get('/api-docs/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
})

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/driver",driverRoutes);

export default app;