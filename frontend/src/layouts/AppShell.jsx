import { Outlet } from 'react-router-dom';
import { OrgProvider } from '../context/OrgContext.jsx';
import Sidebar from '../components/Sidebar';
import './AppShell.css';

const AppShell = () => {
  return (
    <OrgProvider>
      <div className="app-shell">
        <Sidebar />
        <main className="app-shell-content">
          <Outlet />
        </main>
      </div>
    </OrgProvider>
  );
};

export default AppShell;
