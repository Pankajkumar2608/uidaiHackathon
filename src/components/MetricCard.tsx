interface MetricCardProps {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    colorClass?: string;
}

export default function MetricCard({
    label,
    value,
    change,
    changeLabel,
    icon,
    colorClass = 'text-blue-600',
}: MetricCardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="metric-card animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <p className="metric-label">{label}</p>
                    <p className={`metric-value ${colorClass}`}>{value}</p>
                    {change !== undefined && (
                        <span className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                            {changeLabel && <span className="ml-1">{changeLabel}</span>}
                        </span>
                    )}
                </div>
                {icon && (
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
