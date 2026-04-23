export interface FuelShock {
  commodity: string;
  velocity: number;
  acceleration: number;
  severity: "ELEVATED" | "HIGH" | "CRITICAL";
  transmissionLag: number;
  tunisiaImpact: number;
}

export interface NESIComponents {
  importDependence: number;
  subsidySustainability: number;
  supplyDiversification: number;
  infrastructureResilience: number;
  seasonalStress: number;
  geopoliticalVulnerability: number;
}

export interface ButaneData {
  BSI: number;
}

export interface GeneratorData {
  GSI: number;
}

export interface ExtractionData {
  domesticSufficiencyRatio: number;
}

export interface GreenTransitionData {
  TSI: number;
}

export interface EnergySecurityOutput {
  energyStressIndex: number;
  nesi: number;
  shockAmplifier: number;
  butaneStress: number;
  generatorStress: number;
  extractionStress: number;
  greenStress: number;
  socialContractBreach: number;
  riskLevel: "STABLE" | "VULNERABLE" | "STRESSED" | "CRITICAL";
  topThreats: string[];
  recommendedActions: string[];
  timestamp: number;
}

// EMA Utility
export function ema(data: number[], alpha: number): number {
  if (data.length === 0) return 0;
  return data.reduce((acc, val, i) => i === 0 ? val : alpha * val + (1 - alpha) * acc, data[0]);
}

export class FuelShockDetector {
  private priceHistory: Map<string, number[]> = new Map();
  private shockThreshold = 0.20; // 20% move in 5 days

  public addPricePoint(commodity: string, price: number) {
    if (!this.priceHistory.has(commodity)) {
      this.priceHistory.set(commodity, []);
    }
    this.priceHistory.get(commodity)!.push(price);
  }

  public detectShock(commodity: string, currentPrice: number): FuelShock | null {
    const history = this.priceHistory.get(commodity) || [];
    if (history.length < 5) return null;

    const baseline = ema(history.slice(-20), 0.1); // 20-day EMA
    if (baseline === 0) return null;
    const velocity = (currentPrice - baseline) / baseline;
    const pastValue = history[history.length - 5];
    const pastVelocity = pastValue !== 0 ? (history[history.length - 1] - pastValue) / pastValue : 0;
    const acceleration = velocity - pastVelocity;

    if (Math.abs(velocity) > this.shockThreshold) {
      return {
        commodity,
        velocity,
        acceleration,
        severity: this.classifySeverity(velocity),
        transmissionLag: this.estimateTransmissionLag(commodity),
        tunisiaImpact: this.calculateTunisiaImpact(commodity, velocity)
      };
    }
    return null;
  }

  private classifySeverity(velocity: number): "ELEVATED" | "HIGH" | "CRITICAL" {
    if (Math.abs(velocity) > 0.50) return "CRITICAL";
    if (Math.abs(velocity) > 0.30) return "HIGH";
    return "ELEVATED";
  }

  private estimateTransmissionLag(commodity: string): number {
    const lags: Record<string, number> = {
      "brent_crude": 15,
      "natural_gas": 30,
      "lpg_butane": 20,
      "diesel": 10,
      "gasoline": 10,
    };
    return lags[commodity] || 21;
  }

  private calculateTunisiaImpact(commodity: string, velocity: number): number {
    const multipliers: Record<string, number> = {
      "brent_crude": 1.0,
      "natural_gas": 1.2,
      "lpg_butane": 1.3,
      "diesel": 0.9,
      "gasoline": 0.8,
    };
    return velocity * (multipliers[commodity] || 1.0);
  }
}

