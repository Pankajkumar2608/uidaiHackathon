'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import DataTable from '@/components/DataTable';
import {
    loadMetrics,
    loadStates,
    Metrics,
    DemandProxy,
    parseRegionKey,
    formatPercent,
    downloadCSV,
} from '@/lib/data';

export default function Demographics() {
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

            const periods = Object.keys(metricsData.demand_proxies).sort();
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
                <div className="animate-pulse text-gray-500">Loading demographics data...</div>
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

    const periods = Object.keys(metrics.demand_proxies).sort();
    let demandData = metrics.demand_proxies[selectedPeriod] || [];

    if (selectedState !== 'all') {
        demandData = demandData.filter(r => parseRegionKey(r.region_key).state === selectedState);
    }

    // Calculate aggregated stats
    const avgSchoolDemand = demandData.length > 0
        ? demandData.reduce((sum, d) => sum + d.school_demand, 0) / demandData.length
        : 0;
    const avgHousingDemand = demandData.length > 0
        ? demandData.reduce((sum, d) => sum + d.housing_transport_demand, 0) / demandData.length
        : 0;
    const avgChildGrowth = demandData.length > 0
        ? demandData.reduce((sum, d) => sum + d.child_growth_rate, 0) / demandData.length
        : 0;
    const avgAdultGrowth = demandData.length > 0
        ? demandData.reduce((sum, d) => sum + d.adult_growth_rate, 0) / demandData.length
        : 0;

    // Get top regions by school demand and housing demand
    const topSchool = [...demandData].sort((a, b) => b.school_demand - a.school_demand).slice(0, 5);
    const topHousing = [...demandData].sort((a, b) => b.housing_transport_demand - a.housing_transport_demand).slice(0, 5);

    const tableColumns = [
        {
            key: 'region',
            label: 'Region',
            render: (_: any, row: DemandProxy) => {
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
            render: (_: any, row: DemandProxy) => parseRegionKey(row.region_key).state,
        },
        {
            key: 'school_demand',
            label: 'School Demand',
            render: (value: number) => (
                <span className={`font-semibold ${value > 0.15 ? 'text-red-600' : value > 0.05 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatPercent(value)}
                </span>
            ),
        },
        {
            key: 'housing_transport_demand',
            label: 'Housing/Transport',
            render: (value: number) => (
                <span className={`font-semibold ${value > 0.2 ? 'text-red-600' : value > 0.1 ? 'text-amber-600' : 'text-green-600'}`}>
                    {formatPercent(value)}
                </span>
            ),
        },
        {
            key: 'child_growth_rate',
            label: 'Child Growth',
            render: (value: number) => formatPercent(value),
        },
        {
            key: 'adult_growth_rate',
            label: 'Adult Growth',
            render: (value: number) => formatPercent(value),
        },
        {
            key: 'address_intensity',
            label: 'Address Intensity',
            render: (value: number) => formatPercent(value),
        },
    ];

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Infrastructure Demand</h1>
                <p className="page-subtitle">
                    Demand proxies for school, housing, and transport planning
                </p>
            </div>

            {/* Formula Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏫 School Demand Proxy</h2>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg font-mono text-sm mb-4">
                        <code>School_Demand = growth(age_0_5 + age_5_17) + net_settlement_gain</code>
                    </div>
                    <p className="text-sm text-gray-600">
                        Identifies regions with growing child populations and net inward settlement,
                        indicating potential need for school infrastructure expansion.
                    </p>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏠 Housing/Transport Proxy</h2>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg font-mono text-sm mb-4">
                        <code>Housing_Transport = growth(age_18+) + address_update_intensity</code>
                    </div>
                    <p className="text-sm text-gray-600">
                        Tracks adult population growth combined with address change frequency,
                        signaling housing and transportation infrastructure demand.
                    </p>
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
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid-metrics mb-6">
                <MetricCard
                    label="Avg School Demand"
                    value={formatPercent(avgSchoolDemand)}
                    colorClass={avgSchoolDemand > 0.1 ? 'text-amber-600' : 'text-blue-600'}
                />
                <MetricCard
                    label="Avg Housing/Transport"
                    value={formatPercent(avgHousingDemand)}
                    colorClass={avgHousingDemand > 0.15 ? 'text-amber-600' : 'text-purple-600'}
                />
                <MetricCard
                    label="Avg Child Growth"
                    value={formatPercent(avgChildGrowth)}
                    colorClass="text-cyan-600"
                />
                <MetricCard
                    label="Avg Adult Growth"
                    value={formatPercent(avgAdultGrowth)}
                    colorClass="text-indigo-600"
                />
            </div>

            {/* Top Regions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏫 Top School Demand Regions</h2>
                    </div>
                    <div className="space-y-2">
                        {topSchool.map((region, idx) => {
                            const { district, state } = parseRegionKey(region.region_key);
                            return (
                                <div key={region.region_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-sm">{district}</div>
                                            <div className="text-xs text-gray-500">{state}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-blue-600">{formatPercent(region.school_demand)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🏠 Top Housing/Transport Demand</h2>
                    </div>
                    <div className="space-y-2">
                        {topHousing.map((region, idx) => {
                            const { district, state } = parseRegionKey(region.region_key);
                            return (
                                <div key={region.region_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-sm">{district}</div>
                                            <div className="text-xs text-gray-500">{state}</div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-purple-600">{formatPercent(region.housing_transport_demand)}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Full Table */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📋 All Regions ({demandData.length})</h2>
                    <button
                        className="btn btn-secondary text-sm"
                        onClick={() => downloadCSV(demandData, `demographics_demand_${selectedPeriod}.csv`)}
                    >
                        Export CSV ↓
                    </button>
                </div>
                <DataTable columns={tableColumns} data={demandData} />
            </div>
        </div>
    );
}
