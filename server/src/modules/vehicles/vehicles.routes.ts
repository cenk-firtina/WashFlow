import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import * as controller from './vehicles.controller';

const router = Router();

router.use(requireAuth);
router.get('/lookup', asyncHandler(controller.lookup));
router.get('/', asyncHandler(controller.list));

export default router;
