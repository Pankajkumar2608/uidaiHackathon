// Data loading utilities for the frontend
// Uses sample data in demo mode, otherwise loads processed data

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface MSIData {
  region_key: string;
  period: string;
  msi_score: number;
  classification: 'Stable' | 'Watch' | 'Critical';
  address_update_zscore: number;
  adult_enrolment_zscore: number;
  enrolment_decline_zscore: number;
  consecutive_watch_periods: number;
}

export interface DemandProxy {
  region_key: string;
  period: string;
  school_demand: number;
  housing_transport_demand: number;
  child_growth_rate: number;
  adult_growth_rate: number;
  address_intensity: number;
}

export interface MBULoad {
  region_key: string;
  period: string;
  total_mbu_load: number;
  age_5_17_load: number;
  backlog_signal: number;
  priority_rank: number;
}

export interface Insight {
  indicator: string;
  region: string;
  evidence: string;
  action: string;
  department: string;
  impact: 'High' | 'Medium' | 'Low';
  confidence: number;
}

export interface Summary {
  total_regions: number;
  critical_regions: number;
  watch_regions: number;
  stable_regions: number;
  high_mbu_regions: number;
  latest_period: string;
  states: string[];
  districts: number;
  pincodes: number;
}

export interface Metrics {
  msi: Record<string, MSIData[]>;
  demand_proxies: Record<string, DemandProxy[]>;
  mbu_load: Record<string, MBULoad[]>;
  insights_by_state: Record<string, Record<string, Insight[]>>;
}

// Parse region key into components
export function parseRegionKey(regionKey: string): { state: string; district: string; pincode: string } {
  const [state, district, pincode] = regionKey.split('|');
  return { state: state || 'Unknown', district: district || 'Unknown', pincode: pincode || '000000' };
}

// Format region for display
export function formatRegion(regionKey: string): string {
  const { state, district, pincode } = parseRegionKey(regionKey);
  return `${district}, ${state}`;
}

// Get data path based on mode
function getDataPath(): string {
  return DEMO_MODE ? '/data/sample' : '/data';
}

// Load summary data
export async function loadSummary(): Promise<Summary> {
  try {
    const res = await fetch(`${getDataPath()}/summary.json`);
    if (!res.ok) throw new Error('Failed to load summary');
    return res.json();
  } catch (error) {
    console.error('Error loading summary:', error);
    return {
      total_regions: 0,
      critical_regions: 0,
      watch_regions: 0,
      stable_regions: 0,
      high_mbu_regions: 0,
      latest_period: '',
      states: [],
      districts: 0,
      pincodes: 0,
    };
  }
}

// Load full metrics
export async function loadMetrics(): Promise<Metrics> {
  try {
    const res = await fetch(`${getDataPath()}/metrics.json`);
    if (!res.ok) throw new Error('Failed to load metrics');
    return res.json();
  } catch (error) {
    console.error('Error loading metrics:', error);
    return {
      msi: {},
      demand_proxies: {},
      mbu_load: {},
      insights_by_state: {},
    };
  }
}

// Load states list
export async function loadStates(): Promise<string[]> {
  try {
    const res = await fetch(`${getDataPath()}/states.json`);
    if (!res.ok) throw new Error('Failed to load states');
    return res.json();
  } catch (error) {
    console.error('Error loading states:', error);
    return [];
  }
}

// Get MSI data for a specific period
export function getMSIForPeriod(metrics: Metrics, period: string): MSIData[] {
  return metrics.msi[period] || [];
}

// Get top critical/watch regions
export function getHotspots(msiData: MSIData[], limit: number = 10): MSIData[] {
  return msiData
    .filter(r => r.classification !== 'Stable')
    .sort((a, b) => b.msi_score - a.msi_score)
    .slice(0, limit);
}

// Get MSI distribution for a period
export function getMSIDistribution(msiData: MSIData[]): { stable: number; watch: number; critical: number } {
  return msiData.reduce(
    (acc, r) => {
      if (r.classification === 'Stable') acc.stable++;
      else if (r.classification === 'Watch') acc.watch++;
      else if (r.classification === 'Critical') acc.critical++;
      return acc;
    },
    { stable: 0, watch: 0, critical: 0 }
  );
}

// Format percentage
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// Format number with abbreviation
export function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => {
      const value = row[fieldName];
      // Handle commas/quotes in string values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
