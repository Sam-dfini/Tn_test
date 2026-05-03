export interface SectorBreakdown {
  textile: number;
  mechanical: number;
  agro_food: number;
  phosphate: number;
  chemicals: number;
  construction: number;
  other: number;
}

export interface IndustrialGovernorateData {
  governorate: string;
  industrial_density: number;
  employment_rate: number;
  sector_breakdown: SectorBreakdown;
  energy_cost_index: number;
  logistics_performance: number;
  strike_frequency: number;
  closure_rate: number;
  fdi_inflow: number;
  export_volume_index: number;
  timestamp: number;
}

export interface PhosphateData {
  production_volume: number;
  production_trend: number;
  protest_frequency: number;
  environmental_cost_index: number;
  state_revenue_impact: number;
  global_price_index: number;
  timestamp: number;
}

export interface StartupHealthData {
  funding_volume: number;
  survival_rate_24m: number;
  new_registrations: number;
  fintech_transaction_volume: number;
  brain_drain_proxy: number;
  timestamp: number;
}

export interface EnergyStressData {
  cost_per_kwh: number;
  supply_stability: number;
  fuel_import_dependency: number;
  outage_frequency: number;
  timestamp: number;
}

export interface IndustrialStressOutput {
  governorate: string;
  industrial_stress_index: number;
  employment_risk: number;
  export_vulnerability: number;
  sector_concentration_risk: number;
  energy_stress: number;
  phosphate_risk: number | null;
  startup_health: number;
  risk_flag: "STABLE" | "ELEVATED" | "HIGH" | "CRITICAL";
  contributing_factors: string[];
  timestamp: number;
}

export interface NationalIndustrialOutput {
  national_stress_index: number;
  governorate_breakdown: IndustrialStressOutput[];
  phosphate_national_risk: number;
  startup_national_health: number;
  energy_national_stress: number;
  top_risk_governorates: string[];
  timestamp: number;
}

// --- Utilities ---
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const val = (value - min) / (max - min);
  return Math.max(0, Math.min(1, val));
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function safeValue(value: number | undefined | null, fallback: number): number {
  if (value === undefined || value === null || Number.isNaN(value)) return fallback;
  return value;
}

// --- Module 1: SectorMonitor ---
export const SectorMonitor = {
  computeConcentrationRisk(breakdown: SectorBreakdown): number {
    const hhi = Math.pow(breakdown.textile, 2) + Math.pow(breakdown.mechanical, 2) + Math.pow(breakdown.agro_food, 2) + 
                Math.pow(breakdown.phosphate, 2) + Math.pow(breakdown.chemicals, 2) + Math.pow(breakdown.construction, 2) + 
                Math.pow(breakdown.other, 2);
    return normalize(hhi, 0.14, 1.0);
  },
  
  getDominantSector(breakdown: SectorBreakdown): { sector: string, vulnerability: number } {
    let max = 0;
    let dominant = "other";
    for (const [s, v] of Object.entries(breakdown)) {
      if (v > max) { max = v; dominant = s; }
    }
    const vulnerabilities: Record<string, number> = {
      textile: 0.7, mechanical: 0.6, agro_food: 0.5, phosphate: 0.9, chemicals: 0.6, construction: 0.4, other: 0.3
    };
    return { sector: dominant, vulnerability: vulnerabilities[dominant] || 0.3 };
  }
};

// --- Module 3: PhosphateIntel ---
export const PhosphateIntel = {
  computeRisk(data: PhosphateData | null): number | null {
    if (!data) return null;
    const production_risk = clamp01(data.production_volume * 0.3 + Math.abs(data.production_trend) * 0.2);
    const social_risk = clamp01(data.protest_frequency * 0.2 + data.environmental_cost_index * 0.1);
    const economic_risk = clamp01(data.state_revenue_impact * 0.1 + (1 - data.global_price_index) * 0.1);
    return clamp01(production_risk + social_risk + economic_risk);
  }
};

// --- Module 4: StartupHealthIndex ---
export const StartupHealthIndex = {
  computeHealth(data: StartupHealthData): number {
    const health = clamp01(
      data.funding_volume * 0.25 + 
      data.survival_rate_24m * 0.25 + 
      data.new_registrations * 0.2 + 
      data.fintech_transaction_volume * 0.15 + 
      (1 - data.brain_drain_proxy) * 0.15
    );
    return health;
  }
};

