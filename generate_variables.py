import json

categories = {
    "A": ("Economic", 1, 25),
    "B": ("Environmental", 26, 50),
    "C": ("Digital & Tech", 51, 65),
    "D": ("Political", 66, 80),
    "E": ("Social", 81, 95),
    "F": ("Socio-Cultural", 96, 110),
    "G": ("Legal & Structural", 111, 125),
    "H": ("Energy Security", 126, 140),
    "I": ("Infrastructure", 141, 155),
    "J": ("War & External", 156, 170),
    "K": ("Institutional", 171, 185),
    "L": ("Regime Characteristics", 186, 200),
    "M": ("Opposition Dynamics", 201, 215),
    "N": ("Security Apparatus", 216, 230),
    "O": ("Demographic", 231, 245),
    "X": ("Future-Oriented", 246, 250)
}

variables = []

# Specific names for some variables as requested or inferred
specific_names = {
    1: ("GDP_growth_rate", "economy.gdp_growth", ["GDP", "growth", "economy"]),
    2: ("Inflation_rate", "economy.inflation", ["inflation", "CPI"]),
    3: ("Unemployment_rate", "economy.unemployment", ["unemployment", "jobs"]),
    26: ("Water_stress", "environment.water_stress", ["water", "scarcity"]),
    27: ("Air_pollution_index", "environment.air_pollution", ["air", "pollution"]),
    51: ("Internet_penetration", "digital.internet_penetration", ["internet", "digital", "penetration"]),
    52: ("Mobile_subscriptions", "digital.mobile_subs", ["mobile", "telecom"]),
    66: ("Regime_approval_rating", "political.approval", ["regime", "approval"]),
    246: ("Innovation_index", "future.innovation", ["innovation", "R&D"]),
    247: ("Climate_adaptation_score", "future.climate_adaptation", ["climate", "adaptation"]),
    248: ("Youth_tech_engagement", "future.youth_tech", ["youth", "tech", "engagement"]),
    249: ("Global_influence_index", "future.global_influence", ["global", "influence"]),
    250: ("Emerging_risk_score", "future.emerging_risk", ["emerging", "risk"])
}

for code, (cat_name, start, end) in categories.items():
    for i in range(start, end + 1):
        if i in specific_names:
            name, p_field, keywords = specific_names[i]
        else:
            name = f"{cat_name.replace(' ', '_')}_Var_{i}"
            p_field = f"{code.lower()}_{i}.value"
            keywords = [cat_name.lower(), f"var_{i}"]
            
        variables.append({
            "code": code,
            "number": i,
            "name": name,
            "value_2026": 0,
            "weight": 0,
            "pipeline_field": p_field,
            "keywords": keywords,
            "history": [],
            "volatility": 0,
            "threshold": 0
        })

output = {"variables": variables}
from pathlib import Path
output_path = Path(__file__).parent / "backend" / "app" / "data" / "rri_variables.json"
output_path.parent.mkdir(parents=True, exist_ok=True)
with open(output_path, "w") as f:
    json.dump(output, f, indent=2)
