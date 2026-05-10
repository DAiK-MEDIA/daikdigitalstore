import { Router } from 'express';
import { verifyAgentPassword } from '../controllers/agentController';

const router = Router();

router.post('/verify-password', verifyAgentPassword);

export default router;
