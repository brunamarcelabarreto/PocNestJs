import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Settings, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/templates', label: 'Template', Icon: Settings },
  { to: '/contracts', label: 'Contratos', Icon: FileText },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">⚡</span>
          <span className="brand-name">COMMANDIX</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className={`role-badge role-${user?.role?.toLowerCase()}`}>{user?.role}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
            className="h-8 w-8 text-sidebar-foreground hover:text-white hover:bg-white/10"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
