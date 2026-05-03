from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import numpy as np

def clamp01(v: float) -> float:
    return max(0.0, min(1.0, v))

def normalize(value: float, v_min: float, v_max: float) -> float:
    if v_max == v_min:
        return 0.5
    return clamp01((value - v_min) / (v_max - v_min))

def rainfall_to_deficit(anomaly: float) -> float:
    # anomaly range: -1.0 (severe drought) to +1.0 (flood)
    return clamp01((-anomaly + 1) / 2)

def soil_to_deficit(moisture: float) -> float:
    # moisture 0–1 (0 = bone dry, 0.6+ = saturated)
    return clamp01(1 - moisture / 0.6)

def normalize_ndvi(ndvi: float) -> float:
    return normalize(ndvi, 0.1, 0.9)

class TreeCropsResult(BaseModel):
    governorate: str
    fruit_tree_health_index: float
    seasonal_yield_variability: float
    market_supply_pressure: float
    date_palm_health_index: float
    groundwater_dependency_stress: float
    oasis_viability_score: float
    tree_crop_risk: float
    long_term_decline_flag: bool

class VegetablesResult(BaseModel):
    governorate: str
    vegetable_supply_index: float
    harvest_cycle_disruption: float
    price_volatility_pressure: float
    vegetable_risk: float
    rapid_deterioration_flag: bool

class WaterIntelResult(BaseModel):
    governorate: str
    water_reserve_index: float
    evaporation_loss_rate: float
    rainfall_decline_trend: float
    desertification_index: float
    water_stress_composite: float
    water_crisis_flag: bool

class BCIResult(BaseModel):
    BCI: float
    level: str # 'NORMAL', 'STRESS', 'HIGH_RISK', 'CRISIS'
    velocity: float
    supply_stress: float
    price_pressure: float
    public_signal: float
    epsilon_shock: float
    salience_boost: float
    pipeline_updates: Dict[str, float]
    early_warning: bool
    crisis_imminent: bool

class AgroSystemResult(BaseModel):
    governorate: str
    timestamp: datetime
    tree_crops: TreeCropsResult
    vegetables: VegetablesResult
    water_intel: WaterIntelResult
    food_production_risk: float
    agro_stress_index: float
    risk_flag: str # 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    pipeline_updates: Dict[str, float]
    rri_shock_magnitude: float
    rri_salience_boost: float
    oasis_collapse_risk: bool
    water_crisis: bool
    rapid_veg_decline: bool

DATE_PALM_GOVS = {'tozeur', 'kebili', 'tataouine', 'gafsa', 'medenine'}
CITRUS_GOVS = {'nabeul', 'sousse', 'monastir', 'bizerte', 'beja', 'jendouba', 'sfax', 'mahdia'}
VEG_GOVS = {'nabeul', 'beja', 'jendouba', 'manouba', 'ariana', 'zaghouan', 'sidi_bouzid', 'kairouan', 'sfax', 'mahdia'}
DAM_GOVS = {'beja', 'jendouba', 'siliana', 'kef', 'zaghouan', 'kairouan', 'kasserine'}
DESERT_GOVS = {'tozeur', 'kebili', 'tataouine', 'gafsa', 'medenine'}

