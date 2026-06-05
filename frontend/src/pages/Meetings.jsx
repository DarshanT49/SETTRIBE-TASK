   
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
   
import { Button, Avatar, StatusBadge, EmptyState, Skeleton } from '../components/ui';
   
import { formatDuration, canStartMeeting, getMeetingStatus } from '../utils/dates';



const TYPE_COLORS = {
  standup: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  project: 'bg-purple-900/40 text-purple-400 border border-purple-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  interview: 'bg-red-900/40 text-red-400 border border-red-800/50',
  general: 'bg-gray-800 text-gray-400 border border-gray-700'
};

export default function Meetings() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('upcoming');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 200));
      const rawMeetings = await asyncGet(KEYS.MEETINGS) || [];
      setMeetings(rawMeetings.filter(m => m.type !== 'interview'));
      setUsers(await asyncGet(KEYS.USERS) || []);
      setRsvps(await asyncGet(KEYS.MEETING_RSVPS) || []);
      setLoading(false);
    };
    load();
  }, []);

  const getUser = (uid) => users.find(u => String(u.id) === String(uid));
   
  const today = new Date().toISOString().split('T')[0];

  const myRsvp = (meetingId) => rsvps.find(r => String(r.meetingId) === String(meetingId) && String(r.userId) === String(currentUser.id));

  const isAdmin = currentUser.role === 'admin';

  // Non-admins can only see meetings they are a participant or host of.
  // Admins see every meeting.
  const visibleMeetings = isAdmin
    ? meetings
    : meetings.filter(m => String(m.hostId) === String(currentUser.id) || (m.participantIds || []).map(String).includes(String(currentUser.id)));

  const filtered = visibleMeetings.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase());
    const effectiveStatus = getMeetingStatus(m);
    let matchFilter;
    if (filter === 'all') {
      matchFilter = true;
    } else if (filter === 'upcoming') {
      matchFilter = effectiveStatus === 'upcoming' || effectiveStatus === 'ongoing';
    } else if (filter === 'past') {
      matchFilter = effectiveStatus === 'completed' || effectiveStatus === 'cancelled';
    } else {
      // 'my' – meetings I host or am a participant in
      matchFilter = String(m.hostId) === String(currentUser.id) || (m.participantIds || []).map(String).includes(String(currentUser.id));
    }
    const matchType = !typeFilter || m.type === typeFilter;
    return matchSearch && matchFilter && matchType;
  }).sort((a, b) => {
    // Always descending — newest created first
    const da = a.createdAt ? new Date(a.createdAt) : new Date(`${a.date}T${a.time}:00+05:30`);
    const db = b.createdAt ? new Date(b.createdAt) : new Date(`${b.date}T${b.time}:00+05:30`);
    return db - da;
  });

  // Reset to page 1 whenever filters/search change
   
  useEffect(() => { setPage(1); }, [search, filter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const rsvpColors = { attending: 'text-emerald-400', declined: 'text-red-400', no_response: 'text-gray-500' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} meetings</p>
        </div>
        <Link to="/meetings/new"><Button><Plus size={16} />Schedule Meeting</Button></Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meetings..." className="input-field pl-9" />
        </div>
        <div className="flex gap-1">
          {[['upcoming', 'Upcoming'], ['past', 'Past'], ['my', 'My Meetings'], ['all', 'All']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field w-36">
          <option value="">All Types</option>
          {['standup', 'project', 'hr', 'general'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
        </select>
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><List size={16} /></button>
          <button onClick={() => setViewMode('calendar')} className={`p-2 ${viewMode === 'calendar' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><Calendar size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No meetings found" description="Schedule a meeting or adjust filters"
          action={<Link to="/meetings/new"><Button><Plus size={14} />Schedule Meeting</Button></Link>} />
      ) : viewMode === 'list' ? (
        <div className="space-y-3">
          {paginated.map(m => {
            const host = getUser(m.hostId);
            const rsvp = myRsvp(m.id);
            const canJoin = canStartMeeting(m);
            return (
              <div key={m.id} className="card p-4 hover:border-gray-700 transition-all">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/meetings/${m.id}`} className="font-semibold text-gray-100 hover:text-primary-400 transition-colors">{m.title}</Link>
                      <span className={`badge ${TYPE_COLORS[m.type]}`}>{m.type}</span>
                      <StatusBadge status={getMeetingStatus(m)} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {m.date} at {m.time}</span>
                      <span>⏱ {formatDuration(m.duration)}</span>
                      <span className="flex items-center gap-1.5">
                        <Avatar name={host?.name} size="xs" />Host: {host?.name}
                      </span>
                      <span>👥 {(m.participantIds || []).length} participants</span>
                    </div>
                    {rsvp && <span className={`text-xs font-medium mt-1 block ${rsvpColors[rsvp.status]}`}>RSVP: {rsvp.status.replace('_', ' ')}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/meetings/${m.id}`}><Button variant="secondary" size="sm">Details</Button></Link>
                    {canJoin && getMeetingStatus(m) !== 'completed' && getMeetingStatus(m) !== 'cancelled' && (
                      <Link to={`/meetings/${m.id}/room`}><Button size="sm">Join</Button></Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Showing{' '}
                <span className="text-gray-300 font-medium">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span>
                {' '}of{' '}
                <span className="text-gray-300 font-medium">{filtered.length}</span> meetings
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First page">
                  <ChevronsLeft size={15} />
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous page">
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`e${idx}`} className="px-1.5 text-gray-600 text-xs select-none">…</span>
                    ) : (
                      <button key={item} onClick={() => setPage(item)}
                        className={`min-w-[30px] h-[30px] rounded-lg text-xs font-medium transition-all ${page === item ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'}`}>
                        {item}
                      </button>
                    )
                  )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next page">
                  <ChevronRight size={15} />
                </button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last page">
                  <ChevronsRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <CalendarView meetings={filtered} />
      )}
    </div>
  );
}

function CalendarView({ meetings }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });

  const getMeetingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return meetings.filter(m => m.date === dateStr);
  };

  const typeColors = { standup: 'bg-blue-600', project: 'bg-purple-600', hr: 'bg-orange-600', interview: 'bg-red-600', general: 'bg-gray-600' };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200">‹</button>
        <h2 className="font-semibold text-gray-100">{monthName} {year}</h2>
        <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dayMeetings = getMeetingsForDay(day);
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div key={day} className={`min-h-16 p-1 rounded-lg ${isToday ? 'bg-primary-900/30 border border-primary-800/50' : 'hover:bg-gray-800/50'} transition-colors`}>
              <span className={`text-xs font-medium ${isToday ? 'text-primary-400' : 'text-gray-400'}`}>{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {dayMeetings.slice(0, 2).map(m => (
                  <Link key={m.id} to={`/meetings/${m.id}`} className={`block text-xs px-1 py-0.5 rounded ${typeColors[m.type]} text-white truncate`} title={m.title}>
                    {m.time} {m.title}
                  </Link>
                ))}
                {dayMeetings.length > 2 && <span className="text-xs text-gray-500">+{dayMeetings.length - 2}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
