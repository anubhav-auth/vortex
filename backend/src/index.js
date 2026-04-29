import { env } from './config/env.js';
import { prisma } from './config/db.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import domainRoutes from './routes/domains.js';
import awardRoutes from './routes/awards.js';  
import studentRoutes from './routes/students.js';
import teamRoutes from './routes/teams.js'; 
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/domains', domainRoutes);
app.use('/api/awards', awardRoutes); 
app.use('/api', studentRoutes);   
app.use('/api/teams', teamRoutes);            

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
