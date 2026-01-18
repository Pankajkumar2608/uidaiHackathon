export default function AssumptionsPage() {
    return (
        <div className="animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Assumptions & Limitations</h1>
                <p className="page-subtitle">
                    Methodology disclosure, data limitations, and compliance statement
                </p>
            </div>

            {/* Critical Compliance Notice */}
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-4">
                    <div className="text-4xl">⚠️</div>
                    <div>
                        <h2 className="text-xl font-bold text-red-700 mb-2">Critical Compliance Notice</h2>
                        <p className="text-red-700">
                            This platform uses <strong>aggregated, anonymized</strong> Aadhaar administrative data only.
                            <br /><br />
                            <strong>No individual tracking is performed. No PII is exposed or processed.</strong>
                            <br /><br />
                            All outputs are <strong>proxy-based indicators</strong> and do not represent exact migration flows,
                            population counts, or individual movements.
                        </p>
                    </div>
                </div>
            </div>

            {/* Data Sources */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">📊 Data Sources</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">1. Aadhaar Enrolment Data</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Aggregated new Aadhaar enrolments by date, state, district, and PIN code.
                            Includes age bucket breakdowns (0-5, 5-17, 18+).
                        </p>
                        <p className="text-xs text-gray-500">
                            Fields: date, state, district, pincode, age_0_5, age_5_17, age_18_greater
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">2. Aadhaar Demographic Updates</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Aggregated demographic update counts (address, name, DOB, mobile, etc.) by geography.
                            Used as a proxy for address change / settlement mobility.
                        </p>
                        <p className="text-xs text-gray-500">
                            Fields: date, state, district, pincode, demo_age_5_17, demo_age_17_
                        </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">3. Aadhaar Biometric Updates</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            Aggregated mandatory biometric update counts. UIDAI mandates updates at ages 5 and 15.
                            Used for MBU camp planning and operations.
                        </p>
                        <p className="text-xs text-gray-500">
                            Fields: date, state, district, pincode, bio_age_5_17, bio_age_17_
                        </p>
                    </div>
                </div>
            </div>

            {/* Methodology */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">🔬 Methodology</h2>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg mb-3">Migration Stress Index (MSI)</h3>
                        <div className="p-4 bg-blue-50 rounded-lg font-mono text-sm mb-3">
                            <code>MSI = Z(Address Update Rate) + Z(Adult Enrolment Growth) - Z(Enrolment Decline)</code>
                        </div>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            <li><strong>Address Update Rate:</strong> Demographic updates (17+) / Total regional enrolments</li>
                            <li><strong>Adult Enrolment Growth:</strong> Month-over-month change in 18+ enrolments</li>
                            <li><strong>Enrolment Decline:</strong> Negative total enrolment growth (indicates outflow proxy)</li>
                            <li><strong>Z-score:</strong> Standard normalization across all regions for comparability</li>
                        </ul>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                            <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                <div className="font-bold text-emerald-700">Stable</div>
                                <div className="text-emerald-600">MSI &lt; 1.0</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-lg text-center">
                                <div className="font-bold text-amber-700">Watch</div>
                                <div className="text-amber-600">1.0 ≤ MSI &lt; 2.0</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg text-center">
                                <div className="font-bold text-red-700">Critical</div>
                                <div className="text-red-600">MSI ≥ 2.0 (3+ consecutive periods)</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-3">Infrastructure Demand Proxies</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">🏫 School Demand Proxy</h4>
                                <code className="text-xs bg-white p-2 rounded block mb-2">
                                    growth(age_0_5 + age_5_17) + net_settlement_gain
                                </code>
                                <p className="text-xs text-gray-500">
                                    Identifies regions with growing child populations indicating potential need for school infrastructure.
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-2">🏠 Housing/Transport Proxy</h4>
                                <code className="text-xs bg-white p-2 rounded block mb-2">
                                    growth(age_18+) + address_update_intensity
                                </code>
                                <p className="text-xs text-gray-500">
                                    Tracks adult population growth and address changes for housing and transport planning.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-3">MBU Load Analysis</h3>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                Biometric update load is computed from the age 5-17 bucket (mandatory updates at 5 and 15).
                                Backlog signal compares current load against historical rolling average:
                            </p>
                            <code className="text-xs bg-white p-2 rounded block">
                                Backlog_Signal = (current_load / rolling_average) - 1
                            </code>
                        </div>
                    </div>
                </div>
            </div>

            {/* Limitations */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">⚠️ Key Limitations</h2>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className="text-amber-500 text-lg">1.</span>
                        <div>
                            <strong className="text-amber-700">Proxy Not Reality</strong>
                            <p className="text-sm text-amber-600">
                                Address updates are a PROXY for mobility. They do not confirm actual migration or permanent relocation.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className="text-amber-500 text-lg">2.</span>
                        <div>
                            <strong className="text-amber-700">No Origin-Destination Tracking</strong>
                            <p className="text-sm text-amber-600">
                                We cannot determine where people moved FROM. Only regional signals of change are available.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className="text-amber-500 text-lg">3.</span>
                        <div>
                            <strong className="text-amber-700">Aggregated Data Only</strong>
                            <p className="text-sm text-amber-600">
                                All data is pre-aggregated at PIN/district level. Individual-level patterns cannot be inferred.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className="text-amber-500 text-lg">4.</span>
                        <div>
                            <strong className="text-amber-700">Coverage Bias</strong>
                            <p className="text-sm text-amber-600">
                                Aadhaar penetration varies by region. Areas with lower Aadhaar coverage may show skewed signals.
                            </p>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                        <span className="text-amber-500 text-lg">5.</span>
                        <div>
                            <strong className="text-amber-700">Temporal Lag</strong>
                            <p className="text-sm text-amber-600">
                                Data reflects when updates were processed, which may lag actual events (e.g., delayed address updates after moving).
                            </p>
                        </div>
                    </li>
                </ul>
            </div>

            {/* Privacy Compliance */}
            <div className="card mb-6">
                <div className="card-header">
                    <h2 className="card-title">🔒 Privacy & Compliance</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 text-xl">✓</span>
                        <div>
                            <strong>No Individual Identification</strong>
                            <p className="text-sm text-gray-600">
                                All data is aggregated. No individual Aadhaar numbers, names, or identifiable information is used.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 text-xl">✓</span>
                        <div>
                            <strong>No Re-identification Risk</strong>
                            <p className="text-sm text-gray-600">
                                Minimum aggregation thresholds ensure no small-group identification is possible.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 text-xl">✓</span>
                        <div>
                            <strong>Official UIDAI Datasets</strong>
                            <p className="text-sm text-gray-600">
                                Data sourced from official UIDAI public APIs designed for aggregated analytics.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 text-xl">✓</span>
                        <div>
                            <strong>Transparent Methodology</strong>
                            <p className="text-sm text-gray-600">
                                All formulas and thresholds are documented and available for review.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Research Context */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">📚 Research Context</h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600">
                    <p>
                        This project is informed by international research on using administrative data for migration measurement:
                    </p>
                    <ul className="list-disc list-inside mt-3 space-y-2">
                        <li>
                            <strong>Higher-frequency proxies:</strong> Internal migration measurement benefits from administrative/big-data
                            sources compared to census/surveys conducted every 10 years.
                        </li>
                        <li>
                            <strong>International precedent:</strong> Countries like Norway, Sweden, and the Netherlands use
                            change-of-address registrations to estimate internal migration flows.
                        </li>
                        <li>
                            <strong>Early warning signals:</strong> The goal is to provide early indicators rather than
                            descriptive historical charts, enabling proactive policy response.
                        </li>
                    </ul>
                    <p className="mt-4 text-xs text-gray-500">
                        For questions about methodology or data interpretation, contact the research team.
                    </p>
                </div>
            </div>
        </div>
    );
}
