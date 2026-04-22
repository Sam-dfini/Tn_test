# TUNISIAINTEL Technical Methodology

This document outlines the mathematical and logic frameworks driving the system's intelligence.

---

## 1. The Civilizational Engine: Oscillator Model
The "Engine" tab implements a **Coupled Oscillator Model** based on the following logic:

### Domain Mapping
The system tracks 6 primary oscillators:
- **E(t) - Economic**: Fiscal reserves, inflation, and category A/B fiscal signals.
- **F(t) - Freedom**: Media control, Decree 54 charges, and repression density.
- **S(t) - Social**: Protest frequency, UGTT mobilization, and youth wage dynamics.
- **P(t) - Political**: Elite cohesion and institutional legitimacy decay.
- **I(t) - Ideological**: Polarization index and narrative fragmentation.
- **R(t) - RRI Baseline**: The system's current risk baseline.

### Alignment Equation
The system calculates **Systemic Alignment** ($S_a$):
$$S_a = \min(1, \mu \cdot 0.6 + (1 - \sigma^2 \cdot 4) \cdot 0.4)$$
Where:
- $\mu$: Mean intensity of elevated cycles (>0.55).
- $\sigma^2$: Variance between cycle intensities.

High $S_a$ indicates **Constructive Interference**—where cycles don't cancel each other out, leading to a "Crisis Window."

---

## 2. Risk/Resilience Index (RRI)
The RRI is the primary output of the `RRIEngine`.

### Extraction & Scoring
Signals are extracted from unstructured data using Gemini 1.5. Each signal ($s$) has:
- **Intensity** ($i$): 0-1
- **Confidence** ($c$): 0-1
- **Decay** ($d$): Applied linearly over time.

### Final Weight Calculation
$$W_s = f(i, c, Reliability, Decay)$$
The engine then aggregates these into a unified score that shifts the system's baseline.

---

## 3. Ideological Fragmentation (OCI)
The **Opposition Cohesion Index (OCI)** measures the fragmentation of ideology.

$$OCI = 1 - \frac{\text{Number of Active Narratives}}{\text{Total Signaling Intensity}}$$

- **Low OCI [0.0 - 0.3]**: Extreme fragmentation. State repression is more effective because there is no unified counter-narrative.
- **High OCI [0.7 - 1.0]**: Unified mobilization. Indicates high potential for systemic shift.

---

## 4. Anomaly Detection Baseline
The `AnomalyDetectionEngine` uses a rolling baseline of the last 10 signal states.
An anomaly is triggered if:
$$\Delta Intensity > 2.5 \times \sigma_{\text{baseline}}$$

This detects "Black Swan" events or sudden escalations that exceed standard systemic jitter.

---

## 5. Entrepreneurial Decision Engine (EDE) Logic
The EDE maps macro-risk (RRI) into micro-economic decisions.

### Risk-Adjusted Location Scoring ($L_s$)
For a given sector, the viability of a governorate ($g$) is calculated as:
$$L_s = (1 - g_{risk}) \cdot 0.35 + g_{market} \cdot 0.30 + g_{infra} \cdot 0.20 + g_{labor} \cdot 0.15 - (P_{rev} \cdot 0.3 \cdot g_{risk})$$

Where:
- $P_{rev}$: Prob(Revolution) from the Civilizational Engine.
- $g_{risk}$: Statistical historical instability of that region.

### Startup Viability Threshold
A venture is flagged as "CRITICAL" if the required startup capital ($C$) vs. current Currency Volatility ($V_{fx}$) exceeds the threshold:
$$\text{Threshold} = \frac{C \cdot (1 + V_{fx})}{1 - P_{rev}} > \text{Available Liquidity}$$
