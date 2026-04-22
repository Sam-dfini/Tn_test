import asyncio
import json
from datetime import datetime
from .engine import TunisiaSimulator

async def main():
    # 1. Initialize Simulator
    simulator = TunisiaSimulator()
    
    # 2. Define current state (simulated signals)
    current_state = {
        "inflation": 0.85,
        "unemployment": 0.6,
        "social_unrest": 0.7,
        "political_stability": 0.3,
        "tourism_revenue": 0.4
    }
    
    print("--- TUNISIA SIMULATOR: CURRENT STATE ---")
    print(json.dumps(current_state, indent=2))
    
    # 3. Match Historical Analogs
    print("\n--- MATCHING HISTORICAL ANALOGS ---")
    analogs = simulator.match_historical_analogs(current_state)
    for a in analogs:
        print(f"Match: {a['event_name']} (Similarity: {a['similarity']})")
        print(f"  Description: {a['description']}")
    
    # 4. Generate Predictive Scenarios
    print("\n--- GENERATING PREDICTIVE SCENARIOS ---")
    scenarios = simulator.generate_scenarios(current_state, mission_id="example_mission_001")
    
    for s in scenarios:
        print(f"\nScenario: {s.name}")
        print(f"  Probability: {s.probability}")
        print(f"  Projected RRI (T+6): {s.projected_rri}")
        print(f"  Severity: {round(s.severity, 4)}")
        print(f"  Description: {s.description}")
        
        print("  Variable Contributions:")
        for var, impact in s.variable_contributions.items():
            print(f"    - {var}: {impact}")
            
        print("  Causal Chains Triggered:")
        for chain in s.causal_chains:
            print(f"    - {chain['cause']} -> {chain['effect']} (Strength: {chain['strength']})")

if __name__ == "__main__":
    asyncio.run(main())
