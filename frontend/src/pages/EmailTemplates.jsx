import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet, apiPost } from '../services/storage';
import { Button, Input, Select } from '../components/ui';
import { Plus, Edit2, Copy, Trash2, CheckCircle2, Star, Clock, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';

const CATEGORIES = [
  'Interview Invitation',
  'Interview Reminder',
  'Interview Rescheduled',
  'Interview Cancelled',
  'Selection Notification',
  'Rejection Notification',
  'Next Round Invitation',
  'Offer Letter Notification'
];

const MERGE_TAGS = [
  { label: 'Candidate Name', tag: '{{CandidateName}}' },
  { label: 'Candidate Email', tag: '{{CandidateEmail}}' },
  { label: 'Interviewer Name', tag: '{{InterviewerName}}' },
  { label: 'Interview Date', tag: '{{InterviewDate}}' },
  { label: 'Interview Time', tag: '{{InterviewTime}}' },
  { label: 'Interview Type', tag: '{{InterviewType}}' },
  { label: 'Meeting Link', tag: '{{MeetingLink}}' },
  { label: 'Company Name', tag: '{{CompanyName}}' },
  { label: 'Company Logo', tag: '{{CompanyLogo}}' },
  { label: 'HR Name', tag: '{{HRName}}' },
  { label: 'Job Role', tag: '{{JobRole}}' },
  { label: 'Department', tag: '{{Department}}' }
];

export default function EmailTemplates() {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [historyTemplate, setHistoryTemplate] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  
  const [testEmail, setTestEmail] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await asyncGet(KEYS.EMAIL_TEMPLATES);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editingTemplate.name || !editingTemplate.subject) {
      toast.error('Name and Subject are required');
      return;
    }
    const templateToSave = {
      ...editingTemplate,
      updatedBy: currentUser.id,
      createdBy: editingTemplate.id ? editingTemplate.createdBy : currentUser.id
    };
    
    try {
      await asyncSet(KEYS.EMAIL_TEMPLATES, templateToSave);
      toast.success('Template saved successfully!');
      setEditingTemplate(null);
      fetchTemplates();
    } catch (e) {
      toast.error('Failed to save template');
    }
  };

  const handleDelete = async (template) => {
    if (window.confirm(`Are you sure you want to delete ${template.name}?`)) {
      try {
        const filtered = templates.filter(t => t.id !== template.id);
        await asyncSet(KEYS.EMAIL_TEMPLATES, filtered);
        toast.success('Template deleted');
        fetchTemplates();
      } catch (e) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleDuplicate = async (template) => {
    const duplicated = {
      ...template,
      id: null,
      name: `${template.name} (Copy)`,
      isDefault: false,
      version: 1,
      createdBy: currentUser.id,
      updatedBy: currentUser.id
    };
    setEditingTemplate(duplicated);
  };

  const toggleDefault = async (template) => {
    const updated = { ...template, isDefault: true, updatedBy: currentUser.id };
    try {
      await asyncSet(KEYS.EMAIL_TEMPLATES, updated);
      fetchTemplates();
      toast.success(`${template.name} set as default`);
    } catch (e) {
      toast.error('Failed to update default template');
    }
  };

  const toggleActive = async (template) => {
    const updated = { ...template, isActive: !template.isActive, updatedBy: currentUser.id };
    try {
      await asyncSet(KEYS.EMAIL_TEMPLATES, updated);
      fetchTemplates();
      toast.success(`Template ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error('Failed to update template status');
    }
  };

  const loadHistory = async (template) => {
    try {
      const history = await asyncGet(`${KEYS.EMAIL_TEMPLATES}/${template.id}/history`);
      setHistoryRecords(history);
      setHistoryTemplate(template);
    } catch (e) {
      toast.error('Failed to load history');
    }
  };

  const restoreHistory = async (historyRecord) => {
    if (window.confirm('Are you sure you want to restore this version?')) {
      try {
        await apiPost(`${KEYS.EMAIL_TEMPLATES}/${historyTemplate.id}/restore/${historyRecord.id}`);
        toast.success('Template restored successfully');
        setHistoryTemplate(null);
        fetchTemplates();
      } catch (e) {
        toast.error('Failed to restore template');
      }
    }
  };

  const insertMergeTag = (tag) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      htmlBody: (editingTemplate.htmlBody || '') + tag
    });
  };

  const compilePreview = (html) => {
    if (!html) return '';
    let compiled = html;
    const sampleData = {
      CandidateName: 'John Doe',
      CandidateEmail: 'john@example.com',
      InterviewerName: 'Sarah Smith',
      InterviewDate: '2026-06-10',
      InterviewTime: '10:00 AM',
      InterviewType: 'Technical',
      MeetingLink: 'https://settribe.com/join/xyz123',
      CompanyName: 'SetTribe',
      CompanyLogo: 'https://settribe.com/logo.png',
      HRName: 'HR Department',
      JobRole: 'Frontend Developer',
      Department: 'Engineering'
    };
    Object.entries(sampleData).forEach(([key, value]) => {
      compiled = compiled.replaceAll(`{{${key}}}`, value);
    });
    return compiled;
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading templates...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Email Templates</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and customize emails sent to candidates.</p>
        </div>
        <Button onClick={() => setEditingTemplate({ name: '', subject: '', htmlBody: '', category: CATEGORIES[0], isDefault: false, isActive: true })}>
          <Plus size={16} /> New Template
        </Button>
      </div>

      {/* Editor View */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <h2 className="text-lg font-bold text-gray-100">{editingTemplate.id ? 'Edit Template' : 'New Template'}</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setEditingTemplate(null)}>Cancel</Button>
                <Button variant="secondary" onClick={() => setPreviewTemplate(editingTemplate)}><Eye size={16} /> Preview</Button>
                <Button onClick={handleSave}><CheckCircle2 size={16} /> Save Template</Button>
              </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Template Name" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                  <Select label="Category" value={editingTemplate.category} onChange={e => setEditingTemplate({...editingTemplate, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </div>
                <Input label="Email Subject" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                
                <div>
                  <label className="label mb-2">Email Body</label>
                  <RichTextEditor
                    value={editingTemplate.htmlBody || ''}
                    onChange={val => setEditingTemplate({ ...editingTemplate, htmlBody: val })}
                    style={{ minHeight: '300px' }}
                  />
                </div>
              </div>

              {/* Sidebar with Merge Tags */}
              <div className="w-64 border-l border-gray-800 bg-gray-950 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Merge Tags</h3>
                <p className="text-xs text-gray-500 mb-4">Click a tag to append it to your email body.</p>
                <div className="space-y-2">
                  {MERGE_TAGS.map(tag => (
                    <button 
                      key={tag.tag}
                      onClick={() => insertMergeTag(tag.tag)}
                      className="w-full text-left p-2 rounded bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors flex justify-between group"
                    >
                      <span>{tag.label}</span>
                      <span className="text-xs text-gray-500 group-hover:text-primary-400 font-mono">{'{}'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <h2 className="text-lg font-bold text-gray-100">Email Preview</h2>
              <div className="flex gap-4 items-center">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button onClick={() => setPreviewMode('desktop')} className={`px-3 py-1 text-xs rounded-md ${previewMode === 'desktop' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}>Desktop</button>
                  <button onClick={() => setPreviewMode('mobile')} className={`px-3 py-1 text-xs rounded-md ${previewMode === 'mobile' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}>Mobile</button>
                </div>
                <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>Close</Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center">
              <div className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ${previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-2xl'}`}>
                <div className="bg-gray-50 p-4 border-b border-gray-200">
                  <p className="text-sm text-gray-500 mb-1"><strong>Subject:</strong> {compilePreview(previewTemplate.subject)}</p>
                  <p className="text-xs text-gray-400"><strong>To:</strong> john@example.com</p>
                </div>
                <div className="p-6 text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: compilePreview(previewTemplate.htmlBody) }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl border border-gray-700 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-100">Version History: {historyTemplate.name}</h2>
              <Button variant="secondary" onClick={() => setHistoryTemplate(null)}>Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyRecords.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No history available.</p>
              ) : (
                historyRecords.map(record => (
                  <div key={record.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-200">Version {record.version}</h4>
                      <p className="text-xs text-gray-400 mt-1">Modified at: {new Date(record.modifiedAt).toLocaleString()}</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => restoreHistory(record)}>
                      <Clock size={14} className="mr-1" /> Restore
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {CATEGORIES.map(category => {
        const catTemplates = templates.filter(t => t.category === category);
        if (catTemplates.length === 0) return null;
        
        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 pb-2 border-b border-gray-800">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catTemplates.map(template => (
                <div key={template.id} className={`card p-5 border-l-4 ${template.isDefault ? 'border-primary-500' : 'border-gray-700'} ${!template.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-100 truncate pr-2">{template.name}</h3>
                    {template.isDefault && <Star size={16} className="text-yellow-500 flex-shrink-0" fill="currentColor" />}
                  </div>
                  <p className="text-xs text-gray-400 mb-4 line-clamp-1">{template.subject}</p>
                  
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                    <button onClick={() => setEditingTemplate(template)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"><Edit2 size={12}/> Edit</button>
                    <button onClick={() => setPreviewTemplate(template)} className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"><Eye size={12}/> Preview</button>
                    <button onClick={() => handleDuplicate(template)} className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"><Copy size={12}/> Clone</button>
                    <button onClick={() => loadHistory(template)} className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"><Clock size={12}/> History</button>
                    <button onClick={() => toggleDefault(template)} className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"><Star size={12}/> Set Default</button>
                    <button onClick={() => toggleActive(template)} className={`text-xs ${template.isActive ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'} flex items-center gap-1`}><AlertCircle size={12}/> {template.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => handleDelete(template)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 ml-auto"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {templates.length === 0 && (
        <div className="text-center py-20 card border-dashed border-gray-700">
          <p className="text-gray-400">No email templates created yet.</p>
          <Button className="mt-4" onClick={() => setEditingTemplate({ name: '', subject: '', htmlBody: '', category: CATEGORIES[0], isDefault: false, isActive: true })}>Create First Template</Button>
        </div>
      )}
    </div>
  );
}
