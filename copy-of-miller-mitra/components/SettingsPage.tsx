


import React, { useState, useEffect } from 'react';


interface SettingsPageProps {
    installPrompt?: any; // This will hold the `beforeinstallprompt` event
    currentUser: string | null;
    currentSeason: string;
}

// --- Accordion Component ---
interface AccordionItemProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const AccordionItem = ({ title, icon, children, isOpen, onToggle }: AccordionItemProps) => {
    return (
        <div className="border-b border-slate-200">
            <h2>
                <button
                    type="button"
                    className="flex items-center justify-between w-full p-5 font-medium text-left text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    onClick={onToggle}
                    aria-expanded={isOpen}
                >
                    <span className="flex items-center">
                        <span className="mr-4 text-blue-600">{icon}</span>
                        {title}
                    </span>
                    <svg
                        className={`w-6 h-6 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                </button>
            </h2>
            <div className={`transition-max-height duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-5 pt-0">
                    <div className="prose prose-sm max-w-none text-slate-600">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SOP Guide Content ---
const SopGuide = () => {
    const [openAccordion, setOpenAccordion] = useState<string | null>('step0');

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const sopSteps = [
        {
            id: 'step0',
            title: 'Step 0: Create Your Local Profile & Log In',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
            content: (
                 <>
                    <p>The first time you use the app, create a local profile. This profile is stored ONLY on your device and keeps your data separate from other users on the same computer.</p>
                    <ol>
                        <li>On the login screen, choose <strong>'Create a new profile'</strong>.</li>
                        <li>Enter a username and password. You will then be shown a 12-word recovery phrase.</li>
                        <li><strong>Write down this phrase and save it somewhere safe.</strong> It is the ONLY way to recover your account if you forget your password.</li>
                        <li>After creating your profile, log in with your new credentials.</li>
                        <li>Select the milling season you want to work in. You can change this at any time from the header.</li>
                    </ol>
                </>
            )
        },
        {
            id: 'step1',
            title: 'Step 1: Upload Release Order (RO)',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            content: (
                <>
                    <p>This is the starting point of the entire process.</p>
                    <ol>
                        <li>Navigate to the <strong>Paddy Lifting</strong> tab.</li>
                        <li>Click the <strong>'Upload Release Order (PDF)'</strong> button.</li>
                        <li>Select the official PDF document for the Delivery Order (DO) you received. The system will use AI to automatically read and fill in all the details.</li>
                        <li>Verify the extracted information in the table below. The app will automatically handle different milling seasons.</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'step2',
            title: 'Step 2: Record Paddy Lifting',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h2.586a1 1 0 01.707.293l7.414 7.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
            content: (
                <>
                    <p>Once an RO is uploaded, you can start recording the paddy you lift from the godown against it.</p>
                    <ol>
                        <li>On the <strong>Paddy Lifting</strong> tab, find the godown in the 'Pending Paddy for Lifting' section.</li>
                        <li>Click the <strong>'Lift Paddy'</strong> button.</li>
                        <li>In the modal, either manually enter the details from your weighing slip (Kanta Parchi) or use the <strong>'Upload Kanta Parchi'</strong> button to let the AI scan it automatically.</li>
                        <li>Enter the number of new and used bags. The system will calculate the net paddy quantity and automatically distribute it against the correct DOs.</li>
                    </ol>
                </>
            )
        },
        {
            id: 'step3',
            title: 'Step 3: Manage FRK Stock',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l.477 2.387a2 2 0 001.806.547a2 2 0 001.022-.547l2.387-.477a6 6 0 003.86-.517l.318-.158a6 6 0 013.86-.517l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-.477-2.387z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" /></svg>,
            content: (
                <>
                    <p>Track your inventory of Fortified Rice Kernels (FRK) which are essential for producing fortified rice.</p>
                    <ol>
                        <li>Navigate to the <strong>FRK</strong> tab.</li>
                        <li>Click <strong>'Log FRK Purchase'</strong> to record new stock you receive.</li>
                        <li>The system will automatically calculate the consumed FRK (at a 1% ratio) based on your total rice deliveries.</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'step4',
            title: 'Step 4: Log Daily Milling & Sales',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
            content: (
                <>
                    <p>Record your daily production activities to keep your stock register accurate.</p>
                    <ol>
                        <li>Go to the <strong>Milling</strong> tab.</li>
                        <li>Click <strong>'Log Daily Entry'</strong>.</li>
                        <li>Enter the number of paddy bags (new/used) you opened for milling.</li>
                        <li>Enter the number of rice bags produced. The system will auto-calculate the quantity in quintals.</li>
                        <li>Log any sales of by-products (Bran, Husk, etc.) for that day.</li>
                        <li>The system automatically calculates paddy consumption, turnout percentages, and Work-in-Progress (WIP).</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'step5',
            title: 'Step 5: Upload CMR Deposit Order',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            content: (
                <>
                    <p>Before you can deliver rice, you must upload the official authorization document.</p>
                    <ol>
                        <li>Navigate to the <strong>Rice Delivery</strong> tab.</li>
                        <li>Click <strong>'Upload CMR Order (PDF)'</strong>.</li>
                        <li>Select the CMR Deposit Order PDF. The system will use AI to read it and validate it against your completed DOs.</li>
                        <li>You cannot upload a CMR for a DO if paddy lifting is still pending for it.</li>
                        <li>Once uploaded, the order will appear in the 'Authorized Deliveries' table.</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'step6',
            title: 'Step 6: Create a Delivery Challan',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2-2h8a1 1 0 001-1z" /></svg>,
            content: (
                <>
                    <p>Log the fortified rice you send out for delivery.</p>
                    <ol>
                        <li>On the <strong>Rice Delivery</strong> tab, find the authorized order and click <strong>'Create Delivery'</strong>.</li>
                        <li>Fill in the challan details: agency, date, vehicle no., batch no., and number of bags.</li>
                        <li>The system will check your available Plain Rice and FRK stock before allowing you to save.</li>
                        <li>It will also validate that the delivery quantity does not exceed the entitlement for that specific DO.</li>
                    </ol>
                </>
            ),
        },
        {
            id: 'step7',
            title: 'Step 7: Review Registers & Reports',
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
            content: (
                <>
                    <p>All your data is automatically compiled into easy-to-read registers and printable reports.</p>
                    <ul>
                        <li>The <strong>Register</strong> tab shows a complete, DO-by-DO transaction log of all paddy lifted and rice delivered.</li>
                        <li>The <strong>Reports</strong> tab provides high-level summaries of your current stock, pending quantities, and DO fulfillment status. You can also generate and print detailed, filterable reports here.</li>
                    </ul>
                </>
            ),
        },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Application Workflow Guide</h2>
            <p className="mt-1 mb-4 text-slate-500">Follow these steps in order for correct stock management and reporting.</p>
            <div className="rounded-lg border border-slate-200">
                {sopSteps.map(step => (
                    <AccordionItem
                        key={step.id}
                        title={step.title}
                        icon={step.icon}
                        isOpen={openAccordion === step.id}
                        onToggle={() => toggleAccordion(step.id)}
                    >
                        {step.content}
                    </AccordionItem>
                ))}
            </div>
        </div>
    );
};

// --- App Update Component ---
const UpdateManager = () => {
    const currentVersion = '1.1.0';
    const [latestVersionInfo, setLatestVersionInfo] = useState<{ version: string; releaseNotes: string; downloadUrl: string; } | null>(null);
    const [status, setStatus] = useState<'checking' | 'up-to-date' | 'available' | 'error'>('checking');

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                // In a real app, this URL would point to a file on a server/gist.
                // Using a local file for demonstration.
                const response = await fetch('/version.json');
                if (!response.ok) throw new Error('Could not fetch version info');
                const data = await response.json();

                // Simple version comparison (e.g., "1.2.0" > "1.1.0")
                if (data.version > currentVersion) {
                    setLatestVersionInfo(data);
                    setStatus('available');
                } else {
                    setStatus('up-to-date');
                }
            } catch (error) {
                console.error("Update check failed:", error);
                setStatus('error');
            }
        };

        checkForUpdates();
    }, [currentVersion]);

    return (
         <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Application Updates</h2>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600">Your Current Version</p>
                    <p className="text-lg font-bold text-slate-800">v{currentVersion}</p>
                </div>
                {status === 'checking' && <p className="text-sm font-medium text-slate-500">Checking for updates...</p>}
                {status === 'up-to-date' && <div className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">You are up to date!</div>}
                {status === 'error' && <div className="text-sm font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">Update check failed</div>}
            </div>

            {status === 'available' && latestVersionInfo && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg animate-fade-in">
                    <h3 className="text-lg font-bold text-blue-800">New Version Available: v{latestVersionInfo.version}</h3>
                    <div className="mt-2">
                        <h4 className="font-semibold text-slate-700">Release Notes:</h4>
                        <pre className="mt-1 p-3 bg-slate-100 rounded-md text-sm text-slate-600 whitespace-pre-wrap font-sans">{latestVersionInfo.releaseNotes}</pre>
                    </div>
                    <p className="mt-4 text-sm text-amber-800 bg-amber-100 p-2 rounded-md border border-amber-200">
                        <strong>Important:</strong> Before updating, it's always a good idea to use the 'Backup All Data' tool just in case. Your data should be safe, but this provides peace of mind.
                    </p>
                    <a 
                        href={latestVersionInfo.downloadUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-4 inline-block w-full text-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700"
                    >
                        Download New Version
                    </a>
                </div>
            )}
        </div>
    );
};

// --- Settings and Data Content ---
const SettingsContent = ({ installPrompt, currentUser, currentSeason }: { installPrompt: any, currentUser: string | null, currentSeason: string }) => {
    const [issueMessage, setIssueMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [dataMessage, setDataMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
    
    // Restore Modal State
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [backupPreview, setBackupPreview] = useState<{ profiles: string[], seasonsByProfile: Record<string, string[]> } | null>(null);
    const [backupDataToRestore, setBackupDataToRestore] = useState<Record<string, string> | null>(null);
    const [restoreStrategy, setRestoreStrategy] = useState<'merge' | 'replace'>('merge');

    const WEB3FORMS_ACCESS_KEY = '42a68bd7-b1ec-4d92-96d5-3a7928688135';

    const handleReportIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus(null);
        if (!issueMessage.trim()) {
            setSubmitStatus({ type: 'error', text: 'Please describe the issue before sending.' });
            return;
        }

        if (!WEB3FORMS_ACCESS_KEY) {
            setSubmitStatus({ type: 'error', text: 'Issue reporting is not configured. Please contact the app administrator.' });
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("access_key", WEB3FORMS_ACCESS_KEY);
            formData.append("subject", `Miller Mitra - Issue Report from ${currentUser}`);
            formData.append("from_name", "Miller Mitra App");
            formData.append("message", issueMessage);
            
            // Add diagnostic info
            formData.append("User", currentUser || 'Not Logged In');
            formData.append("Season", currentSeason);
            formData.append("Timestamp", new Date().toISOString());
            formData.append("URL", window.location.href);
            formData.append("User Agent", navigator.userAgent);
            
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                body: formData,
            });

            const json = await res.json();

            if (json.success) {
                setSubmitStatus({ type: 'success', text: 'Thank you! Your report has been sent successfully.' });
                setIssueMessage(''); // Clear the form
            } else {
                console.error("Submission Error:", json);
                setSubmitStatus({ type: 'error', text: `Failed to send report: ${json.message}` });
            }
        } catch (error) {
            console.error("Network Error:", error);
            setSubmitStatus({ type: 'error', text: 'A network error occurred. Please check your connection and try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const showDataMessage = (type: 'success' | 'error' | 'info', text: string) => {
        setDataMessage({ type, text });
        setTimeout(() => setDataMessage(null), 5000);
    };

    const handleBackupData = () => {
        try {
            const backupData: Record<string, string> = {};
            const keyPattern = /^[a-zA-Z0-9]+_([a-zA-Z]+)_(20\d{2}-20\d{2})$/;
            const profileKey = 'userProfiles';

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (keyPattern.test(key) || key === profileKey)) {
                    backupData[key] = localStorage.getItem(key)!;
                }
            }
            
            if (Object.keys(backupData).length === 0) {
                showDataMessage('error', 'No application data found to back up.');
                return;
            }

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `miller-mitra-backup-all-profiles-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showDataMessage('success', 'Full application data backup (all profiles) downloaded successfully!');

        } catch (error) {
            console.error('Backup failed:', error);
            showDataMessage('error', 'An unexpected error occurred during backup.');
        }
    };

    const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onerror = () => {
            showDataMessage('error', `Error reading file: ${reader.error?.message || 'Unknown error'}`);
        };

        reader.onload = (e) => {
            interface UserProfile { username: string; }
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error('File could not be read.');
                
                const data = JSON.parse(text);

                // --- Validation and Preview Data Extraction ---
                const keyPattern = /^([a-zA-Z0-9]+)_[a-zA-Z]+_(20\d{2}-20\d{2})$/;
                const profileKey = 'userProfiles';
                
                const keys = Object.keys(data);
                if (!keys.some(k => keyPattern.test(k) || k === profileKey)) {
                    throw new Error('This does not appear to be a valid Miller Mitra backup file.');
                }

                let profiles: string[] = [];
                const seasonsByProfile: Record<string, string[]> = {};
                
                if (data[profileKey]) {
                    try {
                        const parsedProfiles: UserProfile[] = JSON.parse(data[profileKey]);
                        profiles = parsedProfiles.map(p => p.username);
                    } catch {
                        // ignore if profiles are corrupted
                    }
                }

                keys.forEach(key => {
                    const match = key.match(keyPattern);
                    if (match) {
                        const username = match[1];
                        const season = match[2];
                        if (!profiles.includes(username)) {
                            profiles.push(username);
                        }
                        if (!seasonsByProfile[username]) {
                            seasonsByProfile[username] = [];
                        }
                        if (!seasonsByProfile[username].includes(season)) {
                            seasonsByProfile[username].push(season);
                        }
                    }
                });

                setBackupDataToRestore(data);
                setBackupPreview({ profiles, seasonsByProfile });
                setRestoreStrategy('merge');
                setIsRestoreModalOpen(true);

            } catch (error) {
                 const message = error instanceof Error ? error.message : 'Failed to parse the backup file. Please ensure it is a valid JSON file.';
                 showDataMessage('error', message);
            } finally {
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmRestore = () => {
        if (!backupDataToRestore) {
            showDataMessage('error', 'No backup data loaded.');
            return;
        }

        try {
            if (restoreStrategy === 'replace') {
                localStorage.clear();
            }

            for (const key in backupDataToRestore) {
                if (Object.prototype.hasOwnProperty.call(backupDataToRestore, key)) {
                    localStorage.setItem(key, backupDataToRestore[key]);
                }
            }

            setIsRestoreModalOpen(false);
            showDataMessage('success', 'Data restored successfully! The application will now reload.');
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unexpected error occurred during restore.';
            showDataMessage('error', message);
        }
    };


    const handleInstallClick = async () => {
        if (!installPrompt) {
            alert('The app is likely already installed or your browser does not support installation.');
            return;
        }
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
        } else {
            console.log('User dismissed the A2HS prompt');
        }
    };

    return (
        <div className="space-y-8">
            <UpdateManager />

            {/* Data Management Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Data Management</h2>
                <p className="mt-1 text-slate-500">
                    Your data is stored locally in your browser. Use these tools to back up all profiles and data to a single file or restore it. This is useful for moving data to a new computer.
                </p>
                <div className="p-4 my-4 text-sm text-amber-800 bg-amber-100 rounded-lg border border-amber-200" role="alert">
                    <h3 className="font-bold">Important for Development</h3>
                    <p className="mt-1">This preview environment may reset local data when the app's code is updated. To avoid losing your work, please use the <strong>Backup All Data</strong> button frequently. You can use <strong>Restore from Backup</strong> to reload your data if it disappears.</p>
                </div>
                {dataMessage && (
                    <div className={`p-3 mb-4 text-sm rounded-md border ${
                        {
                            success: 'bg-green-50 text-green-700 border-green-200',
                            error: 'bg-red-50 text-red-700 border-red-200',
                            info: 'bg-blue-50 text-blue-700 border-blue-200'
                        }[dataMessage.type]
                    }`}>
                        {dataMessage.text}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={handleBackupData}
                        className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                    >
                        Backup All Data
                    </button>
                    <label
                        className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 cursor-pointer"
                    >
                        Restore from Backup
                        <input
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleRestoreData}
                        />
                    </label>
                </div>
            </div>

            {/* Issue Reporting Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Report an Issue or Suggest a Feature</h2>
                <p className="mt-1 text-slate-500">
                    If you've encountered a bug, have a question, or want to suggest an improvement, please let us know. Your report will be sent instantly.
                </p>
                <form onSubmit={handleReportIssue} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="issue-message" className="block text-sm font-medium text-slate-700 mb-1">
                            Your Message
                        </label>
                        <textarea
                            id="issue-message"
                            name="issue-message"
                            rows={6}
                            value={issueMessage}
                            onChange={(e) => setIssueMessage(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md shadow-sm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Please provide as much detail as possible. For example:&#10;- What were you doing when the issue occurred?&#10;- What was the error message?&#10;- Which Delivery Order or record was affected?"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    {submitStatus && (
                        <div className={`p-3 text-sm rounded-md border ${
                            submitStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            {submitStatus.text}
                        </div>
                    )}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Instant Report'}
                        </button>
                    </div>
                </form>
            </div>
             
             {/* Installation Guide */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">App Installation Guide</h2>
                {installPrompt && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 my-4 rounded-r-lg" role="alert">
                        <p className="font-bold">Install Miller Mitra on your device!</p>
                        <p className="text-sm">Get a faster, more integrated experience by installing this app on your home screen.</p>
                        <button
                            onClick={handleInstallClick}
                            className="mt-3 inline-flex items-center justify-center px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                        >
                            Install App
                        </button>
                    </div>
                )}
                <p className="mt-1 mb-4 text-slate-500">
                    Miller Mitra is a modern web application designed to run in your browser. You do not need to install it from an app store. For a more convenient, app-like experience, you can add it to your device's home screen.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-2">For Android Users</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                            <li>Open Miller Mitra in the Chrome browser.</li>
                            <li>Tap the three-dot menu icon in the top-right corner.</li>
                            <li>Select <span className="font-semibold">"Install app"</span> or <span className="font-semibold">"Add to Home screen"</span>.</li>
                            <li>Follow the on-screen prompts to confirm.</li>
                        </ol>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-700 mb-2">For iOS (iPhone/iPad) Users</h3>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                            <li>Open Miller Mitra in the Safari browser.</li>
                            <li>Tap the "Share" button (square with an arrow pointing up).</li>
                            <li>Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>.</li>
                            <li>Name the shortcut and tap "Add".</li>
                        </ol>
                    </div>
                </div>
            </div>

            {isRestoreModalOpen && backupPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-fast">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl m-4" role="dialog" aria-modal="true" aria-labelledby="restore-modal-title">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h3 id="restore-modal-title" className="text-lg font-bold text-slate-800">Restore Data from Backup</h3>
                            <p className="text-sm text-slate-500">Please review the contents and choose a restore method.</p>
                        </div>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-700 mb-2">Backup File Contents:</h4>
                                {backupPreview.profiles.length > 0 ? (
                                    <ul className="space-y-2">
                                        {backupPreview.profiles.map(profile => (
                                            <li key={profile} className="text-sm">
                                                <strong className="text-blue-600">{profile}</strong>
                                                {backupPreview.seasonsByProfile[profile] && backupPreview.seasonsByProfile[profile].length > 0 && (
                                                    <span className="text-slate-500 ml-2">(Seasons: {backupPreview.seasonsByProfile[profile].join(', ')})</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-slate-500 text-sm">No user profiles were explicitly found, but data is present.</p>
                                )}
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-slate-700 mb-2">Choose Restore Method:</h4>
                                <div className="space-y-3">
                                    <label className="flex items-start p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            name="restore-strategy"
                                            value="merge"
                                            checked={restoreStrategy === 'merge'}
                                            onChange={() => setRestoreStrategy('merge')}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 mt-0.5"
                                        />
                                        <div className="ml-4">
                                            <span className="font-bold text-slate-800">Merge with Existing Data (Recommended)</span>
                                            <p className="text-sm text-slate-600 mt-1">
                                                Adds new data and updates existing profiles from the backup file. Any data on this device that isn't in the backup will be kept.
                                            </p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                                        <input
                                            type="radio"
                                            name="restore-strategy"
                                            value="replace"
                                            checked={restoreStrategy === 'replace'}
                                            onChange={() => setRestoreStrategy('replace')}
                                            className="h-5 w-5 text-red-600 focus:ring-red-500 mt-0.5"
                                        />
                                        <div className="ml-4">
                                            <span className="font-bold text-slate-800">Replace All Data (Full Restore)</span>
                                            <p className="text-sm text-slate-600 mt-1">
                                                <strong className="text-red-600">Warning:</strong> This will delete ALL current data on this device before loading the backup. This action cannot be undone.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
                            <button onClick={() => setIsRestoreModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">Cancel</button>
                            <button
                                onClick={handleConfirmRestore}
                                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Confirm & Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Page Component ---
const SettingsPage = ({ installPrompt, currentUser, currentSeason }: SettingsPageProps) => {
    const [activeSubTab, setActiveSubTab] = useState('sop'); // Default to showing the SOP guide first

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Help & Support</h1>
                <p className="mt-2 text-slate-600">Find answers, report issues, and learn how to use Miller Mitra on your devices.</p>
            </div>
            
            {/* Sub-tab Navigation */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveSubTab('sop')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                            activeSubTab === 'sop'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        SOP Guide
                    </button>
                    <button
                        onClick={() => setActiveSubTab('settings')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                            activeSubTab === 'settings'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Settings & Data
                    </button>
                </nav>
            </div>

            {/* Content Display */}
            <div className="animate-fade-in-fast">
                {activeSubTab === 'sop' && <SopGuide />}
                {activeSubTab === 'settings' && <SettingsContent installPrompt={installPrompt} currentUser={currentUser} currentSeason={currentSeason} />}
            </div>
        </div>
    );
};

export default SettingsPage;