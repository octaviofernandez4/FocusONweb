import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthProvider } from '../context/AuthContext.jsx';
import { OrgProvider } from '../context/OrgContext.jsx';
import { getCurrentOrg } from '../services/orgService';
import { getProjects } from '../services/projectService';

vi.mock('../services/orgService', () => ({
  getCurrentOrg: vi.fn(),
  generateInvite: vi.fn(),
  listMembers: vi.fn(),
  updateOrg: vi.fn(),
  joinOrg: vi.fn(),
}));

vi.mock('../services/projectService', () => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

const renderSidebar = (initialRoute = '/app/today') => {
  getCurrentOrg.mockResolvedValue({ organizacion: { name: 'Organización de prueba' }, role: 'admin' });
  getProjects.mockResolvedValue([]);

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <OrgProvider>
          <Sidebar />
        </OrgProvider>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders every navigation item', async () => {
    renderSidebar();

    await waitFor(() => expect(getCurrentOrg).toHaveBeenCalled());

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Mis tareas')).toBeInTheDocument();
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Tareas del equipo')).toBeInTheDocument();
    expect(screen.getByText('Completadas')).toBeInTheDocument();
    expect(screen.getByText('Analíticas')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('marks the current route as active', async () => {
    renderSidebar('/app/completed');

    await waitFor(() => expect(getCurrentOrg).toHaveBeenCalled());

    const link = screen.getByText('Completadas').closest('a');
    expect(link.className).toContain('is-active');

    const otherLink = screen.getByText('Hoy').closest('a');
    expect(otherLink.className).not.toContain('is-active');
  });
});
