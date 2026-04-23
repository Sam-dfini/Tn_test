export interface ProteinIntelInputs {
  // Feed components
  barley_price_index: number; // [0,1] Normalized against 5-year baseline
  corn_price_index: number;
  soy_price_index: number;
  local_fodder_availability: number; // [0,1]
  
  // Livestock specific
  pasture_NDVI: number;
  historical_pasture_NDVI: number;
  
  // Poultry specific
  energy_price_stress: number; // [0,1]
  disease_outbreak_risk: number; // [0,1]
  
  // Fish specific
  fuel_cost_pressure: number; // [0,1]
  current_catch: number;
  historical_average_catch: number;

  import_dependency_multiplier?: number; // default 1.0
}

export interface ProteinIntelResult {
  feed_stress_index: number;
  livestock_stress: number;
  poultry_stress: number;
  fish_supply_stress: number;
  protein_stress: number;
  protein_inflation_risk: number;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeProteinIntel(inputs: ProteinIntelInputs): ProteinIntelResult {
  // A. FeedStress
  const feed_stress_index = clamp01(
    0.3 * inputs.barley_price_index +
    0.3 * inputs.corn_price_index +
    0.2 * inputs.soy_price_index +
    0.2 * (1 - inputs.local_fodder_availability)
  );

  // B. LivestockStress
  const grazing_stress = clamp01(
    1 - (inputs.historical_pasture_NDVI > 0 
      ? inputs.pasture_NDVI / inputs.historical_pasture_NDVI 
      : 1)
  );
  const livestock_stress = clamp01(
    feed_stress_index * 0.6 +
    grazing_stress * 0.4
  );

  // C. PoultryStress (Most Sensitive)
  const production_disruption = clamp01(
    inputs.energy_price_stress * 0.5 + 
    inputs.disease_outbreak_risk * 0.5
  );
  const poultry_stress = clamp01(
    feed_stress_index * 0.7 +
    production_disruption * 0.3
  );

  // D. FishStress
  const catch_decline = clamp01(
    1 - (inputs.historical_average_catch > 0 
      ? inputs.current_catch / inputs.historical_average_catch 
      : 1)
  );
  const fish_supply_stress = clamp01(
    inputs.fuel_cost_pressure * 0.5 +
    catch_decline * 0.5
  );

  // E. Aggregation
  const protein_stress = clamp01(
    0.4 * poultry_stress +
    0.35 * livestock_stress +
    0.25 * fish_supply_stress
  );

  const import_multiplier = inputs.import_dependency_multiplier ?? 1.2;
  const protein_inflation_risk = clamp01(protein_stress * import_multiplier);

  return {
    feed_stress_index: parseFloat(feed_stress_index.toFixed(4)),
    livestock_stress: parseFloat(livestock_stress.toFixed(4)),
    poultry_stress: parseFloat(poultry_stress.toFixed(4)),
    fish_supply_stress: parseFloat(fish_supply_stress.toFixed(4)),
    protein_stress: parseFloat(protein_stress.toFixed(4)),
    protein_inflation_risk: parseFloat(protein_inflation_risk.toFixed(4))
  };
}
