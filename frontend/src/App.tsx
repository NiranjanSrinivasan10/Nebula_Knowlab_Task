import React from 'react';
import { useMailStore } from './hooks/useMailStore';
import Inbox from './components/Inbox';
import Sent from './components/Sent';
import Compose from './components/Compose';
import EmailDetail from './components/EmailDetail';
import Filters from './components/Filters';
import AssistantPanel from './components/AssistantPanel';
import { mailApi } from './services/api';

function App() {
  const { currentView, setCurrentView, darkMode, toggleDarkMode } = useMailStore();

  const handleLogin = () => {
    mailApi.login();
  };

  const handleLogout = () => {
    mailApi.logout();
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`flex-1 max-w-4xl ${darkMode ? 'bg-gray-800' : 'bg-white'} min-h-screen shadow-lg flex flex-col`}>
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Mail Web App</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1.5 text-sm rounded-md transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={handleLogin}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
              >
                Login
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-4 mt-4">
            <button
              onClick={() => setCurrentView('inbox')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'inbox'
                  ? 'bg-blue-100 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setCurrentView('sent')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'sent'
                  ? 'bg-blue-100 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setCurrentView('compose')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                currentView === 'compose'
                  ? 'bg-blue-100 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Compose
            </button>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'inbox' && (
            <>
              <Filters />
              <Inbox />
            </>
          )}
          {currentView === 'sent' && <Sent />}
          {currentView === 'compose' && <Compose />}
          {currentView === 'email_detail' && <EmailDetail />}
        </main>
      </div>
      
      {/* Assistant Sidebar */}
      <div className={`w-80 border-l ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <AssistantPanel />
      </div>
    </div>
  );
}

export default App;
