import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Box,
  Shield,
  Users,
  UsersRound,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Wallet,
  UserPlus,
  TrendingUp,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Church,
  Crown,
  Settings,
  BarChart3,
  BookOpen,
  Tag,
  Target,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useChurch } from '../context/ChurchContext';
import { useTheme } from '../context/ThemeContext';
import { SetupChecklist } from './SetupChecklist';
import { hasPermission } from '../utils/adminPermissions';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  permission?: string;
  submenu?: MenuItem[];
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { church, isHeadQuarter } = useChurch();
  const { currentAdmin, accessToken, isLoading, signOut } = useAuth();
  const { brandColors } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand menus based on current URL
    const path = window.location.pathname;
    const expanded: string[] = [];
    if (path.startsWith('/finance')) expanded.push('finance');
    if (path === '/roles' || path === '/admins') expanded.push('administration');
    if (path === '/sms' || path === '/wallet') expanded.push('communication');
    return expanded;
  });

  // Fallback admin for display if not authenticated
  const admin = currentAdmin || {
    name: 'Admin',
    level: 'church' as const,
    isSuperAdmin: true,
  };

  // Get menu items based on user permissions
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard'
      }
    ];

    // Church level menu items
    if (admin.level === 'church') {
      if (isHeadQuarter) {
        items.push({
          id: 'branches',
          label: 'Branches',
          icon: <Building2 className="w-5 h-5" />,
          path: '/branches',
          permission: 'manage-branches'
        });
      }

      items.push({
        id: 'departments',
        label: 'Departments',
        icon: <Layers className="w-5 h-5" />,
        path: '/departments',
        permission: 'manage-departments'
      });

      items.push({
        id: 'units',
        label: 'Units',
        icon: <Box className="w-5 h-5" />,
        path: '/units',
        permission: 'manage-units'
      });

      items.push({
        id: 'administration',
        label: 'Administration',
        icon: <Shield className="w-5 h-5" />,
        path: '/administration',
        submenu: [
          {
            id: 'roles',
            label: 'Roles',
            icon: <Shield className="w-4 h-4" />,
            path: '/roles',
            permission: 'manage-roles'
          },
          {
            id: 'admins',
            label: 'Administrators',
            icon: <Users className="w-4 h-4" />,
            path: '/admins',
            permission: 'manage-church-admins'
          }
        ]
      });
    }

    // Branch level items
    if (admin.level === 'branch') {
      items.push({
        id: 'departments',
        label: 'Departments',
        icon: <Layers className="w-5 h-5" />,
        path: '/departments',
        permission: 'manage-departments'
      });

      items.push({
        id: 'units',
        label: 'Units',
        icon: <Box className="w-5 h-5" />,
        path: '/units',
        permission: 'manage-units'
      });

      items.push({
        id: 'administration',
        label: 'Administration',
        icon: <Shield className="w-5 h-5" />,
        path: '/administration',
        submenu: [
          {
            id: 'admins',
            label: 'Administrators',
            icon: <Users className="w-4 h-4" />,
            path: '/admins',
            permission: 'manage-branch-admins'
          }
        ]
      });
    }

    // Department level items
    if (admin.level === 'department') {
      items.push({
        id: 'departments',
        label: 'Departments',
        icon: <Layers className="w-5 h-5" />,
        path: '/departments',
        permission: 'manage-departments'
      });

      items.push({
        id: 'units',
        label: 'My Units',
        icon: <Box className="w-5 h-5" />,
        path: '/units',
        permission: 'manage-department-units'
      });
    }

    // All levels
    items.push({
      id: 'members',
      label: 'Members',
      icon: <UsersRound className="w-5 h-5" />,
      path: '/members',
      permission: 'manage-members'
    });

    items.push({
      id: 'workforce',
      label: 'Workforce',
      icon: <TrendingUp className="w-5 h-5" />,
      path: '/workforce',
      permission: 'manage-workforce'
    });

    items.push({
      id: 'programs',
      label: 'Programs',
      icon: <Calendar className="w-5 h-5" />,
      path: '/programs',
      permission: 'manage-programs'
    });

    items.push({
      id: 'finance',
      label: 'Finance',
      icon: <DollarSign className="w-5 h-5" />,
      path: '/finance',
      permission: 'manage-collections',
      submenu: [
        {
          id: 'finance-ledger',
          label: 'Finance Ledger',
          icon: <BookOpen className="w-4 h-4" />,
          path: '/finance?tab=ledger',
          permission: 'manage-collections',
        },
        {
          id: 'finance-collections',
          label: 'Collections',
          icon: <Tag className="w-4 h-4" />,
          path: '/finance?tab=collections',
          permission: 'manage-collections',
        },
        {
          id: 'finance-fundraisers',
          label: 'Fundraisers',
          icon: <Target className="w-4 h-4" />,
          path: '/finance?tab=fundraisers',
          permission: 'manage-collections',
        },
      ],
    });

    items.push({
      id: 'follow-up',
      label: 'Follow-Up',
      icon: <UserPlus className="w-5 h-5" />,
      path: '/follow-up',
      permission: 'follow-up'
    });

    items.push({
      id: 'communication',
      label: 'Communication',
      icon: <MessageSquare className="w-5 h-5" />,
      path: '/communication',
      submenu: [
        {
          id: 'sms',
          label: 'SMS',
          icon: <MessageSquare className="w-4 h-4" />,
          path: '/sms',
          permission: 'manage-sms'
        },
        {
          id: 'wallet',
          label: 'Wallet',
          icon: <Wallet className="w-4 h-4" />,
          path: '/wallet',
          permission: 'manage-wallet'
        }
      ]
    });

    items.push({
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-5 h-5" />,
      path: '/reports',
      permission: 'view-reports'
    });

    items.push({
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/analytics',
      permission: 'view-reports'
    });

    return items;
  };

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isAllowedMenuItem = (item: MenuItem) => !item.permission || hasPermission(currentAdmin, item.permission);

  const menuItems = getMenuItems()
    .map((item) => item.submenu ? { ...item, submenu: item.submenu.filter(isAllowedMenuItem) } : item)
    .filter((item) => {
      if (item.submenu) {
        return item.submenu.length > 0 || isAllowedMenuItem(item);
      }
      return isAllowedMenuItem(item);
    });

  const isActive = (path: string) => {
    // Handle paths with query params (e.g., /finance?tab=ledger)
    const [pathPart, queryPart] = path.split('?');
    if (queryPart) {
      return location.pathname === pathPart && location.search === `?${queryPart}`;
    }
    // Don't highlight parent /finance if we're on a specific tab
    if (pathPart === '/finance' && !queryPart && location.pathname === '/finance' && location.search) {
      return false;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const accentColor = brandColors?.primary || '#2563eb';
  const accentLight = brandColors?.primaryLight || '#dbeafe';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            {church.logoUrl ? (
              <img src={church.logoUrl} alt={church.name} className="w-8 h-8 object-contain rounded" />
            ) : (
              <Church className="w-8 h-8" style={{ color: accentColor }} />
            )}
            <div>
              <h1 className="font-bold text-xl">Churchset</h1>
              <p className="text-xs text-gray-500">{church.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile?tab=help')}
              title="Help & FAQ"
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {currentAdmin?.profilePicture ? (
                <img
                  src={currentAdmin.profilePicture}
                  alt={admin.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {admin.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-500">
                  {admin.isSuperAdmin ? 'Super Admin' : 'Admin'} &middot; {admin.level}
                </p>
              </div>
              <Settings className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>
            <Button variant="ghost" size="sm" onClick={handleLogout} title="Log out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-white border-r border-gray-200
            w-64 transform transition-transform duration-200 z-20 overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map(item => (
              <div key={item.id} data-tour={`nav-${item.id}`}>
                {item.submenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedMenus.includes(item.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedMenus.includes(item.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.submenu.map(subItem => (
                          <Link
                            key={subItem.id}
                            to={subItem.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`
                              flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                              ${
                                isActive(subItem.path)
                                  ? 'font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }
                            `}
                            style={
                              isActive(subItem.path)
                                ? { backgroundColor: accentLight, color: accentColor }
                                : undefined
                            }
                          >
                            {subItem.icon}
                            <span>{subItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${
                        isActive(item.path)
                          ? 'font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    style={
                      isActive(item.path)
                        ? { backgroundColor: accentLight, color: accentColor }
                        : undefined
                    }
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </div>
            ))}

            {/* Settings */}
            <div className="mt-4 pt-4 border-t border-gray-200" data-tour="nav-settings">
              <Link
                to="/profile"
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${
                    isActive('/profile')
                      ? 'font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                style={
                  isActive('/profile')
                    ? { backgroundColor: accentLight, color: accentColor }
                    : undefined
                }
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
            </div>

            {/* Upgrade CTA for Single Church */}
            {!isHeadQuarter && admin.level === 'church' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link to="/subscription" onClick={() => setIsSidebarOpen(false)}>
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg text-white hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5" />
                      <span className="font-semibold text-sm">Upgrade Plan</span>
                    </div>
                    <p className="text-xs text-white/90">
                      Unlock multi-branch features
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-10 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 relative overflow-x-hidden">
          {/* Church logo watermark */}
          {church.logoUrl && (
            <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center lg:left-64">
              <img
                src={church.logoUrl}
                alt=""
                className="w-[60vw] max-w-[500px] h-[60vw] max-h-[500px] object-contain select-none"
                style={{ opacity: (church.logoOpacity ?? 4) / 100 }}
                draggable={false}
              />
            </div>
          )}
          <div className="relative z-[1]">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : !accessToken ? (
              <Navigate to="/login" replace />
            ) : (
              <>
                <SetupChecklist />
                {children}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
