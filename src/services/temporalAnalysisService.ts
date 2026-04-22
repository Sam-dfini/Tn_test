/**
 * TunisiaIntel — Temporal Pattern Detection Module
 * 
 * Identifies weekly and seasonal cycles in variable data.
 * Distinguishes predictable fluctuations from anomalous events.
 * 
 * Uses:
 * - Day-of-week averaging for weekly cycles.
 * - Month-of-year averaging for seasonal cycles.
 * - Residual analysis for anomaly detection.
 */

export interface TemporalPattern {
  type: 'WEEKLY' | 'SEASONAL' | 'TREND';
  period: number; // in days
  strength: number; // 0-1
  description: string;
}

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface AnalysisResult {
  patterns: TemporalPattern[];
  weeklyStrength: number;
  seasonalStrength: number;
  isAnomalous: boolean;
  residual: number;
  expectedValue: number;
  confidence: number;
  primaryPatternType: 'WEEKLY' | 'SEASONAL' | 'NONE';
}

export class TemporalAnalyzer {
  private history: DataPoint[] = [];
  private readonly minPointsForWeekly = 14; // 2 weeks
  private readonly minPointsForSeasonal = 60; // 2 months

  constructor(history: DataPoint[] = []) {
    this.history = history.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Adds a new data point and returns analysis
   */
  public analyze(newPoint: DataPoint): AnalysisResult {
    const allData = [...this.history, newPoint];
    
    const weeklyPattern = this.detectWeeklyCycle(allData);
    const seasonalPattern = this.detectSeasonalCycle(allData);
    
    const expectedValue = this.calculateExpectedValue(newPoint.timestamp, weeklyPattern, seasonalPattern);
    const residual = newPoint.value - expectedValue;
    
    // Anomaly detection: if residual is > 2x standard deviation of historical residuals
    const isAnomalous = this.checkAnomaly(residual, allData, weeklyPattern, seasonalPattern);

    return {
      patterns: [weeklyPattern, seasonalPattern].filter(p => p.strength > 0.2),
      weeklyStrength: weeklyPattern.strength,
      seasonalStrength: seasonalPattern.strength,
      isAnomalous,
      residual,
      expectedValue,
      confidence: Math.min(1, allData.length / 30),
      primaryPatternType: weeklyPattern.strength > seasonalPattern.strength ? 'WEEKLY' : (seasonalPattern.strength > 0.2 ? 'SEASONAL' : 'NONE')
    };
  }

  private detectWeeklyCycle(data: DataPoint[]): TemporalPattern {
    if (data.length < this.minPointsForWeekly) {
      return { type: 'WEEKLY', period: 7, strength: 0, description: 'Insufficient data for weekly analysis' };
    }

    // Group by day of week (0-6)
    const dayGroups: Record<number, number[]> = {};
    data.forEach(p => {
      const day = new Date(p.timestamp).getDay();
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(p.value);
    });

    const dayAverages = Object.keys(dayGroups).map(day => {
      const vals = dayGroups[parseInt(day)];
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    const overallAvg = data.reduce((a, b) => a + b.value, 0) / data.length;
    
    // Variance of day averages vs overall average
    const variance = dayAverages.reduce((s, avg) => s + Math.pow(avg - overallAvg, 2), 0) / 7;
    const totalVariance = data.reduce((s, p) => s + Math.pow(p.value - overallAvg, 2), 0) / data.length;

    const strength = totalVariance > 0 ? Math.min(1, variance / totalVariance) : 0;

    return {
      type: 'WEEKLY',
      period: 7,
      strength,
      description: strength > 0.5 ? 'Strong weekly cycle detected' : 'Weak weekly cycle',
    };
  }

  private detectSeasonalCycle(data: DataPoint[]): TemporalPattern {
    if (data.length < this.minPointsForSeasonal) {
      return { type: 'SEASONAL', period: 30, strength: 0, description: 'Insufficient data for seasonal analysis' };
    }

    // Group by month (0-11)
    const monthGroups: Record<number, number[]> = {};
    data.forEach(p => {
      const month = new Date(p.timestamp).getMonth();
      if (!monthGroups[month]) monthGroups[month] = [];
      monthGroups[month].push(p.value);
    });

    const monthAverages = Object.keys(monthGroups).map(m => {
      const vals = monthGroups[parseInt(m)];
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    });

    const overallAvg = data.reduce((a, b) => a + b.value, 0) / data.length;
    const variance = monthAverages.reduce((s, avg) => s + Math.pow(avg - overallAvg, 2), 0) / 12;
    const totalVariance = data.reduce((s, p) => s + Math.pow(p.value - overallAvg, 2), 0) / data.length;

    const strength = totalVariance > 0 ? Math.min(1, variance / totalVariance) : 0;

    return {
      type: 'SEASONAL',
      period: 30,
      strength,
      description: strength > 0.5 ? 'Strong seasonal cycle detected' : 'Weak seasonal cycle',
    };
  }

  private calculateExpectedValue(timestamp: number, weekly: TemporalPattern, seasonal: TemporalPattern): number {
    const date = new Date(timestamp);
    const day = date.getDay();
    const month = date.getMonth();

    const overallAvg = this.history.length > 0 
      ? this.history.reduce((a, b) => a + b.value, 0) / this.history.length 
      : 0;

    let expected = overallAvg;

    if (weekly.strength > 0.2) {
      const dayAvg = this.getDayAverage(day);
      expected += (dayAvg - overallAvg) * weekly.strength;
    }

    if (seasonal.strength > 0.2) {
      const monthAvg = this.getMonthAverage(month);
      expected += (monthAvg - overallAvg) * seasonal.strength;
    }

    return expected;
  }

  private getDayAverage(day: number): number {
    const vals = this.history
      .filter(p => new Date(p.timestamp).getDay() === day)
      .map(p => p.value);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  private getMonthAverage(month: number): number {
    const vals = this.history
      .filter(p => new Date(p.timestamp).getMonth() === month)
      .map(p => p.value);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  private checkAnomaly(residual: number, data: DataPoint[], weekly: TemporalPattern, seasonal: TemporalPattern): boolean {
    if (data.length < 7) return false;

    // Calculate historical residuals
    const residuals = data.slice(0, -1).map(p => {
      const expected = this.calculateExpectedValue(p.timestamp, weekly, seasonal);
      return p.value - expected;
    });

    const avgResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const stdDev = Math.sqrt(residuals.reduce((s, r) => s + Math.pow(r - avgResidual, 2), 0) / residuals.length);

    // Threshold: 2.5 standard deviations
    return Math.abs(residual) > (stdDev * 2.5);
  }
}

/**
 * Detects patterns in a list of articles (e.g., volume of mentions)
 */
export function detectArticleVolumePatterns(articles: any[], category: string): AnalysisResult {
  const dailyCounts: Record<string, number> = {};
  
  articles.forEach(a => {
    if (a.category === category || !category) {
      const date = new Date(a.published_at).toISOString().slice(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }
  });

  const dataPoints: DataPoint[] = Object.entries(dailyCounts).map(([date, count]) => ({
    timestamp: new Date(date).getTime(),
    value: count
  }));

  if (dataPoints.length === 0) {
    return {
      patterns: [],
      weeklyStrength: 0,
      seasonalStrength: 0,
      isAnomalous: false,
      residual: 0,
      expectedValue: 0,
      confidence: 0,
      primaryPatternType: 'NONE'
    };
  }

  const analyzer = new TemporalAnalyzer(dataPoints.slice(0, -1));
  return analyzer.analyze(dataPoints[dataPoints.length - 1]);
}
