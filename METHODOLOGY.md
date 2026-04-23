# TUNISIAINTEL Technical Methodology

This document serves as the master mathematical reference for the **TunisiaIntel v2.0** application. It catalogues all algorithms, indices, and formulas that drive the Revolutionary Risk Index (RRI), operational modules, predictive simulations, and civilizational tracking, directly matching the system's `RRIMethodology` Engine.

---

## 1. Master Risk Architecture: The RRI Engine

The **Revolutionary Risk Index (RRI)** is the aggregate measure of systemic stability. It blends slow-moving structural metrics with high-velocity shock events across 250 variables.

### EQ.1 — Revolutionary Risk Index — Base Formula
```latex
R(t) = \sum_{i=1}^{24} \left( \sum_{j=1}^{n_i} w_{ij} \cdot F_{ij}(t) \right) + \epsilon(t)
```
*The fundamental equation governing the RRI. Each of the 250 variables F_ij(t) across 24 categories is multiplied by its dynamic weight w_ij and summed. The noise term epsilon(t) captures unobserved shocks such as assassinations or natural disasters.*

### EQ.2/3 — Salience Modulation — Full War Distraction Equation
```latex
S(t) = \frac{\alpha \cdot \left(1 + \delta \cdot C_P(t) + \epsilon \cdot D_P(t) + \zeta \cdot R_M(t) + \eta \cdot R_R(t) + \theta \cdot C_R(t)\right)}{1 + \beta \cdot W(t) \cdot \left(1 + \gamma \cdot P(t) + \iota \cdot D_D(t)\right)}
```
*Salience S(t) measures how much public attention is focused on revolutionary grievances versus being suppressed by war distraction or propaganda. High war intensity W(t) drives salience down. Counter-propaganda CP(t) and diaspora protests DP(t) drive it up. Rural connectivity CR(t) affects rural mobilization reach.*

### EQ.4 — Epidemic-Style Protest Spread — SIR Model
```latex
\frac{dS}{dt} = -\beta \cdot S \cdot I \qquad \frac{dI}{dt} = \beta \cdot S \cdot I - \gamma \cdot I \qquad \frac{dR}{dt} = \gamma \cdot I
```
*Protest spread is modelled as an epidemic process. S = susceptible population (potential protesters), I = infected (active protesters), R = recovered (former participants). The transmission rate beta is amplified by TikTok penetration and UGTT mobilization.*

### EQ.7 — Elite Defection Utility Function
```latex
U_i(\text{Defect}) = B_i - C_i \cdot (1 - P_{rev}) + \lambda_i \cdot \sum_{j \neq i} D_j
```
*Each elite actor calculates the utility of defecting from the regime. Nash equilibrium: defection occurs if U_i > 10 + sigma * R(t). The critical insight is the cascade term: each defection by elite j increases the utility of defection for all other elites.*

### EQ.8 — War Intensity Index W(t)
```latex
W(t) = 0.6 \cdot \text{Battle\_Deaths}_{norm} + 0.4 \cdot \text{Media\_Salience}_{norm}
```
*Aggregates regional conflict impact — primarily Gaza, Libya, and the Sahel — into a single suppressor value. High W(t) suppresses domestic protest attention by 18-22%.*

### EQ.9 & 10 — Remittance-Driven Mobilization & Distribution
```latex
\Delta P = 0.05 \cdot R_{total} \cdot (1 - D_D(t)) \qquad R_{urban}(t) = \phi \cdot R_{total}(t) \qquad R_{rural}(t) = (1-\phi) \cdot R_{total}(t)
```
*Remittances mobilize protest participation by funding opposition activities and increasing household economic confidence.*

### EQ.12 — Logistic Revolution Probability
```latex
P_{rev}(t) = \frac{1}{1 + e^{-(0.8 \cdot R(t) - 2.1)}}
```
*The logistic function transforms R(t) into a probability. The threshold where P_rev = 50% is R(t) = 2.625 (solving 0.8R - 2.1 = 0).*

### EQ.13 — Stochastic Shock Model
```latex
\epsilon(t) = \sum_{k=1}^{K} \omega_k \cdot \xi_k(t)
```
*Captures unobserved sudden events that can shift R(t) instantaneously. Each shock type k has a weight omega_k and random magnitude xi_k(t).*

### EQ.14 — Monte Carlo Simulation Framework
```latex
R_i(t) = \sum_{j=1}^{250} w_j \cdot F_{ij}(t) + \epsilon_i(t) \qquad P_{rev,i}(t) = \frac{1}{1 + e^{-(0.8 R_i(t) - 2.1)}}
```
*10,000 simulation runs where each variable is perturbed by Gaussian noise proportional to its historical volatility. The distribution of P_rev across all runs gives the confidence interval.*

### EQ.15 — Compound Stress Index CS(t)
```latex
CS(t) = \sum_{i} \sum_{j>i} \left[ \alpha_{ij} \cdot B(n_i, \theta) \cdot B(n_j, \theta) \right] \quad \text{where} \quad B(n, \theta) = \frac{\max(0, n - \theta)}{1 - \theta}
```
*Captures non-linear interactions when multiple variables breach their thresholds simultaneously. Includes the critical A251-E51 (Structural Signal + Protests) coupling.*

