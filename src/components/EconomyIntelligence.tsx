import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Landmark, 
  PieChart as PieChartIcon, 
  AlertTriangle,
  ArrowUpRight,
  Activity,
  BarChart3,
  Globe,
  Layers,
  Map,
  ChevronRight,
  Info,
  Clock,
  RefreshCw,
  Zap,
  Wheat,
  Factory,
  Palmtree,
  Users,
  Briefcase,
  Terminal,
  Wifi,
  Radio,
  Pill,
  Syringe,
  Skull,
  ShieldCheck,
  Rocket,
  Lightbulb,
  LayoutGrid
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { getRealTimeMacroIndicators, MacroIndicator } from '../services/economicDataService';
import { CornerAccent, BackgroundGrid, ModuleHeader, LiveTicker } from './ProfessionalShared';
import { usePipeline } from '../context/PipelineContext';

type SubTab = 'macro' | 'sector' | 'market' | 'regional' | 'poverty' | 'pharmacy' | 'business';

const economicAlerts = [
  { code: 'ECON-CPI-01', title: 'Inflation Spike in Food Sector', impact: 'CRITICAL' },
  { code: 'ECON-BCT-04', title: 'Forex Reserves Below 90 Days', impact: 'CRITICAL' },
  { code: 'ECON-DEBT-09', title: 'External Repayment Q2 Peak', impact: 'HIGH' },
  { code: 'ECON-TND-12', title: 'Parallel Market Premium +20%', impact: 'HIGH' },
  { code: 'ECON-GDP-02', title: 'Growth Forecast Revised Down', impact: 'MEDIUM' },
  { code: 'REM-GDP-01', title: 'Remittance Share: 9.4% GDP — Structural Dependency', impact: 'HIGH' },
  { code: 'REM-FRA-02', title: 'France Concentration: 52% of Inflows — Risk', impact: 'MEDIUM' }
];

const tunindexHistory = [
  { date: '2025-01', value: 8120 },
  { date: '2025-02', value: 8150 },
  { date: '2025-03', value: 8080 },
  { date: '2025-04', value: 7950 },
  { date: '2025-05', value: 7820 },
  { date: '2025-06', value: 7740 },
  { date: '2025-07', value: 7680 },
  { date: '2025-08', value: 7620 },
  { date: '2025-09', value: 7550 },
  { date: '2025-10', value: 7480 },
  { date: '2025-11', value: 7420 },
  { date: '2025-12', value: 7350 },
  { date: '2026-01', value: 7280 },
  { date: '2026-02', value: 7210 },
  { date: '2026-03', value: 7150 }
];

const currencyHistory = [
  { date: '2025-01', usd: 3.05, eur: 3.32 },
  { date: '2025-02', usd: 3.08, eur: 3.35 },
  { date: '2025-03', usd: 3.12, eur: 3.38 },
  { date: '2025-04', usd: 3.15, eur: 3.41 },
  { date: '2025-05', usd: 3.18, eur: 3.44 },
  { date: '2025-06', usd: 3.20, eur: 3.46 },
  { date: '2025-07', usd: 3.22, eur: 3.48 },
  { date: '2025-08', usd: 3.25, eur: 3.51 },
  { date: '2025-09', usd: 3.28, eur: 3.54 },
  { date: '2025-10', usd: 3.31, eur: 3.57 },
  { date: '2025-11', usd: 3.34, eur: 3.60 },
  { date: '2025-12', usd: 3.37, eur: 3.63 },
  { date: '2026-01', usd: 3.40, eur: 3.66 },
  { date: '2026-02', usd: 3.43, eur: 3.69 },
  { date: '2026-03', usd: 3.46, eur: 3.72 }
];

const marketIndicators = [
  { label: 'TUNINDEX', value: '7,150.42', change: '-1.2%', trend: 'down', status: 'CRITICAL' },
  { label: 'Market Cap', value: '22.4B TND', change: '-4.8%', trend: 'down', status: 'WARNING' },
  { label: 'Daily Volume', value: '4.2M TND', change: '+12.4%', trend: 'up', status: 'GOOD' },
  { label: 'TND / USD', value: '3.46', change: '+0.8%', trend: 'up', status: 'CRITICAL' },
  { label: 'TND / EUR', value: '3.72', change: '+0.5%', trend: 'up', status: 'CRITICAL' },
  { label: '10Y Bond Yield', value: '11.4%', change: '+0.2%', trend: 'up', status: 'CRITICAL' }
];

const essentialGoodsPrices = [
  { item: 'Red Meat (Beef)', price: '42.500', unit: 'kg', inflation: '+18.4%', status: 'CRITICAL' },
  { item: 'Chicken (Poultry)', price: '9.850', unit: 'kg', inflation: '+12.2%', status: 'WARNING' },
  { item: 'Vegetable Oil', price: '1.200', unit: 'L', inflation: '+0.0%', status: 'GOOD' }, // Subsidized
  { item: 'Milk (Semi-Skimmed)', price: '1.350', unit: 'L', inflation: '+0.0%', status: 'GOOD' }, // Subsidized
  { item: 'Eggs (Pack of 4)', price: '1.480', unit: 'unit', inflation: '+8.5%', status: 'WARNING' },
  { item: 'Bread (Baguette)', price: '0.190', unit: 'unit', inflation: '+0.0%', status: 'GOOD' }, // Subsidized
  { item: 'Tomatoes', price: '2.400', unit: 'kg', inflation: '+24.1%', status: 'CRITICAL' },
  { item: 'Potatoes', price: '1.800', unit: 'kg', inflation: '+15.2%', status: 'WARNING' }
];

const criticalGoodsAlerts = [
  { item: 'Red Meat', alert: 'Supply shortage in local markets; prices exceeding 45 TND in some regions.', level: 'CRITICAL' },
  { item: 'Chicken', alert: 'Feed cost increase driving farm-gate prices up by 15% this month.', level: 'WARNING' },
  { item: 'Sugar', alert: 'Intermittent availability in retail; state monopoly facing import delays.', level: 'CRITICAL' },
  { item: 'Coffee', alert: 'Strategic stocks at 15-day low; rationing observed in major supermarkets.', level: 'CRITICAL' }
];

const foodInflationHistory = [
  { month: 'Oct 25', rate: 8.2 },
  { month: 'Nov 25', rate: 8.5 },
  { month: 'Dec 25', rate: 8.9 },
  { month: 'Jan 26', rate: 9.1 },
  { month: 'Feb 26', rate: 9.4 },
  { month: 'Mar 26', rate: 9.8 }
];

const historicalMacroData = [
  { year: '2021', gdp: 3.1, inflation: 5.7 },
  { year: '2022', gdp: 2.4, inflation: 8.3 },
  { year: '2023', gdp: 1.2, inflation: 9.4 },
  { year: '2024', gdp: 0.8, inflation: 8.1 },
  { year: '2025', gdp: 0.4, inflation: 7.1 }
];

const povertyByGovernorate = [
  { name: 'Kairouan', rate: 34.2, change: '+2.1', risk: 'CRITICAL', governance: 3.2, vulnerability: 8.5 },
  { name: 'Kasserine', rate: 32.8, change: '+1.8', risk: 'CRITICAL', governance: 2.8, vulnerability: 9.2 },
  { name: 'Sidi Bouzid', rate: 30.5, change: '+1.5', risk: 'CRITICAL', governance: 3.5, vulnerability: 8.8 },
  { name: 'Tataouine', rate: 30.4, change: '+2.2', risk: 'CRITICAL', governance: 3.1, vulnerability: 8.9 },
  { name: 'Kef', rate: 28.4, change: '+1.2', risk: 'CRITICAL', governance: 3.8, vulnerability: 8.2 },
  { name: 'Kebili', rate: 28.2, change: '+1.4', risk: 'HIGH', governance: 4.1, vulnerability: 7.8 },
  { name: 'Siliana', rate: 26.4, change: '+0.5', risk: 'HIGH', governance: 4.0, vulnerability: 7.2 },
  { name: 'Jendouba', rate: 24.8, change: '+1.2', risk: 'HIGH', governance: 3.8, vulnerability: 7.9 },
  { name: 'Tozeur', rate: 24.8, change: '+1.1', risk: 'HIGH', governance: 4.3, vulnerability: 7.4 },
  { name: 'Gafsa', rate: 21.2, change: '+2.4', risk: 'HIGH', governance: 4.5, vulnerability: 8.1 },
  { name: 'Beja', rate: 16.8, change: '+0.3', risk: 'MEDIUM', governance: 5.4, vulnerability: 5.8 },
  { name: 'Mahdia', rate: 16.4, change: '+0.4', risk: 'MEDIUM', governance: 5.8, vulnerability: 5.5 },
  { name: 'Zaghouan', rate: 14.8, change: '+0.2', risk: 'MEDIUM', governance: 6.1, vulnerability: 5.2 },
  { name: 'Bizerte', rate: 14.2, change: '+0.5', risk: 'MEDIUM', governance: 6.4, vulnerability: 4.8 },
  { name: 'Sfax', rate: 12.4, change: '+0.4', risk: 'MEDIUM', governance: 7.1, vulnerability: 4.2 },
  { name: 'Manouba', rate: 11.8, change: '+0.2', risk: 'LOW', governance: 7.4, vulnerability: 3.5 },
  { name: 'Ariana', rate: 11.4, change: '+0.1', risk: 'LOW', governance: 7.8, vulnerability: 3.2 },
  { name: 'Tunis', rate: 8.4, change: '+0.1', risk: 'LOW', governance: 8.5, vulnerability: 2.5 },
  { name: 'Ben Arous', rate: 10.8, change: '+0.1', risk: 'LOW', governance: 8.1, vulnerability: 3.0 },
  { name: 'Sousse', rate: 10.2, change: '+0.2', risk: 'LOW', governance: 7.5, vulnerability: 3.8 },
  { name: 'Monastir', rate: 9.8, change: '+0.1', risk: 'LOW', governance: 8.4, vulnerability: 2.8 },
  { name: 'Nabeul', rate: 8.8, change: '+0.1', risk: 'LOW', governance: 8.2, vulnerability: 2.6 },
  { name: 'Gabes', rate: 22.4, change: '+0.9', risk: 'HIGH', governance: 4.6, vulnerability: 7.1 },
  { name: 'Medenine', rate: 18.8, change: '-0.5', risk: 'MEDIUM', governance: 6.2, vulnerability: 6.0 }
];

const criticalMolecules = [
  { name: 'Insulin (Rapid)', shortage: 'EXTREME', stock: '4 days', impact: 'High', category: 'Diabetes' },
  { name: 'Chemotherapy (5-FU)', shortage: 'CRITICAL', stock: '0 days', impact: 'Extreme', category: 'Oncology' },
  { name: 'Anti-epileptics', shortage: 'HIGH', stock: '12 days', impact: 'High', category: 'Neurology' },
  { name: 'Cardiovascular (ACE)', shortage: 'MODERATE', stock: '22 days', impact: 'Medium', category: 'Cardiology' },
  { name: 'Antibiotics (IV)', shortage: 'HIGH', stock: '8 days', impact: 'High', category: 'Infectious' },
  { name: 'Anti-asthmatics', shortage: 'CRITICAL', stock: '2 days', impact: 'High', category: 'Respiratory' },
  { name: 'Psychotropics', shortage: 'HIGH', stock: '15 days', impact: 'Medium', category: 'Mental Health' },
  { name: 'Dialysis Fluids', shortage: 'CRITICAL', stock: '5 days', impact: 'Extreme', category: 'Nephrology' }
];

const foodBasketData = [
  { month: 'OCT', essential: 145, luxury: 185, change: 2.4 },
  { month: 'NOV', essential: 152, luxury: 198, change: 4.8 },
  { month: 'DEC', essential: 158, luxury: 210, change: 3.9 },
  { month: 'JAN', essential: 165, luxury: 225, change: 4.4 },
  { month: 'FEB', essential: 172, luxury: 240, change: 4.2 },
  { month: 'MAR', essential: 185, luxury: 265, change: 7.5 }
];

