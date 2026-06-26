import { useState, useEffect } from 'react';
import { Users, FileText, Send, History, Settings, MessageSquare, Menu, X, LogOut, User } from 'lucide-react';
import ContactsTab from './components/ContactsTab';
import TemplatesTab from './components/TemplatesTab';
import SendTab from './components/SendTab';
import LogTab from './components/LogTab';
import SettingsTab from './components/SettingsTab';
import Login from './components/Login';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('wareach_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleLogoutEvent = () => setUser(null);
    window.addEventListener('wareach_logout', handleLogoutEvent);
    return () => window.removeEventListener('wareach_logout', handleLogoutEvent);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wareach_token');
    localStorage.removeItem('wareach_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

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

  if (!user) {
    return (
      <>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '12px',
            },
          }} 
        />
        <Login onLoginSuccess={setUser} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0b10] overflow-hidden font-sans text-zinc-100 antialiased">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '13px',
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
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop & Mobile Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 md:w-64 bg-[#07080c] border-r border-white/[0.06] flex flex-col shadow-2xl transition-transform duration-300 ease-out shrink-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-4 h-4 text-zinc-950 fill-current" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">WAReach <span className="text-[10px] font-mono font-normal uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">Pro</span></span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg md:hidden hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabSelect(tab.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-white/[0.07] text-white shadow-sm border border-white/[0.08]'
                    : 'text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                {tab.name}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-white/[0.06] text-[11px] font-mono text-zinc-500 flex items-center justify-between shrink-0">
          <span>Enterprise v2.5</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-sans font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-[#0a0b10]">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-emerald-500/[0.03] rounded-full blur-[140px] pointer-events-none"></div>
        
        {/* Top Navbar */}
        <header className="h-16 bg-[#0a0b10]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6 sm:px-10 relative z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-lg md:hidden hover:bg-white/[0.05] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              {tabs.find((t) => t.id === activeTab)?.name}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.06] text-xs text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              API Connected
            </div>
            
            <div className="flex items-center gap-2 pl-3 border-l border-white/[0.08]">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.07] text-xs text-zinc-300">
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-medium hidden md:inline truncate max-w-[120px]">{user.name || user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 border border-white/[0.07] hover:border-rose-500/30 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
