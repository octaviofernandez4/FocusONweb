import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

const renderWithRoute = () =>
  render(
    <MemoryRouter initialEntries={['/app/today']}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/app/today" element={<div>Today page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when there is no token', () => {
    renderWithRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Today page')).not.toBeInTheDocument();
  });

  it('renders the protected route when a token is present', () => {
    localStorage.setItem('token', 'fake-token');

    renderWithRoute();

    expect(screen.getByText('Today page')).toBeInTheDocument();
  });
});
