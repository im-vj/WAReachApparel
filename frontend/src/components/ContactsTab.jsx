import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ConfirmModal from './ConfirmModal';

export default function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const fileInputRef = useRef(null);
  
  const [modalState, setModalState] = useState({ isOpen: false, type: '', payload: null });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const uploadPromise = api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    toast.promise(uploadPromise, {
      loading: 'Importing contacts...',
      success: (res) => res.data.message,
      error: (err) => 'Import failed: ' + (err.response?.data?.error || err.message)
    });

    try {
      setLoading(true);
      await uploadPromise;
      fetchContacts();
    } catch (err) {
      console.error(err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestDelete = (id) => {
    setModalState({ isOpen: true, type: 'delete', payload: id });
  };

  const requestReset = () => {
    setModalState({ isOpen: true, type: 'reset', payload: null });
  };

  const executeModalAction = async () => {
    if (modalState.type === 'delete') {
      try {
        await api.delete(`/contacts/${modalState.payload}`);
        setContacts(contacts.filter(c => c.id !== modalState.payload));
        toast.success('Contact deleted');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete contact');
      }
    } else if (modalState.type === 'reset') {
      try {
        await api.post('/contacts/reset');
        toast.success('All contacts reset to PENDING');
        fetchContacts();
      } catch (err) {
        console.error(err);
        toast.error('Failed to reset contacts');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT': return 'bg-green-500/20 text-green-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      case 'SKIPPED': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredContacts = contacts.filter(c => filter === 'ALL' || c.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center justify-center grow sm:grow-0"
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2 shrink-0" />
            Upload Excel
          </button>
          <button 
            onClick={requestReset}
            className="btn-secondary flex items-center justify-center grow sm:grow-0"
            disabled={loading || contacts.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
            Reset Pending
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-zinc-400 text-[11px] font-mono uppercase tracking-wider">Filter:</span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="input-field py-2 w-full sm:w-44 text-xs shadow-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="SENT">Sent Successfully</option>
            <option value="FAILED">Failed Delivery</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-[#08090d] sticky top-0 z-10">
            <tr>
              <th className="table-header">ID</th>
              <th className="table-header">Display Name</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Status</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-zinc-500 font-mono text-xs">Loading contacts...</td></tr>
            ) : filteredContacts.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-zinc-500 font-mono text-xs">No contacts found.</td></tr>
            ) : (
              filteredContacts.map(contact => (
                <tr key={contact.id} className="group hover:bg-white/[0.025] transition-colors">
                  <td className="table-cell text-zinc-500 font-mono text-xs">{contact.id}</td>
                  <td className="table-cell font-medium text-white">{contact.displayName || contact.savedName}</td>
                  <td className="table-cell text-zinc-300 font-mono text-xs">+{contact.phoneNumber}</td>
                  <td className="table-cell">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-white/5 ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                    {contact.errorMessage && (
                      <p className="text-xs text-rose-400 mt-1 truncate max-w-xs" title={contact.errorMessage}>
                        {contact.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="table-cell">
                    <button 
                      onClick={() => requestDelete(contact.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.05] rounded-lg transition-colors"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, type: '', payload: null })}
        onConfirm={executeModalAction}
        title={modalState.type === 'delete' ? 'Delete Contact' : 'Reset All Contacts'}
        message={modalState.type === 'delete' 
          ? 'Are you sure you want to delete this contact?' 
          : 'Are you sure you want to reset all contacts to PENDING? This will allow you to message them again.'}
        confirmText={modalState.type === 'delete' ? 'Delete' : 'Reset All'}
        isDestructive={modalState.type === 'delete'}
      />
    </div>
  );
}
