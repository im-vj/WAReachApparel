import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import api from '../utils/api';

export default function LogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/log/all');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (logs.length === 0) return;
    
    const headers = ['ID', 'Date/Time', 'Contact Name', 'Phone', 'Status', 'WA Msg ID', 'Error Response'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        return [
          log.id,
          log.sentAt ? new Date(log.sentAt).toLocaleString() : '',
          `"${log.contact?.displayName || ''}"`,
          log.contact?.phoneNumber || '',
          log.responseStatus || '',
          log.waMessageId || '',
          `"${(log.responseBody || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `wareach_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/40 p-5 rounded-2xl border border-gray-800/80 backdrop-blur-md">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Campaign History Logs</h3>
          <p className="text-gray-400 text-xs mt-1">Review delivery outcomes, timestamps, and Meta API response diagnostics.</p>
        </div>
        <button 
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="btn-secondary flex items-center justify-center w-full sm:w-auto px-5"
        >
          <Download className="w-4 h-4 mr-2 text-emerald-400" />
          Export CSV Report
        </button>
      </div>

      <div className="table-container max-h-[calc(100vh-12rem)]">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="table-header">Date/Time</th>
              <th className="table-header">Contact</th>
              <th className="table-header">Phone</th>
              <th className="table-header">Message Snippet</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">Loading logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">No send history found.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="group hover:bg-gray-800/40 transition-colors">
                  <td className="table-cell text-gray-400 whitespace-nowrap">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'N/A'}
                  </td>
                  <td className="table-cell font-medium">{log.contact?.displayName || 'Unknown'}</td>
                  <td className="table-cell text-gray-300">+{log.contact?.phoneNumber}</td>
                  <td className="table-cell text-gray-400 max-w-xs truncate" title={log.renderedMessage}>
                    {log.renderedMessage?.substring(0, 50)}...
                  </td>
                  <td className="table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      log.responseStatus === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {log.responseStatus}
                    </span>
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