### EQ.16 — Velocity Index V(t)
```latex
V(t) = \tanh\left(\frac{1}{\lambda} \sum_{i} \beta_i \cdot \frac{n_i(t) - n_i(t-30)}{\sigma_i} \cdot w_i \right)
```
*Measures the rate of change of R(t). High-weight tracking includes A251 (Structural Economic Signal) to detect rapid policy-driven deterioration.*

### EQ.17 — Regional Cascade Probability P_cascade(t)
```latex
P_{cascade}(t) = 1 - \prod_{g \in G} \left(1 - P_{protest}(g, t)\right)
```
*The probability that instability in one governorate triggers a cascade to neighboring governorates.*

### EQ.18 — Elite Defection Dynamics EC(t)
```latex
EC(t) = EC(t-1) \cdot (1 - \delta_{defection}) + \epsilon_{loyalty}
```
*Models elite cohesion as a time-series stock that depletes based on defection signals.*

### EQ.19 — Information Amplification Factor A(t)
```latex
A(t) = 1 + \gamma \cdot IFI(t) \cdot SM_{reach}(t) \quad \text{where} \quad IFI(t) = \frac{P_F}{100} \cdot (1 - C_I) \cdot \left(1 - \min\left(0.5, \frac{T_{inc}}{20}\right)\right)
```
*Information freedom amplifies the effect of mobilization variables.*

### EQ.20 — Historical Pattern Similarity HPS(t)
```latex
HPS(t) = \max_k \left[ \cos\_sim\left(\mathbf{N}(t), \mathbf{N}_{hist}(k)\right) \right] \quad \text{where} \quad \cos\_sim(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}| \cdot |\mathbf{b}|}
```
*Compares the current normalized variable vector to known pre-crisis reference states using cosine similarity.*

### EQ.21 — Ministerial Instability Index MII(t)
```latex
MII(t) = \alpha \cdot CF + \beta \cdot (1/tenure_{norm}) + \gamma \cdot CrisisRatio + \delta \cdot KM + \epsilon \cdot LS
```
*Measures government reshuffle patterns as a leading indicator of regime stress, policy failure, and elite fracture.*

### EQ.22 — Cycle Position Index CPI(t)
```latex
CPI(t) = \sum_{i=1}^{n} (C_i(t) \cdot W_i)
```
*Measures the 'Temporal Harmonic' — determining if multiple independent cycles (seasonal, generational, and civilizational) are peaking simultaneously. A high CPI indicates a 'Structural Convergence' where the state fights against historical currents.*

### EQ.23 — Acceleration Index A(t)
```latex
A(t) = \frac{dV}{dt} + \text{ShockDensity}(\sigma)
```
*Measures the second derivative of risk — how fast the speed of risk is increasing. High A(t) represents a 'Loss of State Friction' where standard interventions no longer slow the momentum of the crisis.*

### EQ.24 — Structural Economic Signal S_econ(t)
```latex
S_{econ}(t) = \sum_{k \in \text{Staples}} \omega_k \cdot \Delta \text{Policy}_k + \gamma \cdot \text{SubsidyAdjustment}
```
*Detects 'silent' structural changes in economic policy, specifically focusing on staple goods (bread, flour) and subsidy mechanisms. These are high-impact leading indicators of systemic failure.*

---

## 2. Dedicated Domain Methodologies

### EQ.E1 — National Energy Security Index (NESI)
```text
NESI = 0.20 × ImportDependenceRisk 
     + 0.20 × SubsidySustainability 
     + 0.15 × SupplyDiversification 
     + 0.15 × InfrastructureResilience 
     + 0.15 × SeasonalStress 
     + 0.15 × GeopoliticalVulnerability
```

### EQ.E2 — Butane Stress Index (BSI)
```text
BSI = 0.30 × import_price_pressure 
    + 0.25 × distribution_bottleneck 
    + 0.20 × seasonal_demand_surge 
    + 0.15 × strategic_stock_level 
    + 0.10 × smuggling_drain
```

### EQ.E3 — Generator Stress Index (GSI)
```text
GSI = 0.35 × STEG_outage_frequency 
    + 0.25 × generator_diesel_consumption_estimate 
    + 0.20 × informal_generator_proliferation 
    + 0.15 × diesel_price_pressure 
    + 0.05 × noise_complaint_index
```

### EQ.E4 — Social Contract Breach Probability
```text
BreachProb = min(1, (BSI > 0.6 ? 0.7 : BSI * 0.5) * 0.4
                  + (SubsidySus < 0.3 ? 0.8 : (1 - SubsidySus) * 0.4) * 0.35
                  + (GSI > 0.7 ? 0.6 : GSI * 0.3) * 0.25)
```

---

## 4. Agriculture & Food Crisis Module (ASIL)

