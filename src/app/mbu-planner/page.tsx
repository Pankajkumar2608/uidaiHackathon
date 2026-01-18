'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import DataTable from '@/components/DataTable';
import {
    loadMetrics,
    loadStates,
    Metrics,
    MBULoad,
    parseRegionKey,
    formatNumber,
} from '@/lib/data';

export default function MBUPlanner() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Camp planning parameters
    const [dailyCapacity, setDailyCapacity] = useState(200);
    const [campDays, setCampDays] = useState(5);

    useEffect(() => {
        async function fetchData() {
            const [metricsData, statesData] = await Promise.all([
                loadMetrics(),
                loadStates(),
            ]);
            setMetrics(metricsData);
            setStates(statesData);

            const periods = Object.keys(metricsData.mbu_load).sort();
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
                <div className="animate-pulse text-gray-500">Loading MBU data...</div>
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

    const periods = Object.keys(metrics.mbu_load).sort();
    let mbuData = metrics.mbu_load[selectedPeriod] || [];

    if (selectedState !== 'all') {
        mbuData = mbuData.filter(r => parseRegionKey(r.region_key).state === selectedState);
    }

    // Sort by priority (total load descending)
    mbuData = [...mbuData].sort((a, b) => b.total_mbu_load - a.total_mbu_load);

    // Stats
    const totalLoad = mbuData.reduce((sum, d) => sum + d.total_mbu_load, 0);
    const avgLoad = mbuData.length > 0 ? totalLoad / mbuData.length : 0;
    const highBacklogCount = mbuData.filter(d => d.backlog_signal > 0.3).length;
    const criticalBacklogCount = mbuData.filter(d => d.backlog_signal > 0.5).length;

    // Camp planning calculation
    const campCapacity = dailyCapacity * campDays;
    const regionsNeedingCamps = mbuData.filter(d => d.total_mbu_load > campCapacity * 0.5);
    const estimatedCamps = Math.ceil(totalLoad / campCapacity);

    const tableColumns = [
        {
            key: 'priority_rank',
            label: 'Priority',
            render: (value: number) => (
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${value <= 3 ? 'bg-red-100 text-red-600' : value <= 10 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {value}
                </span>
            ),
        },
        {
            key: 'region',
            label: 'Region',
            render: (_: any, row: MBULoad) => {
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
            render: (_: any, row: MBULoad) => parseRegionKey(row.region_key).state,
        },
        {
            key: 'total_mbu_load',
            label: 'Total Load',
            render: (value: number) => (
                <span className="font-semibold">{formatNumber(value)}</span>
            ),
        },
        {
            key: 'age_5_17_load',
            label: 'Age 5-17 Load',
            render: (value: number) => formatNumber(value),
        },
        {
            key: 'backlog_signal',
            label: 'Backlog Signal',
            render: (value: number) => (
                <span className={`font-semibold ${value > 0.5 ? 'text-red-600' : value > 0.3 ? 'text-amber-600' : value > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                    {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
                </span>
            ),
        },
        {
            key: 'camps_needed',
            label: 'Est. Camps',
            render: (_: any, row: MBULoad) => {
                const camps = Math.ceil(row.total_mbu_load / campCapacity);
                return <span className="font-medium">{camps}</span>;
            },
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">MBU Operations Planner</h1>
                <p className="page-subtitle">
                    Mandatory Biometric Update camp planning and throughput tracking
                </p>
            </div>

            {/* Context Info */}
            <div className="compliance-notice mb-6">
                <strong>ℹ️ About Mandatory Biometric Updates</strong>
                UIDAI mandates biometric updates at ages 5 and 15. The biometric load (bio_age_5_17)
                represents the population requiring these mandatory updates. Backlog signals indicate
                regions with higher-than-average update demand.
            </div>

            {/* Filters and Camp Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🔍 Filters</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
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
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">⚙️ Camp Planning Parameters</h2>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Capacity</label>
                            <input
                                type="number"
                                className="select"
                                value={dailyCapacity}
                                onChange={(e) => setDailyCapacity(Number(e.target.value))}
                                min={50}
                                max={500}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Camp Days</label>
                            <input
                                type="number"
                                className="select"
                                value={campDays}
                                onChange={(e) => setCampDays(Number(e.target.value))}
                                min={1}
                                max={14}
                            />
                        </div>
                        <div className="flex items-end">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm text-gray-600">Camp Capacity: </span>
                                <span className="font-bold text-blue-600">{formatNumber(campCapacity)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid-metrics mb-6">
                <MetricCard
                    label="Total MBU Load"
                    value={formatNumber(totalLoad)}
                    colorClass="text-blue-600"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />
                <MetricCard
                    label="High Backlog Regions"
                    value={highBacklogCount}
                    colorClass="text-amber-600"
                />
                <MetricCard
                    label="Critical Backlog"
                    value={criticalBacklogCount}
                    colorClass="text-red-600"
                />
                <MetricCard
                    label="Estimated Camps Needed"
                    value={estimatedCamps}
                    colorClass="text-purple-600"
                />
            </div>

            {/* Camp Recommendations */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">📍 Recommended Camp Locations (Top Priority)</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mbuData.slice(0, 6).map((region, idx) => {
                        const { district, state, pincode } = parseRegionKey(region.region_key);
                        const campsNeeded = Math.ceil(region.total_mbu_load / campCapacity);
                        const weeksNeeded = Math.ceil(region.total_mbu_load / (dailyCapacity * 7));

                        return (
                            <div key={region.region_key} className={`p-4 rounded-lg border-2 ${idx < 2 ? 'border-red-200 bg-red-50' : idx < 4 ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
                                }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-bold text-lg">{district}</div>
                                        <div className="text-sm text-gray-600">{state} • PIN: {pincode}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${idx < 2 ? 'bg-red-200 text-red-700' : idx < 4 ? 'bg-amber-200 text-amber-700' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        #{idx + 1}
                                    </span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Load:</span>
                                        <span className="font-semibold">{formatNumber(region.total_mbu_load)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Backlog Signal:</span>
                                        <span className={`font-semibold ${region.backlog_signal > 0.3 ? 'text-red-600' : 'text-green-600'}`}>
                                            {region.backlog_signal > 0 ? '+' : ''}{(region.backlog_signal * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Camps Needed:</span>
                                        <span className="font-semibold text-blue-600">{campsNeeded}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Est. Duration:</span>
                                        <span className="font-semibold">{weeksNeeded} week(s)</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Tracker Mockup */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">📊 Weekly Completion Tracker</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Region</th>
                                <th>Target</th>
                                <th>Week 1</th>
                                <th>Week 2</th>
                                <th>Week 3</th>
                                <th>Week 4</th>
                                <th>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mbuData.slice(0, 5).map((region) => {
                                const { district } = parseRegionKey(region.region_key);
                                const weeklyTarget = Math.round(region.total_mbu_load / 4);
                                const progress = Math.random() * 60 + 20; // Demo random progress

                                return (
                                    <tr key={region.region_key}>
                                        <td className="font-medium">{district}</td>
                                        <td>{formatNumber(region.total_mbu_load)}</td>
                                        <td className="text-green-600">{formatNumber(Math.round(weeklyTarget * 0.95))}</td>
                                        <td className="text-green-600">{formatNumber(Math.round(weeklyTarget * 0.88))}</td>
                                        <td className="text-amber-600">{formatNumber(Math.round(weeklyTarget * 0.7))}</td>
                                        <td className="text-gray-400">-</td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-500 mt-3 italic">
                    * Demo data shown. Connect to live operational data for actual tracking.
                </p>
            </div>

            {/* Full Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📋 All Regions ({mbuData.length})</h2>
                    <button className="btn btn-secondary text-sm">Export CSV ↓</button>
                </div>
                <DataTable columns={tableColumns} data={mbuData} />
            </div>
        </div>
    );
}
