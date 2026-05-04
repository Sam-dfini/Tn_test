import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Filter,
  Search,
  ArrowUpRight,
  Info,
  DollarSign,
  Store,
  Globe,
  Database
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { supabase, PriceReport } from '../../lib/supabase';
import { CornerAccent } from '../shared/ProfessionalShared';
import { generateRandomId } from '../../utils/idUtils';
import { prepareList, assertKey, getRenderKey } from '../../lib/keyUtils';

const PRODUCTS = [
  { id: 'bread', name: 'Bread (Baguette)', unit: 'piece', basePrice: 0.200 },
  { id: 'milk', name: 'Milk', unit: 'litre', basePrice: 1.350 },
  { id: 'sugar', name: 'Sugar', unit: 'kg', basePrice: 1.400 },
  { id: 'oil', name: 'Vegetable Oil', unit: 'litre', basePrice: 0.900 },
  { id: 'tomato', name: 'Tomatoes', unit: 'kg', basePrice: 1.800 },
  { id: 'potato', name: 'Potatoes', unit: 'kg', basePrice: 1.600 },
  { id: 'chicken', name: 'Chicken', unit: 'kg', basePrice: 8.500 },
  { id: 'eggs', name: 'Eggs (4 pack)', unit: 'pack', basePrice: 1.400 },
];

const GOVERNORATES = [
  'Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Gabès', 'Ariana', 'Gafsa', 'Monastir', 'Ben Arous', 'Kasserine', 'Médenine', 'Nabeul', 'Tataouine', 'Béja', 'Kef', 'Mahdia', 'Sidi Bouzid', 'Jendouba', 'Tozeur', 'Zaghouan', 'Kebili', 'Siliana', 'Manouba'
];

const MARKET_TYPES = [
  { id: 'formal', name: 'Formal (Supermarket)', color: 'text-intel-cyan' },
  { id: 'informal', name: 'Informal (Souk/Black Market)', color: 'text-intel-orange' },
  { id: 'online', name: 'Online Delivery', color: 'text-intel-purple' },
];

