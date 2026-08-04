import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import JoinInvite from './pages/JoinInvite';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import TaskDetail from './pages/TaskDetail';
import Inbox from './pages/Inbox';
import Completed from './pages/Completed';
import Incomplete from './pages/Incomplete';
import Projects from './pages/Projects';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import TeamManagement from './pages/TeamManagement';
import Onboarding from './pages/Onboarding';
import NotificationsCenter from './pages/NotificationsCenter';
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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/join/:token" element={<JoinInvite />} />

      {/* Rutas Privadas (El Patovica las protege) */}
      <Route element={<ProtectedRoute />}>
        {/* Fuera de AppShell a propósito: es una pantalla completa sin sidebar/navbar. */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="mytasks" element={<MyTasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="completed" element={<Completed />} />
          <Route path="incomplete" element={<Incomplete />} />
          <Route path="projects" element={<Projects />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="notifications" element={<NotificationsCenter />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