// --- Module 5: EnergyStress ---
export const EnergyStress = {
  computeStress(data: EnergyStressData) {
    const stress = clamp01(
      data.cost_per_kwh * 0.35 + 
      (1 - data.supply_stability) * 0.3 + 
      data.fuel_import_dependency * 0.2 + 
      data.outage_frequency * 0.15
    );
    const cross_sector_impact = clamp01(stress * (1 + data.fuel_import_dependency * 0.5));
    return {
      stress_index: stress,
      cost_pressure: data.cost_per_kwh,
      supply_risk: 1 - data.supply_stability,
      cross_sector_impact
    };
  }
};

// --- Module 6: IndustrialSystemEngine ---
export const IndustrialSystemEngine = {
  computeGovernorateStress(
    data: IndustrialGovernorateData,
    phosphateData: PhosphateData | null,
    startupData: StartupHealthData,
    energyData: EnergyStressData
  ): IndustrialStressOutput {
    
    const concentration_risk = SectorMonitor.computeConcentrationRisk(data.sector_breakdown);
    const energy = EnergyStress.computeStress(energyData);
    const phosphate_risk = (data.governorate.toLowerCase() === 'gafsa' || data.governorate.toLowerCase() === 'gabès') 
                            ? PhosphateIntel.computeRisk(phosphateData) 
                            : null;
    
    // employment_risk = 1 - employment_rate; assume we have something mapped
    const employment_risk = clamp01(1 - data.employment_rate);
    const export_vulnerability = clamp01(1 - data.export_volume_index);

    let stress_sum = employment_risk * 0.25 + 
                     export_vulnerability * 0.20 + 
                     concentration_risk * 0.15 + 
                     energy.stress_index * 0.15 + 
                     data.closure_rate * 0.10 + 
                     data.strike_frequency * 0.10;
                     
    if (phosphate_risk !== null) {
      stress_sum += phosphate_risk * 0.05;
    }
    
    const industrial_stress_index = clamp01(stress_sum);
    
    let risk_flag: IndustrialStressOutput['risk_flag'] = "STABLE";
    if (industrial_stress_index > 0.75) risk_flag = "CRITICAL";
    else if (industrial_stress_index > 0.55) risk_flag = "HIGH";
    else if (industrial_stress_index > 0.35) risk_flag = "ELEVATED";

    const factors: string[] = [];
    if (employment_risk > 0.6) factors.push("high_unemployment");
    if (export_vulnerability > 0.6) factors.push("export_decline");
    if (concentration_risk > 0.6) factors.push("sector_concentration");
    if (energy.stress_index > 0.6) factors.push("energy_stress");
    if (data.closure_rate > 0.5) factors.push("business_closures");
    if (data.strike_frequency > 0.5) factors.push("labor_unrest");
    if (phosphate_risk && phosphate_risk > 0.5) factors.push("phosphate_crisis");
    
    const startup_health = StartupHealthIndex.computeHealth(startupData);
    if (startup_health < 0.3) factors.push("startup_ecosystem_fragile");
    
    return {
      governorate: data.governorate,
      industrial_stress_index: parseFloat(industrial_stress_index.toFixed(4)),
      employment_risk: parseFloat(employment_risk.toFixed(4)),
      export_vulnerability: parseFloat(export_vulnerability.toFixed(4)),
      sector_concentration_risk: parseFloat(concentration_risk.toFixed(4)),
      energy_stress: parseFloat(energy.stress_index.toFixed(4)),
      phosphate_risk: phosphate_risk !== null ? parseFloat(phosphate_risk.toFixed(4)) : null,
      startup_health: parseFloat(startup_health.toFixed(4)),
      risk_flag,
      contributing_factors: factors,
      timestamp: Date.now()
    };
  },

  computeNationalStress(
    governorates: IndustrialStressOutput[],
    phosphateData: PhosphateData | null,
    startupData: StartupHealthData,
    energyData: EnergyStressData
  ): NationalIndustrialOutput {
    const avgGovStress = governorates.reduce((acc, g) => acc + g.industrial_stress_index, 0) / Math.max(1, governorates.length);
    const phosphateNatRisk = PhosphateIntel.computeRisk(phosphateData) ?? 0;
    const startupNatHealth = StartupHealthIndex.computeHealth(startupData);
    const energyNatStress = EnergyStress.computeStress(energyData).stress_index;

    const natStress = clamp01(
      avgGovStress * 0.50 +
      phosphateNatRisk * 0.20 +
      (1 - startupNatHealth) * 0.15 +
      energyNatStress * 0.15
    );

    const sortedGovs = [...governorates].sort((a,b) => b.industrial_stress_index - a.industrial_stress_index);
    const top_risk = sortedGovs.slice(0, 3).map(g => g.governorate);

    return {
      national_stress_index: parseFloat(natStress.toFixed(4)),
      governorate_breakdown: governorates,
      phosphate_national_risk: parseFloat(phosphateNatRisk.toFixed(4)),
      startup_national_health: parseFloat(startupNatHealth.toFixed(4)),
      energy_national_stress: parseFloat(energyNatStress.toFixed(4)),
      top_risk_governorates: top_risk,
      timestamp: Date.now()
    };
  }
};

