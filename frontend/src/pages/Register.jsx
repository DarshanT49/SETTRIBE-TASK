import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { registerUser } from '../services/auth';
import { notifyAdminsAndHR } from '../services/notifications';
import { Button, Input, Select } from '../components/ui';
import { validateEmail, validatePassword, validateMobile, getPasswordStrength } from '../utils/validators';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'intern', label: 'Intern' },
  { value: 'panel', label: 'Interview Panel' },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', employeeId: '', email: '', mobile: '', password: '', confirmPassword: '', department: '', role: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!validateEmail(form.email)) e.email = 'Valid email is required';
    if (!validateMobile(form.mobile)) e.mobile = 'Valid 10-digit mobile number required';
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) e.password = pwErrors[0];
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.department) e.department = 'Department is required';
    if (!form.role) e.role = 'Role is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const result = await registerUser(form);
    if (!result.success) {
      setErrors({ submit: result.error });
      setLoading(false);
      return;
    }
    await notifyAdminsAndHR({
      type: 'registration_request',
      title: 'New Registration Request',
      message: `New registration from ${form.name} — ${form.role} — ${form.department}`,
      relatedId: result.user.id,
      relatedType: 'user',
    });
    toast.success('Registration submitted! Waiting for approval.');
    navigate('/login');
    setLoading(false);
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-600 rounded-xl mb-3">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-500 mt-1 text-sm">Submit a registration request to join SetTribe</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <div className="p-3 mb-4 bg-amber-900/20 border border-amber-800/30 rounded-lg text-amber-400 text-xs">
            ⚠️ Admin and HR roles can only be assigned by an existing Admin. You can register as Employee, Intern, or Interview Panel.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} error={errors.name} />
              <Input label="Employee ID" placeholder="EMP007" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} error={errors.employeeId} />
            </div>

            <Input label="Email Address" type="email" placeholder="john@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} error={errors.email} />

            <Input label="Mobile Number" type="tel" placeholder="9876543210" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} error={errors.mobile} />

            <div className="space-y-1.5">
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full"><div className={`h-full rounded-full ${strength.color}`} style={{ width: strength.width }} /></div>
                    <span className="text-xs text-gray-400">{strength.label}</span>
                  </div>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
            </div>

            <Input label="Confirm Password" type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} error={errors.department}>
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
              <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} error={errors.role}>
                <option value="">Select...</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </div>

            {errors.submit && <p className="text-sm text-red-400 bg-red-900/20 p-2 rounded">{errors.submit}</p>}

            <Button type="submit" className="w-full justify-center" loading={loading} size="lg">
              <UserPlus size={16} /> Submit Registration
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
