import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Sun, Moon, Menu, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../ui';



export function Topbar({ onMobileMenu }) {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUser, setShowUser] = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      {/* Left: hamburger for mobile */}
      <button onClick={onMobileMenu} className="lg:hidden text-gray-400 hover:text-gray-100 p-1">
        <Menu size={20} />
      </button>
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => { navigate('/notifications'); setShowUser(false); }}
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Avatar name={currentUser?.name} photo={currentUser?.profilePhoto} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-200 leading-none">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden">
              <Link to="/profile" onClick={() => setShowUser(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-800 text-sm text-gray-300 hover:text-gray-100 transition-colors">
                <User size={14} /> Profile & Settings
              </Link>
              <hr className="border-gray-800" />
              <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800 text-sm text-red-400 hover:text-red-300 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
