import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import BoardPage from './pages/BoardPage';
import BrandsPage from './pages/BrandsPage';
import DashboardPage from './pages/DashboardPage';
import IntakePage from './pages/IntakePage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
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
          path="/markalar"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <BrandsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ayarlar"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<BoardPage />} />
    </Routes>
  );
}
