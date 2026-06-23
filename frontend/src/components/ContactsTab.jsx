import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function ContactsTab() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const fileInputRef = useRef(null);

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
      alert('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(res.data.message);
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to import contacts: ' + (err.response?.data?.error || err.message));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      setContacts(contacts.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete contact');
    }
  };

  const resetAll = async () => {
    if (!confirm('Are you sure you want to reset all contacts to PENDING?')) return;
    try {
      await api.post('/contacts/reset');
      fetchContacts();
    } catch (err) {
      console.error(err);
      alert('Failed to reset contacts');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center"
            disabled={loading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Excel
          </button>
          <button 
            onClick={resetAll}
            className="btn-secondary flex items-center"
            disabled={loading || contacts.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset All to Pending
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Filter:</span>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-surface-dark border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Display Name</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading contacts...</td></tr>
            ) : filteredContacts.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">No contacts found.</td></tr>
            ) : (
              filteredContacts.map(contact => (
                <tr key={contact.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="table-cell text-gray-400">{contact.id}</td>
                  <td className="table-cell font-medium">{contact.displayName || contact.savedName}</td>
                  <td className="table-cell text-gray-300">+{contact.phoneNumber}</td>
                  <td className="table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                    {contact.errorMessage && (
                      <p className="text-xs text-red-400 mt-1 truncate max-w-xs" title={contact.errorMessage}>
                        {contact.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="table-cell">
                    <button 
                      onClick={() => deleteContact(contact.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
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
    </div>
  );
}
