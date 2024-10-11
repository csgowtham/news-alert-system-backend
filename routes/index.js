import express from 'express';
import authRoutes from './authRoutes.js';
import newsRoutes from './newsRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/news', newsRoutes);

export default router;
