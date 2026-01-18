"""
UIDAI Metrics Calculator
Computes Migration Stress Index (MSI), Infrastructure Demand Proxies, and MBU Load metrics.

IMPORTANT: All outputs are proxy-based indicators. They do not represent exact migration flows.
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass
from statistics import mean, stdev
from collections import defaultdict


@dataclass
class MSIResult:
    """Migration Stress Index result for a region"""
    region_key: str  # state|district|pincode
    period: str  # YYYY-MM or YYYY-Q#
    msi_score: float
    classification: str  # Stable, Watch, Critical
    address_update_zscore: float
    adult_enrolment_zscore: float
    enrolment_decline_zscore: float
    consecutive_watch_periods: int = 0


@dataclass  
class DemandProxy:
    """Infrastructure demand proxy result"""
    region_key: str
    period: str
    school_demand: float
    housing_transport_demand: float
    child_growth_rate: float
    adult_growth_rate: float
    address_intensity: float


@dataclass
class MBULoad:
    """Mandatory Biometric Update load metrics"""
    region_key: str
    period: str
    total_mbu_load: int
    age_5_17_load: int
    backlog_signal: float  # > 0 means above average
    priority_rank: int


def compute_zscore(value: float, values: List[float]) -> float:
    """Compute z-score for a value given a list of all values"""
    if len(values) < 2:
        return 0.0
    
    avg = mean(values)
    std = stdev(values)
    
    if std == 0:
        return 0.0
    
    return (value - avg) / std


def compute_growth_rate(current: float, previous: float) -> float:
    """Compute period-over-period growth rate"""
    if previous == 0:
        return 0.0 if current == 0 else 1.0
    return (current - previous) / previous


class MetricsCalculator:
    """
    Calculate all metrics from aggregated UIDAI data.
    Expects pre-aggregated data by region and time period.
    """
    
    # MSI Classification thresholds
    MSI_STABLE_THRESHOLD = 1.0
    MSI_WATCH_THRESHOLD = 2.0
    CONSECUTIVE_PERIODS_FOR_CRITICAL = 3
    
    def __init__(self):
        self.history = defaultdict(list)  # Track consecutive periods
    
    def compute_msi(
        self, 
        aggregated_data: Dict[str, Dict],
        period: str
    ) -> List[MSIResult]:
        """
        Compute Migration Stress Index for all regions in a period.
        
        aggregated_data format:
        {
            "state|district|pincode": {
                "address_update_rate": float,
                "adult_enrolment_growth": float,
                "enrolment_decline": float,
                "demo_age_17_": int,
                "age_18_greater": int,
                ...
            }
        }
        """
        # First pass: collect all values for z-score calculation
        address_rates = []
        adult_growths = []
        declines = []
        
        for region_key, data in aggregated_data.items():
            address_rates.append(data.get("address_update_rate", 0))
            adult_growths.append(data.get("adult_enrolment_growth", 0))
            declines.append(data.get("enrolment_decline", 0))
        
        # Second pass: compute z-scores and MSI
        results = []
        
        for region_key, data in aggregated_data.items():
            addr_z = compute_zscore(data.get("address_update_rate", 0), address_rates)
            adult_z = compute_zscore(data.get("adult_enrolment_growth", 0), adult_growths)
            decline_z = compute_zscore(data.get("enrolment_decline", 0), declines)
            
            # MSI Formula: zscore(AddressUpdateRate) + zscore(AdultEnrollmentGrowth) - zscore(EnrollmentDecline)
            msi_score = addr_z + adult_z - decline_z
            
            # Track consecutive watch periods
            prev_count = self.history[region_key][-1] if self.history[region_key] else 0
            
            if msi_score >= self.MSI_WATCH_THRESHOLD:
                consecutive = prev_count + 1
            else:
                consecutive = 0
            
            self.history[region_key].append(consecutive)
            
            # Classify
            if msi_score >= self.MSI_WATCH_THRESHOLD and consecutive >= self.CONSECUTIVE_PERIODS_FOR_CRITICAL:
                classification = "Critical"
            elif msi_score >= self.MSI_STABLE_THRESHOLD:
                classification = "Watch"
            else:
                classification = "Stable"
            
            results.append(MSIResult(
                region_key=region_key,
                period=period,
                msi_score=round(msi_score, 3),
                classification=classification,
                address_update_zscore=round(addr_z, 3),
                adult_enrolment_zscore=round(adult_z, 3),
                enrolment_decline_zscore=round(decline_z, 3),
                consecutive_watch_periods=consecutive
            ))
        
        return sorted(results, key=lambda x: x.msi_score, reverse=True)
    
    def compute_demand_proxies(
        self,
        current_data: Dict[str, Dict],
        previous_data: Dict[str, Dict],
        period: str
    ) -> List[DemandProxy]:
        """
        Compute infrastructure demand proxies.
        
        School Demand = growth(0-5 + 5-17) + net_settlement_gain
        Housing/Transport = growth(18+) + address_update_intensity
        """
        results = []
        
        for region_key, curr in current_data.items():
            prev = previous_data.get(region_key, {})
            
            # Child population growth (0-5 and 5-17)
            curr_child = curr.get("age_0_5", 0) + curr.get("age_5_17", 0)
            prev_child = prev.get("age_0_5", 0) + prev.get("age_5_17", 0)
            child_growth = compute_growth_rate(curr_child, prev_child)
            
            # Adult population growth (18+)
            curr_adult = curr.get("age_18_greater", 0)
            prev_adult = prev.get("age_18_greater", 0)
            adult_growth = compute_growth_rate(curr_adult, prev_adult)
            
            # Net settlement gain (proxy: adult enrolment growth)
            net_settlement = max(0, adult_growth)
            
            # Address update intensity (demo_age_17_ / total demo updates)
            demo_total = curr.get("demo_age_5_17", 0) + curr.get("demo_age_17_", 0)
            address_intensity = curr.get("demo_age_17_", 0) / max(demo_total, 1)
            
            # Compute proxies
            school_demand = child_growth + net_settlement
            housing_transport = adult_growth + address_intensity
            
            results.append(DemandProxy(
                region_key=region_key,
                period=period,
                school_demand=round(school_demand, 4),
                housing_transport_demand=round(housing_transport, 4),
                child_growth_rate=round(child_growth, 4),
                adult_growth_rate=round(adult_growth, 4),
                address_intensity=round(address_intensity, 4)
            ))
        
        return results
    
    def compute_mbu_load(
        self,
        biometric_data: Dict[str, Dict],
        historical_avg: Dict[str, float],
        period: str
    ) -> List[MBULoad]:
        """
        Compute Mandatory Biometric Update load and backlog signals.
        
        MBU is mandatory at ages 5 and 15, so bio_age_5_17 is key.
        Backlog signal = (current_load / rolling_avg) - 1
        """
        results = []
        
        for region_key, data in biometric_data.items():
            age_5_17 = data.get("bio_age_5_17", 0)
            age_17_plus = data.get("bio_age_17_", 0)
            total_load = age_5_17 + age_17_plus
            
            # Compute backlog signal
            avg = historical_avg.get(region_key, total_load)
            if avg > 0:
                backlog_signal = (total_load / avg) - 1
            else:
                backlog_signal = 0.0
            
            results.append(MBULoad(
                region_key=region_key,
                period=period,
                total_mbu_load=total_load,
                age_5_17_load=age_5_17,
                backlog_signal=round(backlog_signal, 3),
                priority_rank=0  # Will be set after sorting
            ))
        
        # Assign priority ranks (higher load = higher priority)
        results.sort(key=lambda x: x.total_mbu_load, reverse=True)
        for i, result in enumerate(results):
            result.priority_rank = i + 1
        
        return results


class InsightGenerator:
    """Generate actionable insights from computed metrics"""
    
    DEPARTMENTS = {
        "school": "Education",
        "housing": "Urban Development",
        "transport": "Transport",
        "migration": "Labour/Welfare",
        "biometric": "UIDAI Regional Office"
    }
    
    def generate_insights(
        self,
        msi_results: List[MSIResult],
        demand_proxies: List[DemandProxy],
        mbu_loads: List[MBULoad],
        state: str,
        top_n: int = 10
    ) -> List[Dict]:
        """Generate top N actionable insights for a state"""
        insights = []
        
        # Filter by state (region_key format: state|district|pincode)
        state_msi = [r for r in msi_results if r.region_key.split("|")[0] == state]
        state_demand = [r for r in demand_proxies if r.region_key.split("|")[0] == state]
        state_mbu = [r for r in mbu_loads if r.region_key.split("|")[0] == state]
        
        # Critical MSI regions
        critical = [r for r in state_msi if r.classification == "Critical"]
        for region in critical[:3]:
            insights.append({
                "indicator": "MSI (Critical)",
                "region": self._format_region(region.region_key),
                "evidence": f"MSI={region.msi_score}, {region.consecutive_watch_periods} consecutive high periods",
                "action": "Priority intervention needed - high settlement instability signals",
                "department": self.DEPARTMENTS["migration"],
                "impact": "High",
                "confidence": self._compute_confidence(region.msi_score, region.consecutive_watch_periods)
            })
        
        # High school demand
        high_school = sorted(state_demand, key=lambda x: x.school_demand, reverse=True)[:3]
        for demand in high_school:
            if demand.school_demand > 0.1:  # 10% growth threshold
                insights.append({
                    "indicator": "School Demand Proxy",
                    "region": self._format_region(demand.region_key),
                    "evidence": f"Child growth={demand.child_growth_rate:.1%}, Adult settlement gain detected",
                    "action": "Assess school infrastructure capacity",
                    "department": self.DEPARTMENTS["school"],
                    "impact": "Medium" if demand.school_demand < 0.2 else "High",
                    "confidence": min(0.9, 0.5 + abs(demand.school_demand))
                })
        
        # High housing/transport demand
        high_housing = sorted(state_demand, key=lambda x: x.housing_transport_demand, reverse=True)[:2]
        for demand in high_housing:
            if demand.housing_transport_demand > 0.15:
                insights.append({
                    "indicator": "Housing/Transport Proxy",
                    "region": self._format_region(demand.region_key),
                    "evidence": f"Adult growth={demand.adult_growth_rate:.1%}, Address intensity={demand.address_intensity:.1%}",
                    "action": "Review housing and transport infrastructure plans",
                    "department": self.DEPARTMENTS["housing"],
                    "impact": "Medium",
                    "confidence": min(0.85, 0.4 + abs(demand.housing_transport_demand))
                })
        
        # MBU backlog regions 
        high_backlog = [r for r in state_mbu if r.backlog_signal > 0.3][:2]
        for mbu in high_backlog:
            insights.append({
                "indicator": "MBU Backlog Signal",
                "region": self._format_region(mbu.region_key),
                "evidence": f"Load={mbu.total_mbu_load}, Backlog signal=+{mbu.backlog_signal:.0%}",
                "action": "Schedule additional MBU camps in this region",
                "department": self.DEPARTMENTS["biometric"],
                "impact": "Medium",
                "confidence": min(0.9, 0.5 + mbu.backlog_signal)
            })
        
        # Sort by impact and confidence
        impact_order = {"High": 0, "Medium": 1, "Low": 2}
        insights.sort(key=lambda x: (impact_order[x["impact"]], -x["confidence"]))
        
        return insights[:top_n]
    
    def _format_region(self, region_key: str) -> str:
        """Format region key for display"""
        parts = region_key.split("|")
        if len(parts) == 3:
            return f"{parts[1]}, {parts[0]} ({parts[2]})"
        return region_key
    
    def _compute_confidence(self, msi: float, consecutive: int) -> float:
        """Compute confidence score based on signal strength and duration"""
        base = min(0.7, abs(msi) / 4)
        duration_bonus = min(0.3, consecutive * 0.1)
        return round(base + duration_bonus, 2)


if __name__ == "__main__":
    # Test with sample data
    calculator = MetricsCalculator()
    
    # Sample aggregated data
    sample_data = {
        "Bihar|Patna|800001": {
            "address_update_rate": 0.15,
            "adult_enrolment_growth": 0.08,
            "enrolment_decline": 0.02,
            "age_0_5": 1500,
            "age_5_17": 3000,
            "age_18_greater": 8000,
            "demo_age_5_17": 200,
            "demo_age_17_": 1500
        },
        "Bihar|Gaya|823001": {
            "address_update_rate": 0.25,
            "adult_enrolment_growth": 0.12,
            "enrolment_decline": -0.05,
            "age_0_5": 800,
            "age_5_17": 1500,
            "age_18_greater": 4000,
            "demo_age_5_17": 100,
            "demo_age_17_": 800
        }
    }
    
    # Test MSI calculation
    msi_results = calculator.compute_msi(sample_data, "2025-03")
    print("MSI Results:")
    for result in msi_results:
        print(f"  {result.region_key}: {result.msi_score} ({result.classification})")
