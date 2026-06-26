import { useState } from 'react';
import { Users, FileText, Send, History, Settings, MessageSquare, Menu, X } from 'lucide-react';
import ContactsTab from './components/ContactsTab';
import TemplatesTab from './components/TemplatesTab';
import SendTab from './components/SendTab';
import LogTab from './components/LogTab';
import SettingsTab from './components/SettingsTab';
import { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'contacts', name: 'Contacts', icon: Users },
    { id: 'templates', name: 'Templates', icon: FileText },
    { id: 'send', name: 'Send Messages', icon: Send },
    { id: 'log', name: 'Send Log', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'contacts': return <ContactsTab />;
      case 'templates': return <TemplatesTab />;
      case 'send': return <SendTab />;
      case 'log': return <LogTab />;
      case 'settings': return <SettingsTab />;
      default: return <ContactsTab />;
    }
  };

  const handleTabSelect = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden font-sans text-gray-100">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }} 
      />

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-surface-dark/95 md:bg-surface-dark border-r border-gray-800/80 flex flex-col shadow-2xl transition-transform duration-300 ease-out shrink-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none opacity-60"></div>
        
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-gray-800/80 relative z-10">
          <div className="flex items-center">
            <div className="bg-gradient-to-tr from-emerald-500 to-teal-500 p-2.5 rounded-xl mr-3 shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-wider">WAReach</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-white rounded-lg md:hidden hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 relative z-10 px-4 space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-400 shadow-md border border-emerald-500/25'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-r-full shadow-lg shadow-emerald-500"></div>}
                <Icon className={`w-5 h-5 mr-3.5 transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-400' : 'group-hover:scale-110 group-hover:text-gray-300'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-6 border-t border-gray-800/80 text-xs text-gray-500 relative z-10 flex items-center justify-between">
          <span>v2.5 Pro Enterprise</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-bg-dark">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-bg-dark to-bg-dark pointer-events-none"></div>
        
        {/* Top Navbar */}
        <header className="h-20 bg-surface-dark/80 backdrop-blur-xl border-b border-gray-800/80 flex items-center justify-between px-6 sm:px-10 relative z-30 shadow-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl md:hidden hover:bg-gray-800/80 transition-colors border border-gray-700/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight flex items-center gap-3">
              {tabs.find((t) => t.id === activeTab)?.name}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-900/60 px-3.5 py-1.5 rounded-full border border-gray-800 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API Connected
            </div>
          </div>
        </header>

        {/* Tab Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 relative z-20">
          <div className="max-w-7xl mx-auto">
            {renderTab()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
