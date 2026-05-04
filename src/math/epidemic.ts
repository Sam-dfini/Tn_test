/**
 * TunisiaIntel — Epidemic/Protest SIR Model
 * EQ.4
 */

export interface SIRState {
  s: number; // Susceptible
  i: number; // Infected (Active Protesting)
  r: number; // Recovered/Repressed
}

/**
 * Single step of SIR model
 * @param state Current S, I, R values
 * @param beta Transmission rate (mobilization efficiency)
 * @param gamma Recovery rate (exhaustion/repression)
 * @param dt Time step (usually 1 day)
 */
export function nextSIRState(
  state: SIRState,
  beta: number,
  gamma: number,
  dt: number = 1
): SIRState {
  const dS = -beta * state.s * state.i * dt;
  const dI = (beta * state.s * state.i - gamma * state.i) * dt;
  const dR = gamma * state.i * dt;

  return {
    s: Math.max(0, state.s + dS),
    i: Math.max(0, state.i + dI),
    r: Math.min(1, state.r + dR)
  };
}

/**
 * Runs a full simulation over N days
 */
export function simulateSIR(
  initialI: number,
  beta: number,
  gamma: number,
  days: number
): SIRState[] {
  const history: SIRState[] = [{ s: 1 - initialI, i: initialI, r: 0 }];
  
  for (let d = 1; d <= days; d++) {
    const next = nextSIRState(history[d - 1], beta, gamma);
    history.push(next);
  }

  return history;
}
