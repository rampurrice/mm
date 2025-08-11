

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
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [installPrompt, setInstallPrompt] = useState<any>(null); // For PWA installation

  useEffect(() => {
    // Scan localStorage for all available seasons from saved release orders
    const keys = Object.keys(localStorage);
    const seasonKeys = keys
      .filter(key => key.startsWith('releaseOrders_'))
      .map(key => key.replace('releaseOrders_', ''));
    
    const defaultSeasons = ['2024-2025', '2023-2024'];
    const allSeasons = Array.from(new Set([...defaultSeasons, ...seasonKeys])).sort((a, b) => b.localeCompare(a));
    
    setAvailableSeasons(allSeasons);
    
  }, []); // Run only once on mount to initialize seasons

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

  const handleLogin = (season: string) => {
    // Ensure the selected season is valid before logging in
    const allValidSeasons = Array.from(new Set([...availableSeasons, '2024-2025', '2023-2024']));
    if (allValidSeasons.includes(season)) {
      setCurrentSeason(season);
      setIsAuthenticated(true);
      setActiveTab('Dashboard'); // Always start on dashboard after login
    } else {
        // Fallback for an unexpected error
        console.error("Login attempt with an invalid season:", season);
    }
  };

  const renderContent = () => {
    if (!isAuthenticated && currentSeason) { // Check for currentSeason to prevent flash of loading text
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading season data...</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'Dashboard':
        return <DashboardPage currentSeason={currentSeason} />;
      case 'Paddy Lifting':
        return <PaddyLiftingPage currentSeason={currentSeason} setCurrentSeason={setCurrentSeason} />;
      case 'Milling':
        return <MillingPage currentSeason={currentSeason} />;
      case 'FRK':
        return <FrkManagementPage currentSeason={currentSeason} />;
      case 'Rice Delivery':
        return <RiceDeliveryPage currentSeason={currentSeason} />;
      case 'Register':
        return <RegisterPage currentSeason={currentSeason} />;
      case 'Reports':
        return <ReportsPage currentSeason={currentSeason} />;
      case 'Help':
        return <SettingsPage installPrompt={installPrompt} />;
      default:
        return <DashboardPage currentSeason={currentSeason} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={handleLogin}
        availableSeasons={availableSeasons}
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
      />
      <main className="p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;