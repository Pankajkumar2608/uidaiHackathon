"""
UIDAI Data Processor - Main pipeline script
Loads CSVs, aggregates data, computes metrics, and exports JSON for frontend.
"""

import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

from data_loader import UIDAIDataLoader, DATASET_CONFIGS
from metrics import MetricsCalculator, InsightGenerator, MBULoad


class DataProcessor:
    """Main data processing pipeline"""
    
    def __init__(self, base_dir: str = ".."):
        self.base_dir = Path(base_dir)
        self.loader = UIDAIDataLoader(base_dir)
        self.metrics = MetricsCalculator()
        self.insights = InsightGenerator()
        
    def aggregate_by_period_and_region(
        self, 
        dataset_type: str,
        period_type: str = "monthly"  # monthly or quarterly
    ) -> Dict[str, Dict[str, Dict]]:
        """
        Aggregate data by time period and geographic region.
        Returns: {period: {region_key: {field: value}}}
        """
        aggregated = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        
        for batch in self.loader.load_dataset(dataset_type):
            for row in batch:
                date = row.get("date")
                if not date:
                    continue
                
                # Determine period
                if period_type == "monthly":
                    period = date.strftime("%Y-%m")
                else:  # quarterly
                    quarter = (date.month - 1) // 3 + 1
                    period = f"{date.year}-Q{quarter}"
                
                # Build region key
                state = row.get("state", "Unknown")
                district = row.get("district", "Unknown")
                pincode = row.get("pincode", "000000")
                region_key = f"{state}|{district}|{pincode}"
                
                # Aggregate numeric fields
                config = DATASET_CONFIGS[dataset_type]
                for col in config.columns:
                    if col not in ["date", "state", "district", "pincode"]:
                        aggregated[period][region_key][col] += row.get(col, 0)
        
        return dict(aggregated)
    
    def compute_all_metrics(
        self, 
        enrolment_data: Dict,
        demographic_data: Dict,
        biometric_data: Dict
    ) -> Dict:
        """Compute all metrics for all periods"""
        results = {
            "msi": {},
            "demand_proxies": {},
            "mbu_load": {},
            "insights_by_state": {}
        }
        
        # Get all periods (sorted)
        all_periods = sorted(set(
            list(enrolment_data.keys()) + 
            list(demographic_data.keys()) + 
            list(biometric_data.keys())
        ))
        
        previous_enrolment = {}
        historical_bio = defaultdict(list)
        
        for period in all_periods:
            enrol = enrolment_data.get(period, {})
            demo = demographic_data.get(period, {})
            bio = biometric_data.get(period, {})
            
            # Merge data for MSI computation
            merged = defaultdict(dict)
            for region_key in set(list(enrol.keys()) + list(demo.keys())):
                e = enrol.get(region_key, {})
                d = demo.get(region_key, {})
                
                # Compute derived metrics
                total_enrol = e.get("age_0_5", 0) + e.get("age_5_17", 0) + e.get("age_18_greater", 0)
                demo_total = d.get("demo_age_5_17", 0) + d.get("demo_age_17_", 0)
                
                # Address update rate (proxy)
                merged[region_key]["address_update_rate"] = d.get("demo_age_17_", 0) / max(total_enrol, 1)
                
                # Adult enrollment growth
                prev = previous_enrolment.get(region_key, {})
                prev_adult = prev.get("age_18_greater", 0)
                curr_adult = e.get("age_18_greater", 0)
                if prev_adult > 0:
                    merged[region_key]["adult_enrolment_growth"] = (curr_adult - prev_adult) / prev_adult
                else:
                    merged[region_key]["adult_enrolment_growth"] = 0
                
                # Enrollment decline (negative growth in total)
                prev_total = sum(prev.values()) if prev else 0
                if prev_total > 0:
                    merged[region_key]["enrolment_decline"] = (prev_total - total_enrol) / prev_total
                else:
                    merged[region_key]["enrolment_decline"] = 0
                
                # Copy raw values
                merged[region_key].update(e)
                merged[region_key].update(d)
            
            # Compute MSI
            msi_results = self.metrics.compute_msi(dict(merged), period)
            results["msi"][period] = [self._result_to_dict(r) for r in msi_results]
            
            # Compute demand proxies
            demand_results = self.metrics.compute_demand_proxies(dict(merged), previous_enrolment, period)
            results["demand_proxies"][period] = [self._result_to_dict(r) for r in demand_results]
            
            # Update historical averages for MBU
            for region_key, data in bio.items():
                total = data.get("bio_age_5_17", 0) + data.get("bio_age_17_", 0)
                historical_bio[region_key].append(total)
            
            # Compute MBU load
            historical_avg = {k: sum(v) / len(v) for k, v in historical_bio.items() if v}
            mbu_results = self.metrics.compute_mbu_load(bio, historical_avg, period)
            results["mbu_load"][period] = [self._result_to_dict(r) for r in mbu_results]
            
            # Generate insights by state
            states = set(r.region_key.split("|")[0] for r in msi_results)
            for state in states:
                if state not in results["insights_by_state"]:
                    results["insights_by_state"][state] = {}
                
                insights = self.insights.generate_insights(
                    msi_results, demand_results, mbu_results, state
                )
                results["insights_by_state"][state][period] = insights
            
            # Store for next iteration
            previous_enrolment = dict(merged)
        
        return results
    
    def _result_to_dict(self, obj) -> Dict:
        """Convert dataclass to dict"""
        return {k: v for k, v in obj.__dict__.items()}
    
    def generate_summary_stats(self, metrics: Dict) -> Dict:
        """Generate national summary statistics"""
        summary = {
            "total_regions": 0,
            "critical_regions": 0,
            "watch_regions": 0,
            "stable_regions": 0,
            "high_mbu_regions": 0,
            "latest_period": "",
            "states": [],
            "districts": set(),
            "pincodes": set()
        }
        
        if not metrics["msi"]:
            return summary
        
        latest_period = max(metrics["msi"].keys())
        summary["latest_period"] = latest_period
        
        latest_msi = metrics["msi"][latest_period]
        summary["total_regions"] = len(latest_msi)
        
        for r in latest_msi:
            classification = r.get("classification", "Stable")
            if classification == "Critical":
                summary["critical_regions"] += 1
            elif classification == "Watch":
                summary["watch_regions"] += 1
            else:
                summary["stable_regions"] += 1
            
            parts = r.get("region_key", "").split("|")
            if len(parts) >= 3:
                summary["states"].append(parts[0])
                summary["districts"].add(parts[1])
                summary["pincodes"].add(parts[2])
        
        summary["states"] = sorted(set(summary["states"]))
        summary["districts"] = len(summary["districts"])
        summary["pincodes"] = len(summary["pincodes"])
        
        # MBU stats
        if latest_period in metrics["mbu_load"]:
            for m in metrics["mbu_load"][latest_period]:
                if m.get("backlog_signal", 0) > 0.3:
                    summary["high_mbu_regions"] += 1
        
        return summary
    
    def export_to_json(self, output_dir: str = "../public/data"):
        """Run full pipeline and export JSON files"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        print("Loading and aggregating datasets...")
        
        # Aggregate each dataset
        print("  Processing enrolment data...")
        enrolment = self.aggregate_by_period_and_region("enrolment", "monthly")
        
        print("  Processing demographic data...")
        demographic = self.aggregate_by_period_and_region("demographic", "monthly")
        
        print("  Processing biometric data...")
        biometric = self.aggregate_by_period_and_region("biometric", "monthly")
        
        print("Computing metrics...")
        metrics = self.compute_all_metrics(enrolment, demographic, biometric)
        
        print("Generating summary...")
        summary = self.generate_summary_stats(metrics)
        
        # Export files
        print("Exporting JSON files...")
        
        # Full metrics
        with open(output_path / "metrics.json", "w") as f:
            json.dump(metrics, f, indent=2, default=str)
        
        # Summary
        with open(output_path / "summary.json", "w") as f:
            json.dump(summary, f, indent=2, default=str)
        
        # State list for dropdowns
        with open(output_path / "states.json", "w") as f:
            json.dump(summary["states"], f, indent=2)
        
        print(f"✓ Exported to {output_path}")
        print(f"  - Total regions: {summary['total_regions']}")
        print(f"  - States: {len(summary['states'])}")
        print(f"  - Latest period: {summary['latest_period']}")
        
        return metrics, summary


def generate_sample_data(output_dir: str = "../public/data/sample"):
    """Generate sample data for demo mode"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Sample states and districts
    sample_regions = [
        ("Maharashtra", "Mumbai", "400001"),
        ("Maharashtra", "Pune", "411001"),
        ("Karnataka", "Bengaluru Urban", "560001"),
        ("Karnataka", "Mysuru", "570001"),
        ("Tamil Nadu", "Chennai", "600001"),
        ("Tamil Nadu", "Coimbatore", "641001"),
        ("Uttar Pradesh", "Lucknow", "226001"),
        ("Uttar Pradesh", "Varanasi", "221001"),
        ("West Bengal", "Kolkata", "700001"),
        ("West Bengal", "Howrah", "711101"),
    ]
    
    periods = ["2025-01", "2025-02", "2025-03"]
    
    # Generate sample MSI data
    import random
    random.seed(42)
    
    sample_msi = {}
    sample_demand = {}
    sample_mbu = {}
    
    for period in periods:
        sample_msi[period] = []
        sample_demand[period] = []
        sample_mbu[period] = []
        
        for state, district, pin in sample_regions:
            region_key = f"{state}|{district}|{pin}"
            
            # MSI
            msi_score = round(random.uniform(-1, 3), 3)
            if msi_score >= 2:
                classification = "Critical"
            elif msi_score >= 1:
                classification = "Watch"
            else:
                classification = "Stable"
            
            sample_msi[period].append({
                "region_key": region_key,
                "period": period,
                "msi_score": msi_score,
                "classification": classification,
                "address_update_zscore": round(random.uniform(-1, 2), 3),
                "adult_enrolment_zscore": round(random.uniform(-1, 2), 3),
                "enrolment_decline_zscore": round(random.uniform(-1, 1), 3),
                "consecutive_watch_periods": random.randint(0, 4)
            })
            
            # Demand proxies
            sample_demand[period].append({
                "region_key": region_key,
                "period": period,
                "school_demand": round(random.uniform(-0.1, 0.3), 4),
                "housing_transport_demand": round(random.uniform(-0.1, 0.4), 4),
                "child_growth_rate": round(random.uniform(-0.05, 0.15), 4),
                "adult_growth_rate": round(random.uniform(-0.05, 0.2), 4),
                "address_intensity": round(random.uniform(0.3, 0.8), 4)
            })
            
            # MBU Load
            sample_mbu[period].append({
                "region_key": region_key,
                "period": period,
                "total_mbu_load": random.randint(500, 5000),
                "age_5_17_load": random.randint(200, 2000),
                "backlog_signal": round(random.uniform(-0.3, 0.5), 3),
                "priority_rank": sample_regions.index((state, district, pin)) + 1
            })
    
    # Generate sample insights
    sample_insights = {}
    for state in set(s for s, _, _ in sample_regions):
        sample_insights[state] = {
            periods[-1]: [
                {
                    "indicator": "MSI (Watch)",
                    "region": f"Sample District, {state}",
                    "evidence": "MSI=1.5, 2 consecutive periods",
                    "action": "Monitor settlement patterns",
                    "department": "Labour/Welfare",
                    "impact": "Medium",
                    "confidence": 0.65
                },
                {
                    "indicator": "School Demand Proxy",
                    "region": f"Sample District, {state}",
                    "evidence": "Child growth=12%, Adult settlement gain detected",
                    "action": "Assess school infrastructure capacity",
                    "department": "Education",
                    "impact": "Medium",
                    "confidence": 0.70
                }
            ]
        }
    
    sample_metrics = {
        "msi": sample_msi,
        "demand_proxies": sample_demand,
        "mbu_load": sample_mbu,
        "insights_by_state": sample_insights
    }
    
    sample_summary = {
        "total_regions": len(sample_regions),
        "critical_regions": sum(1 for r in sample_msi[periods[-1]] if r["classification"] == "Critical"),
        "watch_regions": sum(1 for r in sample_msi[periods[-1]] if r["classification"] == "Watch"),
        "stable_regions": sum(1 for r in sample_msi[periods[-1]] if r["classification"] == "Stable"),
        "high_mbu_regions": sum(1 for r in sample_mbu[periods[-1]] if r["backlog_signal"] > 0.3),
        "latest_period": periods[-1],
        "states": sorted(set(s for s, _, _ in sample_regions)),
        "districts": len(set(d for _, d, _ in sample_regions)),
        "pincodes": len(set(p for _, _, p in sample_regions))
    }
    
    # Export
    with open(output_path / "metrics.json", "w") as f:
        json.dump(sample_metrics, f, indent=2)
    
    with open(output_path / "summary.json", "w") as f:
        json.dump(sample_summary, f, indent=2)
    
    with open(output_path / "states.json", "w") as f:
        json.dump(sample_summary["states"], f, indent=2)
    
    print(f"✓ Generated sample data in {output_path}")
    return sample_metrics, sample_summary


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--sample":
        print("Generating sample data for demo mode...")
        generate_sample_data()
    else:
        print("Running full data processing pipeline...")
        processor = DataProcessor()
        try:
            processor.export_to_json()
        except FileNotFoundError as e:
            print(f"Dataset not found: {e}")
            print("\nGenerating sample data instead...")
            generate_sample_data()
