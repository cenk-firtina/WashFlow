import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import { requireAuth, requireRole } from '../../middleware/auth';
import * as controller from './brands.controller';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(controller.list)); // tum roller okuyabilir (kabul dropdown)
// Marka tanimlari sadece ADMIN tarafindan degistirilir.
router.post('/', requireRole('ADMIN'), asyncHandler(controller.create));
router.patch('/:id', requireRole('ADMIN'), asyncHandler(controller.update));
router.delete('/:id', requireRole('ADMIN'), asyncHandler(controller.remove));

export default router;
