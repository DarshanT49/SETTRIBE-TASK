import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-900/30',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-gray-800 text-gray-400 hover:text-gray-100',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    outline: 'border border-primary-600 text-primary-400 hover:bg-primary-900/30',
  };

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export function Input({ label, error, hint, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <input className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <select className={`input-field ${error ? 'border-red-500' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea className={`input-field min-h-[80px] resize-none ${error ? 'border-red-500' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-gray-800 text-gray-400 border border-gray-700',
    primary: 'bg-primary-900/40 text-primary-400 border border-primary-800/50',
    success: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
    warning: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
    danger: 'bg-red-900/40 text-red-400 border border-red-800/50',
    info: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
    orange: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
    purple: 'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  };
  return (
    <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
  );
}

export function Avatar({ name, photo, size = 'md', color = '', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' };
  const initials = name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';
  const bgColors = ['bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600', 'bg-indigo-600'];
  const bg = color || bgColors[(name || '').charCodeAt(0) % bgColors.length] || 'bg-primary-600';

  if (photo) {
    return <img src={photo} alt={name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} ${bg} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md', className = '' }) {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${sizes[size]} ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-100 p-1 hover:bg-gray-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function Skeleton({ className = '', lines = 1 }) {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-4 bg-gray-800 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`} />
        ))}
      </div>
    );
  }
  return <div className={`bg-gray-800 rounded animate-pulse ${className}`} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="p-4 bg-gray-800 rounded-2xl mb-4"><Icon size={32} className="text-gray-600" /></div>}
      <h3 className="text-lg font-semibold text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <div className={`${sizes[size]} border-2 border-gray-700 border-t-primary-500 rounded-full animate-spin`} />;
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-600' : 'bg-gray-700'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
}

export function TagInput({ label, tags, onChange, placeholder }) {
  const [input, setInput] = React.useState('');
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) onChange([...tags, input.trim()]);
      setInput('');
    }
  };
  return (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <div className="input-field min-h-[42px] flex flex-wrap gap-1.5 items-center">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-900/40 text-primary-400 border border-primary-800/50 rounded-full text-xs font-medium">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))} className="text-primary-400 hover:text-primary-200">×</button>
          </span>
        ))}
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-20 bg-transparent outline-none text-sm text-gray-100 placeholder-gray-500"
        />
      </div>
      <p className="text-xs text-gray-500">Press Enter or comma to add</p>
    </div>
  );
}

export function StarRating({ value, onChange, max = 5, readonly = false }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i} type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(i + 1)}
          className={`w-6 h-6 transition-colors ${i < value ? 'text-amber-400' : 'text-gray-700'} ${readonly ? '' : 'hover:text-amber-300'}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
        </button>
      ))}
    </div>
  );
}

export function PriorityBadge({ priority }) {
  const map = {
    critical: { label: 'Critical', cls: 'bg-red-900/40 text-red-400 border border-red-800/50' },
    high: { label: 'High', cls: 'bg-orange-900/40 text-orange-400 border border-orange-800/50' },
    medium: { label: 'Medium', cls: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' },
    low: { label: 'Low', cls: 'bg-blue-900/40 text-blue-400 border border-blue-800/50' },
  };
  const p = map[priority] || map.medium;
  return <span className={`badge ${p.cls}`}>{p.label}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', cls: 'bg-green-900/40 text-green-400 border border-green-800/50' },
    completed: { label: 'Completed', cls: 'bg-primary-900/40 text-primary-400 border border-primary-800/50' },
    upcoming: { label: 'Upcoming', cls: 'bg-blue-900/40 text-blue-400 border border-blue-800/50' },
    delayed: { label: 'Delayed', cls: 'bg-red-900/40 text-red-400 border border-red-800/50' },
    locked: { label: 'Locked', cls: 'bg-gray-800 text-gray-400 border border-gray-700' },
    planning: { label: 'Planning', cls: 'bg-purple-900/40 text-purple-400 border border-purple-800/50' },
    todo: { label: 'Todo', cls: 'bg-gray-800 text-gray-400 border border-gray-700' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-900/40 text-blue-400 border border-blue-800/50' },
    in_review: { label: 'In Review', cls: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' },
    testing: { label: 'Testing', cls: 'bg-orange-900/40 text-orange-400 border border-orange-800/50' },
    done: { label: 'Done', cls: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' },
    backlog: { label: 'Backlog', cls: 'bg-gray-800 text-gray-500 border border-gray-700' },
    changes_requested: { label: 'Changes', cls: 'bg-orange-900/40 text-orange-400 border border-orange-800/50' },
    scheduled: { label: 'Scheduled', cls: 'bg-blue-900/40 text-blue-400 border border-blue-800/50' },
    waiting: { label: 'Waiting', cls: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' },
    admitted: { label: 'Admitted', cls: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' },
    ongoing: { label: 'Ongoing', cls: 'bg-green-900/40 text-green-400 border border-green-800/50' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-900/40 text-red-400 border border-red-800/50' },
    pending: { label: 'Pending', cls: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' },
    approved: { label: 'Approved', cls: 'bg-green-900/40 text-green-400 border border-green-800/50' },
    rejected: { label: 'Rejected', cls: 'bg-red-900/40 text-red-400 border border-red-800/50' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-800 text-gray-400 border border-gray-700' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}
