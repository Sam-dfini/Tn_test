# TUNISIAINTEL Technical Methodology

This document serves as the master mathematical reference for the **TunisiaIntel v3.0** application. It catalogues all algorithms, indices, formulas, engines, and modules that drive the Revolutionary Risk Index (RRI), operational modules, predictive simulations, and civilizational tracking, directly matching the system's `RRIMethodology` Engine and all backend service implementations (Phases 1-10).

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

## 3. Agriculture & Food Crisis Module (ASIL)

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

## 4. Industrial Intelligence Module

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

## 5. Civilizational Engine & Legacy Systems

### EQ.C1 — Coupled Oscillator Alignment (S_a)
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

## 6. Actor Cognition Engine (Phase 4)

The **Actor Engine** computes posture and adjusted action probabilities for each of the 14 geopolitical actors (PRES, UGTT, ARM, INT, BCT, LPR, EU, DZA, UTICA, DONOR, PPL, LTDH, KSA, USA) from a state snapshot.

### EQ.AC1 — Actor Posture Computation
```latex
P_{adjusted}(a, t) = P_{base}(a) + \sum_{r \in R_a} \delta_r \cdot \mathbb{1}\left[ v_r(t) \bowtie \theta_r \right]
```
*Each actor a has a base action probability matrix P_base(a). State update rules R_a modify probabilities when a signal's value v_r(t) crosses threshold theta_r with operator `>` or `<`. Delta shifts are clamped to [0, 1].*

### EQ.AC2 — Actor Stress Score
```latex
S_a(t) = \frac{\sum_{s} w_{a,s} \cdot v_s(t)}{\sum_{s} w_{a,s}}
```
*Weighted sum of input signals mapped from the canonical state snapshot. 111 signal-to-snapshot field mappings defined. Used to rank actors by current pressure.*

### EQ.AC3 — Posture Classification
Posture label assigned from highest-probability action:
```text
posture(a) = aggressive    if max(P_adjusted) in {repression, crackdown, general_strike, ...} and P > 0.50
           = collapsing    if max(P_adjusted) in {immediate_concession_or_flight, capital_flight, ...} and P > 0.30
           = negotiating   if max(P_adjusted) in {negotiation, concessions, diplomatic_statement, ...} and P > 0.40
           = defensive     if max(P_adjusted) in {neutrality, border_tightening, capital_controls, ...} and P > 0.40
           = passive       if max(P_adjusted) < 0.20
```

### EQ.AC4 — Actor Backtesting
```latex
\text{match\_score}(a, h) = \frac{1}{|K_h|} \sum_{k \in K_h} \mathbb{1}\left[ k \in \text{top\_action}(a) \right]
```
*Compares the top predicted action for actor a against historical event h by keyword overlap. Keywords are derived from documented historical behavior.*

---

## 7. Doctrine Library (Phase 5)

The **Doctrine Library** integrates with AnythingLLM over 7 sovereign workspaces to provide historical pattern matching and theoretical context.

### EQ.D1 — Doctrine-Enriched Posture
```latex
P_{doctrine}(a, t) = P_{adjusted}(a, t) \oplus f_{LLM}\left( \text{top\_k}(doctrine_{ws(a)}, s(t)) \right)
```
*Each actor binds to 1-3 doctrine workspaces. During deliberation, the top-k relevant chunks are retrieved per workspace, ranked by rerank_score, and fed into the LLM reasoning chain.*

### Workspace Map
| Actor | Doctrine Workspaces |
|-------|-------------------|
| PRES | tunisia-history, regime-survival, strategic-studies |
| UGTT | tunisia-history, social-movements, economic-statecraft |
| ARM | security-state, strategic-studies, tunisia-history |
| BCT | economic-statecraft, energy-water |
| EU | strategic-studies, economic-statecraft |
| DONOR | economic-statecraft, strategic-studies |

---

## 8. Deliberation Engine & High Table (Phases 6, 8)

The **Deliberation Engine** models multi-actor strategic decision-making. When a crisis signal fires or an analyst injects a scenario, actors generate positions, conflicts are detected, coalitions form, and a decision probability distribution is produced.

