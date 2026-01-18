interface MetricCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    colorClass?: string;
    tooltip?: string;
}

export default function MetricCard({
    label,
    value,
    change,
    changeLabel,
    icon,
    colorClass = 'text-blue-600',
    tooltip,
}: MetricCardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="metric-card animate-fade-in group relative">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="metric-label mb-0">{label}</p>
                        {tooltip && (
                            <div className="relative group/tooltip">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none z-10 transition-opacity">
                                    {tooltip}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className={`metric-value ${colorClass}`}>{value}</p>
                    {change !== undefined && (
                        <span className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                            {changeLabel && <span className="ml-1 text-gray-400 font-normal">{changeLabel}</span>}
                        </span>
                    )}
                </div>
                {icon && (
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 opacity-80">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
