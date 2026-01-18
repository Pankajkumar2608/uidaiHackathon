export default function GlobalHeader() {
    return (
        <header className="bg-white border-b border-gray-200 z-50 sticky top-0 h-16 flex items-center justify-between px-6 shadow-sm">
            <div className="flex items-center gap-4">
                {/* Emblem Skeleton */}
                <div className="flex flex-col items-center justify-center w-8 h-8 opacity-80">
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-amber-600">
                        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Government of India</span>
                    <span className="text-sm font-bold text-gray-900 leading-tight">Unique Identification Authority of India</span>
                </div>
                <div className="h-8 w-px bg-gray-300 mx-2"></div>
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-blue-800">Settlement Intelligence Platform</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="bg-red-50 border border-red-100 px-3 py-1 rounded text-xs font-semibold text-red-700 items-center gap-2 hidden md:flex">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    CONFIDENTIAL • INTERNAL USE ONLY
                </div>
                <div className="text-xs text-right text-gray-500 hidden sm:block">
                    <div>System: <span className="font-mono text-gray-700">UID-SIP-v1.0</span></div>
                    <div>Last Sync: <span className="font-mono text-gray-700">{new Date().toLocaleDateString()}</span></div>
                </div>
            </div>
        </header>
    );
}