const foodBasketByGovernorate = [
  { name: 'Tunis', essential: 145, luxury: 185, change: 2.4 },
  { name: 'Sfax', essential: 152, luxury: 198, change: 4.8 },
  { name: 'Gafsa', essential: 158, luxury: 210, change: 3.9 },
  { name: 'Kasserine', essential: 165, luxury: 225, change: 4.4 },
  { name: 'Sidi Bouzid', essential: 172, luxury: 240, change: 4.2 },
  { name: 'Gabes', essential: 185, luxury: 265, change: 7.5 },
  { name: 'Sousse', essential: 148, luxury: 190, change: 2.1 },
  { name: 'Monastir', essential: 146, luxury: 188, change: 2.0 },
  { name: 'Nabeul', essential: 144, luxury: 186, change: 1.9 },
  { name: 'Bizerte', essential: 150, luxury: 195, change: 3.2 },
  { name: 'Beja', essential: 155, luxury: 205, change: 4.1 },
  { name: 'Jendouba', essential: 160, luxury: 215, change: 4.5 },
  { name: 'Siliana', essential: 162, luxury: 220, change: 4.8 },
  { name: 'Zaghouan', essential: 147, luxury: 192, change: 2.5 },
  { name: 'Mahdia', essential: 149, luxury: 194, change: 2.8 },
  { name: 'Kef', essential: 164, luxury: 222, change: 5.1 },
  { name: 'Tozeur', essential: 168, luxury: 230, change: 5.5 },
  { name: 'Kebili', essential: 170, luxury: 235, change: 5.8 },
  { name: 'Tataouine', essential: 175, luxury: 245, change: 6.2 },
  { name: 'Medenine', essential: 172, luxury: 242, change: 6.0 },
  { name: 'Ariana', essential: 146, luxury: 187, change: 2.2 },
  { name: 'Ben Arous', essential: 147, luxury: 189, change: 2.3 },
  { name: 'Manouba', essential: 148, luxury: 191, change: 2.4 },
  { name: 'Kairouan', essential: 166, luxury: 228, change: 5.4 }
];

const povertyTrendData = [
  { year: '2015', national: 15.2, rural: 22.4, urban: 10.1 },
  { year: '2018', national: 15.5, rural: 23.1, urban: 10.4 },
  { year: '2021', national: 16.8, rural: 25.4, urban: 11.2 },
  { year: '2023', national: 18.2, rural: 28.1, urban: 12.5 },
  { year: '2024', national: 19.4, rural: 30.2, urban: 13.8 },
  { year: '2025', national: 21.1, rural: 32.4, urban: 15.2 }
];

const socialSafetyNetData = [
  { category: 'Direct Cash Transfer', value: 450, target: 600, status: 'UNDERFUNDED' },
  { category: 'Food Subsidies', value: 2800, target: 2400, status: 'OVER_BUDGET' },
  { category: 'Health Coverage (AMG)', value: 85, target: 95, status: 'WARNING' },
  { category: 'Education Support', value: 120, target: 200, status: 'CRITICAL' }
];

const pharmacyShortageData = [
  { month: 'OCT', missing: 245, critical: 42 },
  { month: 'NOV', missing: 280, critical: 58 },
  { month: 'DEC', missing: 312, critical: 75 },
  { month: 'JAN', missing: 350, critical: 82 },
  { month: 'FEB', missing: 320, critical: 68 },
  { month: 'MAR', missing: 385, critical: 94 }
];

const medicamentInflationData = [
  { month: 'OCT', subsidized: 0.0, nonSubsidized: 12.4 },
  { month: 'NOV', subsidized: 0.0, nonSubsidized: 14.8 },
  { month: 'DEC', subsidized: 2.5, nonSubsidized: 18.2 },
  { month: 'JAN', subsidized: 2.5, nonSubsidized: 22.4 },
  { month: 'FEB', subsidized: 2.5, nonSubsidized: 24.8 },
  { month: 'MAR', subsidized: 5.0, nonSubsidized: 28.5 }
];

const importDependencyData = [
  { name: 'Imported Finished Meds', value: 45, color: '#ef4444' },
  { name: 'Local Production (Raw Import)', value: 42, color: '#f59e0b' },
  { name: 'Local Production (Full)', value: 13, color: '#22c55e' }
];

const startupData = [
  { year: '2020', startups: 120, funding: 45, exits: 2 },
  { year: '2021', startups: 185, funding: 78, exits: 5 },
  { year: '2022', startups: 240, funding: 112, exits: 8 },
  { year: '2023', startups: 310, funding: 156, exits: 12 },
  { year: '2024', startups: 385, funding: 210, exits: 15 },
  { year: '2025', startups: 450, funding: 285, exits: 18 }
];

const startupSectors = [
  { name: 'FinTech', value: 32, color: '#00f2ff' },
  { name: 'AgriTech', value: 24, color: '#22c55e' },
  { name: 'HealthTech', value: 18, color: '#f43f5e' },
  { name: 'EdTech', value: 15, color: '#bf00ff' },
  { name: 'E-commerce', value: 11, color: '#f97316' }
];

const startupEcosystemMetrics = [
  { label: 'Total Startups', value: '450+', change: '+18%', trend: 'up', status: 'GOOD' },
  { label: 'Total Funding', value: '$285M', change: '+35%', trend: 'up', status: 'GOOD' },
  { label: 'Active Hubs', value: '14', change: '+2', trend: 'up', status: 'GOOD' },
  { label: 'Startup Act Labels', value: '980', change: '+120', trend: 'up', status: 'GOOD' },
  { label: 'Avg Funding/Startup', value: '$630K', change: '+14%', trend: 'up', status: 'WARNING' },
  { label: 'Exit Rate', value: '4.2%', change: '+0.8%', trend: 'up', status: 'WARNING' }
];

const remittanceHistory = [
  { year: '2020', total: 1.8, pctGdp: 4.2 },
  { year: '2021', total: 2.1, pctGdp: 5.1 },
  { year: '2022', total: 2.4, pctGdp: 6.2 },
  { year: '2023', total: 2.6, pctGdp: 7.8 },
  { year: '2024', total: 2.8, pctGdp: 8.5 },
  { year: '2025', total: 3.1, pctGdp: 9.4 }
];

const remittanceDistribution = [
  { name: 'France', value: 52, color: '#00f2ff' },
  { name: 'Italy', value: 18, color: '#bf00ff' },
  { name: 'Germany', value: 12, color: '#f43f5e' },
  { name: 'GCC', value: 10, color: '#f97316' },
  { name: 'Other', value: 8, color: '#475569' }
];

const remittanceRegionalData = [
  { region: 'Grand Tunis', urban: 42, rural: 5, total: 47 },
  { region: 'North East', urban: 15, rural: 8, total: 23 },
  { region: 'Sahel', urban: 25, rural: 12, total: 37 },
  { region: 'Center West', urban: 8, rural: 18, total: 26 },
  { region: 'South East', urban: 12, rural: 22, total: 34 },
  { region: 'South West', urban: 5, rural: 15, total: 20 }
];

const essentialMedsStatus = [
  { category: 'Insulin', availability: 62, trend: 'down', status: 'CRITICAL' },
  { category: 'Cancer Treatments', availability: 45, trend: 'down', status: 'CRITICAL' },
  { category: 'Antibiotics', availability: 78, trend: 'stable', status: 'WARNING' },
  { category: 'Chronic Disease Meds', availability: 55, trend: 'down', status: 'CRITICAL' }
];

