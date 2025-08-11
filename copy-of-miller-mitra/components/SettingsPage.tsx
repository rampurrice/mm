
import React, { useState } from 'react';

interface SettingsPageProps {
    installPrompt?: any; // This will hold the `beforeinstallprompt` event
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
    const [openAccordion, setOpenAccordion] = useState<string | null>('step1');

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const sopSteps = [
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

// --- Settings and Data Content ---
const SettingsContent = ({ installPrompt }: { installPrompt: any }) => {
    const [issueMessage, setIssueMessage] = useState('');
    const [dataMessage, setDataMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleReportIssue = (e: React.FormEvent) => {
        e.preventDefault();
        if (!issueMessage.trim()) {
            alert('Please describe the issue before sending.');
            return;
        }

        const subject = encodeURIComponent('Miller Mitra - User Feedback/Issue Report');
        const body = encodeURIComponent(issueMessage);
        const mailtoLink = `mailto:rampurrice@gmail.com?subject=${subject}&body=${body}`;
        
        window.location.href = mailtoLink;
    };

    const showDataMessage = (type: 'success' | 'error', text: string) => {
        setDataMessage({ type, text });
        setTimeout(() => setDataMessage(null), 5000);
    };

    const handleBackupData = () => {
        try {
            const backupData: Record<string, string> = {};
            const prefixes = ['releaseOrders_', 'liftingRecords_', 'dailyStockLogs_', 'riceDeliveryRecords_', 'cmrDepositOrders_', 'frkRecords_'];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && prefixes.some(p => key.startsWith(p))) {
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
            a.download = `miller-mitra-backup-${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showDataMessage('success', 'Data backup downloaded successfully!');

        } catch (error) {
            console.error('Backup failed:', error);
            showDataMessage('error', 'An unexpected error occurred during backup.');
        }
    };

    const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('File could not be read.');
                }
                
                const data = JSON.parse(text);

                // Basic validation
                const keys = Object.keys(data);
                const prefixes = ['releaseOrders_', 'liftingRecords_', 'dailyStockLogs_', 'riceDeliveryRecords_', 'cmrDepositOrders_', 'frkRecords_'];
                if (!keys.some(k => prefixes.some(p => k.startsWith(p)))) {
                    throw new Error('This does not appear to be a valid Miller Mitra backup file.');
                }
                
                const confirmed = window.confirm(
                    'WARNING: Restoring from this backup will completely OVERWRITE all your current data.\n\nThis action CANNOT be undone.\n\nAre you sure you want to proceed?'
                );

                if (confirmed) {
                    localStorage.clear();
                    for (const key in data) {
                        if (Object.prototype.hasOwnProperty.call(data, key)) {
                            localStorage.setItem(key, data[key]);
                        }
                    }
                    showDataMessage('success', 'Data restored successfully! The application will now reload.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                     showDataMessage('error', 'Restore operation cancelled.');
                }

            } catch (error) {
                 const message = error instanceof Error ? error.message : 'Failed to parse the backup file. Please ensure it is a valid JSON file.';
                 showDataMessage('error', message);
            } finally {
                // Reset file input
                if (event.target) {
                    event.target.value = '';
                }
            }
        };
        reader.readAsText(file);
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
            {/* Data Management Section */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Data Management</h2>
                <p className="mt-1 mb-4 text-slate-500">
                    Your data is stored locally in your browser. Use these tools to back up your data to a file or restore it. This is useful for moving data to a new computer or recovering from accidental data loss.
                </p>
                {dataMessage && (
                    <div className={`p-3 mb-4 text-sm rounded-md border ${
                        dataMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                        {dataMessage.text}
                    </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={handleBackupData}
                        className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                    >
                        Backup My Data
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
                    If you've encountered a bug, have a question, or want to suggest an improvement, please let us know. Clicking "Send Report" will open your default email client.
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
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                        >
                            Send Report via Email
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
        </div>
    );
}

// --- Main Page Component ---
const SettingsPage = ({ installPrompt }: SettingsPageProps) => {
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
                {activeSubTab === 'settings' && <SettingsContent installPrompt={installPrompt} />}
            </div>
        </div>
    );
};

export default SettingsPage;
