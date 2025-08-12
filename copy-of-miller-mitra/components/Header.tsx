import React from 'react';
import { Tab } from '../types';

interface HeaderProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    currentSeason: string;
    setCurrentSeason: (season: string) => void;
    availableSeasons: string[];
    currentUser: string | null;
    onLogout: () => void;
}

const MillerMitraIcon = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        className={className}
        fill="currentColor"
    >
        <path 
            d="M17.62,9.46a2.75,2.75,0,0,0-4.88-1.63L12,9.37,11.26,7.83A2.75,2.75,0,0,0,6.38,9.46,5.26,5.26,0,0,0,5,14.61v.12a1,1,0,0,0,1,1H8.3a1,1,0,0,0,1-1V12.9a.75.75,0,0,1,1.5,0v2.2a1,1,0,0,0,2.05,0v-2.2a.75.75,0,0,1,1.5,0v1.83a1,1,0,0,0,1,1H18a1,1,0,0,0,1-1v-.12A5.26,5.26,0,0,0,17.62,9.46Z" 
            className="text-amber-400"
        />
        <path 
            d="M8.3,15.73H7a1,1,0,0,0-1,1v.12A5.26,5.26,0,0,0,9,21a1,1,0,0,0,.88-.53l1.58-2.8,1.11,2a1,1,0,0,0,1.74,0l1.11-2,1.58,2.8A1,1,0,0,0,17.88,22,1,1,0,0,0,19,21a5.26,5.26,0,0,0,3-5.27V15.61a1,1,0,0,0-1-1H15.73" 
            className="text-green-700"
        />
    </svg>
);


const tabs: Tab[] = ['Dashboard', 'Paddy Lifting', 'Milling', 'FRK', 'Rice Delivery', 'Register', 'Reports', 'Help'];

const Header = ({ activeTab, setActiveTab, currentSeason, setCurrentSeason, availableSeasons, currentUser, onLogout }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm print:hidden">
      <div className="bg-green-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <MillerMitraIcon className="h-8 w-8" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Miller Mitra</h1>
              <p className="text-sm text-green-200">Welcome, <span className="font-semibold">{currentUser}</span></p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <label htmlFor="season-select" className="text-sm font-medium text-green-200 whitespace-nowrap">Season:</label>
                <select
                    id="season-select"
                    value={currentSeason}
                    onChange={(e) => setCurrentSeason(e.target.value)}
                    className="bg-green-700 border border-green-600 text-white text-sm rounded-md focus:ring-green-500 focus:border-green-500 block w-full p-2"
                    aria-label="Select Milling Season"
                >
                    {availableSeasons.map(season => (
                        <option key={season} value={season}>{season}</option>
                    ))}
                </select>
            </div>
            <button
                onClick={onLogout}
                className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md transition-colors"
                aria-label="Logout"
            >
                Logout
            </button>
        </div>
      </div>
      
      <nav className="flex items-center space-x-1 sm:space-x-4 px-2 sm:px-8 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-2 md:px-3 text-sm sm:text-base font-medium transition-colors duration-200 whitespace-nowrap focus:outline-none ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'border-b-2 border-transparent text-slate-600 hover:text-slate-900'
            }`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default Header;
