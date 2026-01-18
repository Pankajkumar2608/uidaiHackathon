interface StatusBadgeProps {
    status: 'Stable' | 'Watch' | 'Critical' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getClassName = () => {
        switch (status.toLowerCase()) {
            case 'stable':
                return 'badge badge-stable';
            case 'watch':
                return 'badge badge-watch';
            case 'critical':
                return 'badge badge-critical';
            default:
                return 'badge';
        }
    };

    return <span className={getClassName()}>{status}</span>;
}