export class EnergySystemEngine {
  static computeNationalEnergySecurity(
    nesComponents: NESIComponents,
    fuelShocks: FuelShock[],
    butaneData: ButaneData,
    generatorData: GeneratorData,
    extractionData: ExtractionData,
    greenData: GreenTransitionData
  ): EnergySecurityOutput {

    // 1. NESI base
    const nesi = 
      nesComponents.importDependence * 0.20 +
      nesComponents.subsidySustainability * 0.20 +
      nesComponents.supplyDiversification * 0.15 +
      nesComponents.infrastructureResilience * 0.15 +
      nesComponents.seasonalStress * 0.15 +
      nesComponents.geopoliticalVulnerability * 0.15;

    // 2. Fuel shock amplification
    const shockAmplifier = fuelShocks.reduce((max, shock) => {
      const impact = shock.tunisiaImpact;
      return impact > max ? impact : max;
    }, 0);

    // 3. Butane social stress
    const butaneStress = butaneData.BSI;

    // 4. Generator informalization
    const generatorStress = generatorData.GSI;

    // 5. Extraction decline
    const extractionStress = Math.max(0, 1 - extractionData.domesticSufficiencyRatio);

    // 6. Green transition gap
    const greenStress = greenData.TSI;

    // Master Energy Stress Index
    const energyStressIndex = Math.min(1, 
      nesi * 0.35 +
      shockAmplifier * 0.25 +
      butaneStress * 0.15 +
      generatorStress * 0.10 +
      extractionStress * 0.10 +
      greenStress * 0.05
    );

    // Social contract breach probability
    const socialContractBreach = this.computeBreachProbability(
      butaneStress, 
      nesComponents.subsidySustainability,
      generatorStress
    );

    return {
      energyStressIndex,
      nesi,
      shockAmplifier,
      butaneStress,
      generatorStress,
      extractionStress,
      greenStress,
      socialContractBreach,
      riskLevel: this.classifyRisk(energyStressIndex),
      topThreats: this.identifyThreats(nesi, fuelShocks, butaneData, generatorData),
      recommendedActions: ["Accelerate renewable transition", "Target target subsidy reform", "Boost reserve capacity"],
      timestamp: Date.now()
    };
  }

  private static computeBreachProbability(
    butane: number, 
    subsidy: number, 
    generator: number
  ): number {
    const butaneBreach = butane > 0.6 ? 0.7 : butane * 0.5;
    const subsidyBreach = subsidy < 0.3 ? 0.8 : (1 - subsidy) * 0.4;
    const generatorBreach = generator > 0.7 ? 0.6 : generator * 0.3;

    return Math.min(1, butaneBreach * 0.4 + subsidyBreach * 0.35 + generatorBreach * 0.25);
  }

  private static classifyRisk(esi: number): "STABLE" | "VULNERABLE" | "STRESSED" | "CRITICAL" {
    if (esi < 0.30) return "STABLE";
    if (esi < 0.50) return "VULNERABLE";
    if (esi < 0.70) return "STRESSED";
    return "CRITICAL";
  }

  private static identifyThreats(nesi: number, fuelShocks: FuelShock[], butaneData: ButaneData, generatorData: GeneratorData): string[] {
    const threats = [];
    if (nesi > 0.6) threats.push("High Structural Vulnerability");
    if (butaneData.BSI > 0.6) threats.push("Butane Shortage Risk");
    if (generatorData.GSI > 0.6) threats.push("Generator Prominence Rising");
    fuelShocks.forEach(shock => {
      threats.push(`Shock: ${shock.commodity} (${(shock.velocity*100).toFixed(1)}%)`);
    });
    if(threats.length === 0) threats.push("Monitoring Stable");
    return threats.slice(0, 3);
  }
}

// --- Mock Data Initialization for immediate UI consumption ---
export const mockNESIComponents: NESIComponents = {
  importDependence: 0.82,
  subsidySustainability: 0.25,
  supplyDiversification: 0.80,
  infrastructureResilience: 0.65,
  seasonalStress: 0.62,
  geopoliticalVulnerability: 0.72
};

export const mockFuelShocks: FuelShock[] = [
  { commodity: "Brent Crude", velocity: 0.45, acceleration: 0.1, severity: "HIGH", transmissionLag: 12, tunisiaImpact: 0.45 }
];

export const mockButaneData: ButaneData = { BSI: 0.58 };
export const mockGeneratorData: GeneratorData = { GSI: 0.42 };
export const mockExtractionData: ExtractionData = { domesticSufficiencyRatio: 0.44 };
export const mockGreenData: GreenTransitionData = { TSI: 0.55 };

export const mockEnergySecurityOutput = EnergySystemEngine.computeNationalEnergySecurity(
  mockNESIComponents,
  mockFuelShocks,
  mockButaneData,
  mockGeneratorData,
  mockExtractionData,
  mockGreenData
);
