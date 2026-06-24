import { useState, useEffect } from 'react';
import { Save, ExternalLink, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function SettingsTab() {
  const [settings, setSettings] = useState({
    'whatsapp.phone-number-id': '',
    'whatsapp.business-account-id': '',
    'whatsapp.access-token': '',
    'whatsapp.api-version': 'v25.0'
  });
  const [loading, setLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const savePromise = api.post('/settings', settings);
    
    toast.promise(savePromise, {
      loading: 'Saving settings...',
      success: 'Settings saved! Backend will use these immediately.',
      error: 'Failed to save settings'
    });

    try {
      setLoading(true);
      await savePromise;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!testPhone) {
      toast.error('Please enter a phone number to test');
      return;
    }
    
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.post('/send/test', { phone: testPhone });
      setTestResult({ success: true, data: res.data });
    } catch (err) {
      console.error(err);
      setTestResult({ success: false, error: err.response?.data?.error || err.message, raw: err.response?.data });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div className="card">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 flex items-center">
          Meta WhatsApp API Configuration
          <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="ml-4 text-xs font-normal text-primary hover:text-primary-dark hover:underline flex items-center bg-primary/10 px-2.5 py-1 rounded-full transition-colors">
            Meta Dashboard <ExternalLink className="w-3 h-3 ml-1.5" />
          </a>
        </h2>
        
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone Number ID</label>
              <input
                type="text"
                className="input-field"
                value={settings['whatsapp.phone-number-id']}
                onChange={(e) => setSettings({...settings, 'whatsapp.phone-number-id': e.target.value})}
                placeholder="101xxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                className="input-field"
                value={settings['whatsapp.business-account-id']}
                onChange={(e) => setSettings({...settings, 'whatsapp.business-account-id': e.target.value})}
                placeholder="112xxxxxxxx"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Permanent Access Token</label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                className="input-field pr-20 font-mono text-sm"
                value={settings['whatsapp.access-token']}
                onChange={(e) => setSettings({...settings, 'whatsapp.access-token': e.target.value})}
                placeholder="EAAL..."
              />
              <button 
                type="button" 
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium hover:text-primary-dark"
              >
                {showToken ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">API Version</label>
            <input
              type="text"
              className="input-field w-32"
              value={settings['whatsapp.api-version']}
              onChange={(e) => setSettings({...settings, 'whatsapp.api-version': e.target.value})}
              placeholder="v25.0"
            />
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button type="submit" className="btn-primary flex items-center" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2.5 text-primary" />
          Test Connection
        </h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Send a free-text test message to verify your API credentials. The recipient number must have sent a message to your WhatsApp Business number within the last 24 hours to receive free-text messages.
        </p>
        
        <div className="flex gap-3 max-w-md">
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 919876543210"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
          <button 
            onClick={handleTestConnection}
            disabled={testing}
            className="btn-secondary whitespace-nowrap"
          >
            {testing ? 'Testing...' : 'Send Test'}
          </button>
        </div>

        {testResult && (
          <div className={`mt-4 p-4 rounded-lg border text-sm overflow-hidden ${testResult.success ? 'bg-green-900/20 border-green-800/50' : 'bg-red-900/20 border-red-800/50'}`}>
            <h4 className={`font-semibold mb-2 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
            </h4>
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
              {JSON.stringify(testResult.success ? testResult.data : testResult.raw, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
