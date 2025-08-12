import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import PaddyLiftingPage from './components/PaddyLiftingPage';
import RiceDeliveryPage from './components/RiceDeliveryPage';
import RegisterPage from './components/RegisterPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import MillingPage from './components/MillingPage';
import FrkManagementPage from './components/FrkManagementPage';
import { Tab } from './types';


function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null); // For PWA installation

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('`beforeinstallprompt` event fired.');
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleLogin = (username: string, season: string, userSeasons: string[]) => {
    setCurrentUser(username);
    setCurrentSeason(season);
    setAvailableSeasons(userSeasons);
    setIsAuthenticated(true);
    setActiveTab('Dashboard'); // Always start on dashboard after login
  };
  
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentSeason('');
    setAvailableSeasons([]);
    setActiveTab('Dashboard');
  }

  const renderContent = () => {
    if (!isAuthenticated || !currentUser || !currentSeason) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'Paddy Lifting':
        return <PaddyLiftingPage currentSeason={currentSeason} currentUser={currentUser} setCurrentSeason={setCurrentSeason} setAvailableSeasons={setAvailableSeasons} />;
      case 'Milling':
        return <MillingPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'FRK':
        return <FrkManagementPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'Rice Delivery':
        return <RiceDeliveryPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'Register':
        return <RegisterPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'Reports':
        return <ReportsPage currentSeason={currentSeason} currentUser={currentUser} />;
      case 'Help':
        return <SettingsPage installPrompt={installPrompt} currentUser={currentUser} currentSeason={currentSeason} />;
      default:
        return <DashboardPage currentSeason={currentSeason} currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        currentSeason={currentSeason}
        setCurrentSeason={setCurrentSeason}
        availableSeasons={availableSeasons}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <main className="p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
