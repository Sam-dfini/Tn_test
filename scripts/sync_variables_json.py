#!/usr/bin/env python3
"""Convert frontend rri_variables.json (with real values) to backend format.

Reads src/data/rri_variables.json (251 variables, real values, weights, thresholds)
and writes backend/app/data/rri_variables.json with the same data + label fields.
"""
import json
from pathlib import Path

FRONTEND = Path(__file__).parent.parent / "src" / "data" / "rri_variables.json"
BACKEND = Path(__file__).parent.parent / "backend" / "app" / "data" / "rri_variables.json"

def name_to_label(name: str) -> str:
    """GDP_growth_rate -> GDP growth rate"""
    return name.replace("_", " ")

def main():
    with open(FRONTEND) as f:
        data = json.load(f)

    variables = data.get("variables", [])
    print(f"Read {len(variables)} variables from frontend JSON")

    out_vars = []
    for v in variables:
        label = v.get("label") or name_to_label(v.get("name", ""))
        out_vars.append({
            "code": v.get("code", ""),
            "number": v.get("number", 0),
            "name": v.get("name", ""),
            "label": label,
            "value_2026": v.get("value_2026", 0),
            "weight": v.get("weight", 0.05),
            "pipeline_field": v.get("pipeline_field", ""),
            "keywords": v.get("keywords", []),
            "history": v.get("history", []),
            "volatility": v.get("volatility", 0.1),
            "threshold": v.get("threshold", None),
        })

    out = {"variables": out_vars}
    with open(BACKEND, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(out_vars)} variables to backend JSON ({BACKEND})")
    print("Done! Backend will now seed real variable values into Supabase.")

if __name__ == "__main__":
    main()