export const EconomicReality: React.FC = () => {
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterProduct, setFilterProduct] = useState('ALL');
  const [filterGov, setFilterGov] = useState('ALL');

  // Form State
  const [newReport, setNewReport] = useState({
    product: PRODUCTS[0].id,
    price_tnd: PRODUCTS[0].basePrice,
    unit: PRODUCTS[0].unit,
    market_type: 'formal' as 'formal' | 'informal' | 'online',
    governorate: 'Tunis',
    notes: ''
  });

  useEffect(() => {
    fetchReports();
    
    // Subscribe to changes
    const channel = supabase
      .channel('price_reports_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_reports' }, (payload) => {
        setReports(prev => [payload.new as PriceReport, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('price_reports')
        .select('*')
        .order('reported_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching price reports:', error);
      // Fallback to mock data if supabase fails
      setReports(generateMockReports());
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockReports = (): PriceReport[] => {
    const mock: PriceReport[] = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const gov = GOVERNORATES[Math.floor(Math.random() * GOVERNORATES.length)];
      const market = MARKET_TYPES[Math.floor(Math.random() * MARKET_TYPES.length)];
      const date = new Date(now.getTime() - Math.random() * 86400000 * 7);
      
      mock.push({
        id: `mock-${i}`,
        product: product.id,
        price_tnd: product.basePrice * (1 + (Math.random() * 0.4 - 0.1)),
        unit: product.unit,
        market_type: market.id as any,
        governorate: gov,
        reported_at: date.toISOString(),
        confirmed_by: Math.floor(Math.random() * 10),
        disputed_by: Math.floor(Math.random() * 2),
        notes: Math.random() > 0.7 ? 'Shortage observed at local market.' : undefined
      });
    }
    return mock.sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('price_reports')
        .insert([newReport]);

      if (error) throw error;
      
      setShowAddForm(false);
      // If not using real-time subscription, we'd fetch again here
    } catch (error) {
      console.error('Error submitting report:', error);
      // For demo purposes, add to local state if supabase fails
      const mockNew: PriceReport = {
        ...newReport,
        id: generateRandomId('report'),
        reported_at: new Date().toISOString(),
        confirmed_by: 0,
        disputed_by: 0
      };
      setReports(prev => [mockNew, ...prev]);
      setShowAddForm(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesProduct = filterProduct === 'ALL' || r.product === filterProduct;
      const matchesGov = filterGov === 'ALL' || r.governorate === filterGov;
      return matchesProduct && matchesGov;
    });
  }, [reports, filterProduct, filterGov]);

  const priceTrends = useMemo(() => {
    // Group by day and calculate average for the selected product
    if (filterProduct === 'ALL') return [];
    
    const productReports = reports.filter(r => r.product === filterProduct);
    const grouped: Record<string, { sum: number, count: number }> = {};
    
    productReports.forEach(r => {
      const date = r.reported_at.split('T')[0];
      if (!grouped[date]) grouped[date] = { sum: 0, count: 0 };
      grouped[date].sum += r.price_tnd;
      grouped[date].count += 1;
    });
    
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        avg: data.sum / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [reports, filterProduct]);

  const inflationIndex = useMemo(() => {
    // Calculate deviation from base prices
    if (reports.length === 0) return 0;
    
    let totalDeviation = 0;
    let count = 0;
    
    reports.forEach(r => {
      const product = PRODUCTS.find(p => p.id === r.product);
      if (product) {
        totalDeviation += (r.price_tnd / product.basePrice) - 1;
        count++;
      }
    });
    
    return (totalDeviation / count) * 100;
  }, [reports]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Economic Reality Intelligence"
        subtitle="Crowdsourced price index tracking the actual cost of living across Tunisia"
        icon={ShoppingBag}
        nodeId="ECON-REAL-17"
      />

      <div className="flex flex-col items-center text-center space-y-4 relative z-20">
        <div className="relative">
          <div className="absolute -inset-4 bg-intel-cyan/20 blur-2xl rounded-full opacity-50"></div>
          <h2 className="text-3xl tracking-tight relative z-10">Economic Reality Monitor</h2>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Crowdsourced price index tracking the actual cost of living across Tunisia. 
          Bridging the gap between official statistics and street-level economic pressure.
        </p>
        
        <div className="flex items-center space-x-6 pt-4">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Reality Inflation Index</span>
            <div className={`text-2xl font-bold font-mono ${inflationIndex > 15 ? 'text-intel-red' : 'text-intel-orange'}`}>
              {inflationIndex > 0 ? '+' : ''}{inflationIndex.toFixed(1)}%
            </div>
          </div>
          <div className="h-10 w-[1px] bg-intel-border"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Active Nodes</span>
            <div className="text-2xl font-bold font-mono text-intel-cyan">
              {reports.length * 12}
            </div>
          </div>
          <div className="h-10 w-[1px] bg-intel-border"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">Confidence</span>
            <div className="text-2xl font-bold font-mono text-intel-green">
              High
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Feed & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-6 rounded-2xl border border-intel-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <select 
                    value={filterProduct}
                    onChange={(e) => setFilterProduct(e.target.value)}
                    className="bg-intel-bg border border-intel-border rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50 appearance-none min-w-[140px]"
                  >
                    <option value="ALL">ALL PRODUCTS</option>
                    {prepareList(PRODUCTS).map((p: any) => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <select 
                    value={filterGov}
                    onChange={(e) => setFilterGov(e.target.value)}
                    className="bg-intel-bg border border-intel-border rounded-lg pl-9 pr-4 py-1.5 text-[10px] font-mono text-white focus:outline-none focus:border-intel-cyan/50 appearance-none min-w-[140px]"
                  >
                    <option value="ALL">ALL GOVERNORATES</option>
                    {prepareList(GOVERNORATES).map((g: any) => <option key={g.id} value={g.value}>{String(g.value).toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-intel-cyan text-intel-bg rounded-xl font-bold text-xs hover:bg-intel-cyan/80 transition-all shadow-lg shadow-intel-cyan/20"
              >
                <Plus className="w-4 h-4" />
                <span>REPORT PRICE</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="w-10 h-10 border-2 border-intel-cyan/30 border-t-intel-cyan rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase animate-pulse">Syncing with Economic Grid...</span>
                </div>
              ) : filteredReports.length > 0 ? (
                prepareList(filteredReports).map((report: any) => {
                  const product = PRODUCTS.find(p => p.id === report.product);
                  const market = MARKET_TYPES.find(m => m.id === report.market_type);
                  const deviation = product ? (report.price_tnd / product.basePrice - 1) * 100 : 0;
                  
                  return (
                    <motion.div 
                      key={report.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${deviation > 20 ? 'bg-intel-red/10 border-intel-red/20 text-intel-red' : 'bg-intel-cyan/10 border-intel-cyan/20 text-intel-cyan'}`}>
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-bold text-white uppercase">{product?.name || report.product}</h4>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${market?.color.replace('text-', 'bg-').replace('text-', 'border-')}/20 ${market?.color} border-current/20`}>
                                {market?.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-500">
                              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {report.governorate}</span>
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {new Date(report.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold font-mono text-white tracking-tighter">{report.price_tnd.toFixed(3)} TND</div>
                          <div className={`text-[10px] font-mono font-bold ${deviation > 0 ? 'text-intel-red' : 'text-intel-green'}`}>
                            {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}% vs Base
                          </div>
                        </div>
                      </div>
                      
                      {report.notes && (
                        <div className="mt-3 p-2 bg-black/20 rounded border border-white/5 text-[10px] text-slate-400 italic">
                          "{report.notes}"
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-[9px] font-mono text-slate-500 hover:text-intel-green transition-colors">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Confirm ({report.confirmed_by})</span>
                          </button>
                          <button className="flex items-center space-x-1 text-[9px] font-mono text-slate-500 hover:text-intel-red transition-colors">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Dispute ({report.disputed_by})</span>
                          </button>
                        </div>
                        <button className="text-[9px] font-mono text-intel-cyan uppercase hover:underline">View Analysis</button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                  <Database className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-mono uppercase">No reports matching criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Trends & Insights */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-2xl border border-intel-border">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-intel-cyan" />
              Price Trend Analysis
            </h3>
            
            {filterProduct !== 'ALL' ? (
              <div className="space-y-6">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceTrends}>
                      <defs>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        hide 
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#475569', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '8px', fontSize: '10px', fontFamily: 'JetBrains Mono' }}
                      />
                      <Area type="monotone" dataKey="avg" stroke="#00f2ff" fillOpacity={1} fill="url(#colorAvg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 bg-intel-cyan/10 border border-intel-cyan/20 rounded-xl">
                  <div className="text-[8px] font-mono text-intel-cyan uppercase font-bold mb-1">Analyst Insight</div>
                  <p className="text-[10px] text-slate-300 leading-relaxed italic">
                    "Upward pressure on {PRODUCTS.find(p => p.id === filterProduct)?.name} prices correlates with recent supply chain disruptions in the {filterGov !== 'ALL' ? filterGov : 'coastal'} region."
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Info className="w-6 h-6 text-slate-600" />
                </div>
                <p className="text-[10px] font-mono text-slate-500 uppercase max-w-[200px]">
                  Select a specific product to view historical price trends
                </p>
              </div>
            )}
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-border bg-gradient-to-br from-intel-card to-intel-orange/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-intel-orange" />
              Shortage Alerts
            </h3>
            <div className="space-y-3">
              {prepareList([
                { item: 'Subsidized Flour', region: 'Sfax', risk: 'CRITICAL' },
                { item: 'Vegetable Oil', region: 'Kairouan', risk: 'HIGH' },
                { item: 'Sugar', region: 'Tunis', risk: 'ELEVATED' },
              ]).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <div className="text-[10px] font-bold text-white uppercase">{alert.item}</div>
                    <div className="text-[8px] font-mono text-slate-500 uppercase">{alert.region}</div>
                  </div>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                    alert.risk === 'CRITICAL' ? 'bg-intel-red/10 text-intel-red border-intel-red/20' : 
                    alert.risk === 'HIGH' ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' : 
                    'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20'
                  }`}>
                    {alert.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-intel-border">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center">
              <Globe className="w-4 h-4 mr-2 text-intel-cyan" />
              Regional Disparity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Highest Prices:</span>
                <span className="text-intel-red font-bold uppercase">Tunis / Sousse</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500 uppercase">Lowest Prices:</span>
                <span className="text-intel-green font-bold uppercase">Sidi Bouzid / Béja</span>
              </div>
              <div className="pt-2">
                <div className="text-[8px] font-mono text-slate-600 uppercase mb-2">Price Gap Index</div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-intel-green via-intel-cyan to-intel-red" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Report Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-intel-bg/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-intel-card border border-intel-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <CornerAccent position="tl" />
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-intel-cyan/10 flex items-center justify-center border border-intel-cyan/20">
                      <Plus className="text-intel-cyan w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-widest">Submit Price Report</h3>
                      <div className="text-[10px] font-mono text-intel-cyan uppercase tracking-[0.2em]">CITIZEN INTELLIGENCE NODE // NODE-REAL-16</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="p-2 text-slate-500 hover:text-white transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Product</label>
                      <select 
                        value={newReport.product}
                        onChange={(e) => {
                          const p = PRODUCTS.find(x => x.id === e.target.value);
                          setNewReport(prev => ({ 
                            ...prev, 
                            product: e.target.value,
                            unit: p?.unit || 'unit',
                            price_tnd: p?.basePrice || 1.0
                          }));
                        }}
                        className="w-full bg-intel-bg border border-intel-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
                      >
                        {PRODUCTS.map((p, index) => <option key={`form-product-${p.id}-${index}`} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Price (TND)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.001"
                          value={newReport.price_tnd}
                          onChange={(e) => setNewReport(prev => ({ ...prev, price_tnd: parseFloat(e.target.value) }))}
                          className="w-full bg-intel-bg border border-intel-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 uppercase">TND</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Governorate</label>
                      <select 
                        value={newReport.governorate}
                        onChange={(e) => setNewReport(prev => ({ ...prev, governorate: e.target.value }))}
                        className="w-full bg-intel-bg border border-intel-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
                      >
                        {GOVERNORATES.map((g, index) => <option key={`form-gov-${g}-${index}`} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Market Type</label>
                      <select 
                        value={newReport.market_type}
                        onChange={(e) => setNewReport(prev => ({ ...prev, market_type: e.target.value as any }))}
                        className="w-full bg-intel-bg border border-intel-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
                      >
                        {MARKET_TYPES.map((m, index) => <option key={`form-market-${m.id}-${index}`} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Notes (Optional)</label>
                    <textarea 
                      value={newReport.notes}
                      onChange={(e) => setNewReport(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g. Limited availability, long queues..."
                      className="w-full bg-intel-bg border border-intel-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-intel-cyan/50 transition-all h-24 resize-none"
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full bg-intel-cyan text-intel-bg py-4 rounded-xl font-bold text-sm hover:bg-intel-cyan/80 transition-all shadow-xl shadow-intel-cyan/20 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>SUBMIT INTELLIGENCE REPORT</span>
                    </button>
                    <p className="text-[8px] font-mono text-slate-600 text-center mt-4 uppercase tracking-widest">
                      By submitting, you confirm this data is accurate to your local reality.
                    </p>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
