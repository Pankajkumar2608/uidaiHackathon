"""
UIDAI Data Loader - Flexible dataset adapter for Aadhaar CSV files
Handles both complete download and state-wise download file structures.
"""

import csv
import os
from pathlib import Path
from typing import Dict, List, Generator, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class DatasetConfig:
    """Configuration for a dataset type"""
    name: str
    base_path: str
    columns: List[str]
    date_column: str = "date"
    geo_columns: List[str] = None
    
    def __post_init__(self):
        if self.geo_columns is None:
            self.geo_columns = ["state", "district", "pincode"]


# Default column mappings based on actual UIDAI datasets
DATASET_CONFIGS = {
    "enrolment": DatasetConfig(
        name="enrolment",
        base_path="api_data_aadhar_enrolment/api_data_aadhar_enrolment",
        columns=["date", "state", "district", "pincode", "age_0_5", "age_5_17", "age_18_greater"]
    ),
    "demographic": DatasetConfig(
        name="demographic", 
        base_path="api_data_aadhar_demographic/api_data_aadhar_demographic",
        columns=["date", "state", "district", "pincode", "demo_age_5_17", "demo_age_17_"]
    ),
    "biometric": DatasetConfig(
        name="biometric",
        base_path="api_data_aadhar_biometric/api_data_aadhar_biometric",
        columns=["date", "state", "district", "pincode", "bio_age_5_17", "bio_age_17_"]
    )
}


class UIDAIDataLoader:
    """
    Flexible data loader for UIDAI CSV files.
    Supports both chunked files (e.g., *_0_500000.csv) and single files.
    """
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = Path(base_dir)
        
    def discover_files(self, dataset_type: str) -> List[Path]:
        """Discover all CSV files for a dataset type"""
        config = DATASET_CONFIGS.get(dataset_type)
        if not config:
            raise ValueError(f"Unknown dataset type: {dataset_type}")
        
        dataset_path = self.base_dir / config.base_path
        if not dataset_path.exists():
            # Try alternate structure (flat directory)
            dataset_path = self.base_dir / f"api_data_aadhar_{dataset_type}"
            if not dataset_path.exists():
                # Try double nested structure (often happens with unzip)
                nested_path = self.base_dir / f"api_data_aadhar_{dataset_type}" / f"api_data_aadhar_{dataset_type}"
                if nested_path.exists():
                    dataset_path = nested_path
                else:
                    raise FileNotFoundError(f"Dataset directory not found: {dataset_path}")
        
        csv_files = list(dataset_path.glob("*.csv"))
        if not csv_files:
            # Check for nested structure one level deeper
            csv_files = list(dataset_path.glob("**/*.csv"))
            
        return sorted(csv_files)
    
    def load_dataset(
        self, 
        dataset_type: str,
        chunk_size: int = 10000
    ) -> Generator[List[Dict], None, None]:
        """
        Load dataset in chunks for memory efficiency.
        Yields batches of rows as dictionaries.
        """
        files = self.discover_files(dataset_type)
        config = DATASET_CONFIGS[dataset_type]
        
        for file_path in files:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                batch = []
                
                for row in reader:
                    # Clean and normalize row
                    cleaned_row = self._clean_row(row, config)
                    batch.append(cleaned_row)
                    
                    if len(batch) >= chunk_size:
                        yield batch
                        batch = []
                
                if batch:
                    yield batch
    
    def load_full_dataset(self, dataset_type: str) -> List[Dict]:
        """Load entire dataset into memory (use with caution for large datasets)"""
        all_rows = []
        for batch in self.load_dataset(dataset_type):
            all_rows.extend(batch)
        return all_rows
    
    def _clean_row(self, row: Dict, config: DatasetConfig) -> Dict:
        """Clean and validate a single row"""
        cleaned = {}
        
        for col in config.columns:
            value = row.get(col, "").strip()
            
            if col == config.date_column:
                # Parse date (expected format: DD-MM-YYYY)
                try:
                    cleaned[col] = datetime.strptime(value, "%d-%m-%Y")
                except ValueError:
                    try:
                        cleaned[col] = datetime.strptime(value, "%Y-%m-%d")
                    except ValueError:
                        cleaned[col] = None
            elif col in config.geo_columns:
                # Keep geographic columns as strings
                cleaned[col] = value
            else:
                # Numeric columns
                try:
                    cleaned[col] = int(value) if value else 0
                except ValueError:
                    cleaned[col] = 0
        
        return cleaned
    
    def get_date_range(self, dataset_type: str) -> tuple:
        """Get min and max dates in dataset"""
        min_date = None
        max_date = None
        
        for batch in self.load_dataset(dataset_type, chunk_size=50000):
            for row in batch:
                date = row.get("date")
                if date:
                    if min_date is None or date < min_date:
                        min_date = date
                    if max_date is None or date > max_date:
                        max_date = date
        
        return min_date, max_date
    
    def get_unique_values(self, dataset_type: str, column: str) -> set:
        """Get unique values for a column (useful for states/districts)"""
        values = set()
        for batch in self.load_dataset(dataset_type, chunk_size=50000):
            for row in batch:
                if column in row:
                    values.add(row[column])
        return values


def get_sample_data(loader: UIDAIDataLoader, sample_size: int = 1000) -> Dict:
    """Get sample data from all datasets for demo/testing"""
    sample = {}
    
    for dataset_type in DATASET_CONFIGS.keys():
        try:
            data = []
            for batch in loader.load_dataset(dataset_type, chunk_size=sample_size):
                data.extend(batch[:sample_size])
                if len(data) >= sample_size:
                    break
            sample[dataset_type] = data[:sample_size]
        except FileNotFoundError:
            print(f"Warning: {dataset_type} dataset not found")
            sample[dataset_type] = []
    
    return sample


if __name__ == "__main__":
    # Test the loader
    loader = UIDAIDataLoader(base_dir="..")
    
    print("Testing UIDAI Data Loader")
    print("=" * 50)
    
    for dataset_type in DATASET_CONFIGS.keys():
        try:
            files = loader.discover_files(dataset_type)
            print(f"\n{dataset_type.upper()}:")
            print(f"  Files found: {len(files)}")
            
            # Get first batch
            for batch in loader.load_dataset(dataset_type, chunk_size=5):
                print(f"  Sample row: {batch[0]}")
                break
                
        except FileNotFoundError as e:
            print(f"  Error: {e}")
