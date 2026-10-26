import { Router } from 'express';
import { asyncHandler } from '../../lib/http';
import * as service from './tracking.service';

const router = Router();

// PUBLIC: kimlik dogrulama yok. Token bilen herkes gorebilir.
router.get(
  '/:token',
  asyncHandler(async (req, res) => {
    res.json(await service.getPublicStatus(req.params.token));
  }),
);

export default router;
