'use client';

import { useEffect, useState } from 'react';
import MetricCard from '@/components/MetricCard';
import DataTable from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  loadSummary,
  loadMetrics,
  Summary,
  Metrics,
  MSIData,
  getHotspots,
  getMSIDistribution,
  formatRegion,
} from '@/lib/data';

export default function NationalOverview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [summaryData, metricsData] = await Promise.all([
        loadSummary(),
        loadMetrics(),
      ]);
      setSummary(summaryData);
      setMetrics(metricsData);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!summary || !metrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        Failed to load data. Please refresh the page.
      </div>
    );
  }

  const latestMSI = metrics.msi[summary.latest_period] || [];
  const hotspots = getHotspots(latestMSI, 5);
  const distribution = getMSIDistribution(latestMSI);

  const tableColumns = [
    {
      key: 'region',
      label: 'Region',
      render: (_: any, row: MSIData) => formatRegion(row.region_key),
    },
    {
      key: 'msi_score',
      label: 'MSI Score',
      render: (value: number) => value.toFixed(2),
    },
    { key: 'classification', label: 'Status' },
    {
      key: 'consecutive_watch_periods',
      label: 'Consecutive Periods',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">National Overview</h1>
        <p className="page-subtitle">
          Settlement Intelligence Dashboard • Latest Period: {summary.latest_period}
        </p>
      </div>

      {/* Compliance Notice */}
      <div className="compliance-notice mb-6">
        <strong>⚠️ Proxy-Based Analysis</strong>
        All metrics shown are derived from aggregated Aadhaar administrative data.
        They represent proxy indicators of settlement patterns, not exact migration flows.
      </div>

      {/* Key Metrics */}
      <div className="grid-metrics mb-8">
        <MetricCard
          label="Total Regions Monitored"
          value={summary.total_regions.toLocaleString()}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Critical Regions"
          value={summary.critical_regions}
          colorClass="text-red-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <MetricCard
          label="Watch Regions"
          value={summary.watch_regions}
          colorClass="text-amber-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />
        <MetricCard
          label="Stable Regions"
          value={summary.stable_regions}
          colorClass="text-emerald-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="States Covered"
          value={summary.states?.length || 0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
          }
        />
        <MetricCard
          label="High MBU Load Regions"
          value={summary.high_mbu_regions}
          colorClass="text-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MSI Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">MSI Classification Distribution</h2>
          </div>
          <div className="flex items-center justify-around py-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-red-600">{distribution.critical}</span>
              </div>
              <span className="text-sm text-gray-500">Critical</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-amber-600">{distribution.watch}</span>
              </div>
              <span className="text-sm text-gray-500">Watch</span>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-emerald-600">{distribution.stable}</span>
              </div>
              <span className="text-sm text-gray-500">Stable</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Coverage Summary</h2>
          </div>
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Districts</span>
              <span className="font-semibold">{summary.districts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total PIN Codes</span>
              <span className="font-semibold">{summary.pincodes}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Data Period</span>
              <span className="font-semibold">{summary.latest_period}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Alert Rate</span>
              <span className="font-semibold text-amber-600">
                {((summary.critical_regions + summary.watch_regions) / summary.total_regions * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotspots Table */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">🔥 Top Hotspots (Critical & Watch Regions)</h2>
          <a href="/mobility" className="btn btn-secondary text-sm">
            View All →
          </a>
        </div>
        <DataTable columns={tableColumns} data={hotspots} />
      </div>
    </div>
  );
}
