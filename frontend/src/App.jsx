import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinInvite from './pages/JoinInvite';
import TodayFocus from './pages/TodayFocus';
import Inbox from './pages/Inbox';
import Completed from './pages/Completed';
import Settings from './pages/Settings';
// Importamos el guardia de seguridad y el layout de la app autenticada
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './layouts/AppShell';

function App() {
  return (
    <Routes>
      {/* Landing pública */}
      <Route path="/" element={<Landing />} />

      {/* Rutas Públicas (Cualquiera puede entrar) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/join/:token" element={<JoinInvite />} />

      {/* Rutas Privadas (El Patovica las protege) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayFocus />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="completed" element={<Completed />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
