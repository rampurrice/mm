import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateRecoveryPhrase, hashString } from '../utils';

interface LoginPageProps {
    onLogin: (username: string, season: string, availableSeasons: string[]) => void;
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

const PROFILES_KEY = 'userProfiles';

// --- Recovery Phrase Modal Component ---
interface RecoveryPhraseModalProps {
    phrase: string;
    onClose: () => void;
}
const RecoveryPhraseModal = ({ phrase, onClose }: RecoveryPhraseModalProps) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(phrase);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md m-4 p-6 text-center">
                <h2 className="text-xl font-bold text-red-600">IMPORTANT: Save Your Recovery Phrase!</h2>
                <p className="mt-2 text-slate-600">This is the <strong className="text-red-700">ONLY</strong> way to recover your account if you forget your password. Write it down and store it in a safe place.</p>
                <div className="my-4 p-4 bg-slate-100 border border-slate-300 rounded-lg font-mono text-lg text-slate-800 tracking-wider">
                    {phrase}
                </div>
                <button onClick={handleCopy} className="w-full mb-4 py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                    {isCopied ? 'Copied to Clipboard!' : 'Copy Phrase'}
                </button>
                <div className="flex items-start text-left my-4">
                    <input id="acknowledgement" type="checkbox" checked={isAcknowledged} onChange={() => setIsAcknowledged(!isAcknowledged)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1" />
                    <label htmlFor="acknowledgement" className="ml-2 block text-sm text-slate-700">I have written down or securely saved my recovery phrase.</label>
                </div>
                <button onClick={onClose} disabled={!isAcknowledged} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    I Understand, Continue to Login
                </button>
            </div>
        </div>
    );
};


