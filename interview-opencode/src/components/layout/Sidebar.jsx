import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, ClipboardList,
  Video, UserCheck, BarChart3, Bell, User, LogOut, ChevronLeft,
  ChevronRight, Clock, Shield, Menu, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Avatar, Badge } from '../ui';

const allNavLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'] },
  { to: '/employees/pending', icon: Shield, label: 'Pending Approvals', roles: ['admin', 'hr'] },
  { to: '/employees', icon: Users, label: 'Employees', roles: ['admin', 'hr', 'manager', 'panel'] },
  { to: '/projects', icon: FolderKanban, label: 'Projects', roles: ['admin', 'manager', 'employee', 'intern'] },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks', roles: ['admin', 'manager', 'employee', 'intern'] },
  { to: '/self-tasks', icon: ClipboardList, label: 'My To-Dos', roles: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'] },
  { to: '/meetings', icon: Video, label: 'Meetings', roles: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'] },
  { to: '/interviews', icon: UserCheck, label: 'Interviews', roles: ['admin', 'hr', 'manager', 'employee', 'panel'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'hr', 'manager', 'employee'] },
  { to: '/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'] },
  { to: '/profile', icon: User, label: 'Profile', roles: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'] },
];

const roleColors = {
  admin: 'bg-red-900/40 text-red-400 border border-red-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  manager: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
  employee: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  intern: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  panel: 'bg-purple-900/40 text-purple-400 border border-purple-800/50',
};

export function Sidebar({ collapsed, onCollapse }) {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const visibleLinks = allNavLinks.filter(link => currentUser && link.roles.includes(currentUser.role));

  return (
    <aside className={`flex flex-col h-screen bg-gray-950 border-r border-gray-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">ST</span>
        </div>
        {!collapsed && <span className="font-bold text-gray-100 text-lg">SetTribe</span>}
        <button
          onClick={onCollapse}
          className="ml-auto text-gray-500 hover:text-gray-300 transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {visibleLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            title={collapsed ? label : ''}
          >
            <div className="relative">
              <Icon size={18} className="flex-shrink-0" />
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      {currentUser && (
        <div className={`border-t border-gray-800 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar name={currentUser.name} photo={currentUser.profilePhoto} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{currentUser.name}</p>
                <span className={`badge text-xs ${roleColors[currentUser.role]}`}>{currentUser.role}</span>
              </div>
              <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Avatar name={currentUser.name} photo={currentUser.profilePhoto} size="sm" />
              <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Logout">
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
