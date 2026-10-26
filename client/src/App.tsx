import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import BoardPage from './pages/BoardPage';
import DashboardPage from './pages/DashboardPage';
import IntakePage from './pages/IntakePage';
import LoginPage from './pages/LoginPage';
import SettingsLayout from './pages/settings/SettingsLayout';
import NotificationSettings from './pages/settings/NotificationSettings';
import ServiceSettings from './pages/settings/ServiceSettings';
import BrandSettings from './pages/settings/BrandSettings';
import TrackingPage from './pages/TrackingPage';

export default function App() {
  return (
    <Routes>
      {/* PUBLIC - kimlik dogrulama yok */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/t/:token" element={<TrackingPage />} />

      {/* KORUMALI */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BoardPage />} />
        <Route path="/kabul" element={<IntakePage />} />
        <Route path="/yonetim" element={<DashboardPage />} />
        <Route
          path="/ayarlar"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <SettingsLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="bildirimler" replace />} />
          <Route path="bildirimler" element={<NotificationSettings />} />
          <Route path="hizmetler" element={<ServiceSettings />} />
          <Route path="markalar" element={<BrandSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<BoardPage />} />
    </Routes>
  );
}
