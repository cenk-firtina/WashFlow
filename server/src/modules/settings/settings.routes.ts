import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './settings.controller';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(controller.getAll));
router.patch('/', requireRole('ADMIN'), asyncHandler(controller.update));

export default router;
