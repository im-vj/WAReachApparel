import { useState, useEffect } from 'react';
import { Send, CheckSquare, Square, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SendTab() {
  const [contacts, setContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState(new Set());
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [delayMs, setDelayMs] = useState(3000);
  const [isTemplateMode, setIsTemplateMode] = useState(true);
  const [paramValues, setParamValues] = useState({});
  
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cRes, tRes] = await Promise.all([
        api.get('/contacts'),
        api.get('/templates')
      ]);
      setContacts(cRes.data);
      setTemplates(tRes.data);
      if (tRes.data.length > 0) setSelectedTemplateId(tRes.data[0].id.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleContact = (id) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const selectAllPending = () => {
    const pendingIds = contacts.filter(c => c.status === 'PENDING').map(c => c.id);
    setSelectedContacts(new Set(pendingIds));
  };

  const selectAll = () => setSelectedContacts(new Set(contacts.map(c => c.id)));
  const deselectAll = () => setSelectedContacts(new Set());

  const startSending = async () => {
    if (selectedContacts.size === 0 || !selectedTemplateId) return;

    try {
      setSending(true);
      setLogs([]);
      setProgress({ total: selectedContacts.size, sent: 0, failed: 0 });
      toast('Campaign started!', { icon: '🚀' });

      // Convert paramValues { 2: "val2", 3: "val3" } into array for worker
      const selectedTpl = templates.find(t => t.id.toString() === selectedTemplateId);
      const matches = selectedTpl ? [...(selectedTpl.content.matchAll(/\{\{(\d+)\}\}/g))].map(m => parseInt(m[1])) : [];
      const maxIdx = matches.length > 0 ? Math.max(...matches) : 0;
      const customParamsList = [];
      for (let p = 2; p <= maxIdx; p++) {
        customParamsList.push(paramValues[p] || '');
      }

      const res = await api.post('/send', {
        templateId: parseInt(selectedTemplateId),
        contactIds: Array.from(selectedContacts),
        delayMs,
        isTemplateMode,
        customParams: customParamsList
      });

      const { clientId } = res.data;
      
      const eventSource = new EventSource(`/api/send/progress/${clientId}`);
      
      eventSource.addEventListener('init', (e) => {
        console.log('SSE Connected', e.data);
      });

      eventSource.addEventListener('progress', (e) => {
        setProgress(JSON.parse(e.data));
      });

      eventSource.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        setLogs(prev => [data, ...prev].slice(0, 100)); // Keep last 100 logs
        
        // Update contact status in list
        setContacts(prev => prev.map(c => 
          c.id === data.contactId ? { ...c, status: data.status === 'SENT' ? 'SENT' : data.status === 'FAILED' ? 'FAILED' : c.status } : c
        ));
      });

      eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        setProgress(data);
        setSending(false);
        eventSource.close();
        toast.success(`Finished sending. ${data.sent} sent, ${data.failed} failed.`);
      });

      eventSource.addEventListener('error', (e) => {
        console.error('SSE Error', e);
        setSending(false);
        eventSource.close();
      });

    } catch (err) {
      console.error(err);
      toast.error('Failed to start sending');
      setSending(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id.toString() === selectedTemplateId);
  const previewName = selectedContacts.size > 0 
    ? contacts.find(c => c.id === Array.from(selectedContacts)[0])?.displayName 
    : 'John Doe';

  // Calculate max parameter count required by selectedTemplate
  const matches = selectedTemplate ? [...(selectedTemplate.content.matchAll(/\{\{(\d+)\}\}/g))].map(m => parseInt(m[1])) : [];
  const maxParamIndex = matches.length > 0 ? Math.max(...matches) : (/\{name\}/i.test(selectedTemplate?.content || '') ? 1 : 0);

  const getPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.content.replace(/\{name\}|\{\{1\}\}/gi, previewName);
    for (let p = 2; p <= maxParamIndex; p++) {
      const val = paramValues[p] || `{{${p}}}`;
      text = text.replace(new RegExp(`\\{\\{${p}\\}\\}`, 'g'), val);
    }
    return text;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Configuration */}
      <div className="lg:col-span-2 space-y-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Send Configuration</h3>
          
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-blue-400 shrink-0 w-5 h-5 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Important: Meta API Rules</p>
                <p>For cold outreach, you <strong>must</strong> use an approved Template Message. Free text is only allowed for contacts who have messaged you first within the last 24 hours.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="mode" 
                  checked={isTemplateMode} 
                  onChange={() => setIsTemplateMode(true)}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium">Template Message (Cold Outreach)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="mode" 
                  checked={!isTemplateMode} 
                  onChange={() => setIsTemplateMode(false)}
                  className="w-4 h-4 text-primary bg-gray-700 border-gray-600 focus:ring-primary focus:ring-2"
                />
                <span className="text-sm font-medium">Free Text (24h window)</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Select Template</label>
              <select 
                className="input-field"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                disabled={sending}
              >
                <option value="" disabled>Select a template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {isTemplateMode && t.metaTemplateName ? `(${t.metaTemplateName})` : ''}</option>
                ))}
              </select>
            </div>

            {isTemplateMode && selectedTemplate && (
              <div className="space-y-3 pt-2 border-t border-gray-800 animate-in fade-in">
                <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">Template Parameter Options:</div>
                {maxParamIndex === 0 ? (
                  <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/40 text-xs text-gray-400 italic text-center">
                    No parameters ({'{{1}}'}, {'{{2}}'}, etc.) required for this template.
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/60 text-xs text-primary flex items-center justify-between font-mono">
                      <span>{'{{1}}'} (Recipient Name)</span>
                      <span className="text-gray-400 italic font-sans text-[11px]">Auto-bound to contact Name</span>
                    </div>
                    {maxParamIndex >= 2 && (
                      Array.from({ length: maxParamIndex - 1 }, (_, i) => i + 2).map(num => (
                        <div key={num}>
                          <label className="block text-xs font-medium text-gray-300 mb-1 font-mono">
                            Parameter {'{{' + num + '}}'} Value
                          </label>
                          <input 
                            type="text" 
                            className="input-field py-2 text-sm font-sans"
                            value={paramValues[num] || ''}
                            onChange={(e) => setParamValues({ ...paramValues, [num]: e.target.value })}
                            placeholder={`Enter value for {{${num}}}`}
                            disabled={sending}
                          />
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Delay Between Messages (ms)</label>
              <input 
                type="number" 
                className="input-field"
                value={delayMs}
                onChange={(e) => setDelayMs(parseInt(e.target.value))}
                min="0"
                step="500"
                disabled={sending}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Select Contacts ({selectedContacts.size} selected)</h3>
            <div className="flex gap-2">
              <button onClick={selectAllPending} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={sending}>Pending Only</button>
              <button onClick={selectAll} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={sending}>Select All</button>
              <button onClick={deselectAll} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition-colors disabled:opacity-50" disabled={sending}>Deselect All</button>
            </div>
          </div>
          
          <div className="table-container max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-800/50">
              <thead className="bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left w-10"></th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 bg-surface-dark">
                {contacts.map(contact => (
                  <tr key={contact.id} className="hover:bg-gray-800/40 cursor-pointer transition-colors group" onClick={() => !sending && toggleContact(contact.id)}>
                    <td className="table-cell">
                      {selectedContacts.has(contact.id) ? 
                        <CheckSquare className="w-5 h-5 text-primary transition-transform group-hover:scale-110" /> : 
                        <Square className="w-5 h-5 text-gray-500 transition-transform group-hover:scale-110" />
                      }
                    </td>
                    <td className="table-cell font-medium">{contact.displayName || contact.savedName}</td>
                    <td className="table-cell text-gray-400">+{contact.phoneNumber}</td>
                    <td className="table-cell">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${contact.status === 'SENT' ? 'bg-green-500/10 text-green-400 border-green-500/20' : contact.status === 'FAILED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                        {contact.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Action */}
      <div className="space-y-6">
        <div className="card flex flex-col items-center justify-center py-8">
          <button 
            onClick={startSending}
            disabled={sending || selectedContacts.size === 0 || !selectedTemplateId}
            className={`w-full py-4 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg transition-all ${
              sending 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-primary hover:bg-primary-dark text-white hover:shadow-primary/20 hover:-translate-y-1'
            }`}
          >
            <Send className="w-6 h-6 mr-3" />
            {sending ? 'Sending...' : `Send ${selectedContacts.size} Messages`}
          </button>
          
          {!sending && selectedContacts.size > 0 && selectedTemplateId && (
            <p className="text-sm text-gray-400 mt-4 text-center">
              Estimated time: ~{((selectedContacts.size * delayMs) / 1000).toFixed(1)} seconds
            </p>
          )}
        </div>

        {sending || progress ? (
          <div className="card">
            <h3 className="font-medium mb-4">Live Progress</h3>
            
            {progress && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>{progress.sent + progress.failed} of {progress.total} processed</span>
                  <span className="text-primary font-medium">{Math.round(((progress.sent + progress.failed) / progress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}></div>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-green-400">{progress.sent} Sent</span>
                  <span className="text-red-400">{progress.failed} Failed</span>
                </div>
              </div>
            )}

            <div className="bg-gray-950 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-2.5 border border-gray-800/80 shadow-inner relative">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-950 to-transparent pointer-events-none"></div>
              {logs.map((log, idx) => (
                <div key={idx} className={`flex items-start ${log.status === 'FAILED' ? 'text-red-400' : log.status === 'SENT' ? 'text-primary' : log.status === 'RATE_LIMITED' ? 'text-yellow-400' : 'text-gray-300'} animate-in fade-in slide-in-from-bottom-1`}>
                  <span className="mr-2.5 mt-0.5">
                    {log.status === 'SENT' ? '✓' : log.status === 'FAILED' ? '✗' : log.status === 'RATE_LIMITED' ? '⚠' : '⟳'}
                  </span>
                  <span className="leading-relaxed">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-500/70 italic absolute inset-0 flex items-center justify-center">Awaiting terminal output...</div>}
            </div>
          </div>
        ) : (
          <div className="card">
            <h3 className="font-medium mb-4 text-gray-400 uppercase tracking-wider text-xs">Message Preview</h3>
            {selectedTemplate ? (
              <div className="bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover rounded-xl p-5 h-80 overflow-y-auto flex flex-col border border-gray-700/50 shadow-inner relative">
                <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                <div className="bg-white text-gray-800 rounded-xl rounded-tl-none p-4 shadow-sm max-w-[85%] self-start text-[14.5px] leading-snug whitespace-pre-wrap relative z-10">
                  <svg viewBox="0 0 8 13" width="8" height="13" className="absolute top-0 -left-2 text-white fill-current drop-shadow-sm">
                    <path d="M5.188 1H0v11.142l4.969-5.063A2 2 0 0 0 5.188 1z" />
                  </svg>
                  <span className="text-gray-900">{getPreviewText()}</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg h-80 flex items-center justify-center text-gray-500 text-sm text-center p-6 border border-gray-700">
                Select a template to see preview
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
