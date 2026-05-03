export interface FoodPriceInputs {
  product: string;
  base_price: number;
  delay_weeks: number; // Δ

  // Supply Shock
  production_drop: number; // [0,1]
  seasonal_factor: number; // [0,1]
  stock_depletion: number; // [0,1]

  // Cost Pressure
  feed_cost: number; // [0,1] -> from ProteinIntel
  fuel_price: number; // [0,1]
  global_price: number; // raw value or normalized
  exchange_rate: number; // standard to parallel impact

  // Market Distortion (BMDM)
  BMI: number; // [0,1]
  availability_gap: number; // [0,1]

  // Behavioral Pressure
  panic_buying: number; // [0,1]
  hoarding: number; // [0,1]
  expectation_inflation: number; // [0,1]
}

export interface FoodPriceResult {
  product: string;
  current_price: number;
  predicted_price_2w: number;
  predicted_price_4w: number;
  predicted_price_8w: number;
  volatility: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  contributing_factors: string[];
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeFoodPrice(inputs: FoodPriceInputs): FoodPriceResult {
  // A. SupplyShock
  const supply_shock = clamp01(
    0.5 * inputs.production_drop +
    0.3 * inputs.seasonal_factor +
    0.2 * inputs.stock_depletion
  );

  // B. CostPressure
  const import_cost = clamp01(inputs.global_price * inputs.exchange_rate * 0.01); // simplified norm
  const cost_pressure = clamp01(
    0.4 * inputs.feed_cost +
    0.3 * inputs.fuel_price +
    0.3 * import_cost
  );

  // C. MarketDistortion
  const market_distortion = clamp01(
    0.6 * inputs.BMI +
    0.4 * inputs.availability_gap
  );

  // D. BehavioralPressure
  const behavioral_pressure = clamp01(
    0.5 * inputs.panic_buying +
    0.3 * inputs.hoarding +
    0.2 * inputs.expectation_inflation
  );

  // Master Equation: FPF(t+Δ) = BasePrice × (1 + SupplyShock + CostPressure + MarketDistortion + BehavioralPressure)
  const computePriceMultiplier = (weeksOut: number) => {
    // scale effect based on delay_weeks (Δ). If product reacts in 2 weeks, impact hits faster.
    const timeRatio = Math.min(1, weeksOut / inputs.delay_weeks);
    return 1 + timeRatio * (supply_shock * 0.3 + cost_pressure * 0.3 + market_distortion * 0.2 + behavioral_pressure * 0.2);
  };

  const predicted_price_2w = inputs.base_price * computePriceMultiplier(2);
  const predicted_price_4w = inputs.base_price * computePriceMultiplier(4);
  const predicted_price_8w = inputs.base_price * computePriceMultiplier(8);

  const max_increase = (predicted_price_8w - inputs.base_price) / inputs.base_price;

  let risk_level: FoodPriceResult['risk_level'] = "LOW";
  if (max_increase > 0.4) risk_level = "CRITICAL";
  else if (max_increase > 0.2) risk_level = "HIGH";
  else if (max_increase > 0.1) risk_level = "MEDIUM";

  const contributing_factors: string[] = [];
  if (supply_shock > 0.5) contributing_factors.push("Supply Shock");
  if (cost_pressure > 0.5) contributing_factors.push("Cost Pressure");
  if (market_distortion > 0.5) contributing_factors.push("Market Distortion");
  if (behavioral_pressure > 0.5) contributing_factors.push("Behavioral Pressure");

  const volatility = clamp01((supply_shock + market_distortion + behavioral_pressure) / 3);

  return {
    product: inputs.product,
    current_price: parseFloat(inputs.base_price.toFixed(3)),
    predicted_price_2w: parseFloat(predicted_price_2w.toFixed(3)),
    predicted_price_4w: parseFloat(predicted_price_4w.toFixed(3)),
    predicted_price_8w: parseFloat(predicted_price_8w.toFixed(3)),
    volatility: parseFloat(volatility.toFixed(4)),
    risk_level,
    confidence: 0.85, // mockup
    contributing_factors
  };
}
