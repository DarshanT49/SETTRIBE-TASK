import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroup, updateGroup, deleteGroup, shareGroup } from '../services/participantGroups';
import { KEYS, asyncGet } from '../services/storage';
import { formatDateTime } from '../utils/dates';
import { Button, Input, Modal, Avatar } from '../components/ui';
import { Users, Edit2, Share2, Trash2, ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', participantIds: [] });
  
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareForm, setShareForm] = useState({ sharedWith: [] });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const usersData = await asyncGet(KEYS.USERS) || [];
      setAllUsers(usersData);
      
      const groupData = await getGroup(currentUser.id, id);
      setGroup(groupData);
    } catch (err) {
      toast.error('Failed to load group details or you do not have permission.');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = String(group?.createdBy) === String(currentUser.id);

  const openEditModal = () => {
    setGroupForm({ name: group.name, participantIds: (group.participantIds || []).map(String) });
    setIsEditModalOpen(true);
  };

  const openShareModal = () => {
    setShareForm({ sharedWith: (group.sharedWith || []).map(String) });
    setIsShareModalOpen(true);
  };

  const handleGroupSave = async () => {
    if (!groupForm.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    try {
      await updateGroup(currentUser.id, group.id, groupForm);
      toast.success("Group updated");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to update group");
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, delete it!',
      background: '#1f2937',
      color: '#f3f4f6'
    });
    
    if (!result.isConfirmed) return;
    try {
      await deleteGroup(currentUser.id, group.id);
      toast.success("Group deleted");
      navigate('/groups');
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  const handleShareSave = async () => {
    try {
      await shareGroup(currentUser.id, group.id, shareForm.sharedWith);
      toast.success("Sharing updated");
      setIsShareModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to share group");
    }
  };

  const handleUnshare = async (userIdToRemove) => {
    try {
      const updatedSharedWith = (group.sharedWith || []).filter(uid => String(uid) !== String(userIdToRemove));
      await shareGroup(currentUser.id, group.id, updatedSharedWith);
      toast.success("Sharing removed");
      fetchData();
    } catch (err) {
      toast.error("Failed to remove sharing");
    }
  };

  const handleUnshareAll = async () => {
    const result = await Swal.fire({
      title: 'Stop sharing completely?',
      text: "Are you sure you want to stop sharing this group completely?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, unshare all!',
      background: '#1f2937',
      color: '#f3f4f6'
    });
    
    if (!result.isConfirmed) return;
    try {
      await shareGroup(currentUser.id, group.id, []);
      toast.success("Group unshared completely");
      fetchData();
    } catch (err) {
      toast.error("Failed to unshare group");
    }
  };

  const toggleParticipant = (uid) => {
    const strUid = String(uid);
    setGroupForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.includes(strUid)
        ? prev.participantIds.filter(pid => pid !== strUid)
        : [...prev.participantIds, strUid]
    }));
  };

  const toggleShareUser = (uid) => {
    const strUid = String(uid);
    setShareForm(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(strUid)
        ? prev.sharedWith.filter(sid => sid !== strUid)
        : [...prev.sharedWith, strUid]
    }));
  };

  const activeUsers = allUsers.filter(u => u.isActive && u.isApproved);
  const getUser = (uid) => allUsers.find(u => String(u.id) === String(uid));

  if (loading) return <div className="flex justify-center p-8"><span className="loading" /></div>;
  if (!group) return null;

  const ownerUser = getUser(group.createdBy);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => navigate('/groups')} className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors mb-4">
        <ArrowLeft size={16} /> Back to Groups
      </button>

      <div className="card p-6 border border-gray-800 bg-gray-900/50">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              {group.name}
              {!isOwner && <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">Shared</span>}
              {isOwner && group.sharedWith?.length > 0 && <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">Shared</span>}
              {isOwner && (!group.sharedWith || group.sharedWith.length === 0) && <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-500/20 text-gray-400">Private</span>}
            </h1>
            <p className="text-gray-400 mt-2">Created by {ownerUser ? ownerUser.name : 'Unknown User'}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={openShareModal} className="flex items-center gap-2">
                <Share2 size={16} /> Share
              </Button>
              {group.sharedWith?.length > 0 && (
                <Button variant="secondary" onClick={handleUnshareAll} className="flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20">
                  <X size={16} /> Unshare All
                </Button>
              )}
              <Button variant="secondary" onClick={openEditModal} className="flex items-center gap-2">
                <Edit2 size={16} /> Edit
              </Button>
              <Button variant="danger" onClick={handleDelete} className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="text-xs text-gray-500">Owner</p>
            <p className="mt-1 text-sm font-medium text-gray-200 truncate">{ownerUser ? ownerUser.name : 'Unknown User'}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="text-xs text-gray-500">Participants</p>
            <p className="mt-1 text-sm font-medium text-gray-200">{group.participantIds?.length || 0}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="text-xs text-gray-500">Created</p>
            <p className="mt-1 text-sm font-medium text-gray-200">{formatDateTime(group.createdAt) || 'Unknown'}</p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <p className="text-xs text-gray-500">Updated</p>
            <p className="mt-1 text-sm font-medium text-gray-200">{formatDateTime(group.updatedAt) || 'Unknown'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Users size={18} /> Participants ({group.participantIds?.length || 0})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {(group.participantIds || []).map(uid => {
                const user = allUsers.find(u => String(u.id) === String(uid));
                return user ? (
                  <div key={uid} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <Avatar name={user.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-200">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                ) : null;
              })}
              {!group.participantIds?.length && (
                <p className="text-gray-500 text-sm">No participants in this group.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Share2 size={18} /> Shared With ({group.sharedWith?.length || 0})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {(group.sharedWith || []).map(uid => {
                const user = getUser(uid);
                return user ? (
                  <div key={uid} className="flex items-center justify-between p-3 bg-blue-900/10 rounded-lg border border-blue-900/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-blue-100 truncate">{user.name}</p>
                        <p className="text-xs text-blue-400/70 capitalize">{user.role}</p>
                      </div>
                    </div>
                    {isOwner && (
                      <button onClick={() => handleUnshare(uid)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Remove share">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ) : null;
              })}
              {!group.sharedWith?.length && (
                <div className="p-4 bg-gray-800/30 rounded-lg border border-dashed border-gray-700 text-center">
                  <p className="text-sm text-gray-500 mb-3">This group is private.</p>
                  {isOwner && (
                    <Button variant="secondary" onClick={openShareModal} size="sm" className="mx-auto flex items-center gap-2">
                      <Plus size={14} /> Share Group
                    </Button>
                  )}
                </div>
              )}
            </div>
            {!isOwner && (
              <div className="mt-4 p-4 bg-blue-900/10 rounded-lg border border-blue-900/30">
                <h3 className="text-lg font-semibold text-blue-200 mb-2 flex items-center gap-2">
                  <Share2 size={18} /> Shared Group
                </h3>
                <p className="text-sm text-blue-300/80">
                  This group has been shared with you by {ownerUser?.name || 'the owner'}. You can use it for meetings, but you cannot edit, delete, share, or unshare it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <>
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Group" size="md">
            <div className="p-5 space-y-4">
              <Input 
                label="Group Name *" 
                value={groupForm.name} 
                onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} 
                placeholder="e.g. Backend Team" 
              />
              
              <div>
                <label className="label mb-3">Select Participants</label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {activeUsers.map(u => (
                    <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${groupForm.participantIds.includes(String(u.id)) ? 'bg-primary-900/30 border border-primary-800/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                      <input 
                        type="checkbox" 
                        checked={groupForm.participantIds.includes(String(u.id))} 
                        onChange={() => toggleParticipant(u.id)} 
                        className="rounded border-gray-600 bg-gray-700 text-primary-600" 
                      />
                      <Avatar name={u.name} size="xs" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{u.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{groupForm.participantIds.length} selected</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleGroupSave}>Save Changes</Button>
              </div>
            </div>
          </Modal>

          <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Group" size="md">
            <div className="p-5 space-y-4">
              {shareForm.sharedWith.length > 0 && (
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-900/30 mb-4">
                  <h4 className="text-sm font-semibold text-blue-200 mb-2">Currently Shared With</h4>
                  <div className="flex flex-wrap gap-2">
                    {shareForm.sharedWith.map(uid => {
                      const user = getUser(uid);
                      return user ? (
                        <div key={uid} className="flex items-center gap-1.5 bg-blue-900/40 px-2 py-1 rounded border border-blue-800/50">
                          <Avatar name={user.name} size="xs" className="w-4 h-4 text-[10px]" />
                          <span className="text-xs text-blue-100">{user.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-400">Select users to share <span className="text-white font-medium">{group.name}</span> with.</p>
              
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {activeUsers.filter(u => u.id !== currentUser.id).map(u => (
                  <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${shareForm.sharedWith.includes(String(u.id)) ? 'bg-blue-900/30 border border-blue-800/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                    <input 
                      type="checkbox" 
                      checked={shareForm.sharedWith.includes(String(u.id))} 
                      onChange={() => toggleShareUser(u.id)} 
                      className="rounded border-gray-600 bg-gray-700 text-blue-600" 
                    />
                    <Avatar name={u.name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">{u.name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{u.role}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button variant="secondary" onClick={() => setIsShareModalOpen(false)}>Cancel</Button>
                <Button onClick={handleShareSave}>Save Sharing</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
