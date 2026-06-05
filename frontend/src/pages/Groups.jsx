import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroups, createGroup, updateGroup, deleteGroup, shareGroup } from '../services/participantGroups';
import { KEYS, asyncGet } from '../services/storage';
import { Button, Input, Modal, Avatar } from '../components/ui';
import { Users, Edit2, Share2, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

export default function Groups() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({ name: '', participantIds: [] });
  
  const [sharingGroup, setSharingGroup] = useState(null);
  const [shareForm, setShareForm] = useState({ sharedWith: [] });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersData = await asyncGet(KEYS.USERS) || [];
      setAllUsers(usersData);
      
      const groupsData = await getGroups(currentUser.id);
      setGroups(groupsData);
    } catch (err) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingGroup(null);
    setGroupForm({ name: '', participantIds: [] });
    setIsGroupModalOpen(true);
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setGroupForm({ name: group.name, participantIds: (group.participantIds || []).map(String) });
    setIsGroupModalOpen(true);
  };

  const openShareModal = (group) => {
    setSharingGroup(group);
    setShareForm({ sharedWith: (group.sharedWith || []).map(String) });
    setIsShareModalOpen(true);
  };

  const handleGroupSave = async () => {
    if (!groupForm.name.trim()) {
      toast.error("Group name is required");
      return;
    }
    
    try {
      if (editingGroup) {
        await updateGroup(currentUser.id, editingGroup.id, groupForm);
        toast.success("Group updated");
        setIsGroupModalOpen(false);
        fetchData();
      } else {
        const newGroup = await createGroup(currentUser.id, groupForm);
        toast.success("Group created");
        setIsGroupModalOpen(false);
        fetchData();
        
        navigate(`/groups/${newGroup.id}`);
      }
    } catch (err) {
      toast.error("Failed to save group");
    }
  };

  const handleDelete = async (id) => {
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
      await deleteGroup(currentUser.id, id);
      toast.success("Group deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete group");
    }
  };

  const handleShareSave = async () => {
    try {
      await shareGroup(currentUser.id, sharingGroup.id, shareForm.sharedWith);
      toast.success("Sharing updated");
      setIsShareModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Failed to share group");
    }
  };

  const handleUnshare = async (group) => {
    const result = await Swal.fire({
      title: 'Stop sharing?',
      text: "Are you sure you want to stop sharing this group?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, unshare it!',
      background: '#1f2937',
      color: '#f3f4f6'
    });
    
    if (!result.isConfirmed) return;
    try {
      await shareGroup(currentUser.id, group.id, []);
      toast.success("Group unshared");
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
        ? prev.participantIds.filter(id => id !== strUid)
        : [...prev.participantIds, strUid]
    }));
  };

  const toggleShareUser = (uid) => {
    const strUid = String(uid);
    setShareForm(prev => ({
      ...prev,
      sharedWith: prev.sharedWith.includes(strUid)
        ? prev.sharedWith.filter(id => id !== strUid)
        : [...prev.sharedWith, strUid]
    }));
  };

  const activeUsers = allUsers.filter(u => u.isActive && u.isApproved);

  if (loading) return <div className="flex justify-center p-8"><span className="loading" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Participant Groups</h1>
          <p className="text-sm text-gray-400">Manage groups of users to quickly invite them to meetings.</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={16} /> Create Group
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map(group => {
          const isOwner = String(group.createdBy) === String(currentUser.id);
          return (
            <div key={group.id} className="card p-5 border border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-200 text-lg flex items-center gap-2">
                    {group.name}
                    {!isOwner && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">Shared</span>}
                    {isOwner && group.sharedWith?.length > 0 && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">Shared</span>}
                    {isOwner && (!group.sharedWith || group.sharedWith.length === 0) && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">Private</span>}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{group.participantIds?.length || 0} participants</p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => openShareModal(group)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" title="Share Group">
                      <Share2 size={16} />
                    </button>
                    {group.sharedWith?.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); handleUnshare(group); }} className="p-1.5 text-blue-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Unshare Group">
                        <X size={16} />
                      </button>
                    )}
                    <button onClick={() => openEditModal(group)} className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-400/10 rounded-md transition-colors" title="Edit Group">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(group.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete Group">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-800/50">
                <p className="text-xs text-gray-500 mb-2">Participants ({group.participantIds?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 custom-scrollbar" onClick={e => e.stopPropagation()}>
                  {group.participantIds && group.participantIds.map(uid => {
                    const user = allUsers.find(u => String(u.id) === String(uid));
                    return user ? (
                      <div key={uid} title={user.name} className="flex-shrink-0 hover:scale-110 transition-transform cursor-help">
                        <Avatar name={user.name} size="sm" className="w-7 h-7 text-xs" />
                      </div>
                    ) : null;
                  })}
                  {(!group.participantIds || group.participantIds.length === 0) && (
                    <span className="text-xs text-gray-600 italic px-1">No participants</span>
                  )}
                </div>
              </div>

              {group.sharedWith?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-800/50">
                  <p className="text-xs text-blue-400/80">Shared with {group.sharedWith.length} user(s)</p>
                </div>
              )}

              <div className="mt-4">
                <Button 
                  className="w-full justify-center bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700" 
                  onClick={(e) => { e.stopPropagation(); navigate(`/groups/${group.id}`); }}
                >
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>You haven't created any groups yet.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title={editingGroup ? "Edit Group" : "Create Group"} size="md">
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
            <Button variant="secondary" onClick={() => setIsGroupModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGroupSave}>Save Group</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Group" size="md">
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-400">Select users to share <span className="text-white font-medium">{sharingGroup?.name}</span> with. They will be able to use this group when scheduling meetings.</p>
          
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {activeUsers.filter(u => u.id !== currentUser.id && ['admin', 'manager', 'hr'].includes(u.role)).map(u => (
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
    </div>
  );
}
