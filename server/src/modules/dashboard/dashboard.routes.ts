import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import * as controller from './dashboard.controller';

const router = Router();

router.use(requireAuth);
router.get('/summary', asyncHandler(controller.summary));
router.get('/messages', asyncHandler(controller.messageLogs));

export default router;
