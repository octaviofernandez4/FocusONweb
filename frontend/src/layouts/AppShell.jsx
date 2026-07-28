import { Outlet } from 'react-router-dom';
import { OrgProvider } from '../context/OrgContext.jsx';
import { useOrg } from '../hooks/useOrg';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import CompanyNavbar from '../components/CompanyNavbar';
import './AppShell.css';

// La cuenta empresa y la cuenta empleado usan layouts distintos a propósito:
// empresa = navbar horizontal arriba, sin sidebar; empleado = sidebar + topbar.
// Ojo: esto se decide por accountType (el tipo de cuenta elegido al registrarse),
// NO por el rol de Membership — un "empleado" sin invitación igual termina siendo
// admin de su propia organización placeholder, pero no por eso debe ver el panel
// de empresa.
const AppShellLayout = () => {
  const { isLoading } = useOrg();
  const { user } = useAuth();
  const esEmpresa = user?.accountType === 'empresa';

  if (isLoading) {
    return <p className="empty-state">Cargando…</p>;
  }

  if (esEmpresa) {
    return (
      <div className="company-app-shell">
        <CompanyNavbar />
        <main className="company-app-shell-content">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell-content">
        <TopBar />
        <Outlet />
      </main>
    </div>
  );
};

const AppShell = () => (
  <OrgProvider>
    <AppShellLayout />
  </OrgProvider>
);

export default AppShell;
