export interface ImportDependencyInputs {
  imported_food_value: number; // e.g. in billions TND
  total_food_consumption: number; // e.g. in billions TND
  global_price_volatility: number; // [0,1] index based on FAO
  currency_distortion: number; // [0,1] from BMDM
  wheat_import_ratio?: number; // specific to wheat, default 0.6
}

export interface ImportDependencyResult {
  national_level: boolean;
  import_dependency_ratio: number;
  supply_risk_score: number;
  wheat_import_dependency: number;
  top_risk_commodities: string[];
}

/**
 * clamp01
 * Helper to ensure a value stays between 0 and 1
 */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeImportDependency(inputs: ImportDependencyInputs): ImportDependencyResult {
  const import_dependency_ratio = clamp01(
    inputs.total_food_consumption > 0 
      ? inputs.imported_food_value / inputs.total_food_consumption 
      : 0.5
  );

  const supply_risk_score = clamp01(
    import_dependency_ratio * 0.4 +
    inputs.global_price_volatility * 0.3 +
    inputs.currency_distortion * 0.3
  );

  const wheat_import_dependency = clamp01(inputs.wheat_import_ratio ?? 0.6);

  const top_risk_commodities: string[] = [];
  if (wheat_import_dependency > 0.5) top_risk_commodities.push('wheat');
  if (inputs.global_price_volatility > 0.6) {
    top_risk_commodities.push('soy', 'corn'); // common highly volatile imports
  }

  return {
    national_level: true,
    import_dependency_ratio: parseFloat(import_dependency_ratio.toFixed(4)),
    supply_risk_score: parseFloat(supply_risk_score.toFixed(4)),
    wheat_import_dependency: parseFloat(wheat_import_dependency.toFixed(4)),
    top_risk_commodities,
  };
}
