# UIDAI Mobility & Settlement Intelligence Platform

A proxy-based analytics platform for detecting settlement patterns and migration stress indicators using aggregated Aadhaar administrative data.

> ⚠️ **Privacy Compliance**: This platform uses only aggregated, anonymized data. No individual tracking. All outputs are labeled as proxy-based indicators.

## Features

- **Migration Stress Index (MSI)**: Multi-factor index to identify regions experiencing settlement instability
- **Infrastructure Demand Signals**: Proxy-based indicators for school, housing, and transport planning
- **MBU Operations Planner**: Mandatory Biometric Update camp planning and throughput tracking
- **Actionable Insights Engine**: Auto-generated policy recommendations per state

## Tech Stack

- **Frontend**: Next.js 16 + Tailwind CSS 4
- **Charts**: Recharts
- **Maps**: SVG India map with state/district drilldowns
- **Data Pipeline**: Python scripts for CSV processing

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Data Pipeline

Python scripts in `/scripts` folder:
- `data_loader.py` - Load and merge CSV datasets
- `data_processor.py` - Clean, aggregate, and compute metrics
- `metrics.py` - MSI and demand proxy calculations

```bash
cd scripts
python data_processor.py
```

## Project Structure

```
├── scripts/              # Python data processing
├── src/
│   ├── app/             # Next.js app router pages
│   │   ├── mobility/    # MSI Map
│   │   ├── demographics/
│   │   ├── mbu-planner/
│   │   ├── insights/
│   │   └── assumptions/
│   ├── components/      # Reusable UI components
│   └── lib/             # Utilities and data
└── public/
    └── data/            # Processed JSON data
```

## Compliance & Limitations

- All data is aggregated at PIN/district level
- No individual tracking or PII exposure
- Outputs are proxy-based signals, not exact migration flows
- See `/assumptions` page for full methodology disclosure

## License

This project is for UIDAI Data Hackathon 2026.
