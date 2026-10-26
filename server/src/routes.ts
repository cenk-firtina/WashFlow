import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import customersRoutes from './modules/customers/customers.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import servicesRoutes from './modules/services/services.routes';
import brandsRoutes from './modules/brands/brands.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import trackingRoutes from './modules/tracking/tracking.routes';
import settingsRoutes from './modules/settings/settings.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const api = Router();

api.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

api.use('/auth', authRoutes);
api.use('/customers', customersRoutes);
api.use('/vehicles', vehiclesRoutes);
api.use('/services', servicesRoutes);
api.use('/brands', brandsRoutes);
api.use('/tickets', ticketsRoutes);
api.use('/tracking', trackingRoutes); // PUBLIC
api.use('/settings', settingsRoutes);
api.use('/dashboard', dashboardRoutes);

export default api;
