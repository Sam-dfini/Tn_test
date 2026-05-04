import modelData from '../data/model_v2.json';
import rriVariables from '../data/rri_variables.json';

export interface ModelVariable {
  value: number | null;
  weight: number;
  unit?: string;
  description?: string;
  range?: string;
  code?: string;
  number?: number;
}

export interface ModelFramework {
  [category: string]: {
    [variable: string]: ModelVariable;
  };
}

export interface ModelV2 {
  model_metadata: {
    name: string;
    version: string;
    last_updated: string;
    target_period: string;
    baseline_r_t: number;
    baseline_p_rev: string;
  };
  equations_registry: {
    EQ1_RRI: string;
    EQ2_Salience: string;
    EQ4_SIR: {
      beta: number;
      gamma: number;
      description: string;
    };
    EQ12_Logistic_Prob: string;
  };
  variables_framework: ModelFramework;
  state_modifiers: {
    remittance_multiplier: {
      urban_protester_per_1m: number;
      rural_protester_per_1m: number;
    };
    stochastic_shocks: any[];
  };
}

class CoreLogicEngine {
  private model: ModelV2;

  constructor() {
    this.model = JSON.parse(JSON.stringify(modelData));
    this.initializeFromRRIVariables();
  }

  private initializeFromRRIVariables() {
    const vars = rriVariables.variables;
    const categories: Record<string, string> = {
      'A': 'A_ECONOMIC',
      'B': 'B_ENVIRONMENTAL',
      'C': 'C_DIGITAL',
      'D': 'D_POLITICAL',
      'E': 'E_SOCIAL',
      'F': 'F_SOCIO_CULTURAL',
      'G': 'G_LEGAL_STRUCTURAL',
      'H': 'H_MEDIA_COMMUNICATION',
      'I': 'I_INTERNATIONAL_EXTERNAL',
      'J': 'J_CONFLICT_WAR',
      'K': 'K_HISTORICAL_LEGACY',
      'L': 'L_REGIME_CHARACTERISTICS',
      'M': 'M_OPPOSITION_DYNAMICS',
      'N': 'N_SECURITY_APPARATUS',
      'O': 'O_DEMOGRAPHIC',
      'X': 'X_FUTURE_ORIENTED'
    };

    vars.forEach((v: any) => {
      const catKey = categories[v.code] || `CAT_${v.code}`;
      if (!this.model.variables_framework[catKey]) {
        this.model.variables_framework[catKey] = {};
      }
      
      const varKey = `${v.code}${v.number}_${v.name}`;
      this.model.variables_framework[catKey][varKey] = {
        value: v.value_2026,
        weight: v.weight,
        description: v.keywords.join(', '),
        code: v.code,
        number: v.number
      };
    });
  }

  public getModel(): ModelV2 {
    return this.model;
  }

  public updateVariable(category: string, variable: string, newValue: number): void {
    if (this.model.variables_framework[category] && this.model.variables_framework[category][variable]) {
      this.model.variables_framework[category][variable].value = newValue;
      this.model.model_metadata.last_updated = new Date().toISOString().split('T')[0];
    }
  }

  public updateByCode(code: string, newValue: number): void {
    for (const category in this.model.variables_framework) {
      for (const varKey in this.model.variables_framework[category]) {
        const v = this.model.variables_framework[category][varKey];
        if (v.code === code) {
          v.value = newValue;
          this.model.model_metadata.last_updated = new Date().toISOString().split('T')[0];
          return;
        }
      }
    }
  }

  public nudgeByCode(code: string, delta: number): void {
    for (const category in this.model.variables_framework) {
      for (const varKey in this.model.variables_framework[category]) {
        const v = this.model.variables_framework[category][varKey];
        if (v.code === code) {
          const current = v.value || 0;
          v.value = current + delta;
          this.model.model_metadata.last_updated = new Date().toISOString().split('T')[0];
          return;
        }
      }
    }
  }

