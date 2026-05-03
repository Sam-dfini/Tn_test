import { VariableMap, GovernorateMap, NewsFeedItem } from '../types';

export const mockVariables: VariableMap = {
  "A.1": {"id":"A.1","category":"Economic","name":"Real GDP Growth Rate","value":2.1,"weight":0.045,"threshold":2.0,"volatility":0.015,"history":[1.6,1.8,2.0,2.3,2.1],"pipelineField":"economy.gdp_growth","nlpKeywords":["economic growth","GDP slowdown","economic stagnation"],"dataSource":"IMF Forecast"},
  "A.2": {"id":"A.2","category":"Economic","name":"GDP Per Capita (Nominal)","value":4622,"weight":0.03,"threshold":4500,"volatility":150,"history":[4181,4350,4450,4550,4622],"pipelineField":"economy.gdp_per_capita","nlpKeywords":["GDP per capita","standard of living","wealth"],"dataSource":"Trade Forecast"},
  "A.3": {"id":"A.3","category":"Economic","name":"Unemployment Rate","value":15.3,"weight":0.05,"threshold":12,"volatility":0.5,"history":[14.7,15.1,15.2,15.4,15.3],"pipelineField":"labor.unemployment_rate","nlpKeywords":["joblessness","unemployment","youth out of work"],"dataSource":"World Bank / ILO Estimate"},
  "A.4": {"id":"A.4","category":"Economic","name":"Inflation (CPI)","value":5.0,"weight":0.04,"threshold":4.0,"volatility":0.3,"history":[7.2,6.8,6.1,5.6,5.0],"pipelineField":"economy.inflation","nlpKeywords":["price rise","cost of living","inflation"],"dataSource":"National Statistics / TradingEconomics"},
  "A.5": {"id":"A.5","category":"Economic","name":"Personal Remittances (% of GDP)","value":6.3,"weight":0.025,"threshold":5.0,"volatility":0.2,"history":[6.1,6.2,6.3,6.3,6.3],"pipelineField":"economy.remittances_percent_gdp","nlpKeywords":["remittances","foreign transfers"],"dataSource":"World Bank 2024"},
  "B.1": {"id":"B.1","category":"Environmental","name":"Water Stress Index","value":null,"weight":0.05,"threshold":0.5,"volatility":0.01,"history":[],"pipelineField":"environment.water_stress","nlpKeywords":["water shortage","drought","scarcity"],"dataSource":"Estimation Pending 2026 Release"},
  "C.1": {"id":"C.1","category":"Digital & Connectivity","name":"Internet Penetration (%)","value":84.3,"weight":0.03,"threshold":80,"volatility":0.5,"history":[72,78,82,84,84.3],"pipelineField":"digital.internet_penetration","nlpKeywords":["internet access","connectivity","network outage"],"dataSource":"DataReportal 2026"},
  "C.2": {"id":"C.2","category":"Digital & Connectivity","name":"Social Media User Penetration (%)","value":63.3,"weight":0.02,"threshold":60,"volatility":0.4,"history":[58.9,60,61.5,62.5,63.3],"pipelineField":"digital.social_media_users","nlpKeywords":["social media","digital mobilization"],"dataSource":"DataReportal 2026"},
  "D.1": {"id":"D.1","category":"Social & Protest","name":"Protest Frequency (Annual)","value":4838,"weight":0.07,"threshold":2000,"volatility":500,"history":[1200,1600,2500,3000,4838],"pipelineField":"social.protest_count","nlpKeywords":["protests","street demonstrations","civil unrest"],"dataSource":"FTDES 2025 Protest Count"}
};

export const mockGovernorates: GovernorateMap = {
  'TUN': { id: 'TUN', name: 'Tunis', unemp: 0.15, water_stress: 0.4, hist_protest: 0.8, security_presence: 0.9 },
  'SFA': { id: 'SFA', name: 'Sfax', unemp: 0.18, water_stress: 0.6, hist_protest: 0.7, security_presence: 0.7 },
  'SOU': { id: 'SOU', name: 'Sousse', unemp: 0.12, water_stress: 0.5, hist_protest: 0.5, security_presence: 0.8 },
  'KAS': { id: 'KAS', name: 'Kasserine', unemp: 0.35, water_stress: 0.9, hist_protest: 0.95, security_presence: 0.4 },
  'SID': { id: 'SID', name: 'Sidi Bouzid', unemp: 0.30, water_stress: 0.85, hist_protest: 0.9, security_presence: 0.5 },
  'GAB': { id: 'GAB', name: 'Gabes', unemp: 0.25, water_stress: 0.8, hist_protest: 0.75, security_presence: 0.6 },
};

export const mockNewsFeed: NewsFeedItem[] = [
  { id: 'n1', title: 'Protests erupt in Kasserine over water shortages', impact: 0.8, variablesAffected: ['B.1', 'A.2'], timestamp: Date.now() - 3600000 },
  { id: 'n2', title: 'New economic reforms announced by government', impact: -0.3, variablesAffected: ['A.1'], timestamp: Date.now() - 7200000 },
  { id: 'n3', title: 'Rural internet connectivity drops significantly', impact: 0.6, variablesAffected: ['C.2'], timestamp: Date.now() - 8640000 },
];