### EQ.DE1 — Position Generation
```latex
\text{pos}_i = \max_a P_{doctrine}(a_i, t) \quad \text{conf}_i = P_{doctrine}(a_i, \text{pos}_i)
```
*Each actor i selects the action with highest adjusted probability as their position recommendation. Confidence is the probability of that action.*

### EQ.DE2 — Conflict Detection
```latex
\text{conflict}(i, j) = \mathbb{1}\left[ \text{pos}_i = \text{oppose}(\text{pos}_j) \right] \cdot \frac{\text{conf}_i + \text{conf}_j}{2}
```
*Opposition mapping: repression↔concessions, general_strike↔negotiation, imf_delay↔imf_compliance, crackdown↔international_appeal. Severity is the mean of both actors' confidences.*

### EQ.DE3 — Coalition Formation
```latex
C(r) = \{ a_i : \text{pos}_i = r \} \quad \text{AW}(r) = \sum_{a_i \in C(r)} \text{authority}_i(crisis\_type)
```
*Actors with the same recommended action form a coalition. The coalition's authority weight is the sum of each member's domain-specific authority weight (from the profile's authority_weights dict, keyed by crisis type).*

### EQ.DE4 — Resolution
```latex
\text{resolution} = \text{consensus}   \quad \text{if } \max\_aw > 0.65
                  = \text{compromise} \quad \text{if } (\max\_aw - \text{second\_aw}) < 0.15
                  = \text{deadlock}   \quad \text{if } \max\_aw < 0.40
```
*Resolution type determines output format. Vetoes override all: if an actor's veto condition is met (e.g., UGTT strike during compound_stress > 0.75), the vetoing actor is excluded and deliberation continues among remaining actors.*

### EQ.DE5 — Veto Conditions
```latex
\text{veto\_active} = \bigvee_{a \in A} \bigvee_{v \in V_a} \mathbb{1}\left[ f_v(\text{snapshot}) > \theta_v \right]
```
*Each actor profile defines veto_conditions with a condition string and blocked action. Examples: UGTT vetoes repression during high compound stress; LTDH vetoes on civilian casualty orders.*

---

## 9. Simulation Chamber (Phase 7)

The **Simulation Chamber** runs Monte Carlo simulations that fork from the canonical state snapshot, inject shocks, propagate through causal chains, integrate deliberation, and produce outcome distributions.

### EQ.SC1 — Scenario Shock Injection
```latex
\mathbf{s}_i(0) = \mathbf{s}_{canonical} + \sum_{k \in K} \text{shock}_k \cdot \mathcal{N}(1, \sigma_k)
```
*Each simulation run i starts from the canonical snapshot and applies the scenario's shock_vector, perturbed by Gaussian noise proportional to each variable's historical volatility.*

### EQ.SC2 — Time Step Propagation
```latex
\mathbf{s}_i(t+1) = \mathbf{s}_i(t) + \alpha \cdot \nabla R(\mathbf{s}_i(t)) + \epsilon_i(t)
```
*State propagates forward in discrete steps. The gradient of the RRI function with respect to each variable provides drift direction. Stochastic shock epsilon_i(t) applied per step.*

### EQ.SC3 — Deliberation Integration
```latex
\text{if } R_i(t) > \text{threshold}_{deliberate}: \quad \pi_i(t) = \text{deliberate}(\mathbf{s}_i(t))
```
*When RRI crosses predefined thresholds, the deliberation engine is called with the forked state, and its output (decision probability distribution) is fed back into the state vector.*

### EQ.SC4 — Outcome Distribution
```latex
P_{outcome}(o) = \frac{1}{N} \sum_{i=1}^{N} \mathbb{1}\left[ \text{classify}(\mathbf{s}_i(T)) = o \right]
```
*After N iterations (configurable, default 1000), the final state of each run is classified (stable / elevated / crisis / acute_crisis / transition). The proportion of runs per class gives the probability distribution.*

### Pre-Built Scenarios
13 scenarios across 4 categories: Economic (SCN-E01–E05), Political (SCN-P01–P04), Security (SCN-S01–S02), Social (SCN-V01–V02). Each defines a shock_vector, tags, and historical_basis.

---

## 10. Intervention Engine (Phase 10)

The **Intervention Engine** answers: "What action reduces collapse probability most efficiently, at lowest political cost, with highest confidence?"

### EQ.IE1 — Intervention Efficiency
```latex
E_i = \frac{\max(0, -\Delta P_{rev,i})}{0.4 \cdot C_{pol,i} + 0.35 \cdot C_{econ,i} + 0.25 \cdot C_{social,i}}
```
*Efficiency is the ratio of P_revolution reduction to weighted total cost. Political cost weighted 0.40, economic 0.35, social 0.25.*

### EQ.IE2 — P_revolution Delta Estimation
```latex
\Delta P_{rev,i} = \left( \sum_{v \in V_i} \delta_v \cdot w_v \right) \cdot \frac{T_{horizon}}{30}
```
*Each state_vector entry in intervention i contributes delta_j * weight_j (0.08 for stress/anger/velocity variables, 0.05 otherwise), scaled by time horizon in 30-day units.*

### EQ.IE3 — Composite Ranking Score
```latex
S_i = 0.60 \cdot E_i + 0.20 \cdot H_i + 0.10 \cdot \left(1 - \frac{T_{effect,i}}{30}\right) + 0.10 \cdot R_i
```
*Final rank score blends efficiency (60%), historical success rate (20%), time-to-effect speed (10%), and reversibility (10%).*

### EQ.IE4 — Actor Stance & Veto Risk
```latex
\text{veto\_risk}_i = \bigvee_{a \in A} \mathbb{1}\left[ \text{stance}_{a,i} = \text{oppose} \land \text{intensity}_{a,i} > 0.60 \land \text{requires}_i(\text{consent}_a) \right]
```
*An intervention has veto risk if it requires consent from an actor whose stance is oppose with >60% intensity.*

### Intervention Library
14+ seeded interventions across 5 categories: Economic (INT-E01–E05), Security (INT-S01–S03), Political (INT-P01–P03), Social (INT-V01–V03), Diplomatic (INT-D01–D02). Each defines: state_vector (variable→delta map), political/economical/social costs, actor_stances, historical_basis, success_rate, and tags.

---

## 11. Cognitive Workspace (Phase 9)

The **Cognitive Workspace** orchestrates natural language queries across all engines (Phases 1-8, 10), synthesizes intelligence responses, and parameterizes canvas blocks.

### EQ.CW1 — Intent Routing
```latex
\text{engine\_set}(q) = f_{LLM}\left( q, \{ \text{block\_registry} \} \right)
```
*Query q is routed to one or more engine capabilities based on the block registry. 16 block types defined (rri-gauge, governorate-heatmap, monte-carlo-futures, actor-timeline, elite-network, economic-stress, narrative-warfare, comparative-historical, protest-sir, confidence-meter, water-stress, migration-flow, intervention-ranker, etc.).*

### EQ.CW2 — Parallel Execution Synthesis
```latex
\text{response}(q) = f_{LLM}\left( q, \{ \text{result}_e : e \in \text{engine\_set}(q) \} \right)
```
*Each selected engine executes in parallel; results are bundled with the original query and synthesized into a structured envelope (prose + confidence + block parameters).*

### EQ.CW3 — Streaming Narrative Token Generation
```latex
P(\text{token}_t | \text{context}_{<t}, \text{investigation}_i, \text{snapshot})
```
*The workspace supports streaming SSE endpoint for real-time narrative generation. Token-by-token generation conditioned on investigation context and current state snapshot.*

---

## 12. RAG & Intelligence Pipeline

The full RAG pipeline: Retrieve → Format → Generate → Cite → Log.

### EQ.RAG1 — Multi-Source Retrieval
```latex
\text{chunks} = \text{top\_k}\left( \cos\_sim(\text{embed}(q), \text{embed}(D_{articles})) \right) \cup \text{top\_k}\left( \cos\_sim(\text{embed}(q), \text{embed}(D_{telegram})) \right) \cup \text{search\_doctrine}(q)
```
*Semantic search across article_embeddings and telegram_embeddings (cosine similarity) PLUS doctrine library via AnythingLLM. Live signals weighted 0.60, doctrine/theoretical weighted 0.40.*

### EQ.RAG2 — Synthesis Confidence
```latex
\text{confidence} = \begin{cases} 0.1 & \text{if } |\text{chunks}| = 0 \\ f_{LLM}(q, \text{chunks}) & \text{if } |\text{chunks}| > 0 \end{cases}
```
*Confidence is LLM-generated. If insufficient evidence, the model returns confidence < 0.3 with explicit flag.*

### Continuous Intelligence Loop
10-step pipeline runs every 10 minutes: Extract → Qualify → Score → Deduplicate → Analyze → Correlate → Detect Anomalies → Calculate RRI → Simulate → Act. Orchestrated by 9 AI agents (Extractor, Analyst, Predictor, ResourceScout, DisinformationAnalyst, SocialMovementTracker, EconomicForecaster, SecurityAnalyst).

---

## 13. Causal Ontology Engine

The **Ontology Service** checks 12 seeded causal chains against the canonical state snapshot after each write, returning triggered chain_ids with propagation timing.

### EQ.O1 — Chain Activation
```latex
\text{chain\_active}(c) = \mathbb{1}\left[ v_{act,c}(t) > \theta_c \right] \land \mathbb{1}\left[ \exists t \in T_c : v_t(t) \geq \text{threshold}_t \right]
```
*A chain is active if its activation variable value exceeds the chain's activation threshold AND at least one trigger threshold in the chain is breached.*

### EQ.O2 — Node Propagation
```latex
\text{node\_fires}(n) = \mathbb{1}\left[ v_{act}(t) \geq \theta_c \cdot (1.5 - 0.5 \cdot w_n) \right]
```
*Each causal node n fires if the activation variable exceeds an effective threshold adjusted by the node's propagation_weight w_n. Higher weight nodes fire at lower thresholds.*

### EQ.O3 — Propagation Timing
```latex
T_{prop}(c) = \max_{n \in N_c} \text{lag\_days}(n) \times 24 \text{ hours}
```
*Total propagation window is the maximum time_lag_days across all triggered nodes, converted to hours.*

### 12 Core Causal Chains
| Chain ID | Domain | Activation Variable | Nodes |
|----------|--------|--------------------|-------|
| bread_price_cascade | economic→social | E2_wheat_stress | 8 |
| phosphate_disruption | economic→political→security | S4_phosphate_strike | 8 |
| elite_defection | political | P1_mii | 8 |
| repression_radicalization | security→social | S3_repression_index | 8 |
| ugtt_strike_escalation | social→political | S4_ugtt_strike_index | 8 |
| water_collapse | environment→economic→social | B1_water_stress | 8 |
| imf_conditionality_cascade | economic→political | P3_imf_pressure | 6 |
| war_distraction_release | geopolitical→social | w_t | 6 |
| diaspora_mobilization | external→social→political | salience_effective | 7 |
| elite_cohesion_collapse | political | elite_cohesion_dynamics | 6 |
| brain_drain_acceleration | social→economic | A16_brain_drain_rate | 4 |
| cascade_contagion | social→security | cascade_probability | 6 |

Each chain includes local_amplifiers (Ramadan timing +0.35, Summer heat +0.20), local_suppressors (war distraction -0.22, UGTT neutrality -0.30), regional_sensitivity (governorate-level multipliers up to 0.98), doctrine_refs, and validated_events for historical calibration.

---

## 14. Global Variable Ontology (RRI Variable Space)

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

---

## Global Variable Ontology — Knowledge Graph

The Knowledge Graph maps entities (actors, institutions, locations) and their typed relations across 4 dimensions:

### EQ.KG1 — Entity-Relation Model
```text
G = (V, E, T_V, T_E)
```
*Vertices V represent entities with types T_V ∈ {actor, institution, governorate, sector, geopolitical}. Edges E represent typed relations T_E ∈ {influences, controls, opposes, funds, mediates, represents, operates_in}.*

### EQ.KG2 — BFS Traversal
```latex
N_k(v) = \{ u : \text{dist}(v, u) \leq k \}
```
*Neighborhood query returns all entities within k hops of the seed entity. Used for influence mapping and cascade tracking.*
