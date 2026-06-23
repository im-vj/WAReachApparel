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
      <div className="w-64 bg-surface-dark border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <MessageSquare className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-xl font-bold text-white tracking-wide">WAReach</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary border-r-4 border-primary'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="h-16 bg-surface-dark border-b border-gray-800 flex items-center px-8">
          <h2 className="text-xl font-semibold text-white">
            {tabs.find((t) => t.id === activeTab)?.name}
          </h2>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-bg-dark">
          {renderTab()}
        </main>
      </div>
    </div>
  );
}

export default App;
