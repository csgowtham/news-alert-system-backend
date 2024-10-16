import express from 'express';
import { register, login, getEmailById } from '../controllers/authController.js'; // Use the correct names

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/get-user-email', getEmailById);

export default router;
