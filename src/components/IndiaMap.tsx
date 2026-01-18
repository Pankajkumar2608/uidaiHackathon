'use client';

import React, { useState } from 'react';
import { MSIData, parseRegionKey } from '@/lib/data';

interface IndiaMapProps {
    data: MSIData[];
    onRegionSelect?: (stateName: string) => void;
    selectedState?: string;
}

// Simplified paths for major states - purely illustrative for the hackathon demo
// In a real production app, we would use TopoJSON with d3-geo or react-simple-maps
const STATE_PATHS: Record<string, string> = {
    'Jammu & Kashmir': 'M 180,20 L 220,30 L 240,60 L 200,80 L 160,60 Z',
    'Himachal Pradesh': 'M 200,80 L 230,90 L 220,110 L 190,100 Z',
    'Punjab': 'M 160,80 L 190,90 L 180,120 L 150,110 Z',
    'Uttarakhand': 'M 230,90 L 260,100 L 250,120 L 220,110 Z',
    'Haryana': 'M 180,110 L 210,110 L 200,130 L 170,130 Z',
    'Rajasthan': 'M 100,130 L 170,130 L 180,180 L 160,220 L 90,200 Z',
    'Uttar Pradesh': 'M 210,110 L 280,130 L 290,180 L 220,170 Z',
    'Bihar': 'M 290,150 L 330,150 L 330,180 L 290,180 Z',
    'West Bengal': 'M 330,160 L 350,160 L 340,220 L 320,210 Z',
    'Gujarat': 'M 50,180 L 100,180 L 110,230 L 60,240 Z',
    'Madhya Pradesh': 'M 160,180 L 240,180 L 230,240 L 150,240 Z',
    'Maharashtra': 'M 80,240 L 180,240 L 190,320 L 90,310 Z',
    'Andhra Pradesh': 'M 160,320 L 220,320 L 210,400 L 170,390 Z',
    'Karnataka': 'M 100,320 L 160,320 L 150,410 L 90,400 Z',
    'Kerala': 'M 110,410 L 140,410 L 130,480 L 120,470 Z',
    'Tamil Nadu': 'M 140,410 L 190,400 L 180,480 L 140,480 Z',
    'Telangana': 'M 160,300 L 200,300 L 200,340 L 160,340 Z',
    'Odisha': 'M 250,230 L 300,230 L 290,290 L 240,280 Z',
    'Chhattisgarh': 'M 220,220 L 250,220 L 240,280 L 210,280 Z',
    'Jharkhand': 'M 250,180 L 290,180 L 280,220 L 240,220 Z',
    'Assam': 'M 360,130 L 410,130 L 400,160 L 350,160 Z',
    // Add simplified bounding boxes for others/Islands
    'Others': 'M 360,170 L 380,170 L 380,190 L 360,190 Z'
};

const getStatusColor = (msiScore?: number) => {
    if (msiScore === undefined) return '#e5e7eb'; // Gray-200
    if (msiScore >= 2.0) return '#fca5a5'; // Red-300
    if (msiScore >= 1.0) return '#fcd34d'; // Amber-300
    return '#6ee7b7'; // Emerald-300
};

export default function IndiaMap({ data, onRegionSelect, selectedState }: IndiaMapProps) {
    // Aggregate MSI by state
    const stateScores: Record<string, { total: number; count: number }> = {};

    data.forEach(item => {
        const { state } = parseRegionKey(item.region_key);
        if (!stateScores[state]) {
            stateScores[state] = { total: 0, count: 0 };
        }
        stateScores[state].total += item.msi_score;
        stateScores[state].count += 1;
    });

    const getStateAvg = (state: string) => {
        const s = stateScores[state];
        return s ? s.total / s.count : undefined;
    };

    return (
        <div className="w-full aspect-[4/5] relative bg-white rounded-lg overflow-hidden">
            <svg
                viewBox="0 0 500 550"
                className="w-full h-full drop-shadow-sm"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }}
            >
                <title>Interactive Map of India (Simplified)</title>

                {/* Background/Water */}
                <path d="M0,0 H500 V550 H0 Z" fill="#f8fafc" />

                {Object.entries(STATE_PATHS).map(([stateName, path]) => {
                    const avgScore = getStateAvg(stateName);
                    const color = getStatusColor(avgScore);
                    const isSelected = selectedState === stateName;

                    return (
                        <g key={stateName} onClick={() => onRegionSelect?.(stateName)}>
                            <path
                                d={path}
                                fill={color}
                                stroke={isSelected ? '#2563eb' : '#ffffff'}
                                strokeWidth={isSelected ? 2 : 1}
                                className="cursor-pointer hover:opacity-80 transition-all duration-200"
                                style={{ outline: 'none' }}
                            />
                            {/* Simplified Label Center */}
                            {/* In a real map, we'd calculate centroids */}
                        </g>
                    );
                })}

                {/* Legend */}
                <g transform="translate(20, 480)">
                    <rect width="120" height="60" rx="4" fill="white" stroke="#e5e7eb" />
                    <text x="10" y="20" fontSize="10" fontWeight="bold">MSI Status</text>

                    <rect x="10" y="30" width="10" height="10" fill="#fca5a5" />
                    <text x="25" y="38" fontSize="8">Critical (&ge;2.0)</text>

                    <rect x="70" y="30" width="10" height="10" fill="#fcd34d" />
                    <text x="85" y="38" fontSize="8">Watch</text>

                    <rect x="10" y="45" width="10" height="10" fill="#6ee7b7" />
                    <text x="25" y="53" fontSize="8">Stable (&lt;1.0)</text>
                </g>
            </svg>

            {/* Hover Info Tooltip (Simplified via absolute positioning if needed, or just let SVG title handle it) */}
        </div>
    );
}
