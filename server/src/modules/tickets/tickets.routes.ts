import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { requireAuth } from '../../middleware/auth';
import * as controller from './tickets.controller';

const router = Router();

router.use(requireAuth);
router.get('/board', asyncHandler(controller.board)); // Kanban + polling
router.post('/', asyncHandler(controller.create)); // Arac kabul
router.get('/:id', asyncHandler(controller.getOne));
router.patch('/:id/status', asyncHandler(controller.patchStatus));

export default router;