export const IndustrialRRIIntegration = {
  checkShockConditions(
    nationalData: NationalIndustrialOutput,
    agroStress: number,
    bmi: number
  ) {
    let epsilon = 0;
    let reasons: string[] = [];

    const closureCount = nationalData.governorate_breakdown.filter(g => g.contributing_factors.includes("business_closures")).length;
    
    if (nationalData.national_stress_index > 0.6 && agroStress > 0.6 && bmi > 0.5) {
      epsilon += 0.8;
      reasons.push("triple_stress_industrial_agro_bmi");
    } else if (nationalData.national_stress_index > 0.6 && agroStress > 0.6) {
      epsilon += 0.6;
      reasons.push("industrial_agricultural_simultaneous_stress");
    }

    if (nationalData.phosphate_national_risk > 0.75) {
      epsilon += 0.4;
      reasons.push("phosphate_sector_collapse");
    }

    if (closureCount >= 3) {
      epsilon += 0.35;
      reasons.push("widespread_business_closures");
    }

    if (nationalData.energy_national_stress > 0.7) {
      epsilon += 0.3;
      reasons.push("cross_sector_energy_crisis");
    }

    return {
      shock: epsilon > 0,
      magnitude: epsilon,
      reasons
    };
  }
};

// --- Mock Data ---
export const mockGovernorateData: IndustrialGovernorateData[] = [
  {
    governorate: "Sfax", industrial_density: 0.75, employment_rate: 0.62,
    sector_breakdown: { textile: 0.4, mechanical: 0.25, agro_food: 0.15, phosphate: 0, chemicals: 0.05, construction: 0.1, other: 0.05 },
    energy_cost_index: 0.65, logistics_performance: 0.7, strike_frequency: 0.2, closure_rate: 0.35, fdi_inflow: 0.55, export_volume_index: 0.6, timestamp: Date.now()
  },
  {
    governorate: "Gafsa", industrial_density: 0.25, employment_rate: 0.35,
    sector_breakdown: { textile: 0.05, mechanical: 0.05, agro_food: 0.1, phosphate: 0.65, chemicals: 0.05, construction: 0.05, other: 0.05 },
    energy_cost_index: 0.7, logistics_performance: 0.4, strike_frequency: 0.75, closure_rate: 0.45, fdi_inflow: 0.15, export_volume_index: 0.4, timestamp: Date.now()
  },
  {
    governorate: "Kasserine", industrial_density: 0.15, employment_rate: 0.28,
    sector_breakdown: { textile: 0.1, mechanical: 0.05, agro_food: 0.3, phosphate: 0, chemicals: 0, construction: 0.2, other: 0.35 },
    energy_cost_index: 0.6, logistics_performance: 0.35, strike_frequency: 0.15, closure_rate: 0.55, fdi_inflow: 0.1, export_volume_index: 0.25, timestamp: Date.now()
  }
];

export const mockPhosphateData: PhosphateData = {
  production_volume: 0.4, production_trend: -0.25, protest_frequency: 0.7, environmental_cost_index: 0.6, state_revenue_impact: 0.6, global_price_index: 0.5, timestamp: Date.now()
};

export const mockStartupData: StartupHealthData = {
  funding_volume: 0.3, survival_rate_24m: 0.4, new_registrations: 0.5, fintech_transaction_volume: 0.4, brain_drain_proxy: 0.6, timestamp: Date.now()
};

export const mockEnergyData: EnergyStressData = {
  cost_per_kwh: 0.6, supply_stability: 0.8, fuel_import_dependency: 0.7, outage_frequency: 0.3, timestamp: Date.now()
};