  private pipelineMapping: Record<string, { category: string; variable: string }> = {
    'economy.inflation': { category: 'A_ECONOMIC', variable: 'A1_Inflation' },
    'economy.youth_unemployment': { category: 'A_ECONOMIC', variable: 'A2_Youth_Unemployment' },
    'economy.remittances_total_bnd': { category: 'A_ECONOMIC', variable: 'A14_Remittances' },
    'social.protest_events_30d': { category: 'D_POLITICAL', variable: 'D51_Protest_Frequency' },
    'rri.w_t': { category: 'J_WAR_EXTERNAL', variable: 'J104_War_Intensity_W' },
  };

  public updateFromPipeline(path: string, value: number): void {
    const mapping = this.pipelineMapping[path];
    if (mapping) {
      this.updateVariable(mapping.category, mapping.variable, value);
    }
  }

  /**
   * Normalizes values for R(t) calculation.
   * This is a simplified normalization based on typical ranges for these variables.
   */
  private normalize(variableId: string, value: number | null): number {
    if (value === null) return 0.5; // Neutral fallback

    switch (variableId) {
      case 'A1_Inflation': return Math.min(1, value / 20); // 0-20% range
      case 'A2_Youth_Unemployment': return Math.min(1, value / 50); // 0-50% range
      case 'A14_Remittances': return Math.min(1, value / 5); // 0-5B range
      case 'C24_Internet_Penetration': return value / 100; // 0-100%
      case 'C31_Rural_Connectivity': return value / 100; // 0-100%
      case 'C40_Digital_Divide_Dd': return value; // Already 0-1
      case 'D51_Protest_Frequency': return Math.min(1, value / 50); // 0-50 per month
      case 'D41_Executive_Approval': return 1 - (value > 1 ? value / 100 : value); // Invert: lower approval = higher risk
      case 'J104_War_Intensity_W': return value > 1 ? value / 100 : value; // Already 0-1
      default: return value > 1 ? Math.min(1, value / 100) : value;
    }
  }

  public calculateRRI(): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const category in this.model.variables_framework) {
      for (const variableId in this.model.variables_framework[category]) {
        const variable = this.model.variables_framework[category][variableId];
        const normalizedValue = this.normalize(variableId, variable.value);
        weightedSum += normalizedValue * variable.weight;
        totalWeight += variable.weight;
      }
    }

    // Baseline epsilon (stochastic noise)
    const epsilon = 0.05 * (Math.random() - 0.5);
    
    // Scale to 0-5 range (typical for RRI)
    const r_t = totalWeight > 0 ? (weightedSum / totalWeight) * 5 : 0;
    return parseFloat((r_t + epsilon).toFixed(4));
  }

  public calculatePRev(r_t: number): number {
    // EQ12: P_rev(t) = 1 / (1 + exp(-(0.8 * R(t) - 2.1)))
    const p_rev = 1 / (1 + Math.exp(-(0.8 * r_t - 2.1)));
    return parseFloat(p_rev.toFixed(4));
  }

  public calculateSalience(): number {
    // EQ2: S(t) = (alpha * (1 + 0.12Cp + 0.08Dp)) / (1 + 0.7W * (1 + 0.3P + 0.1Dd))
    // We need to extract these variables from the framework
    const alpha = 0.7; // Base salience
    const Cp = this.normalize('H_CP', 0.4); // Counter-propaganda (placeholder)
    const Dp = this.normalize('F_DP', 0.3); // Diaspora protest (placeholder)
    const W = this.normalize('J104_War_Intensity_W', this.model.variables_framework.J_WAR_EXTERNAL.J104_War_Intensity_W.value);
    const P = this.normalize('H_PROP', 0.6); // Propaganda (placeholder)
    const Dd = this.normalize('C40_Digital_Divide_Dd', this.model.variables_framework.C_DIGITAL.C40_Digital_Divide_Dd.value);

    const numerator = alpha * (1 + 0.12 * Cp + 0.08 * Dp);
    const denominator = 1 + 0.7 * W * (1 + 0.3 * P + 0.1 * Dd);
    
    return parseFloat((numerator / denominator).toFixed(4));
  }

  public getFullAnalysis() {
    const rt = this.calculateRRI();
    const pRev = this.calculatePRev(rt);
    const salience = this.calculateSalience();

    return {
      rt,
      pRev,
      salience,
      metadata: this.model.model_metadata,
      variables: this.model.variables_framework
    };
  }
}

export const coreLogicEngine = new CoreLogicEngine();
