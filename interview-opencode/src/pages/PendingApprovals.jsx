import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
import { createNotification } from '../services/notifications';
import { Avatar, Button, Modal, Skeleton } from '../components/ui';
import { formatRelativeTime } from '../utils/dates';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function PendingApprovals() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    await new Promise(r => setTimeout(r, 200));
    const reqs = await asyncGet(KEYS.REGISTRATION_REQUESTS) || [];
    const users = await asyncGet(KEYS.USERS) || [];
    const enriched = reqs.map(r => ({ ...r, user: users.find(u => u.id === r.userId) })).filter(r => r.user);
    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (req) => {
    try {
      // Fetch the user from backend and update via PUT
      const userResp = await api.get(`/users/${req.userId}`);
      const user = userResp.data;
      const updatedUser = {
        ...user,
        isApproved: true,
        isActive: true,
        approvedBy: currentUser.id,
        approvedAt: new Date().toISOString(),
      };
      await api.put(`/users/${req.userId}`, updatedUser);

      // Update registration request status via PUT
      const updatedReq = {
        ...req,
        user: undefined, // remove enriched field before sending
        status: 'approved',
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString(),
      };
      delete updatedReq.user;
      await api.put(`/registrationRequests/${req.id}`, updatedReq);

      createNotification({
        userId: req.userId,
        type: 'registration_approved',
        title: 'Account Approved!',
        message: 'Your registration has been approved. You can now log in to SetTribe.',
        relatedType: 'user',
      });
      toast.success(`${req.user?.name}'s account approved!`);
      load();
    } catch (e) {
      console.error('Approve error:', e);
      toast.error('Failed to approve. Please try again.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason'); return; }
    const req = rejectModal;
    try {
      const updatedReq = {
        id: req.id,
        userId: req.userId,
        status: 'rejected',
        requestedAt: req.requestedAt,
        rejectionReason: rejectReason,
        reviewedBy: currentUser.id,
        reviewedAt: new Date().toISOString(),
      };
      await api.put(`/registrationRequests/${req.id}`, updatedReq);

      createNotification({
        userId: req.userId,
        type: 'registration_rejected',
        title: 'Account Not Approved',
        message: `Your registration was not approved. Reason: ${rejectReason}`,
        relatedType: 'user',
      });
      toast.success('Registration rejected');
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (e) {
      console.error('Reject error:', e);
      toast.error('Failed to reject. Please try again.');
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const reviewed = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Pending Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">{pending.length} pending registration requests</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : pending.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-200">All caught up!</h2>
          <p className="text-sm text-gray-500 mt-1">No pending registration requests</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100 flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" /> Pending Requests</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Applicant</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {pending.map(req => (
                <tr key={req.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.user?.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-gray-200">{req.user?.name}</p>
                        <p className="text-xs text-gray-500">{req.user?.email}</p>
                        <p className="text-xs text-gray-600 font-mono">{req.user?.employeeId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400 capitalize">{req.user?.role}</td>
                  <td className="px-4 py-4 text-sm text-gray-400">{req.user?.department}</td>
                  <td className="px-4 py-4 text-xs text-gray-500">{formatRelativeTime(req.requestedAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <Button variant="success" size="sm" onClick={() => handleApprove(req)}><CheckCircle size={12} /> Approve</Button>
                      <Button variant="danger" size="sm" onClick={() => setRejectModal(req)}><XCircle size={12} /> Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recently Reviewed */}
      {reviewed.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100">Recently Reviewed</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {reviewed.slice(0, 10).map(req => (
              <div key={req.id} className="flex items-center gap-4 px-4 py-3">
                <Avatar name={req.user?.name} size="sm" />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{req.user?.name} <span className="text-gray-500">— {req.user?.role}</span></p>
                  {req.status === 'rejected' && req.rejectionReason && <p className="text-xs text-red-400 mt-0.5">Reason: {req.rejectionReason}</p>}
                </div>
                <span className={`badge ${req.status === 'approved' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' : 'bg-red-900/40 text-red-400 border border-red-800/50'}`}>
                  {req.status}
                </span>
                <span className="text-xs text-gray-600">{formatRelativeTime(req.reviewedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Registration" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-400">Reject {rejectModal?.user?.name}'s registration request?</p>
          <div className="space-y-1.5">
            <label className="label">Rejection Reason *</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input-field min-h-[80px] resize-none" placeholder="Please provide a reason..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject}><XCircle size={14} /> Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
