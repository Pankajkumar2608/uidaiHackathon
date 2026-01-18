
import time
import os
import subprocess
from pathlib import Path
from datetime import datetime

WATCH_DIRS = [
    "api_data_aadhar_enrolment",
    "api_data_aadhar_demographic",
    "api_data_aadhar_biometric"
]

def get_latest_mtime(base_path):
    """Get the latest modification time of any CSV in the watched directories."""
    latest = 0
    for d in WATCH_DIRS:
        # Check both flat and nested structures
        paths = [
            base_path / d,
            base_path / d / d
        ]
        
        for p in paths:
            if p.exists():
                for f in p.rglob("*.csv"):
                    try:
                        mtime = f.stat().st_mtime
                        if mtime > latest:
                            latest = mtime
                    except OSError:
                        pass
    return latest

def main():
    base_path = Path(".")
    print(f"[{datetime.now().strftime('%H:%M:%S')}] starting Auto-Pipeline Watcher...")
    print(f"Watching directories: {', '.join(WATCH_DIRS)}")
    
    last_mtime = get_latest_mtime(base_path)
    
    try:
        while True:
            time.sleep(10) # Check every 10 seconds
            current_mtime = get_latest_mtime(base_path)
            
            if current_mtime > last_mtime:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] New data detected! Triggering processor...")
                
                # Run the processor
                start_time = time.time()
                result = subprocess.run(
                    ["python", "scripts/data_processor.py"], 
                    cwd=base_path,
                    capture_output=False # Let it print to console
                )
                
                duration = time.time() - start_time
                
                if result.returncode == 0:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing complete ({duration:.1f}s). Dashboard updated.")
                    last_mtime = current_mtime
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Processing FAILED.")
                    # Don't update last_mtime so we retry on next change or if we restart
            
    except KeyboardInterrupt:
        print("\nWatcher stopped.")

if __name__ == "__main__":
    main()