### EQ.A1 — Bread Crisis Index (BCI)
```text
BCI = (Supply_Stress × 0.45) + (Price_Pressure × 0.35) + (Public_Signal × 0.20)
```

### EQ.A2 — Black Market Index (BMI)
Calculates the systemic slide toward the shadow economy.
```text
BMI = 0.4 × (Price_Divergence_Gap)
    + 0.3 × (Currency_Distortion_Gap)
    + 0.2 × (Commodity_Availability_Drop)
    + 0.1 × (Informal_Keywords_Intercepts)
```

---

## 5. Industrial Intelligence Module

### EQ.I1 — Concentration Risk (HHI)
```text
HHI = ∑(sector_weight_i ^ 2)
Concentration_Risk = normalize(HHI, 0.14, 1.0)
```

### EQ.I2 — Phosphate Risk
```text
PhosphateRisk = 0.35 × global_price_inversion
              + 0.30 × local_strike_frequency
              + 0.20 × logistical_bottlenecks
              + 0.15 × environmental_proxy
```

### EQ.I3 — Startup Health & Tech Fragility
```text
HealthScore = 0.25 × VC_funding + 0.25 × Survival_rate_24m 
            + 0.20 × Growth_rate + 0.15 × Digital_adoption 
            + 0.15 × (1 - Brain_Drain_Rate)
Tech_Fragility = 1.0 - HealthScore
```

### EQ.I4 — Industrial Stress Index
```text
ISI(gov) = 0.30 × EmploymentRisk + 0.20 × ExportVulnerability
         + 0.20 × SectorConcentrationRisk + 0.15 × EnergyCostIndex
         + 0.15 × PhosphateRisk
```

---

## 6. Civilizational Engine & Legacy Systems

### EQ.C1 — Coupled Oscillator Alignment ($S_a$)
The system calculates **Systemic Alignment** across Economic (E), Freedom (F), Social (S), Political (P) and Ideological (I) domains:
```text
S_a = min(1.0, μ · 0.6 + (1 - σ² · 4) · 0.4)
```
Where:
- `μ`: Mean intensity of elevated cycles (>0.55).
- `σ²`: Variance between cycle intensities.

### EQ.C2 — Anomaly Detection Baseline
The `AnomalyDetectionEngine` uses a rolling baseline of the last 10 signal states. An anomaly is triggered if:
```text
Δ Intensity > 2.5 × σ_baseline
```

### EQ.C3 — Opposition Cohesion Index (OCI)
Measures the fragmentation of ideology. Low OCI indicates high fragmentation, high OCI indicates unified mobilization.
```text
OCI = 1 - (Number of Active Narratives / Total Signaling Intensity)
```

### EQ.C4 — Entrepreneurial Location Scoring (L_s)
Risk-Adjusted Location Scoring used by the Business / Entrepreneur mode.
```text
L_s = (1 - g_risk) · 0.35 + g_market · 0.30 + g_infra · 0.20 + g_labor · 0.15 - (P_rev · 0.3 · g_risk)
```
Threshold for failure probability calculation via currency squeeze:
```text
FailureThreshold = [C · (1 + V_fx)] / (1 - P_rev) > Available Liquidity
```

---

## 7. Global Variable Ontology (RRI Variable Space)

The entire pipeline resolves raw data into the following structural classifications:

### E-Variables: Economic & Environmental
*   **E.1 (Macro-Economy):** Inflation, Deficits, Debt-to-GDP, IMF, Foreign Exchange.
*   **E.2 (Food & Agronomy):** ASIL metrics, Wheat Stress, BCI.
*   **E.3 (Energy Security):** NESI metrics, STEG, GSI, BSI, Fuel Subsidies.
*   **E.4 (Currency & Fiscal):** BMI index, Tax evasion rate, Sovereign yield.

### P-Variables: Political & Institutional
*   **P.1 (Regime Cohesion):** MII (Ministerial Instability), Elite fracture probability (`EQ.7`).
*   **P.2 (Legislative / Executive Friction):** Rule-by-decree frequency, arrest rates.
*   **P.3 (Geopolitical Independence):** Sovereign alignments, foreign assistance conditionality.

### S-Variables: Social & Security
*   **S.1 (Public Pressure):** Protest velocity, Social Contract Breach.
*   **S.2 (Radicalization Flux):** Ideological recruitment volumes, polarization.
*   **S.3 (Kinetic Security):** Police friction, border interceptions.
*   **S.4 (Labor Dynamics):** UGTT strike index, Industrial Stress Index (`ISI`).

### A-Variables: Accelerators (The "x-Factors")
These act as structural multipliers on top of standard metrics.
*   **A.12 (Supply Squeeze):** Absolute shortages in critical imports (medicine, coffee, flour).
*   **A.14 (Market Distortion):** Velocity of the Black Market overtaking the formal sector.
*   **A.16 (Investment Chill):** Evaporation of SME credit, Tech Fragility.
*   **A.18 (Revenue Collapse):** Plunging Phosphate or Tourism receipts triggering sudden fx liquidity crises.
