export interface BlackMarketInputs {
  // A. PriceGap
  real_market_price: number; 
  official_price: number;
  
  // B. AvailabilityGap
  shortage_report_intensity: number; // [0,1]
  empty_shelf_signals: number; // [0,1]
  queue_intensity: number; // [0,1]
  
  // C. Currency Distortion
  parallel_rate: number;
  official_rate: number;
  currency_distortion_velocity?: number; // delta over 3 days
  
  // D. Informal Signal
  social_media_mentions: number; // [0,1] normalized
  keyword_spikes: number; // [0,1]
  enforcement_events: number; // [0,1] based on police/customs hits
  
  previous_bmi_7d?: number; // for velocity
}

export interface BlackMarketResult {
  BMI: number; // [0,1]
  level: "NORMAL" | "EMERGING" | "ACTIVE" | "BREAKDOWN";
  velocity: number;
  price_gaps: Record<string, number>;
  currency_distortion: number;
  informal_signals: string[];
  rapid_distortion_alert: boolean;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function computeBlackMarketIntel(inputs: BlackMarketInputs): BlackMarketResult {
  // A. PriceGap
  const price_gap = clamp01(
    inputs.official_price > 0 
      ? (inputs.real_market_price - inputs.official_price) / inputs.official_price 
      : 0
  );

  // B. AvailabilityGap
  const availability_gap = clamp01(
    inputs.shortage_report_intensity * 0.4 +
    inputs.empty_shelf_signals * 0.3 +
    inputs.queue_intensity * 0.3
  );

  // C. CurrencyDistortion
  const currency_distortion = clamp01(
    inputs.official_rate > 0 
      ? (inputs.parallel_rate - inputs.official_rate) / inputs.official_rate 
      : 0
  );

  // D. InformalSignal
  const informal_signal = clamp01(
    inputs.social_media_mentions * 0.4 +
    inputs.keyword_spikes * 0.3 +
    inputs.enforcement_events * 0.3
  );

  // Core Equation
  const BMI = clamp01(
    0.35 * price_gap +
    0.25 * availability_gap +
    0.20 * currency_distortion +
    0.20 * informal_signal
  );

  // Thresholds
  let level: BlackMarketResult['level'] = "NORMAL";
  if (BMI > 0.7) level = "BREAKDOWN";
  else if (BMI > 0.5) level = "ACTIVE";
  else if (BMI > 0.3) level = "EMERGING";

  const velocity = inputs.previous_bmi_7d !== undefined ? BMI - inputs.previous_bmi_7d : 0;
  const rapid_distortion_alert = velocity > 0.2 || (inputs.currency_distortion_velocity ?? 0) > 0.1;

  const informal_signals: string[] = [];
  if (inputs.keyword_spikes > 0.6) informal_signals.push("High keyword spikes (e.g. 'prix ytir', 'mafama chay')");
  if (availability_gap > 0.6) informal_signals.push("High scarcity reports/empty shelves");

  return {
    BMI: parseFloat(BMI.toFixed(4)),
    level,
    velocity: parseFloat(velocity.toFixed(4)),
    price_gaps: { "tracked_commodity": parseFloat(price_gap.toFixed(4)) },
    currency_distortion: parseFloat(currency_distortion.toFixed(4)),
    informal_signals,
    rapid_distortion_alert
  };
}