const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [authMode, setAuthMode] = useState<'login' | 'create' | 'recovery'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryPhrase, setRecoveryPhrase] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const [verifiedUser, setVerifiedUser] = useState<string | null>(null);
    const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('');

    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [generatedPhrase, setGeneratedPhrase] = useState('');

    const getProfiles = (): UserProfile[] => {
        const data = localStorage.getItem(PROFILES_KEY);
        if (!data) {
            return [];
        }
        try {
            const profiles = JSON.parse(data);
            // Add a check to ensure it's an array
            if (Array.isArray(profiles)) {
                return profiles;
            }
            // If it's not an array, something is wrong.
            console.error("User profiles in localStorage is not an array:", profiles);
            localStorage.removeItem(PROFILES_KEY);
            return [];
        } catch (error) {
            console.error("Failed to parse user profiles from localStorage. Data might be corrupted.", error);
            // If parsing fails, remove the corrupted data to allow the user to start fresh.
            localStorage.removeItem(PROFILES_KEY);
            return [];
        }
    };

    const saveProfiles = (profiles: UserProfile[]) => {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    };
    
    const handleLogin = (user: UserProfile) => {
        const keys = Object.keys(localStorage);
        const seasonKeys = keys
            .filter(key => key.startsWith(`${user.username}_releaseOrders_`))
            .map(key => key.replace(`${user.username}_releaseOrders_`, ''));
        
        const defaultSeasons = ['2024-2025', '2023-2024'];
        const allSeasons = Array.from(new Set([...defaultSeasons, ...seasonKeys])).sort((a, b) => b.localeCompare(a));
        
        setAvailableSeasons(allSeasons);
        setSelectedSeason(allSeasons[0] || '');
        setVerifiedUser(user.username);
    };

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);
        const profiles = getProfiles();

        if (authMode === 'login') {
            const user = profiles.find(p => p.username.toLowerCase() === username.toLowerCase() && p.password === password);
            if (user) {
                handleLogin(user);
            } else {
                setError('Invalid username or password.');
            }
        } else if (authMode === 'create') {
            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
            if (profiles.some(p => p.username.toLowerCase() === username.toLowerCase())) {
                setError("Username already exists. Please choose another one.");
                return;
            }
            if (username.includes('_') || username.trim().length < 3) {
                setError("Username must be at least 3 characters and cannot contain underscores.");
                return;
            }

            const phrase = generateRecoveryPhrase();
            const phraseHash = await hashString(phrase);

            const newUser: UserProfile = { username, password, recoveryPhraseHash: phraseHash };
            const newProfiles = [...profiles, newUser];
            saveProfiles(newProfiles);
            
            setGeneratedPhrase(phrase);
            setShowRecoveryModal(true);
            
        } else { // Recovery mode
            const user = profiles.find(p => p.username.toLowerCase() === username.toLowerCase());
            if (!user) {
                setError("Username not found.");
                return;
            }
            if (password !== confirmPassword) {
                setError("New passwords do not match.");
                return;
            }
            const enteredPhraseHash = await hashString(recoveryPhrase.trim().toLowerCase());
            if (enteredPhraseHash === user.recoveryPhraseHash) {
                user.password = password; // Update password
                saveProfiles(profiles);
                setMessage("Password has been reset successfully! Please log in with your new password.");
                setAuthMode('login');
                setUsername('');
                setPassword('');
                setRecoveryPhrase('');
                setConfirmPassword('');
            } else {
                setError("Invalid recovery phrase. Please try again.");
            }
        }
    };

    const handleRecoveryModalClose = () => {
        setShowRecoveryModal(false);
        setMessage(`Profile for '${username}' created successfully! Please log in.`);
        setAuthMode('login');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };
    
    const handleSeasonSelectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (verifiedUser && selectedSeason) {
            onLogin(verifiedUser, selectedSeason, availableSeasons);
        } else {
            setError('Please select a milling season to continue.');
        }
    };
    
    const switchMode = (mode: 'login' | 'create' | 'recovery') => {
        setAuthMode(mode);
        setError(null);
        setMessage(null);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setRecoveryPhrase('');
    };

    const renderAuthForm = () => (
        <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">Username</label>
                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
            <div>
                <label htmlFor="password-login" className="block text-sm font-medium text-slate-700">Password</label>
                <input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
            </div>
            {authMode === 'create' && (
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700">Confirm Password</label>
                    <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" />
                </div>
            )}
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                {authMode === 'login' ? 'Login' : 'Create Profile'}
            </button>
            <div className="flex justify-between items-center text-sm">
                <button type="button" onClick={() => switchMode('create')} className="font-medium text-blue-600 hover:text-blue-800">
                    Create a new profile
                </button>
                <button type="button" onClick={() => switchMode('recovery')} className="font-medium text-blue-600 hover:text-blue-800">
                    Forgot Password?
                </button>
            </div>
        </form>
    );

    const renderRecoveryForm = () => (
        <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
                <label htmlFor="username-recovery" className="block text-sm font-medium text-slate-700">Username</label>
                <input id="username-recovery" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="recovery-phrase" className="block text-sm font-medium text-slate-700">12-Word Recovery Phrase</label>
                <textarea id="recovery-phrase" rows={3} value={recoveryPhrase} onChange={(e) => setRecoveryPhrase(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm" placeholder="Enter the 12 words separated by spaces..."></textarea>
            </div>
            <div>
                <label htmlFor="password-recovery" className="block text-sm font-medium text-slate-700">New Password</label>
                <input id="password-recovery" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm" />
            </div>
            <div>
                <label htmlFor="confirm-password-recovery" className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <input id="confirm-password-recovery" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm" />
            </div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                Reset Password
            </button>
             <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800">
                Back to Login
            </button>
        </form>
    );
    
    const renderSeasonSelector = () => (
         <form onSubmit={handleSeasonSelectSubmit} className="space-y-6 animate-fade-in">
            <div className="p-3 text-sm text-center text-green-800 bg-green-100 border border-green-200 rounded-lg">
                Welcome, {verifiedUser}! Please select your milling season.
            </div>
            <div>
                <label htmlFor="season-select-login" className="block text-sm font-medium text-slate-700">Milling Season</label>
                <select id="season-select-login" value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500" required>
                    {availableSeasons.length > 0 ? (
                        availableSeasons.map(season => (
                            <option key={season} value={season}>{season}</option>
                        ))
                    ) : (
                        <option value="" disabled>No seasons found</option>
                    )}
                </select>
            </div>
             <button type="submit" disabled={!selectedSeason} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
                Continue to Dashboard
            </button>
        </form>
    );

    const renderContent = () => {
        if (verifiedUser) return renderSeasonSelector();
        switch (authMode) {
            case 'login': return renderAuthForm();
            case 'create': return renderAuthForm();
            case 'recovery': return renderRecoveryForm();
            default: return renderAuthForm();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            {showRecoveryModal && <RecoveryPhraseModal phrase={generatedPhrase} onClose={handleRecoveryModalClose} />}
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl animate-fade-in">
                <div className="flex flex-col items-center space-y-2">
                    <MillerMitraIcon className="h-12 w-12" />
                    <h1 className="text-3xl font-bold text-slate-800">Miller Mitra</h1>
                    <p className="text-slate-500">
                        {verifiedUser ? 'Select your session' : 
                         authMode === 'create' ? 'Create a New Local Profile' : 
                         authMode === 'recovery' ? 'Recover Your Account' : 'Your Local Milling Companion'}
                    </p>
                </div>
                
                {message && <div className="p-3 text-sm text-center text-green-800 bg-green-100 border border-green-200 rounded-lg">{message}</div>}
                {error && <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg">{error}</div>}
                
                {renderContent()}
                
            </div>
        </div>
    );
};

export default LoginPage;