'use client';

import { useEffect, useState } from 'react';
import {
    loadMetrics,
    loadStates,
    Metrics,
    Insight,
} from '@/lib/data';

export default function InsightsPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [states, setStates] = useState<string[]>([]);
    const [selectedState, setSelectedState] = useState<string>('');
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

            // Set defaults
            if (statesData.length > 0) {
                setSelectedState(statesData[0]);
            }

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
                <div className="animate-pulse text-gray-500">Loading insights...</div>
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

    const stateInsights = metrics.insights_by_state[selectedState] || {};
    const insights: Insight[] = stateInsights[selectedPeriod] || [];

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High': return 'bg-red-100 text-red-700 border-red-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getDeptIcon = (dept: string) => {
        switch (dept) {
            case 'Education':
                return '🏫';
            case 'Urban Development':
                return '🏗️';
            case 'Transport':
                return '🚌';
            case 'Labour/Welfare':
                return '👷';
            case 'UIDAI Regional Office':
                return '🪪';
            default:
                return '📋';
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Actionable Insights Engine</h1>
                <p className="page-subtitle">
                    Auto-generated policy recommendations based on computed metrics
                </p>
            </div>

            {/* Filters */}
            <div className="card mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select State</label>
                        <select
                            className="select"
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                        >
                            {states.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                        <select
                            className="select"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            {Object.keys(metrics.msi).sort().map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                    <div className="ml-auto">
                        <span className="text-sm text-gray-500">
                            Showing {insights.length} insights for <strong>{selectedState}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Insights Description */}
            <div className="compliance-notice mb-6">
                <strong>ℹ️ How Insights Are Generated</strong>
                Each insight combines multiple signals (MSI, demand proxies, MBU load) with evidence
                from the selected period. Confidence scores reflect signal strength and duration.
                All recommendations are proxy-based and should be validated with ground-level data.
            </div>

            {/* Insights List */}
            {insights.length === 0 ? (
                <div className="card text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💡</div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Insights Available</h3>
                    <p className="text-gray-500">
                        No insights generated for {selectedState} in period {selectedPeriod}.
                        <br />
                        This may indicate stable conditions or insufficient data.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {insights.map((insight, idx) => (
                        <div key={idx} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-start gap-4">
                                {/* Priority Number */}
                                <div className="flex-shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${idx < 3 ? 'bg-red-100 text-red-600' : idx < 6 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {idx + 1}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    {/* Header Row */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{getDeptIcon(insight.department)}</span>
                                                <h3 className="font-semibold text-lg">{insight.indicator}</h3>
                                            </div>
                                            <p className="text-gray-600 text-sm">{insight.region}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getImpactColor(insight.impact)}`}>
                                                {insight.impact} Impact
                                            </span>
                                        </div>
                                    </div>

                                    {/* Evidence */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Evidence</div>
                                        <p className="text-sm text-gray-700">{insight.evidence}</p>
                                    </div>

                                    {/* Action */}
                                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                                        <div className="text-xs font-semibold text-blue-500 uppercase mb-1">Recommended Action</div>
                                        <p className="text-sm text-blue-800 font-medium">{insight.action}</p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-4">
                                            <span className="text-gray-500">
                                                <strong>Department:</strong> {insight.department}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">Confidence:</span>
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${insight.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-medium text-gray-700">{(insight.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Export Options */}
            <div className="card mt-6">
                <div className="card-header">
                    <h2 className="card-title">📤 Export Options</h2>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-primary">
                        Export as PDF Report
                    </button>
                    <button className="btn btn-secondary">
                        Export as CSV
                    </button>
                    <button className="btn btn-secondary">
                        Share via Email
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    * Exported reports will include compliance disclaimers and data sources.
                </p>
            </div>
        </div>
    );
}