export const EconomyIntelligence: React.FC = () => {
  const { data } = usePipeline();

  const macroData = [
    { month: 'JAN 25', gdp: 0.8, inflation: 7.2 },
    { month: 'FEB 25', gdp: 0.7, inflation: 7.3 },
    { month: 'MAR 25', gdp: 0.6, inflation: 7.4 },
    { month: 'APR 25', gdp: 0.5, inflation: 7.5 },
    { month: 'MAY 25', gdp: 0.4, inflation: 7.4 },
    { month: 'JUN 25', gdp: 0.45, inflation: 7.3 },
    { month: 'JUL 25', gdp: 0.5, inflation: 7.2 },
    { month: 'AUG 25', gdp: 0.4, inflation: 7.1 },
    { month: 'SEP 25', gdp: 0.35, inflation: 7.0 },
    { month: 'OCT 25', gdp: 0.3, inflation: 7.1 },
    { month: 'NOV 25', gdp: 0.25, inflation: 7.2 },
    { month: 'DEC 25', gdp: 0.2, inflation: 7.3 },
    { month: 'JAN 26', gdp: 0.25, inflation: 7.2 },
    { month: 'FEB 26', gdp: 0.3, inflation: 7.1 },
    { month: 'MAR 26', gdp: data.economy.gdp_growth, inflation: data.economy.inflation }
  ];

  const sectorData = [
    { name: 'Agriculture', growth: 4.2, contribution: 10.2, jobs: 14.5, jobTrend: -1.8, minWage: 450, avgSalary: 650, wageGrowth: 2.1 },
    { name: 'Manufacturing', growth: 0.5, contribution: 16.8, jobs: 21.2, jobTrend: 0.3, minWage: 520, avgSalary: 950, wageGrowth: 3.4 },
    { name: 'Tourism', growth: -12.4, contribution: 7.4, jobs: 8.7, jobTrend: -12.4, minWage: 480, avgSalary: 820, wageGrowth: -1.5 },
    { name: 'Phosphate', growth: -28.0, contribution: 3.1, jobs: 3.4, jobTrend: -2.8, minWage: 650, avgSalary: 1450, wageGrowth: 5.2 },
    { name: 'Energy', growth: -6.1, contribution: 4.2, jobs: 2.1, jobTrend: -6.1, minWage: 700, avgSalary: 1850, wageGrowth: 4.8 },
    { name: 'Financial', growth: 1.2, contribution: 8.3, jobs: 4.6, jobTrend: 1.2, minWage: 850, avgSalary: 2450, wageGrowth: 6.1 },
    { name: 'Construction', growth: -3.4, contribution: 5.9, jobs: 12.3, jobTrend: -3.4, minWage: 490, avgSalary: 880, wageGrowth: 1.8 },
    { name: 'Services', growth: 1.1, contribution: 44.1, jobs: 33.2, jobTrend: 1.1, minWage: 550, avgSalary: 1150, wageGrowth: 4.2 }
  ];

  const ministryWorkforceData = [
    { name: 'Education', workers: 245000, percentage: 35.2, avgSalary: 1250, growth: 4.2 },
    { name: 'Interior', workers: 112000, percentage: 16.1, avgSalary: 1350, growth: 5.8 },
    { name: 'Health', workers: 85000, percentage: 12.2, avgSalary: 1450, growth: 6.5 },
    { name: 'Defense', workers: 65000, percentage: 9.3, avgSalary: 1550, growth: 7.2 },
    { name: 'Agriculture', workers: 42000, percentage: 6.0, avgSalary: 1100, growth: 3.5 },
    { name: 'Finance', workers: 28000, percentage: 4.0, avgSalary: 1850, growth: 8.4 },
    { name: 'Higher Ed', workers: 25000, percentage: 3.6, avgSalary: 2100, growth: 5.1 },
    { name: 'Justice', workers: 18000, percentage: 2.6, avgSalary: 1650, growth: 4.8 },
    { name: 'Other', workers: 76000, percentage: 11.0, avgSalary: 1050, growth: 2.9 }
  ];

  const getSectorHealth = (sector: typeof sectorData[0]) => {
    if (sector.growth < -10 || (sector.growth < 0 && sector.wageGrowth < 0)) return 'CRITICAL';
    if (sector.growth > 2 && sector.wageGrowth > 2) return 'GOOD';
    return 'WARNING';
  };

  const inflationDriversData = [
    { month: 'APR 25', food: 4.2, energy: 2.1, services: 1.2 },
    { month: 'MAY 25', food: 4.0, energy: 2.2, services: 1.2 },
    { month: 'JUN 25', food: 3.8, energy: 2.3, services: 1.2 },
    { month: 'JUL 25', food: 3.7, energy: 2.3, services: 1.2 },
    { month: 'AUG 25', food: 3.6, energy: 2.3, services: 1.2 },
    { month: 'SEP 25', food: 3.5, energy: 2.3, services: 1.2 },
    { month: 'OCT 25', food: 3.6, energy: 2.3, services: 1.2 },
    { month: 'NOV 25', food: 3.7, energy: 2.3, services: 1.2 },
    { month: 'DEC 25', food: 3.8, energy: 2.3, services: 1.2 },
    { month: 'JAN 26', food: 3.7, energy: 2.3, services: 1.2 },
    { month: 'FEB 26', food: 3.6, energy: 2.3, services: 1.2 },
    { month: 'MAR 26', food: 3.6, energy: 2.3, services: 1.2 }
  ];

  const phosphateTrends = [
    { year: '2010', volume: 8.2, revenue: 1.8 },
    { year: '2015', volume: 4.5, revenue: 1.2 },
    { year: '2020', volume: 3.8, revenue: 0.9 },
    { year: '2023', volume: 3.5, revenue: 1.1 },
    { year: '2024', volume: 3.3, revenue: 0.95 },
    { year: '2025', volume: 3.1, revenue: 0.82 }
  ];

  const regionalData = [
    { country: 'Tunisia', gdp: data.economy.gdp_growth, inflation: data.economy.inflation, debt: data.economy.public_debt, unemployment: data.economy.unemployment, reserves: data.economy.fx_reserves, risk: 'CRITICAL', isTarget: true },
    { country: 'Morocco', gdp: 3.4, inflation: 4.2, debt: 71.3, unemployment: 11.8, reserves: 142, risk: 'MEDIUM' },
    { country: 'Egypt', gdp: 4.2, inflation: 12.8, debt: 94.2, unemployment: 7.4, reserves: 98, risk: 'HIGH' },
    { country: 'Algeria', gdp: 3.8, inflation: 6.9, debt: 52.1, unemployment: 12.3, reserves: 196, risk: 'MEDIUM' },
    { country: 'Jordan', gdp: 2.8, inflation: 3.9, debt: 91.4, unemployment: 22.4, reserves: 112, risk: 'HIGH' }
  ];

  const debtBreakdownData = [
    { name: 'External Debt', value: 62, color: '#ef4444' },
    { name: 'Domestic Debt', value: 28, color: '#f97316' },
    { name: 'SOE Debt', value: 10, color: '#fbbf24' }
  ];

  const [activeCategory, setActiveCategory] = useState<'MACRO' | 'REMITTANCES' | 'SECTOR' | 'MARKET' | 'STARTUP' | 'SOCIAL' | 'REGIONAL' | 'BUSINESS'>('MACRO');

  React.useEffect(() => {
    const handleNavigateSubTab = (e: any) => {
      const { subTab } = e.detail || {};
      if (subTab) {
        const mapping: Record<string, string> = {
          'macro': 'MACRO',
          'sector': 'SECTOR',
          'market': 'MARKET',
          'regional': 'REGIONAL',
          'poverty': 'SOCIAL',
          'pharmacy': 'MARKET',
          'business': 'BUSINESS'
        };
        const category = mapping[subTab.toLowerCase()];
        if (category) {
          setActiveCategory(category as any);
        }
      }
    };
    window.addEventListener('navigate-subtab', handleNavigateSubTab);
    return () => window.removeEventListener('navigate-subtab', handleNavigateSubTab);
  }, []);

  const categories = [
    { id: 'MACRO', label: 'Macroeconomic', icon: Landmark },
    { id: 'REMITTANCES', label: 'Remittances', icon: Globe },
    { id: 'SECTOR', label: 'Sector Dynamics', icon: Layers },
    { id: 'MARKET', label: 'Market & Price Monitoring', icon: BarChart3 },
    { id: 'STARTUP', label: 'Startup Ecosystem', icon: Rocket },
    { id: 'SOCIAL', label: 'Social Economy', icon: Users },
    { id: 'REGIONAL', label: 'Regional Analysis', icon: Globe },
    { id: 'BUSINESS', label: 'Business Climate', icon: Briefcase },
  ];

  const [macroIndicators, setMacroIndicators] = useState<MacroIndicator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [sectorSort, setSectorSort] = useState<'none' | 'asc' | 'desc'>('none');

  const sortedSectorData = [...sectorData].sort((a, b) => {
    if (sectorSort === 'asc') return a.growth - b.growth;
    if (sectorSort === 'desc') return b.growth - a.growth;
    return 0;
  });

  const fetchRealTimeData = async () => {
    setIsLoading(true);
    try {
      const data = await getRealTimeMacroIndicators();
      if (data && data.length > 0) {
        // Enhance with mock history for sparklines
        const enhancedData = data.map(ind => {
          const baseValue = parseFloat(ind.value) || 0;
          return {
            ...ind,
            history: Array(5).fill(0).map(() => baseValue * (0.9 + Math.random() * 0.2))
          };
        });
        setMacroIndicators(enhancedData);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch real-time economic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
  }, []);

  const renderBusinessClimate = () => {
    const compositeScore = (
      (data.economy.heritage_freedom_score || 0) + 
      (data.economy.cpi_score || 0) + 
      45 + // Global Innovation Index (Mock)
      48 + // Global Competitiveness (Mock)
      (100 - (data.economy.doing_business_rank || 0)) + // Doing Business Proxy
      42   // Fraser Institute (Mock)
    ) / 6;

    const getScoreColor = (score: number) => {
      if (score < 50) return 'text-intel-red';
      if (score < 60) return 'text-intel-orange';
      if (score < 70) return 'text-intel-cyan';
      return 'text-intel-green';
    };

    return (
      <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500">
        {/* SECTION 1 — ECONOMIC FREEDOM SCORECARD */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-intel-border pb-6 space-y-4 md:space-y-0">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">Economic Freedom Composite Score</h3>
              <p className="text-xs md:text-sm text-slate-500">Multi-index assessment — March 2026</p>
            </div>
            <div className="text-left md:text-right">
              <div className={`text-4xl md:text-5xl font-bold font-mono ${getScoreColor(compositeScore)}`}>
                {compositeScore.toFixed(1)}<span className="text-lg md:text-xl text-slate-600">/100</span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">Overall Climate Status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Index Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Index</th>
                      <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Score</th>
                      <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { name: 'Heritage Economic Freedom', score: data.economy.heritage_freedom_score || 0, rank: '121/184' },
                      { name: 'Transparency Intl (CPI)', score: data.economy.cpi_score || 0, rank: '87/180' },
                      { name: 'Global Innovation Index', score: 45, rank: '71/132' },
                      { name: 'Global Competitiveness', score: 48, rank: '87/141' },
                      { name: 'Doing Business (Proxy)', score: 100 - (data.economy.doing_business_rank || 0), rank: `${data.economy.doing_business_rank || 0}/190` },
                      { name: 'Economic Freedom (Fraser)', score: 42, rank: '128/165' }
                    ].map((idx, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-[10px] font-bold text-white uppercase">{idx.name}</td>
                        <td className={`py-3 text-[10px] font-mono font-bold text-right ${getScoreColor(idx.score)}`}>{idx.score.toString()}</td>
                        <td className="py-3 text-[10px] font-mono text-slate-400 text-right">{idx.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { subject: 'Property Rights', A: 42, full: 100 },
                  { subject: 'Gov Integrity', A: data.economy.cpi_score, full: 100 },
                  { subject: 'Judicial Effect', A: 38, full: 100 },
                  { subject: 'Tax Burden', A: 72, full: 100 },
                  { subject: 'Gov Spending', A: 45, full: 100 },
                  { subject: 'Fiscal Health', A: 32, full: 100 },
                  { subject: 'Business Freedom', A: 58, full: 100 },
                  { subject: 'Labor Freedom', A: 48, full: 100 },
                  { subject: 'Monetary Freedom', A: 65, full: 100 },
                  { subject: 'Trade Freedom', A: 68, full: 100 },
                  { subject: 'Invest Freedom', A: 35, full: 100 },
                  { subject: 'Finan Freedom', A: 30, full: 100 }
                ]}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Economic Freedom" dataKey="A" stroke="#00f2ff" fill="#00f2ff" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* SECTION 2 — HERITAGE BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Heritage Index: 12 Pillars</h3>
              <p className="text-[10px] text-slate-500">Comparative performance across 4 key categories</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { cat: 'Rule of Law', val: 37.3, color: '#ef4444' },
                  { cat: 'Gov Size', val: 49.7, color: '#f97316' },
                  { cat: 'Reg Efficiency', val: 57.0, color: '#fbbf24' },
                  { cat: 'Open Markets', val: 44.3, color: '#ef4444' }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="cat" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    { [37.3, 49.7, 57.0, 44.3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry < 50 ? '#ef4444' : entry < 60 ? '#f97316' : '#00f2ff'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl">
              <p className="text-[9px] text-slate-400 leading-relaxed">
                <span className="text-intel-red font-bold">CRITICAL WEAKNESS:</span> Rule of Law (37.3) remains the primary bottleneck, driven by low scores in Property Rights and Judicial Effectiveness.
              </p>
            </div>
          </div>

          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Corruption Perception (CPI) Trend</h3>
              <p className="text-[10px] text-slate-500">Transparency International Score - 2020-2026</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { year: '2020', score: 44 },
                  { year: '2021', score: 44 },
                  { year: '2022', score: 42 },
                  { year: '2023', score: 40 },
                  { year: '2024', score: 41 },
                  { year: '2025', score: 40 },
                  { year: '2026', score: data.economy.cpi_score }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="score" stroke="#00f2ff" strokeWidth={3} dot={{ r: 4, fill: '#00f2ff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500 uppercase">Current Score: {(data.economy.cpi_score || 0).toString()}/100</span>
              <span className="text-intel-red font-bold uppercase">Stagnant / Declining</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 — FDI TRACKER */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">FDI Inflow & Sectoral Concentration</h3>
              <p className="text-[10px] text-slate-500">Annual inflows (B USD) and primary destination sectors</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-mono">{(data.economy.fdi_inflow_usd || 0).toString()}B USD</div>
              <p className="text-[8px] font-mono text-slate-500 uppercase">Annual Inflow (2025)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { year: '2020', fdi: 1.8 },
                  { year: '2021', fdi: 1.6 },
                  { year: '2022', fdi: 1.5 },
                  { year: '2023', fdi: 1.3 },
                  { year: '2024', fdi: 1.4 },
                  { year: '2025', fdi: data.economy.fdi_inflow_usd }
                ]}>
                  <defs>
                    <linearGradient id="colorFdi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="fdi" stroke="#00f2ff" fillOpacity={1} fill="url(#colorFdi)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">FDI by Sector (%)</h4>
              <div className="space-y-3">
                {[
                  { name: 'Manufacturing', val: 42, color: 'bg-intel-cyan' },
                  { name: 'Energy', val: 28, color: 'bg-intel-orange' },
                  { name: 'Services', val: 18, color: 'bg-intel-green' },
                  { name: 'Agriculture', val: 7, color: 'bg-slate-600' },
                  { name: 'Tourism', val: 5, color: 'bg-intel-red' }
                ].map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono uppercase">
                      <span className="text-slate-500">{s.name}</span>
                      <span className="text-white font-bold">{s.val}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color}`} style={{ width: `${s.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4 — ENTREPRENEURSHIP & SME CREDIT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">SME Credit Access</h3>
              <p className="text-[10px] text-slate-500">% of SMEs with active bank credit lines</p>
            </div>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-white/5"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-current text-intel-cyan"
                    strokeWidth="3"
                    strokeDasharray={`${data.economy.sme_credit_access_pct}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white font-mono">{(data.economy.sme_credit_access_pct || 0).toString()}%</span>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Access Rate</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-xs font-bold text-white">12.4%</div>
                <div className="text-[8px] font-mono text-slate-500 uppercase">Avg Interest Rate</div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                <div className="text-xs font-bold text-white">180%</div>
                <div className="text-[8px] font-mono text-slate-500 uppercase">Collateral Req.</div>
              </div>
            </div>
          </div>

          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">New Business Registrations</h3>
              <p className="text-[10px] text-slate-500">Monthly volume - last 6 months</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { month: 'OCT', val: 1240 },
                  { month: 'NOV', val: 1180 },
                  { month: 'DEC', val: 950 },
                  { month: 'JAN', val: 1050 },
                  { month: 'FEB', val: 1120 },
                  { month: 'MAR', val: data.economy.new_business_registrations }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Bar dataKey="val" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-500 uppercase">Total YTD: 3,410</span>
              <span className="text-intel-green font-bold uppercase">+4.2% YoY</span>
            </div>
          </div>
        </div>

        {/* SECTION 5 — REGULATORY BURDEN */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-8">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Regulatory Burden & Compliance</h3>
            <p className="text-[10px] text-slate-500">Time and cost metrics for key business operations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Starting a Business', val: '12 days', cost: '3.4% GNI', status: 'GOOD' },
              { label: 'Building Permits', val: '184 days', cost: '4.2% value', status: 'CRITICAL' },
              { label: 'Getting Electricity', val: '65 days', cost: '840% income', status: 'WARNING' },
              { label: 'Registering Property', val: '35 days', cost: '6.1% value', status: 'WARNING' },
              { label: 'Paying Taxes', val: '144 hrs/yr', cost: '60.7% profit', status: 'CRITICAL' },
              { label: 'Trading Across Borders', val: '48 hrs', cost: '$450/doc', status: 'GOOD' },
              { label: 'Enforcing Contracts', val: '565 days', cost: '27% claim', status: 'CRITICAL' },
              { label: 'Resolving Insolvency', val: '1.3 years', cost: '7% estate', status: 'GOOD' }
            ].map((op, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-white uppercase tracking-tight leading-tight w-2/3">{op.label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    op.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' : 
                    op.status === 'WARNING' ? 'bg-intel-orange' : 'bg-intel-green'
                  }`}></div>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <div className="text-xs font-bold text-white font-mono">{op.val}</div>
                  <div className="text-[8px] font-mono text-slate-500">{op.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 6 — ONSHORE/OFFSHORE DUALITY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Onshore vs. Offshore Duality</h3>
              <p className="text-[10px] text-slate-500">Structural divide in the Tunisian economy</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Export Share', onshore: 28, offshore: 72 },
                  { name: 'Tax Contribution', onshore: 85, offshore: 15 },
                  { name: 'Employment', onshore: 65, offshore: 35 },
                  { name: 'FDI Share', onshore: 15, offshore: 85 }
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '10px' }} />
                  <Bar dataKey="onshore" name="Onshore" stackId="a" fill="#475569" />
                  <Bar dataKey="offshore" name="Offshore" stackId="a" fill="#00f2ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
              <p className="text-[9px] text-slate-400 leading-relaxed">
                The "Two-Speed Economy": The offshore sector (export-oriented) enjoys tax holidays and simplified customs but has limited linkages to the domestic onshore economy, which bears the primary tax burden.
              </p>
            </div>
          </div>

          <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Informal Economy Estimation</h3>
              <p className="text-[10px] text-slate-500">Estimated % of GDP operating outside formal regulation</p>
            </div>
            <div className="flex items-center justify-center h-48">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    className="stroke-current text-intel-cyan"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="stroke-current text-intel-orange"
                    strokeWidth="3"
                    strokeDasharray={`${data.economy.informal_economy_pct}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-intel-orange font-mono">{(data.economy.informal_economy_pct || 0).toString()}%</span>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">Informal Share</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Formal Sector</span>
                <span className="text-intel-cyan font-bold">{(100 - (data.economy.informal_economy_pct || 0)).toString()}%</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Informal Sector</span>
                <span className="text-intel-orange font-bold">{(data.economy.informal_economy_pct || 0).toString()}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7 — CAPITAL FLIGHT INDICATORS */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Capital Flight & Parallel Market</h3>
              <p className="text-[10px] text-slate-500">Parallel market premium and estimated illicit outflows</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-intel-red font-mono">+{(data.economy.parallel_market_premium || 0).toString()}%</div>
              <p className="text-[8px] font-mono text-slate-500 uppercase">Parallel Premium (Ben Guerdane/Djerba)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'OCT', official: 3.25, parallel: 3.58 },
                  { month: 'NOV', official: 3.28, parallel: 3.65 },
                  { month: 'DEC', official: 3.31, parallel: 3.78 },
                  { month: 'JAN', official: 3.35, parallel: 3.92 },
                  { month: 'FEB', official: 3.38, parallel: 4.05 },
                  { month: 'MAR', official: 3.42, parallel: 3.42 * (1 + data.economy.parallel_market_premium / 100) }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                  <Line type="monotone" dataKey="official" name="Official BCT Rate" stroke="#00f2ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="parallel" name="Parallel Rate" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Capital Flight Drivers</h4>
              <div className="space-y-4">
                {[
                  { label: 'Trade Misinvoicing', risk: 'HIGH', desc: 'Under-invoicing of exports and over-invoicing of imports to move capital abroad.' },
                  { label: 'Forex Rationing', risk: 'CRITICAL', desc: 'BCT restrictions on corporate FX transfers driving firms to parallel markets.' },
                  { label: 'Political Instability', risk: 'HIGH', desc: 'Uncertainty regarding property rights and future tax regimes.' }
                ].map((d, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-white uppercase">{d.label}</span>
                      <span className="text-[8px] font-mono text-intel-red font-bold">{d.risk}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-tight">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 8 — ECONOMIC FREEDOM VS RRI LINK */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-8">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Economic Freedom vs. Revolution Risk (RRI)</h3>
            <p className="text-[10px] text-slate-500">Correlation between business climate deterioration and social unrest risk</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="freedom" name="Freedom Score" unit="" domain={[30, 70]} label={{ value: 'Economic Freedom Score', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 8 }} tick={{ fill: '#475569', fontSize: 8 }} />
                <YAxis type="number" dataKey="rri" name="RRI" unit="" domain={[0, 100]} label={{ value: 'Revolution Risk Index (RRI)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 8 }} tick={{ fill: '#475569', fontSize: 8 }} />
                <ZAxis type="number" dataKey="pop" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Scatter name="Regions" data={[
                  { name: 'Tunisia (Current)', freedom: data.economy.heritage_freedom_score, rri: 78, pop: 300, color: '#ef4444' },
                  { name: 'Morocco', freedom: 58, rri: 42, pop: 200, color: '#22c55e' },
                  { name: 'Egypt', freedom: 48, rri: 65, pop: 250, color: '#f97316' },
                  { name: 'Algeria', freedom: 42, rri: 58, pop: 180, color: '#f59e0b' },
                  { name: 'Jordan', freedom: 62, rri: 38, pop: 120, color: '#00f2ff' }
                ]}>
                  { [
                    { name: 'Tunisia (Current)', freedom: data.economy.heritage_freedom_score, rri: 78, pop: 300, color: '#ef4444' },
                    { name: 'Morocco', freedom: 58, rri: 42, pop: 200, color: '#22c55e' },
                    { name: 'Egypt', freedom: 48, rri: 65, pop: 250, color: '#f97316' },
                    { name: 'Algeria', freedom: 42, rri: 58, pop: 180, color: '#f59e0b' },
                    { name: 'Jordan', freedom: 62, rri: 38, pop: 120, color: '#00f2ff' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
            <p className="text-[9px] text-slate-400 leading-relaxed text-center">
              <span className="text-intel-orange font-bold">ANALYSIS:</span> Tunisia currently sits in the "High Risk / Low Freedom" quadrant. Historical data suggests that when Economic Freedom drops below 50 while RRI exceeds 70, the probability of structural social unrest increases by 65%.
            </p>
          </div>
        </div>

        {/* SECTION 9 — STARTUP ECOSYSTEM (RE-RENDERED FOR BUSINESS CONTEXT) */}
        <div className="glass p-4 md:p-6 rounded-xl md:rounded-2xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Startup Ecosystem: The Only Growth Engine?</h3>
              <p className="text-[10px] text-slate-500">Comparing Startup Act performance vs. traditional SME sector</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="text-[10px] font-bold text-intel-cyan uppercase">Startup Act Labels</div>
              <div className="text-2xl font-bold text-white font-mono">980</div>
              <p className="text-[8px] text-slate-500">Total labels granted since 2019. Providing tax holidays and FX accounts.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="text-[10px] font-bold text-intel-green uppercase">Avg Funding</div>
              <div className="text-2xl font-bold text-white font-mono">$630K</div>
              <p className="text-[8px] text-slate-500">Average seed/Series A round. Driven by international VCs (212, AfricInvest).</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="text-[10px] font-bold text-intel-red uppercase">Brain Drain Risk</div>
              <div className="text-2xl font-bold text-white font-mono">42%</div>
              <p className="text-[8px] text-slate-500">Startups considering relocation to France/UAE due to local FX restrictions.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRemittances = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Remittances', value: `${data.economy.remittances_total_bnd}B TND`, trend: `+${data.economy.remittances_growth_yoy}% YoY`, status: 'GOOD', desc: 'Total annual inflows from Tunisian diaspora.' },
          { label: '% of GDP', value: `${data.economy.remittances_pct_gdp}%`, trend: 'Structural Pillar', status: 'WARNING', desc: 'Critical source of foreign exchange and household income.' },
          { label: 'France Share', value: `${data.economy.remittances_france_pct}%`, trend: 'High Concentration', status: 'WARNING', desc: 'Percentage of total remittances originating from France.' },
          { label: 'Avg Transfer Cost', value: '6.2%', trend: 'SDG Target: 3%', status: 'CRITICAL', desc: 'Average cost of sending $200 to Tunisia.' }
        ].map((stat, i) => (
          <div key={i} className="glass p-4 rounded-xl border border-intel-border space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{stat.label}</span>
            <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono ${stat.status === 'GOOD' ? 'text-intel-green' : stat.status === 'WARNING' ? 'text-intel-orange' : 'text-intel-red'}`}>
                {stat.trend}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${stat.status === 'GOOD' ? 'bg-intel-green' : stat.status === 'WARNING' ? 'bg-intel-orange' : 'bg-intel-red animate-pulse'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Remittance Growth & GDP Impact</h3>
              <p className="text-[10px] text-slate-500">Total volume (B TND) vs % of GDP - 2020-2025</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={remittanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar yAxisId="left" dataKey="total" name="Total (B TND)" fill="#00f2ff" radius={[4, 4, 0, 0]} barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="pctGdp" name="% of GDP" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Geographic Origin Distribution</h3>
              <p className="text-[10px] text-slate-500">Breakdown of remittance inflows by source country/region</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={remittanceDistribution}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {remittanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Regional Distribution: Urban vs Rural</h3>
            <p className="text-[10px] text-slate-500">Inflow concentration by region and settlement type (M TND)</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Urban</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
              <span className="text-[8px] font-mono text-slate-500 uppercase">Rural</span>
            </div>
          </div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={remittanceRegionalData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
              <YAxis dataKey="region" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={100} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
              <Bar dataKey="urban" name="Urban Inflows" stackId="a" fill="#00f2ff" />
              <Bar dataKey="rural" name="Rural Inflows" stackId="a" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl">
          <div className="flex items-start space-x-3">
            <Info className="w-4 h-4 text-intel-cyan mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10px] text-white font-bold uppercase">Structural Urban Bias</p>
              <p className="text-[9px] text-slate-400 leading-relaxed">
                72% of total remittances are directed towards coastal urban centers (Grand Tunis, Sahel, Sfax), exacerbating regional wealth disparities. Rural areas, despite higher migration rates in some cases, receive lower absolute volumes, often used for immediate consumption rather than investment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Remittance Policy & Strategic Links</h3>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate-subtab', { detail: { subtab: 'migration' } }))}
            className="text-[10px] font-mono text-intel-cyan hover:underline flex items-center space-x-1"
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>VIEW DIASPORA INTELLIGENCE</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Digitalization Push', desc: 'BCT promoting mobile wallet integration for diaspora to reduce transfer costs and informal flows.', impact: 'HIGH', color: 'text-intel-cyan' },
            { title: 'Investment Incentives', desc: 'New "Diaspora Bond" proposal to channel remittances into infrastructure and green energy projects.', impact: 'MEDIUM', color: 'text-intel-green' },
            { title: 'Informal Channel Risk', desc: 'Estimated 25% of total flows bypass official banking system via informal "hand-to-hand" networks.', impact: 'CRITICAL', color: 'text-intel-red' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="text-[10px] font-bold text-white uppercase tracking-tight">{item.title}</div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
              <div className={`text-[8px] font-mono font-bold uppercase ${item.color}`}>{item.impact} IMPACT</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMacroIndicators = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {isLoading && macroIndicators.length === 0 ? (
          Array(12).fill(0).map((_, i) => (
            <div key={i} className="glass p-4 rounded-xl border border-intel-border h-40 animate-pulse bg-white/5"></div>
          ))
        ) : (
          (macroIndicators.length > 0 ? macroIndicators : [
            { label: 'GDP Growth', value: `${data.economy.gdp_growth}%`, trend: '-1.2 vs Q4 2025', status: 'CRITICAL', desc: 'Real GDP growth rate Q1 2026. Revised down from 1.6% forecast.', source: 'INS Tunisia', history: [0.8, 0.6, 0.5, 0.4, 0.4] },
            { label: 'CPI Inflation', value: `${data.economy.inflation}%`, trend: '-0.4 vs Feb 2026', status: 'WARNING', desc: 'Consumer Price Index annual variation. Food inflation at 9.3%.', source: 'INS Tunisia', history: [8.2, 7.8, 7.5, 7.2, 7.1] },
            { label: 'BCT Forex Reserves', value: `${data.economy.fx_reserves} days`, trend: '-11 vs Jan 2026', status: 'CRITICAL', desc: 'Foreign exchange reserves expressed as import cover days. Below 90-day safety threshold.', source: 'Banque Centrale de Tunisie', history: [112, 105, 98, 92, 88] },
            { label: 'Unemployment', value: `${data.economy.unemployment}%`, trend: '+0.3 vs Q4 2025', status: 'CRITICAL', desc: `National unemployment rate. Youth (15-24) rate: ${data.economy.youth_unemployment}%. Interior regions: 29%+`, source: 'INS Tunisia', history: [15.5, 15.8, 16.0, 16.1, 16.2] },
            { label: 'Public Debt / GDP', value: `${data.economy.public_debt}%`, trend: '+2.1 vs 2025', status: 'CRITICAL', desc: 'Total public debt as % of GDP. External debt service: $3.2B due in 2026.', source: 'Ministry of Finance', history: [82, 84, 85, 86, 87.4] },
            { label: 'Current Account', value: '-8.3%', trend: '-0.7 vs 2025', status: 'CRITICAL', desc: 'Current account balance as % of GDP. Trade deficit widening due to energy imports.', source: 'BCT', history: [-7.2, -7.5, -7.8, -8.1, -8.3] },
            { label: 'TND / USD', value: `${data.economy.tnd_usd}`, trend: '+4.2 YTD 2026', status: 'WARNING', desc: 'Official dinar exchange rate. Parallel market estimated at 3.85 TND/USD (+20%).', source: 'BCT Official Rate', history: [3.05, 3.12, 3.15, 3.18, 3.21] },
            { 
              label: 'Budget Deficit', 
              value: '-7.8%', 
              trend: '-0.3 vs 2025 target', 
              status: 'CRITICAL', 
              desc: 'Fiscal deficit vs GDP. IMF target was -6.0%. Wage bill expansion driving overrun.', 
              source: 'Ministry of Finance', 
              history: [-6.8, -7.2, -7.4, -7.6, -7.8],
              links: [
                { label: 'VIEW UGTT MONITOR', tab: 'political', subTab: 'ugtt', color: 'text-intel-cyan' },
                { label: 'VIEW GEOPOLITICAL PRESSURE', tab: 'geopolitical', color: 'text-intel-orange' }
              ]
            },
            { label: 'FDI Inflows', value: '1.24B', trend: '-18.4 vs 2025', status: 'CRITICAL', desc: 'Foreign direct investment inflows YTD. Energy sector FDI down 34%.', source: 'FIPA', history: [1.8, 1.6, 1.5, 1.3, 1.24] },
            { label: 'Remittances', value: '$2.87B', trend: '+3.1 vs 2025', status: 'GOOD', desc: 'Diaspora remittances — one of Tunisia\'s key forex sources. Slight growth driven by Europe.', source: 'BCT', history: [2.6, 2.7, 2.75, 2.8, 2.87] },
            { label: 'Tourism Revenue', value: '1.4B', trend: '-24 vs Q1 2025', status: 'CRITICAL', desc: 'Tourist revenue Q1 2026. Bookings down 42% amid political instability and visa issues.', source: 'Ministry of Tourism', history: [2.1, 1.9, 1.7, 1.5, 1.4] },
            { label: 'Phosphate Output', value: '3.1Mt', trend: '-28 vs 2025', status: 'CRITICAL', desc: 'Phosphate production 2025. Strikes, equipment failure, water shortage. Peak was 8Mt (2010).', source: 'CPG / GCT', history: [4.2, 3.8, 3.5, 3.3, 3.1] },
          ]).map((ind: any, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              className={`glass p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-48 ${
                ind.status === 'CRITICAL' ? 'border-intel-red/20 hover:border-intel-red/40' :
                ind.status === 'WARNING' ? 'border-intel-orange/20 hover:border-intel-orange/40' :
                'border-intel-green/20 hover:border-intel-green/40'
              }`}
            >
              <CornerAccent position="tl" />
              <CornerAccent position="br" />
              {/* Status Glow */}
              {ind.status === 'CRITICAL' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-intel-red/5 blur-2xl rounded-full -mr-8 -mt-8 animate-pulse"></div>
              )}

              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">{ind.label}</span>
                  <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full border text-[8px] font-bold font-mono ${
                    ind.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red animate-pulse' :
                    ind.status === 'WARNING' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                    'bg-intel-green/10 border-intel-green/30 text-intel-green'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      ind.status === 'CRITICAL' ? 'bg-intel-red' :
                      ind.status === 'WARNING' ? 'bg-intel-orange' :
                      'bg-intel-green'
                    }`}></div>
                    <span>{ind.status}</span>
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-white font-mono tracking-tighter">{ind.value}</div>
                    <div className="flex items-center space-x-1 text-[10px] font-mono">
                      {ind.trend.startsWith('+') ? 
                        <TrendingUp className={`w-3 h-3 ${ind.status === 'GOOD' ? 'text-intel-green' : 'text-intel-red'}`} /> : 
                        <TrendingDown className={`w-3 h-3 ${ind.status === 'GOOD' ? 'text-intel-red' : 'text-intel-green'}`} />
                      }
                      <span className={
                        (ind.trend.startsWith('+') && ind.status === 'GOOD') || (ind.trend.startsWith('-') && ind.status !== 'GOOD') 
                        ? 'text-intel-green' : 'text-intel-red'
                      }>
                        {ind.trend}
                      </span>
                    </div>
                  </div>

                  {ind.links && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {ind.links.map((link: any, idx: number) => (
                        <button 
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: link.tab, subTab: link.subTab } }));
                          }}
                          className={cn("text-[8px] font-mono font-bold hover:underline flex items-center space-x-1", link.color)}
                        >
                          <ArrowUpRight className="w-2 h-2" />
                          <span>{link.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                  
                  {/* Mini Sparkline */}
                  <div className="h-12 w-20 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ind.history?.map((v: number, idx: number) => ({ v, idx })) || []}>
                        <Line 
                          type="monotone" 
                          dataKey="v" 
                          stroke={
                            ind.status === 'CRITICAL' ? '#FF4D4D' :
                            ind.status === 'WARNING' ? '#FFA500' :
                            '#00E5FF'
                          } 
                          strokeWidth={2} 
                          dot={false} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              <div className="pt-2 border-t border-white/5 mt-auto relative z-10">
                <p className="text-[9px] text-slate-500 leading-tight line-clamp-2 group-hover:line-clamp-none transition-all">
                  {ind.desc}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[7px] font-mono text-slate-700 uppercase tracking-tighter">{ind.source}</div>
                  <Info className="w-2.5 h-2.5 text-slate-700 cursor-help" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Historical Macro Trends (5Y)</h3>
              <p className="text-[10px] text-slate-500">GDP Growth vs Inflation Rate - 2021-2025</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">GDP</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Inflation</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalMacroData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="gdp" name="GDP Growth %" stroke="#00f2ff" strokeWidth={3} dot={{ r: 4, fill: '#00f2ff' }} />
                <Line type="monotone" dataKey="inflation" name="Inflation %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Inflation Drivers (CPI Contribution)</h3>
              <p className="text-[10px] text-slate-500">Stacked contribution by key categories - last 12 months</p>
            </div>
            <span className="text-[10px] font-mono text-intel-orange uppercase tracking-wider">Food Driven</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inflationDriversData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '10px' }} />
                <Bar dataKey="food" name="Food" stackId="a" fill="#f43f5e" />
                <Bar dataKey="energy" name="Energy" stackId="a" fill="#f97316" />
                <Bar dataKey="services" name="Services" stackId="a" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">GDP Growth Trend</h3>
              <p className="text-[10px] text-slate-500">15-month rolling - % annual</p>
            </div>
            <span className="text-[10px] font-mono text-intel-red uppercase px-2 py-0.5 bg-intel-red/10 border border-intel-red/20 rounded">Declining</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={macroData}>
                <defs>
                  <linearGradient id="colorGdp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="gdp" stroke="#00f2ff" fillOpacity={1} fill="url(#colorGdp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">CPI Inflation by Component</h3>
              <p className="text-[10px] text-slate-500">Annual % change - March 2026</p>
            </div>
            <span className="text-[10px] font-mono text-intel-orange uppercase">{(data.economy.inflation || 0).toString()}% Overall</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Food & Bev', val: 9.3, color: '#f43f5e' },
                { name: 'Transport', val: 8.5, color: '#f97316' },
                { name: 'Housing & Energy', val: 7.2, color: '#fbbf24' },
                { name: 'Healthcare', val: 6.1, color: '#22d3ee' },
                { name: 'Clothing', val: 5.8, color: '#0ea5e9' },
                { name: 'Communication', val: 4.2, color: '#38bdf8' },
                { name: 'Education', val: 3.5, color: '#7dd3fc' },
                { name: 'Other', val: 2.1, color: '#94a3b8' }
              ]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={12}>
                  { [9.3, 8.5, 7.2, 6.1, 5.8, 4.2, 3.5, 2.1].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f43f5e', '#f97316', '#fbbf24', '#22d3ee', '#0ea5e9', '#38bdf8', '#7dd3fc', '#94a3b8'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Trade Balance</h3>
              <p className="text-[10px] text-slate-500">Exports vs Imports (M TND) - last 7 months</p>
            </div>
            <span className="text-[10px] font-mono text-intel-red uppercase">Deficit Widening</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { month: 'SEP 25', exp: 4200, imp: 5800 },
                { month: 'OCT 25', exp: 4500, imp: 6200 },
                { month: 'NOV 25', exp: 4100, imp: 6500 },
                { month: 'DEC 25', exp: 4800, imp: 7100 },
                { month: 'JAN 26', exp: 4300, imp: 6900 },
                { month: 'FEB 26', exp: 4400, imp: 7200 },
                { month: 'MAR 26', exp: 4600, imp: 7500 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="exp" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="imp" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Dinar Exchange Rate</h3>
              <p className="text-[10px] text-slate-500">TND/USD and TND/EUR - official rate</p>
            </div>
            <span className="text-[10px] font-mono text-intel-orange uppercase">Depreciating</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { month: 'MAY 25', usd: 3.12, eur: 3.35 },
                { month: 'JUN 25', usd: 3.14, eur: 3.38 },
                { month: 'JUL 25', usd: 3.15, eur: 3.40 },
                { month: 'AUG 25', usd: 3.16, eur: 3.42 },
                { month: 'SEP 25', usd: 3.18, eur: 3.45 },
                { month: 'OCT 25', usd: 3.21, eur: 3.48 },
                { month: 'NOV 25', usd: 3.23, eur: 3.50 },
                { month: 'DEC 25', usd: 3.25, eur: 3.52 },
                { month: 'JAN 26', usd: 3.28, eur: 3.55 },
                { month: 'FEB 26', usd: 3.30, eur: 3.58 },
                { month: 'MAR 26', usd: 3.32, eur: 3.60 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Line type="monotone" dataKey="usd" stroke="#00f2ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eur" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center space-x-2 text-[10px] text-slate-500 italic">
            <AlertTriangle className="w-3 h-3 text-intel-orange" />
            <span>Parallel market rate: ~3.85 TND/USD (+20% premium over official)</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Debt Calendar & Risk Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">External Debt Service Calendar</h3>
            <p className="text-[10px] text-slate-500">Upcoming repayments (USD M) - 2026-2027</p>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { q: 'Q1 2026', val: 850, color: '#f97316' },
                { q: 'Q2 2026', val: 1100, color: '#ef4444' },
                { q: 'Q3 2026', val: 450, color: '#22d3ee' },
                { q: 'Q4 2026', val: 600, color: '#38bdf8' },
                { q: 'Q1 2027', val: 780, color: '#f59e0b' },
                { q: 'Q2 2027', val: 1250, color: '#dc2626' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="q" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="val" radius={[2, 2, 0, 0]}>
                  { [850, 1100, 450, 600, 780, 1250].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#f97316', '#ef4444', '#22d3ee', '#38bdf8', '#f59e0b', '#dc2626'][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-4 md:p-8 rounded-xl md:rounded-3xl border border-intel-border space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2 text-intel-cyan" />
              Public Debt Breakdown
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={debtBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {debtBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {debtBreakdownData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-500 uppercase">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-intel-border space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Risk Signals</h3>
            <div className="space-y-4">
              {[
                { label: 'IMF Deal Status', value: 'SUSPENDED', color: 'text-intel-red', link: { label: 'VIEW GEOPOLITICAL PRESSURE', tab: 'geopolitical', color: 'text-intel-orange' } },
                { label: 'Eurobond Yield', value: '11.2% (+340bps)', color: 'text-intel-red' },
                { label: 'Credit Rating (Fitch)', value: 'CCC+ (Negative)', color: 'text-intel-red' },
                { label: 'Subsidy Bill 2026', value: '8.4B TND (+18%)', color: 'text-intel-orange' },
                { label: 'Wage Bill / Revenue', value: '62% (DANGER)', color: 'text-intel-red' },
                { label: 'Inflation Expectation', value: '6.8% (12m)', color: 'text-intel-orange' },
                { label: 'BCT Policy Rate', value: '8.0% (unchanged)', color: 'text-intel-orange' },
                { label: 'Diaspora Confidence', value: 'STABLE', color: 'text-intel-green' }
              ].map((signal: any, i) => (
                <div key={i} className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{signal.label}</span>
                    <span className={`text-[10px] font-mono font-bold ${signal.color}`}>{signal.value}</span>
                  </div>
                  {signal.link && (
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: signal.link.tab, subTab: signal.link.subTab } }))}
                      className={cn("text-[8px] font-mono font-bold hover:underline flex items-center space-x-1", signal.link.color)}
                    >
                      <ArrowUpRight className="w-2 h-2" />
                      <span>{signal.link.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomSectorTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-intel-bg border border-intel-border p-3 rounded-xl shadow-2xl space-y-2">
          <div className="text-[10px] font-bold text-white uppercase tracking-widest border-b border-intel-border pb-1 mb-1">
            {data.name}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between space-x-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Growth Rate</span>
              <span className={`text-[8px] font-mono font-bold ${data.growth > 0 ? 'text-intel-green' : 'text-intel-red'}`}>
                {data.growth > 0 ? '+' : ''}{data.growth}%
              </span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase">GDP Contribution</span>
              <span className="text-[8px] font-mono font-bold text-intel-cyan">{data.contribution}%</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Workforce Share</span>
              <span className="text-[8px] font-mono font-bold text-white">{data.jobs}%</span>
            </div>
            <div className="flex justify-between space-x-4 pt-1 border-t border-intel-border/30">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Min Wage</span>
              <span className="text-[8px] font-mono font-bold text-intel-cyan">{data.minWage} TND</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Avg Salary</span>
              <span className="text-[8px] font-mono font-bold text-white">{data.avgSalary} TND</span>
            </div>
            <div className="flex justify-between space-x-4">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Wage Growth</span>
              <span className={`text-[8px] font-mono font-bold ${data.wageGrowth > 0 ? 'text-intel-green' : 'text-intel-red'}`}>
                {data.wageGrowth > 0 ? '+' : ''}{data.wageGrowth}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderSectorAnalysis = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Sector Growth & GDP Impact</h3>
              <p className="text-[10px] text-slate-500">Growth % vs. GDP Contribution % - 2025</p>
            </div>
            <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-lg border border-intel-border">
              <button 
                onClick={() => setSectorSort('none')}
                className={`px-2 py-1 text-[8px] font-mono uppercase rounded transition-all ${sectorSort === 'none' ? 'bg-intel-cyan text-intel-bg font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Default
              </button>
              <button 
                onClick={() => setSectorSort('desc')}
                className={`px-2 py-1 text-[8px] font-mono uppercase rounded transition-all ${sectorSort === 'desc' ? 'bg-intel-cyan text-intel-bg font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Highest
              </button>
              <button 
                onClick={() => setSectorSort('asc')}
                className={`px-2 py-1 text-[8px] font-mono uppercase rounded transition-all ${sectorSort === 'asc' ? 'bg-intel-cyan text-intel-bg font-bold' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Lowest
              </button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedSectorData} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  content={<CustomSectorTooltip />}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }}
                />
                <Bar dataKey="growth" name="Growth Rate %" radius={[0, 2, 2, 0]} barSize={10}>
                  { sortedSectorData.map((entry, index) => (
                    <Cell key={`cell-growth-${index}`} fill={entry.growth > 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
                <Bar dataKey="contribution" name="GDP Contribution %" fill="#06b6d4" radius={[0, 2, 2, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">GDP Contribution & Employment</h3>
            <p className="text-[10px] text-slate-500">% of GDP and % of workforce - 2025</p>
          </div>
          <div className="space-y-6">
            {sectorData.map((sector, i) => {
              const health = getSectorHealth(sector);
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        health === 'GOOD' ? 'bg-intel-green shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                        health === 'WARNING' ? 'bg-intel-orange shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                        'bg-intel-red shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse'
                      }`}></div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{sector.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-[10px] font-mono text-intel-green font-bold">{sector.contribution}% GDP</span>
                      <span className="text-[10px] font-mono text-slate-500">{sector.jobs}% jobs</span>
                      <span className={`text-[10px] font-mono font-bold ${sector.jobTrend > 0 ? 'text-intel-green' : 'text-intel-red'}`}>
                        {sector.jobTrend > 0 ? `+${sector.jobTrend}%` : `${sector.jobTrend}%`}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-intel-cyan" style={{ width: `${sector.contribution}%` }}></div>
                    <div className="h-full bg-slate-700" style={{ width: `${sector.jobs}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wage & Salary Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Wage & Salary Analysis</h3>
            <p className="text-[10px] text-slate-500">Average Salary vs. Minimum Wage by Sector (TND)</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar dataKey="avgSalary" name="Avg Salary" fill="#00f2ff" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="minWage" name="Min Wage" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Wage Growth vs. Average Salary</h3>
            <p className="text-[10px] text-slate-500">Comparing annual growth % against absolute salary levels</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={sectorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar yAxisId="left" dataKey="avgSalary" name="Avg Salary (TND)" fill="rgba(0, 242, 255, 0.3)" radius={[4, 4, 0, 0]} barSize={30} />
                <Line yAxisId="right" type="monotone" dataKey="wageGrowth" name="Wage Growth %" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sector Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Factory, label: 'Phosphate', status: 'CRISIS', color: 'text-intel-red', desc: '3.1Mt produced (2025). Strikes + water shortage. Revenue down 34%. Gafsa unrest escalating.', stats: [{ l: 'Output', v: '3.1Mt (-28%)' }, { l: 'Avg Salary', v: '1,450 TND' }, { l: 'Min Wage', v: '650 TND' }, { l: 'Wage Growth', v: '+5.2%' }] },
          { icon: Palmtree, label: 'Tourism', status: 'CRITICAL', color: 'text-intel-red', desc: 'Bookings down 42% vs Q1 2025. Political instability deterring EU tourists. Monastir hub laying off.', stats: [{ l: 'Revenue Q1', v: '1.4B TND (-24%)' }, { l: 'Avg Salary', v: '820 TND' }, { l: 'Min Wage', v: '480 TND' }, { l: 'Wage Growth', v: '-1.5%' }] },
          { icon: Wheat, label: 'Agriculture', status: 'STRESSED', color: 'text-intel-orange', desc: 'Drought hitting northern crops. Olive oil export strong but subsidized grain import costs rising.', stats: [{ l: 'GDP share', v: '10.2%' }, { l: 'Avg Salary', v: '650 TND' }, { l: 'Min Wage', v: '450 TND' }, { l: 'Wage Growth', v: '+2.1%' }] },
          { icon: Zap, label: 'Energy', status: 'WARNING', color: 'text-intel-orange', desc: 'Net energy importer. Petrol subsidies cost 2.8B TND. STEG power cuts in interior regions.', stats: [{ l: 'Import dependency', v: '62%' }, { l: 'Avg Salary', v: '1,850 TND' }, { l: 'Min Wage', v: '700 TND' }, { l: 'Wage Growth', v: '+4.8%' }] }
        ].map((sector, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-intel-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <sector.icon className={`w-5 h-5 ${sector.color}`} />
                <span className="text-xs font-bold text-white uppercase tracking-widest">{sector.label}</span>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                sector.status === 'CRISIS' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' :
                'bg-intel-orange/10 border-intel-orange/30 text-intel-orange'
              }`}>
                {sector.status}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {sector.desc}
            </p>
            <div className="space-y-1.5 pt-2">
              {sector.stats.map((s, j) => (
                <div key={j} className="flex justify-between text-[8px] font-mono uppercase">
                  <span className="text-slate-600">{s.l}</span>
                  <span className="text-white font-bold">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ministry Workforce & Salary Analysis */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-8">
        <div className="flex items-center justify-between border-b border-intel-border pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-intel-cyan/10 rounded-xl border border-intel-cyan/30">
              <Users className="w-8 h-8 text-intel-cyan" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Public Sector: Ministry Analysis</h3>
              <p className="text-sm text-slate-500">Workforce distribution, average salaries, and annual growth by ministry</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-intel-cyan bg-intel-cyan/10 px-2 py-1 rounded border border-intel-cyan/20 mb-1">FISCAL MONITORING</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Wage Bill: 22.8B TND</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workforce Distribution Chart */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Workforce Distribution</h4>
              <p className="text-[10px] text-slate-500">Total public sector employees: ~695,000</p>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryWorkforceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                  />
                  <Bar dataKey="workers" name="Employees" fill="#00f2ff" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Salary & Growth Table */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Salary & Growth Metrics</h4>
              <p className="text-[10px] text-slate-500">Average monthly net salary (TND) and YoY growth</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Ministry</th>
                    <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Avg Salary</th>
                    <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Growth</th>
                    <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ministryWorkforceData.map((m, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-3 text-[10px] font-bold text-white group-hover:text-intel-cyan transition-colors">{m.name}</td>
                      <td className="py-3 text-[10px] font-mono text-slate-300">{m.avgSalary.toLocaleString()} TND</td>
                      <td className="py-3">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-intel-green" />
                          <span className="text-[10px] font-mono text-intel-green">+{m.growth}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-intel-cyan" style={{ width: `${m.percentage}%` }}></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 w-8">{m.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Phosphate Sector Deep Dive */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-8">
        <div className="flex items-center justify-between border-b border-intel-border pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-intel-red/10 rounded-xl border border-intel-red/30">
              <Factory className="w-8 h-8 text-intel-red" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Phosphate Sector Deep Dive</h3>
              <p className="text-sm text-slate-500">Strategic analysis of Tunisia's primary mineral resource</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-intel-red bg-intel-red/10 px-2 py-1 rounded border border-intel-red/20 mb-1">STRATEGIC CRISIS</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">CPG / GCT Monitoring</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Production & Revenue Trends */}
          <div className="space-y-6">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">Production Volume & Export Revenue</h4>
              <p className="text-[10px] text-slate-500">Historical decline vs. revenue volatility</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={phosphateTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                  <Bar yAxisId="left" dataKey="volume" name="Volume (Mt)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (B USD)" stroke="#00f2ff" strokeWidth={2} dot={{ r: 4, fill: '#00f2ff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Qualitative Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
              <div className="flex items-center space-x-2 text-intel-red">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Labor Disputes</h4>
              </div>
              <ul className="space-y-3">
                {[
                  { t: 'Metlaoui Blockades', d: 'Ongoing rail transport disruptions by unemployed youth demanding jobs.' },
                  { t: 'Gafsa Strikes', d: 'CPG workers union demanding safety equipment and bonus payments.' },
                  { t: 'Transport Bottlenecks', d: 'SNCFT rail capacity down 60% due to lack of locomotive maintenance.' }
                ].map((item, i) => (
                  <li key={i} className="space-y-1">
                    <div className="text-[10px] font-bold text-white">{item.t}</div>
                    <div className="text-[9px] text-slate-500 leading-tight">{item.d}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass p-6 rounded-2xl border border-intel-border/50 space-y-4">
              <div className="flex items-center space-x-2 text-intel-cyan">
                <Landmark className="w-4 h-4" />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Policy Impacts</h4>
              </div>
              <ul className="space-y-3">
                {[
                  { t: 'Restructuring Plan', d: 'Gov proposal to split CPG and GCT to isolate debt; union resistance high.' },
                  { t: 'Chinese Investment', d: 'Negotiations for $200M infrastructure loan for Mdhilla 2 plant.' },
                  { t: 'Water Management', d: 'New desalination mandate for washing units to preserve local aquifers.' }
                ].map((item, i) => (
                  <li key={i} className="space-y-1">
                    <div className="text-[10px] font-bold text-white">{item.t}</div>
                    <div className="text-[9px] text-slate-500 leading-tight">{item.d}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMarketIntelligence = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Critical Goods Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {criticalGoodsAlerts.map((alert, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
              alert.level === 'CRITICAL' ? 'border-intel-red/30 bg-intel-red/5' : 'border-intel-orange/30 bg-intel-orange/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`w-4 h-4 ${alert.level === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{alert.item} Alert</span>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                alert.level === 'CRITICAL' ? 'bg-intel-red text-white' : 'bg-intel-orange text-white'
              }`}>
                {alert.level}
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">{alert.alert}</p>
          </motion.div>
        ))}
      </div>

      {/* Market Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {marketIndicators.map((ind, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`glass p-4 rounded-xl border ${
              ind.status === 'CRITICAL' ? 'border-intel-red/20' :
              ind.status === 'WARNING' ? 'border-intel-orange/20' :
              'border-intel-green/20'
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{ind.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                ind.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' :
                ind.status === 'WARNING' ? 'bg-intel-orange' :
                'bg-intel-green'
              }`}></div>
            </div>
            <div className="text-xl font-bold text-white font-mono">{ind.value}</div>
            <div className="flex items-center space-x-1">
              {ind.trend === 'up' ? 
                <TrendingUp className={`w-3 h-3 ${ind.status === 'GOOD' ? 'text-intel-green' : 'text-intel-red'}`} /> : 
                <TrendingDown className={`w-3 h-3 ${ind.status === 'GOOD' ? 'text-intel-red' : 'text-intel-green'}`} />
              }
              <span className={`text-[10px] font-mono ${
                (ind.trend === 'up' && ind.status === 'GOOD') || (ind.trend === 'down' && ind.status !== 'GOOD') 
                ? 'text-intel-green' : 'text-intel-red'
              }`}>
                {ind.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TUNINDEX Performance */}
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">TUNINDEX Performance</h3>
              <p className="text-[10px] text-slate-500">15-month historical trend - BVMT</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-red uppercase">-12.4% YTD</span>
              <BarChart3 className="w-4 h-4 text-intel-red" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tunindexHistory}>
                <defs>
                  <linearGradient id="colorTunindex" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis domain={['dataMin - 100', 'dataMax + 100']} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorTunindex)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Currency Trends */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Currency Trends (TND)</h3>
              <p className="text-[10px] text-slate-500">Exchange rate variation against USD & EUR</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-orange uppercase">Devaluation Risk</span>
              <RefreshCw className="w-4 h-4 text-intel-orange animate-spin-slow" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currencyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Line type="monotone" dataKey="usd" name="TND / USD" stroke="#00f2ff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="eur" name="TND / EUR" stroke="#bf00ff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Food Prices & Inflation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Essential Goods Prices</h3>
              <p className="text-[10px] text-slate-500">Retail price monitoring - TND per unit</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-red uppercase">Inflationary Pressure</span>
              <Activity className="w-4 h-4 text-intel-red animate-pulse" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Item</th>
                  <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Price (TND)</th>
                  <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Unit</th>
                  <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Inflation (YoY)</th>
                  <th className="py-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {essentialGoodsPrices.map((item, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 text-[10px] font-bold text-white group-hover:text-intel-cyan transition-colors">{item.item}</td>
                    <td className="py-3 text-[10px] font-mono text-slate-300">{item.price}</td>
                    <td className="py-3 text-[10px] font-mono text-slate-500">{item.unit}</td>
                    <td className="py-3 text-[10px] font-mono text-intel-red">{item.inflation}</td>
                    <td className="py-3">
                      <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                        item.status === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' :
                        item.status === 'WARNING' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                        'bg-intel-green/10 border-intel-green/30 text-intel-green'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Food Inflation Trend</h3>
              <p className="text-[10px] text-slate-500">Monthly CPI contribution - %</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={foodInflationHistory}>
                <defs>
                  <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="rate" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFood)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl">
            <p className="text-[9px] text-intel-red leading-tight">
              <strong>Note:</strong> Food inflation remains the primary driver of overall CPI, with fresh produce and meat seeing the highest volatility.
            </p>
          </div>
        </div>
      </div>

      {/* Market News & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Market Sentiment & News</h3>
          <div className="space-y-4">
            {[
              { title: 'BVMT Liquidity Crisis', desc: 'Daily trading volumes hit 5-year low as institutional investors shift to treasury bills.', time: '2h ago', impact: 'HIGH' },
              { title: 'BCT Rate Hike Speculation', desc: 'Analysts expect 50bps hike in next MPC meeting to curb dinar slide.', time: '5h ago', impact: 'MEDIUM' },
              { title: 'Eurobond Repayment', desc: 'Tunisia successfully repays €850M bond; reserves drop to 88 days.', time: '1d ago', impact: 'CRITICAL' }
            ].map((news, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start justify-between group hover:bg-white/10 transition-all cursor-pointer">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-white uppercase tracking-tight group-hover:text-intel-cyan transition-colors">{news.title}</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{news.desc}</p>
                  <div className="text-[8px] font-mono text-slate-600 uppercase pt-1">{news.time}</div>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  news.impact === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' :
                  news.impact === 'HIGH' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                  'bg-intel-cyan/10 border-intel-cyan/30 text-intel-cyan'
                }`}>
                  {news.impact}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Market Composition</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Banking', value: 45 },
                    { name: 'Industry', value: 20 },
                    { name: 'Services', value: 15 },
                    { name: 'Consumer', value: 12 },
                    { name: 'Other', value: 8 }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Banking', color: '#00f2ff' },
                    { name: 'Industry', color: '#bf00ff' },
                    { name: 'Services', color: '#f43f5e' },
                    { name: 'Consumer', color: '#f97316' },
                    { name: 'Other', color: '#475569' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Regional Food Basket Analysis</h3>
              <p className="text-[10px] text-slate-500">Current cost by Governorates - TND</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={foodBasketByGovernorate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar dataKey="essential" name="Essential" fill="#00f2ff" radius={[0, 4, 4, 0]} />
                <Bar dataKey="luxury" name="Full" fill="#bf00ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Food Basket Analysis</h3>
              <p className="text-[10px] text-slate-500">Monthly cost for a family of 4 - TND</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={foodBasketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar dataKey="essential" name="Essential Basket" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="luxury" name="Full Basket" fill="#bf00ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPovertyTracker = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Poverty by Governorate */}
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between border-b border-intel-border pb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Poverty Rate by Governorate</h3>
              <p className="text-[10px] text-slate-500 uppercase">Regional disparity and governance effectiveness correlation</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Poverty %</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-cyan"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Gov. Score</span>
              </div>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={povertyByGovernorate} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontFamily: 'monospace' }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                />
                <Bar dataKey="rate" name="Poverty Rate %" fill="#ef4444" radius={[0, 2, 2, 0]} barSize={12} />
                <Line dataKey="governance" name="Governance Score" stroke="#00f2ff" strokeWidth={2} dot={{ r: 3, fill: '#00f2ff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Vulnerability Heatmap Grid */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Regional Vulnerability Heatmap</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {povertyByGovernorate.map((gov, i) => (
                <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between h-16">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-mono text-slate-500 uppercase truncate">{gov.name}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      gov.vulnerability > 8 ? 'bg-intel-red animate-pulse' : 
                      gov.vulnerability > 6 ? 'bg-intel-orange' : 'bg-intel-cyan'
                    }`}></div>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-xs font-bold text-white font-mono">{gov.vulnerability.toString()}</span>
                    <span className="text-[7px] font-mono text-slate-600 uppercase">Risk Index</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-4 h-4 text-intel-red mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] text-white font-bold uppercase">Inverse Correlation Detected</p>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Data shows a strong inverse correlation (-0.82) between governance effectiveness and poverty rates. Interior regions with the lowest governance scores (Kairouan, Kasserine) exhibit the highest poverty densities, indicating institutional failure in service delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Poverty Trends & Safety Nets */}
        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">National Poverty Trend</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={povertyTrendData}>
                  <defs>
                    <linearGradient id="colorPoverty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="national" stroke="#ef4444" fillOpacity={1} fill="url(#colorPoverty)" strokeWidth={2} />
                  <Area type="monotone" dataKey="rural" stroke="#f97316" fill="transparent" strokeDasharray="5 5" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                <span className="text-slate-500 uppercase">National Avg</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 border-t border-intel-orange border-dashed"></div>
                <span className="text-slate-500 uppercase">Rural Peak</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-border space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Social Safety Net Performance</h3>
            <div className="space-y-4">
              {socialSafetyNetData.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400 uppercase tracking-tighter">{item.category}</span>
                    <span className={`font-bold ${
                      item.status === 'CRITICAL' ? 'text-intel-red' : 
                      item.status === 'OVER_BUDGET' ? 'text-intel-orange' : 
                      'text-intel-cyan'
                    }`}>{item.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        item.status === 'CRITICAL' ? 'bg-intel-red' : 
                        item.status === 'OVER_BUDGET' ? 'bg-intel-orange' : 
                        'bg-intel-cyan'
                      }`} 
                      style={{ width: `${(item.value / item.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-slate-600">
                    <span>Current: {item.value}M TND</span>
                    <span>Target: {item.target}M TND</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Poverty Risk Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Extreme Poverty', value: '4.8%', trend: '+0.6 vs 2024', status: 'CRITICAL', desc: 'Population living on less than $2.15/day. Concentrated in NW and Central regions.' },
          { label: 'Food Insecurity', value: '18.2%', trend: '+2.4 vs 2024', status: 'CRITICAL', desc: 'Households reporting inability to afford essential food items weekly.' },
          { label: 'Energy Poverty', value: '12.5%', trend: '+1.8 vs 2024', status: 'WARNING', desc: 'Households spending >10% of income on basic utility bills.' },
          { label: 'Child Poverty', value: '26.4%', trend: '+1.2 vs 2024', status: 'CRITICAL', desc: 'Children under 15 living in households below the poverty line.' }
        ].map((ind, i) => (
          <div key={i} className="glass p-4 rounded-xl border border-intel-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase">{ind.label}</span>
              <div className={`w-2 h-2 rounded-full ${ind.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' : 'bg-intel-orange'}`}></div>
            </div>
            <div className="text-2xl font-bold text-white font-mono">{ind.value}</div>
            <div className={`text-[10px] font-mono ${ind.trend.startsWith('+') ? 'text-intel-red' : 'text-intel-green'}`}>{ind.trend}</div>
            <p className="text-[9px] text-slate-600 leading-tight pt-2 border-t border-white/5">{ind.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPharmacyIntelligence = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shortage Trends */}
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between border-b border-intel-border pb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Pharmaceutical Shortage Trends</h3>
              <p className="text-[10px] text-slate-500 uppercase">Total missing molecules vs. critical lifesaving drugs</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-red"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Critical</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Total Missing</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pharmacyShortageData}>
                <defs>
                  <linearGradient id="colorMissing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="missing" stroke="#f97316" fillOpacity={1} fill="url(#colorMissing)" strokeWidth={2} />
                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-intel-red mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] text-white font-bold uppercase">Critical Stock Alert</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    94 critical lifesaving molecules (oncology, cardiology, insulin) are currently at zero stock in the Central Pharmacy. Estimated replenishment lead time: 45-60 days due to credit line issues.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-intel-orange mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] text-white font-bold uppercase">Supply Chain Latency</p>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Import dependency for raw materials has increased to 87%. Global logistics costs and local currency depreciation are driving a 15% increase in procurement delays.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medicament Inflation */}
        <div className="space-y-8">
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Critical Molecule Shortages</h3>
            <div className="space-y-3">
              {criticalMolecules.map((mol, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold text-white uppercase">{mol.name}</div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">{mol.category}</div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className={`text-[9px] font-bold font-mono ${
                      mol.shortage === 'EXTREME' || mol.shortage === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'
                    }`}>{mol.shortage}</div>
                    <div className="text-[8px] font-mono text-slate-400">Stock: {mol.stock}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-border space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Medicament Price Inflation</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={medicamentInflationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '10px' }} />
                  <Line type="monotone" dataKey="subsidized" name="Subsidized" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="nonSubsidized" name="Non-Subsidized" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-[9px] text-slate-400 leading-tight">
                <span className="text-intel-red font-bold">Divergence:</span> While subsidized drugs remained stable for 2 years, a 5% adjustment was made in March. Non-subsidized medication prices have surged by 28.5% YoY.
              </p>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-border space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Import Dependency Breakdown</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={importDependencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {importDependencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {importDependencyData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[9px] font-mono">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-slate-500 uppercase">{item.name}</span>
                  </div>
                  <span className="text-white font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Essential Meds Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {essentialMedsStatus.map((med, i) => (
          <div key={i} className="glass p-5 rounded-2xl border border-intel-border space-y-4 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  med.status === 'CRITICAL' ? 'bg-intel-red/10' : 'bg-intel-orange/10'
                }`}>
                  <Pill className={`w-4 h-4 ${
                    med.status === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'
                  }`} />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-widest">{med.category}</span>
              </div>
              <div className={`w-2 h-2 rounded-full ${med.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' : 'bg-intel-orange'}`}></div>
            </div>
            
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Availability</span>
                <span className={`text-xl font-bold font-mono ${
                  med.availability < 50 ? 'text-intel-red' : 
                  med.availability < 70 ? 'text-intel-orange' : 'text-intel-green'
                }`}>{med.availability}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    med.availability < 50 ? 'bg-intel-red' : 
                    med.availability < 70 ? 'bg-intel-orange' : 'bg-intel-green'
                  }`} 
                  style={{ width: `${med.availability}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5 relative z-10">
              <div className="flex items-center space-x-1">
                {med.trend === 'down' ? (
                  <TrendingDown className="w-3 h-3 text-intel-red" />
                ) : (
                  <Activity className="w-3 h-3 text-intel-orange" />
                )}
                <span className={`text-[9px] font-mono uppercase ${med.trend === 'down' ? 'text-intel-red' : 'text-intel-orange'}`}>
                  {med.trend} trend
                </span>
              </div>
              <span className="text-[8px] font-mono text-slate-600 uppercase">Updated: 2h ago</span>
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Stock & Procurement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Strategic Stock Levels</h3>
          <div className="space-y-6">
            {[
              { label: 'Central Pharmacy Reserves', value: 42, target: 90, unit: 'days', status: 'CRITICAL' },
              { label: 'Hospital Emergency Stock', value: 15, target: 30, unit: 'days', status: 'CRITICAL' },
              { label: 'Private Sector Inventory', value: 55, target: 120, unit: 'days', status: 'WARNING' },
              { label: 'Raw Material Buffer', value: 28, target: 180, unit: 'days', status: 'CRITICAL' }
            ].map((stock, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 uppercase tracking-tighter">{stock.label}</span>
                  <span className={`font-bold ${stock.status === 'CRITICAL' ? 'text-intel-red' : 'text-intel-orange'}`}>
                    {stock.value} / {stock.target} {stock.unit}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${stock.status === 'CRITICAL' ? 'bg-intel-red' : 'bg-intel-orange'}`} 
                    style={{ width: `${(stock.value / stock.target) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Procurement Risk Matrix</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Forex Availability', risk: 'EXTREME', color: 'text-intel-red', desc: 'Central Bank prioritizing energy/food over meds.' },
              { label: 'Supplier Credit', risk: 'HIGH', color: 'text-intel-red', desc: 'Outstanding debts to intl pharma firms > 800M TND.' },
              { label: 'Local Production', risk: 'STRESSED', color: 'text-intel-orange', desc: 'Raw material costs up 35% due to TND depreciation.' },
              { label: 'Distribution', risk: 'MODERATE', color: 'text-intel-cyan', desc: 'Fuel costs impacting regional delivery frequency.' }
            ].map((risk, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">{risk.label}</span>
                  <span className={`text-[9px] font-bold font-mono ${risk.color}`}>{risk.risk}</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight">{risk.desc}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center space-x-2 text-intel-red">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Strategic Recommendation</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">
              "Immediate activation of emergency credit lines for the Central Pharmacy is required to secure Q3/Q4 lifesaving medication imports. Failure to act will result in widespread hospital stockouts by June 2026."
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStartupIntelligence = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Ecosystem Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {startupEcosystemMetrics.map((ind, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`glass p-4 rounded-xl border ${
              ind.status === 'CRITICAL' ? 'border-intel-red/20' :
              ind.status === 'WARNING' ? 'border-intel-orange/20' :
              'border-intel-green/20'
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{ind.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                ind.status === 'CRITICAL' ? 'bg-intel-red animate-pulse' :
                ind.status === 'WARNING' ? 'bg-intel-orange' :
                'bg-intel-green'
              }`}></div>
            </div>
            <div className="text-xl font-bold text-white font-mono">{ind.value}</div>
            <div className="flex items-center space-x-1">
              {ind.trend === 'up' ? 
                <TrendingUp className="w-3 h-3 text-intel-green" /> : 
                <TrendingDown className="w-3 h-3 text-intel-red" />
              }
              <span className={`text-[10px] font-mono ${ind.trend === 'up' ? 'text-intel-green' : 'text-intel-red'}`}>
                {ind.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth & Funding Trends */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Startup Growth & Funding</h3>
              <p className="text-[10px] text-slate-500">Number of startups vs. total funding raised ($M)</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-cyan uppercase">Ecosystem Expansion</span>
              <Rocket className="w-4 h-4 text-intel-cyan animate-pulse" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={startupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingBottom: '20px' }} />
                <Bar yAxisId="left" dataKey="startups" name="New Startups" fill="#00f2ff" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="funding" name="Funding ($M)" stroke="#bf00ff" strokeWidth={2} dot={{ r: 4, fill: '#bf00ff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Breakdown */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Startup Sector Distribution</h3>
              <p className="text-[10px] text-slate-500">Breakdown of active startups by primary industry</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-green uppercase">Diversification</span>
              <Lightbulb className="w-4 h-4 text-intel-green" />
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={startupSectors}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {startupSectors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Startup News & Highlights */}
      <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Startup Ecosystem Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Series B Milestone', desc: 'Local FinTech startup raises $25M in Series B, the largest in the region this year.', impact: 'HIGH', color: 'text-intel-cyan' },
            { title: 'AgriTech Innovation', desc: 'New IoT solution for water management adopted by 50+ farms in the interior.', impact: 'MEDIUM', color: 'text-intel-green' },
            { title: 'Global Accelerator Entry', desc: 'Three Tunisian startups selected for Y Combinator Summer 2026 batch.', impact: 'HIGH', color: 'text-intel-cyan' },
            { title: 'Regulatory Sandbox', desc: 'BCT expands regulatory sandbox to include blockchain-based remittance startups.', impact: 'MEDIUM', color: 'text-intel-cyan' },
            { title: 'Startup Act 2.0', desc: 'Government announces tax incentives for angel investors and R&D grants.', impact: 'HIGH', color: 'text-intel-green' },
            { title: 'Exit Potential', desc: 'Major EU tech firm in talks to acquire local AI-driven logistics platform.', impact: 'CRITICAL', color: 'text-intel-red' }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 hover:bg-white/10 transition-all cursor-pointer group">
              <div className="flex justify-between items-start">
                <div className={`text-[10px] font-bold uppercase tracking-tight group-hover:${item.color} transition-colors`}>{item.title}</div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                  item.impact === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' :
                  item.impact === 'HIGH' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                  'bg-intel-cyan/10 border-intel-cyan/30 text-intel-cyan'
                }`}>
                  {item.impact}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRegionalComparison = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass rounded-2xl border border-intel-border overflow-hidden overflow-x-auto scrollbar-hide">
        <div className="px-6 py-4 border-b border-intel-border bg-white/5 min-w-[800px]">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">MENA Economic Comparison</h3>
          <p className="text-[10px] text-slate-500">Tunisia vs regional peers - 2025/2026 data</p>
        </div>
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-white/5 border-b border-intel-border">
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">Country</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">GDP Growth</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Inflation</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Debt/GDP</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Unemployment</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">FX Reserves</th>
              <th className="px-6 py-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest text-right">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-intel-border/30">
            {regionalData.map((peer, i) => (
              <tr key={i} className={`hover:bg-white/5 transition-all ${peer.isTarget ? 'bg-intel-cyan/5' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${peer.isTarget ? 'text-intel-cyan' : 'text-white'}`}>
                      {peer.country} {peer.isTarget && '★'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-mono font-bold ${peer.gdp < 1 ? 'text-intel-red' : 'text-intel-green'}`}>
                    {peer.gdp}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-mono font-bold ${peer.inflation > 10 ? 'text-intel-red' : 'text-slate-300'}`}>
                    {peer.inflation}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-mono font-bold ${peer.debt > 80 ? 'text-intel-red' : 'text-slate-300'}`}>
                    {peer.debt}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-mono font-bold ${peer.unemployment > 15 ? 'text-intel-red' : 'text-slate-300'}`}>
                    {peer.unemployment}%
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-xs font-mono font-bold ${peer.reserves < 100 ? 'text-intel-red' : 'text-intel-cyan'}`}>
                    {peer.reserves}d
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                    peer.risk === 'CRITICAL' ? 'bg-intel-red/10 border-intel-red/30 text-intel-red' :
                    peer.risk === 'HIGH' ? 'bg-intel-orange/10 border-intel-orange/30 text-intel-orange' :
                    'bg-intel-green/10 border-intel-green/30 text-intel-green'
                  }`}>
                    {peer.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">GDP Growth Comparison</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="gdp" radius={[4, 4, 0, 0]}>
                  { regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isTarget ? '#ef4444' : '#22d3ee'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 md:p-8 rounded-3xl border border-intel-border space-y-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Forex Reserves (Import Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 8, fontFamily: 'monospace' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }} />
                <Bar dataKey="reserves" radius={[4, 4, 0, 0]}>
                  { regionalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.reserves < 100 ? '#ef4444' :
                      entry.reserves < 120 ? '#f97316' :
                      '#22d3ee'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Economic Intelligence & Market Dynamics"
        subtitle="Real-time monitoring of macroeconomic indicators, sector health, and fiscal stability"
        icon={TrendingUp}
        nodeId="ECON-NODE-04"
      />

      <LiveTicker items={economicAlerts} />

      {/* CATEGORY SELECTOR */}
      <div className="relative">
        <div className="flex items-center gap-2 border-b border-intel-border/30 pb-4 sticky top-0 bg-black/50 backdrop-blur-md z-50 py-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 border ${
                activeCategory === cat.id 
                  ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]' 
                  : 'bg-white/5 border-intel-border text-slate-500 hover:border-white/20 hover:text-white'
              }`}
            >
              <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-intel-cyan' : 'text-slate-500'}`} />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest">{cat.label}</span>
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#020810] to-transparent pointer-events-none md:hidden z-[60]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-10 md:space-y-20 relative z-20"
        >
          {activeCategory === 'MACRO' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Landmark className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Macroeconomic Foundation</h2>
              </div>
              <div className="space-y-12">
                {renderMacroIndicators()}
              </div>
            </div>
          )}

          {activeCategory === 'REMITTANCES' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Globe className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Remittance Intelligence</h2>
              </div>
              {renderRemittances()}
            </div>
          )}

          {activeCategory === 'REGIONAL' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Globe className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Regional Economic Comparison</h2>
              </div>
              {renderRegionalComparison()}
            </div>
          )}

          {activeCategory === 'SECTOR' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Layers className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Sectoral Dynamics</h2>
              </div>
              <div className="space-y-12">
                {renderSectorAnalysis()}
              </div>
            </div>
          )}

          {activeCategory === 'MARKET' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <BarChart3 className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Market Intelligence & Price Monitoring</h2>
              </div>
              {renderMarketIntelligence()}
            </div>
          )}

          {activeCategory === 'STARTUP' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Rocket className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Startup Ecosystem & Venture Capital</h2>
              </div>
              {renderStartupIntelligence()}
            </div>
          )}

          {activeCategory === 'BUSINESS' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Briefcase className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Business Climate & Economic Freedom</h2>
              </div>
              {renderBusinessClimate()}
            </div>
          )}

          {activeCategory === 'SOCIAL' && (
            <div className="space-y-8">
              <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
                <Users className="w-6 h-6 text-intel-cyan" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Social & Strategic Economy</h2>
              </div>
              <div className="space-y-12">
                {renderPovertyTracker()}
                <div className="pt-8 border-t border-intel-border/30">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Pharmaceutical Intelligence & Strategic Stocks</h3>
                  {renderPharmacyIntelligence()}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
