
import React, { useState, useEffect } from 'react';

interface LoginPageProps {
    onLogin: (season: string) => void;
    availableSeasons: string[];
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


const LoginPage = ({ onLogin, availableSeasons }: LoginPageProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPasswordVerified, setIsPasswordVerified] = useState(false);

    useEffect(() => {
        if (availableSeasons.length > 0) {
            setSelectedSeason(availableSeasons[0]);
        }
    }, [availableSeasons]);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (username.toLowerCase() === 'demo' && password === 'demo') {
            setIsPasswordVerified(true);
        } else {
            setError('Invalid username or password.');
        }
    };

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSeason) {
            onLogin(selectedSeason);
        } else {
            setError('Please select a milling season.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl animate-fade-in">
                <div className="flex flex-col items-center space-y-2">
                    <MillerMitraIcon className="h-12 w-12" />
                    <h1 className="text-3xl font-bold text-slate-800">Miller Mitra</h1>
                    <p className="text-slate-500">Welcome! Please sign in to continue.</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">
                        {error}
                    </div>
                )}
                
                {!isPasswordVerified ? (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="beta username: demo"
                                required
                                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-login" className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                id="password-login"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="beta password: demo"
                                required
                                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            Verify
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
                        <div className="p-3 text-sm text-center text-green-800 bg-green-100 border border-green-200 rounded-lg">
                            Credentials verified! Please select your season.
                        </div>
                        <div>
                            <label htmlFor="season-select-login" className="block text-sm font-medium text-slate-700">Milling Season</label>
                            <select
                                id="season-select-login"
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(e.target.value)}
                                className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                required
                            >
                                {availableSeasons.length > 0 ? (
                                    availableSeasons.map(season => (
                                        <option key={season} value={season}>{season}</option>
                                    ))
                                ) : (
                                    <option value="" disabled>No seasons found</option>
                                )}
                            </select>
                        </div>
                         <button
                            type="submit"
                            disabled={!selectedSeason}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Login to Season
                        </button>
                    </form>
                )}
                 <p className="px-8 text-center text-sm text-slate-500">
                    This is a beta version. Use username <code className="bg-slate-200 px-1 rounded-md">demo</code> and password <code className="bg-slate-200 px-1 rounded-md">demo</code> to proceed.
                </p>

                <div className="pt-6 border-t border-slate-200 text-sm text-slate-600">
                    <h3 className="text-center font-semibold text-slate-700">How to Install on Your Phone</h3>
                    <p className="text-center text-xs text-slate-500 mt-1">Get an app-like experience with one tap access.</p>
                    <div className="mt-4 flex gap-4 text-left">
                        <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-800">Android</h4>
                            <p className="text-xs mt-1">In Chrome, tap the <strong className="text-base">⋮</strong> menu, then 'Install app'.</p>
                        </div>
                        <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <h4 className="font-bold text-slate-800">iPhone</h4>
                            <p className="text-xs mt-1">In Safari, tap the Share <strong className="text-base">↑</strong> button, then 'Add to Home Screen'.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
