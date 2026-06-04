import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { filterStandupData, exportStandupData } from '../services/standup';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { Button, Input, Select, Avatar } from '../components/ui';
import { KEYS, asyncGet } from '../services/storage';

export default function StandupData() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    meetingType: '',
    userId: '',
    status: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // We no longer redirect here; all roles can access.
    // If they are not admin/manager, we will force the filter below.

    const loadUsers = async () => {
      const allUsers = await asyncGet(KEYS.USERS);
      setUsers(allUsers || []);
    };
    
    loadUsers();
    fetchData();
  }, [currentUser, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeFilters = { ...filters };
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
        activeFilters.hostId = currentUser.id;
      }
      const result = await filterStandupData(activeFilters);
      setData(result || []);
    } catch (error) {
      console.error("Failed to fetch standup data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [filters]);

  const handleExport = () => {
    const activeFilters = { ...filters };
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
      activeFilters.hostId = currentUser.id;
    }
    exportStandupData(activeFilters);
  };

  const filteredData = data.filter(record => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (record.userName || '').toLowerCase().includes(q) ||
      (record.questionsAndAnswers || '').toLowerCase().includes(q)
    );
  });

  // Pivot Data Logic
  const uniqueDates = [...new Set(filteredData.map(d => d.meetingDate).filter(Boolean))].sort();
  
  const recordsByUser = filteredData.reduce((acc, curr) => {
    if (!curr.userId) return acc;
    if (!acc[curr.userId]) {
      acc[curr.userId] = {
        userId: curr.userId,
        userName: curr.userName,
        records: {}
      };
    }
    const key = `${curr.meetingDate}_${curr.meetingType}`;
    acc[curr.userId].records[key] = curr;
    return acc;
  }, {});

  const pivotedData = Object.values(recordsByUser);

  if (loading && data.length === 0) {
    return <div className="flex h-screen items-center justify-center text-primary-500">Loading standup data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Standup Data</h1>
          <p className="text-sm text-gray-400">View and export employee standup records</p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Download size={16} /> Export to Excel
        </Button>
      </div>

      <div className="card p-4 bg-gray-900 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <Input 
              placeholder="Search name or content..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Input 
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="Start Date"
          />
          
          <Input 
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            placeholder="End Date"
          />

          <Select 
            value={filters.meetingType} 
            onChange={(e) => setFilters(prev => ({ ...prev, meetingType: e.target.value }))}
          >
            <option value="">All Types</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
          </Select>

          <Select 
            value={filters.userId} 
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
          >
            <option value="">All Employees</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="card overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl shadow-gray-950/50 rounded-xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-950/90 backdrop-blur z-20 text-gray-400">
              <tr>
                <th className="p-4 font-semibold sticky left-0 top-0 bg-gray-950 z-30 border-b border-r border-gray-800 min-w-[120px]">Id</th>
                <th className="p-4 font-semibold sticky left-[120px] top-0 bg-gray-950 z-30 border-b border-r border-gray-800 min-w-[200px]">Name</th>
                {uniqueDates.map(date => (
                  <th key={date} colSpan="2" className="p-3 text-center border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-950 font-bold text-gray-200">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar size={14} className="text-primary-400" />
                      {date}
                    </div>
                  </th>
                ))}
                {uniqueDates.length === 0 && <th className="p-3 border-b border-gray-800 text-center">Dates</th>}
              </tr>
              <tr>
                <th className="p-3 sticky left-0 top-[53px] bg-gray-950/95 z-30 border-b border-r border-gray-800"></th>
                <th className="p-3 sticky left-[120px] top-[53px] bg-gray-950/95 z-30 border-b border-r border-gray-800"></th>
                {uniqueDates.map(date => (
                  <React.Fragment key={`${date}-sub`}>
                    <th className="p-3 font-medium bg-gray-900/50 border-b border-r border-gray-800/50 min-w-[250px] text-blue-400 text-center">Morning</th>
                    <th className="p-3 font-medium bg-gray-900/50 border-b border-r border-gray-800/50 min-w-[250px] text-orange-400 text-center">Evening</th>
                  </React.Fragment>
                ))}
                {uniqueDates.length === 0 && <th className="p-3 border-b border-gray-800"></th>}
              </tr>
            </thead>
            <tbody>
              {pivotedData.length === 0 ? (
                <tr>
                  <td colSpan={2 + (uniqueDates.length * 2) || 3} className="p-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Filter size={36} className="opacity-20" />
                      <p className="text-lg">No standup records found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pivotedData.map((userRow, idx) => (
                  <tr key={userRow.userId} className={`hover:bg-gray-800/40 transition-colors ${idx % 2 === 0 ? 'bg-transparent' : 'bg-gray-900/20'}`}>
                    <td className="p-4 align-top font-mono text-xs text-gray-500 sticky left-0 bg-gray-950/80 backdrop-blur z-10 border-b border-r border-gray-800/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      {userRow.userId.substring(0, 8)}...
                    </td>
                    <td className="p-4 align-top sticky left-[120px] bg-gray-950/80 backdrop-blur z-10 border-b border-r border-gray-800/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center gap-3">
                        <Avatar name={userRow.userName} size="sm" className="ring-2 ring-gray-800" />
                        <span className="font-medium text-gray-200">{userRow.userName}</span>
                      </div>
                    </td>
                    {uniqueDates.map(date => {
                      const morningRec = userRow.records[`${date}_Morning`];
                      const eveningRec = userRow.records[`${date}_Evening`];
                      return (
                        <React.Fragment key={`${userRow.userId}-${date}`}>
                          <td className="p-4 align-top border-b border-r border-gray-800/30 hover:bg-blue-900/10 transition-colors">
                            {morningRec && morningRec.questionsAndAnswers ? (
                              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {morningRec.questionsAndAnswers}
                                <div className="mt-3 text-xs text-blue-500/40 font-mono flex items-center gap-1">
                                  <span>{morningRec.submissionTime}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full py-4 text-gray-700 italic text-xs">No entry</div>
                            )}
                          </td>
                          <td className="p-4 align-top border-b border-r border-gray-800/30 hover:bg-orange-900/10 transition-colors">
                            {eveningRec && eveningRec.questionsAndAnswers ? (
                              <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {eveningRec.questionsAndAnswers}
                                <div className="mt-3 text-xs text-orange-500/40 font-mono flex items-center gap-1">
                                  <span>{eveningRec.submissionTime}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full py-4 text-gray-700 italic text-xs">No entry</div>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="text-right text-sm text-gray-500">
        Total Records: {filteredData.length}
      </div>
    </div>
  );
}
