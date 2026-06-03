import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
import { Avatar, Skeleton, EmptyState } from '../components/ui';

export default function TeamPerformance() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('intern'); // 'intern' or 'employee'

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 200));
      
      const allUsers = await asyncGet(KEYS.USERS) || [];
      setUsers(allUsers);
      setLoading(false);
    };
    
    load();
  }, [currentUser]);

  const filtered = users.filter(u => 
    u.role === activeTab &&
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.employeeId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <TrendingUp className="text-primary-400" /> Team Performance
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View performance for team members across the company.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('intern')} 
          className={`tab-btn capitalize ${activeTab === 'intern' ? 'active' : ''}`}
        >
          Interns
        </button>
        <button 
          onClick={() => setActiveTab('employee')} 
          className={`tab-btn capitalize ${activeTab === 'employee' ? 'active' : ''}`}
        >
          Employees
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={`Search ${activeTab}s by name or ID...`} 
            className="input-field pl-9" 
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={Users} 
          title={`No ${activeTab}s found`} 
          description={search ? "Try adjusting your search" : `There are currently no ${activeTab}s in the system.`} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="card p-5 flex flex-col justify-between">
              <div className="flex items-start gap-3 mb-4">
                <Avatar name={member.name} photo={member.profilePhoto} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-100 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.department} · {member.employeeId}</p>
                </div>
              </div>
              
              <Link 
                to={`/employees/${member.id}?tab=performance`}
                className="w-full py-2 bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white rounded-lg text-center text-sm font-medium transition-colors"
              >
                View Performance
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