class AgroIntelligenceEngine:
    """
    Agro-Climate Intelligence System (ASIL) — TunisiaIntel v2.0
    Ported from TypeScript to Python for backend orchestration.
    """

    def compute_tree_crops(self, inputs: Dict[str, Any]) -> TreeCropsResult:
        gov = inputs["governorate"]
        is_date_palm = gov in DATE_PALM_GOVS
        is_citrus = gov in CITRUS_GOVS

        ndvi_n = normalize_ndvi(inputs["ndvi"])
        soil_n = clamp01(inputs["soil_moisture"])
        temp_stress = clamp01((inputs["temperature"] - 24) / 16)

        if is_citrus:
            fruit_tree_health = clamp01(ndvi_n * 0.50 + soil_n * 0.30 + (1 - temp_stress) * 0.20)
        else:
            fruit_tree_health = clamp01(ndvi_n * 0.60 + soil_n * 0.40)

        seasonal_variability = clamp01(abs(inputs["rainfall_anomaly"]) * 0.60 + temp_stress * 0.40)
        market_pressure = clamp01((1 - fruit_tree_health) * 0.55 + seasonal_variability * 0.45)

        gw_stress = clamp01(inputs["groundwater_stress"])
        rain_deficit = rainfall_to_deficit(inputs["rainfall_anomaly"])
        ndvi_decline = clamp01(-min(0, inputs.get("ndvi_trend_365d", 0)) * 5)

        if is_date_palm:
            date_palm_health = clamp01(ndvi_n * 0.30 + (1 - gw_stress) * 0.40 + (1 - ndvi_decline) * 0.30)
            gw_dep_stress = clamp01(gw_stress * 0.70 + rain_deficit * 0.30)
            oasis_viability = clamp01(date_palm_health * 0.40 + (1 - gw_dep_stress) * 0.40 + (1 - ndvi_decline) * 0.20)
        else:
            date_palm_health = clamp01(ndvi_n * 0.70 + (1 - gw_stress) * 0.30)
            gw_dep_stress = clamp01(gw_stress * 0.40)
            oasis_viability = 1.0

        if is_date_palm and is_citrus:
            tree_risk = clamp01((1 - fruit_tree_health) * 0.45 + (1 - date_palm_health) * 0.55)
        elif is_date_palm:
            tree_risk = clamp01((1 - date_palm_health) * 0.70 + (1 - fruit_tree_health) * 0.30)
        else:
            tree_risk = clamp01((1 - fruit_tree_health) * 0.80 + (1 - date_palm_health) * 0.20)

        return TreeCropsResult(
            governorate=gov,
            fruit_tree_health_index=round(fruit_tree_health, 4),
            seasonal_yield_variability=round(seasonal_variability, 4),
            market_supply_pressure=round(market_pressure, 4),
            date_palm_health_index=round(date_palm_health, 4),
            groundwater_dependency_stress=round(gw_dep_stress, 4),
            oasis_viability_score=round(oasis_viability, 4),
            tree_crop_risk=round(tree_risk, 4),
            long_term_decline_flag=inputs.get("ndvi_trend_365d", 0) < -0.08
        )

    def compute_vegetables(self, inputs: Dict[str, Any]) -> VegetablesResult:
        gov = inputs["governorate"]
        is_veg_gov = gov in VEG_GOVS

        ndvi_n = normalize_ndvi(inputs["ndvi"])
        ndvi_drop_30d = clamp01(-min(0, inputs.get("ndvi_trend_30d", 0)) * 8)
        temp_spike = clamp01((inputs["temperature"] - 28) / 12)
        rain_deficit = rainfall_to_deficit(inputs["rainfall_anomaly"])
        soil_def = soil_to_deficit(inputs["soil_moisture"])

        veg_supply = clamp01(ndvi_n * 0.40 + (1 - ndvi_drop_30d) * 0.35 + (1 - temp_spike) * 0.25)
        if not is_veg_gov:
            veg_supply *= 0.7

        disruption = clamp01(rain_deficit * 0.45 + soil_def * 0.30 + temp_spike * 0.25)
        volatility = clamp01((1 - veg_supply) * 0.55 + disruption * 0.45)
        veg_risk = clamp01((1 - veg_supply) * 0.50 + disruption * 0.30 + volatility * 0.20)

        return VegetablesResult(
            governorate=gov,
            vegetable_supply_index=round(veg_supply, 4),
            harvest_cycle_disruption=round(disruption, 4),
            price_volatility_pressure=round(volatility, 4),
            vegetable_risk=round(veg_risk, 4),
            rapid_deterioration_flag=inputs.get("ndvi_trend_30d", 0) < -0.05
        )

    def compute_water_intel(self, inputs: Dict[str, Any]) -> WaterIntelResult:
        gov = inputs["governorate"]
        is_dam_gov = gov in DAM_GOVS
        is_desert = gov in DESERT_GOVS

        dam_n = clamp01(inputs.get("dam_level_pct", 35) / 100)
        soil_n = clamp01(inputs["soil_moisture"])
        rain_surplus = clamp01((inputs["rainfall_anomaly"] + 1) / 2)

        if is_dam_gov:
            reserve_index = clamp01(dam_n * 0.50 + soil_n * 0.25 + rain_surplus * 0.25)
        elif is_desert:
            reserve_index = clamp01((1 - inputs["groundwater_stress"]) * 0.60 + soil_n * 0.20 + rain_surplus * 0.20)
        else:
            reserve_index = clamp01(soil_n * 0.45 + rain_surplus * 0.35 + dam_n * 0.20)

        evap_loss = clamp01(max(0, (inputs["temperature"] - 20) / 20) * 0.60 + (1 - soil_n) * 0.40)
        rain_trend = clamp01(inputs.get("ndvi_trend_365d", 0) + 0.5) * 2 - 1
        ndvi_long_loss = clamp01(-min(0, inputs.get("ndvi_trend_365d", 0)) * 6)
        rain_long_def = rainfall_to_deficit(inputs["rainfall_anomaly"])

        if is_desert:
            desert_index = clamp01(ndvi_long_loss * 0.40 + inputs["groundwater_stress"] * 0.35 + rain_long_def * 0.25)
        else:
            desert_index = clamp01(ndvi_long_loss * 0.50 + rain_long_def * 0.35 + evap_loss * 0.15)

        water_stress = clamp01((1 - reserve_index) * 0.45 + desert_index * 0.30 + evap_loss * 0.25)

        return WaterIntelResult(
            governorate=gov,
            water_reserve_index=round(reserve_index, 4),
            evaporation_loss_rate=round(evap_loss, 4),
            rainfall_decline_trend=round(rain_trend, 4),
            desertification_index=round(desert_index, 4),
            water_stress_composite=round(water_stress, 4),
            water_crisis_flag=reserve_index < 0.30
        )

    def compute_bci(self, inputs: Dict[str, Any]) -> BCIResult:
        # Layer 1: Supply Stress
        supply_stress = clamp01(
            inputs.get("wheat_stress_index", 0.35) * 0.40 +
            inputs.get("import_dependency_ratio", 0.55) * 0.30 +
            inputs.get("stock_depletion", 0.4) * 0.20 +
            inputs.get("milling_disruption", 0.2) * 0.10
        )

        # Layer 2: Price Pressure
        flour_price_change = clamp01(max(0, inputs.get("inflation", 7.1) - 4) / 12)
        subsidy_burden = clamp01(inputs.get("food_subsidy_cost", 2.0) / 3.0)
        black_market_premium = clamp01(inputs.get("parallel_premium", 18) / 30)

        price_pressure = clamp01(
            flour_price_change * 0.50 +
            subsidy_burden * 0.30 +
            black_market_premium * 0.20
        )

        # Layer 3: Public Signal
        protest_norm = clamp01(inputs.get("protest_events_30d", 23) / 30)
        public_signal = clamp01(
            inputs.get("queue_reports", 0.2) * 0.40 +
            inputs.get("flour_sei_score", 0.1) * 0.30 +
            inputs.get("media_bread_score", 0.2) * 0.20 +
            protest_norm * 0.10
        )

        bci = clamp01(supply_stress * 0.40 + price_pressure * 0.35 + public_signal * 0.25)
        
        level = 'NORMAL'
        if bci > 0.70: level = 'CRISIS'
        elif bci > 0.50: level = 'HIGH_RISK'
        elif bci > 0.30: level = 'STRESS'

        velocity = round(bci - inputs.get("bci_previous_7d", 0), 4)

        epsilon_shock = round(min(0.30, (bci - 0.60) * 0.75), 4) if bci > 0.60 else 0.0
        salience_boost = round(min(0.15, bci * 0.18), 4)

        pipeline_updates = {
            'social.food_security': round(1 - bci, 4),
            'economy.food_subsidies': round(subsidy_burden, 4),
            'environment.drought': round(supply_stress, 4)
        }

        return BCIResult(
            BCI=round(bci, 4),
            level=level,
            velocity=velocity,
            supply_stress=round(supply_stress, 4),
            price_pressure=round(price_pressure, 4),
            public_signal=round(public_signal, 4),
            epsilon_shock=epsilon_shock,
            salience_boost=salience_boost,
            pipeline_updates=pipeline_updates,
            early_warning=velocity > 0.20,
            crisis_imminent=bci > 0.70
        )

    def process_agro_system(self, inputs: Dict[str, Any], wheat_stress_index: float = 0.35) -> AgroSystemResult:
        tree = self.compute_tree_crops(inputs)
        veg = self.compute_vegetables(inputs)
        water = self.compute_water_intel(inputs)

        food_prod_risk = clamp01(
            wheat_stress_index * 0.40 +
            veg.vegetable_risk * 0.35 +
            tree.tree_crop_risk * 0.15 +
            (1 - tree.date_palm_health_index) * 0.10
        )

        agro_stress = clamp01(
            food_prod_risk * 0.50 +
            water.water_stress_composite * 0.30 +
            water.desertification_index * 0.20
        )

        risk_flag = 'LOW'
        if agro_stress > 0.75: risk_flag = 'CRITICAL'
        elif agro_stress > 0.55: risk_flag = 'HIGH'
        elif agro_stress > 0.35: risk_flag = 'MEDIUM'

        pipeline_updates = {
            'economy.agriculture': round(1 - food_prod_risk * 0.65, 4),
            'economy.food_subsidies': round(clamp01(food_prod_risk * 0.8), 4),
            'social.food_security': round(1 - agro_stress, 4),
            'environment.water_stress': round(water.water_stress_composite, 4),
            'environment.desertification': round(water.desertification_index, 4),
            'environment.drought': round(clamp01(wheat_stress_index * 0.7 + (0.3 if water.water_reserve_index < 0.4 else 0)), 4),
            'environment.dam_levels': round(clamp01(inputs.get("dam_level_pct", 35) / 100), 4),
            'environment.groundwater': round(inputs.get("groundwater_stress", 0.55), 4)
        }

        gov = inputs["governorate"]
        oasis_trigger = gov in DATE_PALM_GOVS and tree.oasis_viability_score < 0.40
        base_shock = min(0.25, (agro_stress - 0.60) * 0.625) if agro_stress > 0.60 else 0.0
        
        compound_trigger = water.water_reserve_index < 0.30 and food_prod_risk > 0.60
        rri_shock = round(min(0.30, base_shock + (0.10 if compound_trigger else 0) + (0.05 if oasis_trigger else 0)), 4)
        rri_salience = round(min(0.15, agro_stress * 0.15), 4)

        return AgroSystemResult(
            governorate=inputs["governorate"],
            timestamp=datetime.now(),
            tree_crops=tree,
            vegetables=veg,
            water_intel=water,
            food_production_risk=round(food_prod_risk, 4),
            agro_stress_index=round(agro_stress, 4),
            risk_flag=risk_flag,
            pipeline_updates=pipeline_updates,
            rri_shock_magnitude=rri_shock,
            rri_salience_boost=rri_salience,
            oasis_collapse_risk=oasis_trigger,
            water_crisis=water.water_crisis_flag,
            rapid_veg_decline=veg.rapid_deterioration_flag
        )

    def process_all_national(self, inputs: Dict[str, Dict[str, Any]], bci_inputs: Dict[str, Any], wheat_stress: Dict[str, float] = {}) -> Dict[str, Any]:
        results = []
        for gov, bundle in inputs.items():
            ws = wheat_stress.get(gov, 0.35)
            # Ensure gov is in bundle
            bundle["governorate"] = gov
            results.append(self.process_agro_system(bundle, ws))

        if not results:
            return {}

        n = len(results)
        national_food_risk = clamp01(sum(r.food_production_risk for r in results) / n)
        national_agro_stress = clamp01(sum(r.agro_stress_index for r in results) / n)
        national_water_stress = clamp01(sum(r.water_intel.water_stress_composite for r in results) / n)

        bci = self.compute_bci(bci_inputs)

        critical_govs = [r.governorate for r in results if r.risk_flag == 'CRITICAL']
        oasis_at_risk = [r.governorate for r in results if r.oasis_collapse_risk]
        water_crisis_govs = [r.governorate for r in results if r.water_crisis]

        max_gov_shock = max((r.rri_shock_magnitude for r in results), default=0)
        aggregate_shock = clamp01(max(max_gov_shock, bci.epsilon_shock))
        aggregate_salience = clamp01(max([r.rri_salience_boost for r in results] + [bci.salience_boost], default=0))

        def get_avg(field):
            return round(sum(r.pipeline_updates[field] for r in results) / n, 4)

        rri_overrides = {
            'economy.agriculture': get_avg('economy.agriculture'),
            'social.food_security': round(min(get_avg('social.food_security'), 1 - bci.BCI), 4),
            'environment.water_stress': get_avg('environment.water_stress'),
            'environment.desertification': get_avg('environment.desertification'),
            'environment.drought': get_avg('environment.drought'),
            'environment.dam_levels': get_avg('environment.dam_levels'),
            'environment.groundwater': get_avg('environment.groundwater'),
            '_sei_shock_magnitude': round(aggregate_shock, 4),
            '_sei_salience_boost': round(aggregate_salience, 4)
        }

        return {
            "results": [r.model_dump(mode='json') for r in results],
            "bci": bci.model_dump(mode='json'),
            "national_food_risk": round(national_food_risk, 4),
            "national_agro_stress": round(national_agro_stress, 4),
            "national_water_stress": round(national_water_stress, 4),
            "critical_govs": critical_govs,
            "oasis_at_risk_govs": oasis_at_risk,
            "water_crisis_govs": water_crisis_govs,
            "rri_overrides": rri_overrides,
            "generated_at": datetime.now().isoformat()
        }
