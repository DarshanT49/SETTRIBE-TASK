import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
import { Avatar, Button, Badge, StatusBadge, EmptyState, Skeleton } from '../components/ui';
import { formatDate } from '../utils/dates';

const STATUS_COLORS = {
  scheduled: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  completed: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  cancelled: 'bg-gray-800 text-gray-500 border border-gray-700',
  waiting: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50' };

const ROUNDS = ['screening', 'technical', 'hr', 'final', 'all'];

export default function Interviews() {
  const { currentUser } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roundFilter, setRoundFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 200));
      let iv = await asyncGet(KEYS.INTERVIEWS) || [];
      if (['panel', 'manager'].includes(currentUser.role)) {
        iv = iv.filter(i => i.interviewerId === currentUser.id || i.panelIds?.includes(currentUser.id));
      }
      setInterviews(iv.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`)));
      setUsers(await asyncGet(KEYS.USERS) || []);
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const getUser = (uid) => users.find(u => u.id === uid);
  const today = new Date().toISOString().split('T')[0];

  const filtered = interviews.filter(i => {
    const matchSearch = !search || i.candidateName.toLowerCase().includes(search.toLowerCase()) || i.position.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchRound = roundFilter === 'all' || i.round === roundFilter;
    const matchDate = !dateFilter || i.date === dateFilter;
    return matchSearch && matchStatus && matchRound && matchDate;
  }).sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

  const today_count = interviews.filter(i => i.date === today).length;
  const pending_eval = interviews.filter(i => i.status === 'completed' && !i.evaluation?.rating).length;

  const canSchedule = ['admin', 'hr'].includes(currentUser.role);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">{today_count} today · {pending_eval} pending evaluation</p>
        </div>
        {canSchedule && <Link to="/interviews/new"><Button><Plus size={16} />Schedule Interview</Button></Link>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by candidate, position..." className="input-field pl-9" />
        </div>
        <div className="flex gap-1">
          {['all', 'scheduled', 'waiting', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{s}</button>
          ))}
        </div>
        <select value={roundFilter} onChange={e => setRoundFilter(e.target.value)} className="input-field w-32">
          {ROUNDS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-field w-40" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={UserCheck} title="No interviews found" description="Schedule interviews or adjust filters"
          action={canSchedule ? <Link to="/interviews/new"><Button><Plus size={14} />Schedule Interview</Button></Link> : null} />
      ) : (
        <div className="space-y-3">
          {filtered.map(i => {
            const interviewer = getUser(i.interviewerId);
            const hasEval = i.evaluation?.rating;
            return (
              <div key={i.id} className="card p-4 hover:border-gray-700 transition-all">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-900/30 border border-primary-800/40 flex items-center justify-center text-lg flex-shrink-0">
                      {i.round === 'screening' ? '📋' : i.round === 'technical' ? '💻' : i.round === 'hr' ? '👥' : '🎯'}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-gray-100">{i.candidateName}</h3>
                        <span className={`badge ${STATUS_COLORS[i.status] || 'bg-gray-800 text-gray-400 border border-gray-700'}`}>{i.status}</span>
                        <span className="badge bg-gray-800 text-gray-400 border border-gray-700 capitalize">{i.round}</span>
                        {hasEval && <span className="badge bg-emerald-900/40 text-emerald-400 border border-emerald-800/50">Evaluated ✓</span>}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{i.position} · {i.department}</p>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                        <span>📅 {i.date} at {i.time}</span>
                        <span>⏱ {i.duration}min</span>
                        {interviewer && <span className="flex items-center gap-1"><Avatar name={interviewer.name} size="xs" />{interviewer.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/interviews/${i.id}`}><Button variant="secondary" size="sm">View Details</Button></Link>
                    {(currentUser.id === i.interviewerId || (i.panelIds || []).includes(currentUser.id)) && i.status === 'completed' && !hasEval && (
                      <Link to={`/interviews/${i.id}?tab=evaluation`}><Button size="sm">Add Evaluation</Button></Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
