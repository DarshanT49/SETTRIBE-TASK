import { useState, useRef } from 'react';
import { Camera, Save, Lock, Bell, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiPut, KEYS, asyncGet } from '../services/storage';
import { Button, Input, Select, Toggle, Avatar } from '../components/ui';
import { validatePassword } from '../utils/validators';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const TIMEZONE = ['UTC', 'UTC+5:30 (IST)', 'UTC-5 (EST)', 'UTC-8 (PST)', 'UTC+1 (CET)'];
const LANGS = ['English', 'Hindi', 'Spanish', 'French'];

export default function Profile() {
  const { currentUser, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('personal');
  const [form, setForm] = useState({ name: currentUser.name, email: currentUser.email, mobile: currentUser.mobile || '', department: currentUser.department, timezone: 'UTC+5:30 (IST)', language: 'English', bio: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(currentUser.notifPrefs || { task: true, meeting: true, interview: true, project: true, email: false });
  const fileRef = useRef();

  const handleSaveProfile = async () => {
    try {
      const updated = { ...currentUser, ...form };
      await apiPut(KEYS.USERS, currentUser.id, updated);
      await refreshUser();
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    const users = await asyncGet(KEYS.USERS) || [];
    const user = users.find(u => u.id === currentUser.id);
    if (user?.password !== pwForm.currentPassword) { toast.error('Current password is incorrect'); return; }
    const errors = validatePassword(pwForm.newPassword);
    if (errors.length > 0) { toast.error(errors[0]); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    try {
      await apiPut(KEYS.USERS, currentUser.id, { ...currentUser, password: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated!');
    } catch {
      toast.error('Failed to update password');
    }
  };

  const handleSaveNotifPrefs = async () => {
    try {
      await apiPut(KEYS.USERS, currentUser.id, { ...currentUser, notifPrefs });
      await refreshUser();
      toast.success('Notification preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await apiPut(KEYS.USERS, currentUser.id, { ...currentUser, profilePhoto: reader.result });
        await refreshUser();
        toast.success('Profile photo updated!');
      } catch {
        toast.error('Failed to update photo');
      }
    };
    reader.readAsDataURL(file);
  };

  const TABS = [{ id: 'personal', label: 'Personal Info' }, { id: 'security', label: 'Security' }, { id: 'notifications', label: 'Notifications' }, { id: 'appearance', label: 'Appearance' }];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar name={currentUser.name} photo={currentUser.profilePhoto} size="xl" />
            <button onClick={() => fileRef.current?.click()} className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity">
              <Camera size={20} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">{currentUser.name}</h1>
            <p className="text-sm text-gray-400">{currentUser.role} · {currentUser.department}</p>
            <p className="text-sm text-gray-500">{currentUser.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto">
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn whitespace-nowrap ${activeTab === t.id ? 'active' : ''}`}>{t.label}</button>)}
      </div>

      {/* Personal Info */}
      {activeTab === 'personal' && (
        <div className="card p-6 space-y-4">
          <Input label="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Mobile" type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
          <Select label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select label="Timezone" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
            {TIMEZONE.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Select label="Language" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile}><Save size={14} />Save Changes</Button>
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2"><Lock size={16} />Change Password</h2>
          <div className="relative">
            <input type={showPw ? 'text' : 'password'} placeholder="Current Password" className="input-field pr-10" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Input type={showPw ? 'text' : 'password'} placeholder="New Password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          <Input type={showPw ? 'text' : 'password'} placeholder="Confirm New Password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} />
          <div className="flex justify-end">
            <Button onClick={handleChangePassword}><Lock size={14} />Update Password</Button>
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2"><Bell size={16} />Notification Preferences</h2>
          {[
            { key: 'task', label: 'Task Notifications', desc: 'Task assignments, overdue alerts, approvals' },
            { key: 'meeting', label: 'Meeting Notifications', desc: 'Invitations, reminders, standup updates' },
            { key: 'interview', label: 'Interview Notifications', desc: 'Scheduled interviews, evaluations' },
            { key: 'project', label: 'Project Notifications', desc: 'Added to projects, milestone updates' },
            { key: 'email', label: 'Email Digest', desc: 'Daily summary email (simulated)' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-200">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <Toggle checked={!!notifPrefs[key]} onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))} />
            </div>
          ))}
          <div className="flex justify-end">
            <Button onClick={handleSaveNotifPrefs}><Save size={14} />Save Preferences</Button>
          </div>
        </div>
      )}

      {/* Appearance */}
      {activeTab === 'appearance' && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-100">Appearance</h2>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-200">Dark Mode</p>
              <p className="text-xs text-gray-500">Switch between dark and light theme</p>
            </div>
            <Toggle checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {['Slate', 'Violet', 'Indigo'].map((scheme) => (
              <button key={scheme} className={`p-3 rounded-xl border text-sm transition-all ${scheme === 'Indigo' ? 'border-primary-600 bg-primary-900/20 text-primary-400' : 'border-gray-700 text-gray-500 hover:border-gray-600'}`}>
                {scheme}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
