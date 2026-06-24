import { useState } from 'react';
import { Users, FileText, Send, History, Settings, MessageSquare } from 'lucide-react';
import ContactsTab from './components/ContactsTab';
import TemplatesTab from './components/TemplatesTab';
import SendTab from './components/SendTab';
import LogTab from './components/LogTab';
import SettingsTab from './components/SettingsTab';

import { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('contacts');

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

  return (
    <div className="flex h-screen bg-bg-dark">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }} 
      />
      {/* Sidebar */}
      <div className="w-64 bg-surface-dark border-r border-gray-800/80 flex flex-col shadow-xl z-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none opacity-50"></div>
        <div className="h-20 flex items-center px-8 border-b border-gray-800/80 relative z-10">
          <div className="bg-primary/10 p-2 rounded-xl mr-3 border border-primary/20 shadow-inner">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-wide">WAReach</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 relative z-10">
          <ul className="space-y-2 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 group-hover:text-gray-300'}`} />
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative bg-bg-dark">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-bg-dark to-bg-dark pointer-events-none"></div>
        <header className="h-20 bg-surface-dark/80 backdrop-blur-md border-b border-gray-800/80 flex items-center px-10 relative z-10 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-100 tracking-wide">
            {tabs.find((t) => t.id === activeTab)?.name}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-10 relative z-10">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}

export default App;
