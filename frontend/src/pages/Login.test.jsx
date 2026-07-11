import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { loginUser } from '../services/authService';
import { getProfile } from '../services/profileService';
import { AuthProvider } from '../context/AuthContext.jsx';

vi.mock('../services/authService', () => ({
  loginUser: vi.fn(),
}));

vi.mock('../services/profileService', () => ({
  getProfile: vi.fn(),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByText(/email no es válido/i)).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('submits credentials and stores the returned token', async () => {
    loginUser.mockResolvedValueOnce({ token: 'abc123', usuario: { name: 'Octavio' } });
    getProfile.mockResolvedValueOnce({ name: 'Octavio', lastname: 'Fernandez', email: 'octavio@example.com' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText('vos@empresa.com'), 'octavio@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'secret123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith({
        email: 'octavio@example.com',
        password: 'secret123',
      });
    });
    expect(localStorage.getItem('token')).toBe('abc123');
  });
});
