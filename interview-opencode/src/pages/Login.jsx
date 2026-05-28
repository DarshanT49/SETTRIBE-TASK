import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';
import toast from 'react-hot-toast';

const DEMO_USERS = [
  { role: 'Admin', email: 'admin@settribe.com', password: 'Admin@1234', color: 'bg-red-900/40 text-red-400 border-red-800/50 hover:bg-red-900/60' },
  { role: 'HR', email: 'hr@settribe.com', password: 'Hr@12345', color: 'bg-orange-900/40 text-orange-400 border-orange-800/50 hover:bg-orange-900/60' },
  { role: 'Manager', email: 'manager@settribe.com', password: 'Manager@123', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50 hover:bg-yellow-900/60' },
  { role: 'Employee', email: 'employee@settribe.com', password: 'Employee@123', color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60' },
  { role: 'Intern', email: 'intern@settribe.com', password: 'Intern@1234', color: 'bg-blue-900/40 text-blue-400 border-blue-800/50 hover:bg-blue-900/60' },
  { role: 'Panel', email: 'panel@settribe.com', password: 'Panel@1234', color: 'bg-purple-900/40 text-purple-400 border-purple-800/50 hover:bg-purple-900/60' },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.emailOrId || !form.password) { setError('Please fill in all fields'); return; }
    const result = await login(form.emailOrId, form.password);
    if (result.success) {
      toast.success(`Welcome back! Logged in as ${result.user.role}`);
      navigate('/dashboard');
    } else if (result.error === 'pending_approval') {
      setError('Your account is pending admin/HR approval. Please wait.');
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const demoLogin = async (user) => {
    setForm({ emailOrId: user.email, password: user.password });
    const result = await login(user.email, user.password);
    if (result.success) {
      toast.success(`Logged in as ${user.role}!`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/40">
            <span className="text-white font-bold text-2xl">ST</span>
          </div>
          <h1 className="text-3xl font-bold text-white">SetTribe</h1>
          <p className="text-gray-500 mt-1 text-sm">Employee Management System</p>
        </div>

        <div className="card p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Employee ID"
              type="text"
              placeholder="admin@settribe.com or EMP001"
              value={form.emailOrId}
              onChange={e => setForm({ ...form, emailOrId: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-primary-600" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300">Forgot password?</Link>
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full justify-center" loading={loading} size="lg">
              <LogIn size={16} /> Sign In
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">Register</Link>
          </div>

          {/* Demo Login */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center mb-3 flex items-center gap-2 justify-center">
              <Zap size={12} /> Demo Login — Click any role
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map(user => (
                <button
                  key={user.role}
                  onClick={() => demoLogin(user)}
                  disabled={loading}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${user.color}`}
                >
                  {user.role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
