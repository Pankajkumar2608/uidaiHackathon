'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
    loadMetrics,
    loadStates,
    Metrics,
    MSIData,
    formatRegion,
    parseRegionKey,
} from '@/lib/data';

export default function MobilityMap() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            const [metricsData, statesData] = await Promise.all([
                loadMetrics(),
                loadStates(),
            ]);
            setMetrics(metricsData);
            setStates(statesData);

            // Set default period to latest
            const periods = Object.keys(metricsData.msi).sort();
            if (periods.length > 0) {
                setSelectedPeriod(periods[periods.length - 1]);
            }

            setLoading(false);
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-500">Loading mobility data...</div>
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="text-center py-8 text-gray-500">
                Failed to load data. Please refresh the page.
            </div>
        );
    }

    const periods = Object.keys(metrics.msi).sort();
    let msiData = metrics.msi[selectedPeriod] || [];

    // Filter by state if selected
    if (selectedState !== 'all') {
        msiData = msiData.filter(r => parseRegionKey(r.region_key).state === selectedState);
    }

    // Sort by MSI score descending
    msiData = [...msiData].sort((a, b) => b.msi_score - a.msi_score);

    // Get stats
    const criticalCount = msiData.filter(r => r.classification === 'Critical').length;
    const watchCount = msiData.filter(r => r.classification === 'Watch').length;
    const stableCount = msiData.filter(r => r.classification === 'Stable').length;

    const tableColumns = [
        {
            key: 'rank',
            label: '#',
            render: (_: any, __: any, idx: number) => idx + 1,
        },
        {
            key: 'region',
            label: 'Region',
            render: (_: any, row: MSIData) => {
                const { district, pincode } = parseRegionKey(row.region_key);
                return (
                    <div>
                        <div className="font-medium">{district}</div>
                        <div className="text-xs text-gray-500">PIN: {pincode}</div>
                    </div>
                );
            },
        },
        {
            key: 'state',
            label: 'State',
            render: (_: any, row: MSIData) => parseRegionKey(row.region_key).state,
        },
        {
            key: 'msi_score',
            label: 'MSI Score',
            render: (value: number) => (
                <span className={`font-semibold ${value >= 2 ? 'text-red-600' : value >= 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {value.toFixed(3)}
                </span>
            ),
        },
        { key: 'classification', label: 'Status' },
        {
            key: 'address_update_zscore',
            label: 'Address Z-Score',
            render: (value: number) => value.toFixed(2),
        },
        {
            key: 'adult_enrolment_zscore',
            label: 'Adult Enrol Z-Score',
            render: (value: number) => value.toFixed(2),
        },
        {
            key: 'consecutive_watch_periods',
            label: 'Consecutive',
            render: (value: number) => (
                <span className={value >= 3 ? 'text-red-600 font-semibold' : ''}>
                    {value}
                </span>
            ),
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Mobility (MSI) Map</h1>
                <p className="page-subtitle">
                    Migration Stress Index analysis by region • Track settlement instability signals
                </p>
            </div>

            {/* Formula Explanation */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">📊 MSI Formula</h2>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm">
                    <code>
                        MSI = Z(Address Update Rate) + Z(Adult Enrolment Growth) - Z(Enrolment Decline)
                    </code>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <div className="font-semibold text-emerald-700">Stable</div>
                        <div className="text-emerald-600">MSI &lt; 1.0</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="font-semibold text-amber-700">Watch</div>
                        <div className="text-amber-600">1.0 ≤ MSI &lt; 2.0</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                        <div className="font-semibold text-red-700">Critical</div>
                        <div className="text-red-600">MSI ≥ 2.0 (3+ periods)</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select
                            className="select"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            {periods.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select
                            className="select"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            <option value="all">All States</option>
                            {states.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ml-auto flex gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                            <div className="text-xs text-gray-500">Critical</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">{watchCount}</div>
                            <div className="text-xs text-gray-500">Watch</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">{stableCount}</div>
                            <div className="text-xs text-gray-500">Stable</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MSI Legend Map Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 card">
                    <div className="card-header">
                        <h2 className="card-title">🗺️ Regional MSI Distribution</h2>
                    </div>
                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            <p className="text-lg font-medium">India Map Visualization</p>
                            <p className="text-sm">Interactive state/district drilldown</p>
                            <p className="text-xs mt-2">Color-coded by MSI classification</p>
                        </div>
                    </div>
                </div>

                {/* Top 5 Hotspots */}
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🔥 Top 5 Hotspots</h2>
                    </div>
                    <div className="space-y-3">
                        {msiData.slice(0, 5).map((region, idx) => {
                            const { district, state } = parseRegionKey(region.region_key);
                            return (
                                <div key={region.region_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-sm">{district}</div>
                                            <div className="text-xs text-gray-500">{state}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${region.msi_score >= 2 ? 'text-red-600' : region.msi_score >= 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {region.msi_score.toFixed(2)}
                                        </div>
                                        <StatusBadge status={region.classification} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Full Data Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📋 All Regions ({msiData.length})</h2>
                    <button className="btn btn-secondary text-sm">
                        Export CSV ↓
                    </button>
                </div>
                <DataTable
                    columns={tableColumns}
                    data={msiData.map((d, idx) => ({ ...d, rank: idx + 1 }))}
                />
            </div>
        </div>
    );
}
