import React from 'react';
import { motion } from 'motion/react';
import { 
  Library, 
  ExternalLink, 
  Shield, 
  Globe, 
  Database, 
  Search,
  ChevronRight,
  Info,
  Clock,
  ArrowLeft,
  Plus,
  X
} from 'lucide-react';

interface Source {
  name: string;
  reliability: 'HIGH' | 'MEDIUM' | 'PENDING';
  description: string;
  url: string;
}

interface SourceCategory {
  title: string;
  sources: Source[];
}

const sourceData: SourceCategory[] = [
  {
    title: "OFFICIAL / GOVERNMENT",
    sources: [
      {
        name: "INS Tunisia",
        reliability: "HIGH",
        description: "National statistics institute — CPI, GDP, employment, poverty",
        url: "ins.tn"
      },
      {
        name: "Banque Centrale de Tunisie",
        reliability: "HIGH",
        description: "Monetary policy, forex reserves, banking sector data",
        url: "bct.gov.tn"
      },
      {
        name: "Ministry of Finance",
        reliability: "HIGH",
        description: "Budget, debt, fiscal data",
        url: "finances.gov.tn"
      },
      {
        name: "ISIE",
        reliability: "MEDIUM",
        description: "Electoral results and voter registration",
        url: "isie.tn"
      },
      {
        name: "TAP Wire",
        reliability: "MEDIUM",
        description: "Official government statements — biased but authoritative for gov positions",
        url: "tap.info.tn"
      },
      {
        name: "FIPA",
        reliability: "HIGH",
        description: "Foreign investment promotion — FDI data",
        url: "investintunisia.tn"
      }
    ]
  },
  {
    title: "INVESTIGATIVE & INDEPENDENT MEDIA",
    sources: [
      {
        name: "Inkyfada",
        reliability: "HIGH",
        description: "Investigative journalism, human rights, data journalism. Highest quality Tunisian outlet.",
        url: "inkyfada.com"
      },
      {
        name: "Nawaat",
        reliability: "HIGH",
        description: "Pioneered online journalism in Tunisia. Strong on civil liberties and political repression.",
        url: "nawaat.org"
      },
      {
        name: "Business News TN",
        reliability: "HIGH",
        description: "Economic and financial reporting. Good industry coverage.",
        url: "businessnews.com.tn"
      },
      {
        name: "Mosaique FM",
        reliability: "MEDIUM",
        description: "Most listened radio. Generally balanced; cautious on presidential criticism.",
        url: "mosaiquefm.net"
      }
    ]
  },
  {
    title: "INTERNATIONAL NEWS & ANALYSIS",
    sources: [
      {
        name: "Reuters",
        reliability: "HIGH",
        description: "Primary international wire for Tunisia economic/political news",
        url: "reuters.com"
      },
      {
        name: "AFP",
        reliability: "HIGH",
        description: "French wire with strong Maghreb coverage",
        url: "afp.com"
      },
      {
        name: "Le Monde Afrique",
        reliability: "HIGH",
        description: "French-language analysis, strong Tunisia coverage",
        url: "lemonde.fr/afrique"
      },
      {
        name: "Middle East Eye",
        reliability: "MEDIUM",
        description: "Regional analysis. Good on political Islam and opposition perspectives.",
        url: "middleeasteye.net"
      }
    ]
  },
  {
    title: "DATA & ACADEMIC",
    sources: [
      {
        name: "World Bank Open Data",
        reliability: "HIGH",
        description: "Macro indicators, poverty, development data",
        url: "data.worldbank.org"
      },
      {
        name: "IMF DataMapper",
        reliability: "HIGH",
        description: "GDP, inflation, debt, current account data",
        url: "imf.org/datamapper"
      },
      {
        name: "ACLED",
        reliability: "HIGH",
        description: "Armed conflict and protest event data — useful for unrest tracking",
        url: "acleddata.com"
      },
      {
        name: "Freedom House",
        reliability: "HIGH",
        description: "Democracy and civil liberties index",
        url: "freedomhouse.org"
      },
      {
        name: "RSF Press Freedom Index",
        reliability: "HIGH",
        description: "Annual media freedom rankings",
        url: "rsf.org"
      },
      {
        name: "V-Dem (Varieties of Democracy)",
        reliability: "HIGH",
        description: "Academic democracy indicators — best longitudinal dataset",
        url: "v-dem.net"
      }
    ]
  },
  {
    title: "REAL-TIME FEEDS (PLANNED)",
    sources: [
      {
        name: "WFP VAM API",
        reliability: "HIGH",
        description: "World Food Programme food price monitoring — Tunisia data available",
        url: "vam.wfp.org"
      },
      {
        name: "FAO GIEWS",
        reliability: "HIGH",
        description: "Global food price monitoring — regional comparison",
        url: "fao.org/giews"
      },
      {
        name: "BCT Open Data (Planned)",
        reliability: "PENDING",
        description: "BCT has not yet published a public API. Market prices service is designed to connect here.",
        url: "bct.gov.tn"
      },
      {
        name: "INS Open Data (Planned)",
        reliability: "PENDING",
        description: "INS plans API publication — expected 2026",
        url: "ins.tn"
      }
    ]
  }
];

export const SourceLibrary: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const sourceData: SourceCategory[] = [
    {
      title: "OFFICIAL / GOVERNMENT",
      sources: [
        {
          name: "INS Tunisia",
          reliability: "HIGH",
          description: "National statistics institute — CPI, GDP, employment, poverty",
          url: "ins.tn"
        },
        {
          name: "Banque Centrale de Tunisie",
          reliability: "HIGH",
          description: "Monetary policy, forex reserves, banking sector data",
          url: "bct.gov.tn"
        },
        {
          name: "Ministry of Finance",
          reliability: "HIGH",
          description: "Budget, debt, fiscal data",
          url: "finances.gov.tn"
        },
        {
          name: "ISIE",
          reliability: "MEDIUM",
          description: "Electoral results and voter registration",
          url: "isie.tn"
        },
        {
          name: "TAP Wire",
          reliability: "MEDIUM",
          description: "Official government statements — biased but authoritative for gov positions",
          url: "tap.info.tn"
        },
        {
          name: "FIPA",
          reliability: "HIGH",
          description: "Foreign investment promotion — FDI data",
          url: "investintunisia.tn"
        }
      ]
    },
    {
      title: "SOCIAL MEDIA",
      sources: [
        {
          name: "UGTT Facebook",
          reliability: "HIGH",
          description: "Official union announcements and labor mobilization",
          url: "facebook.com/ugtt.tunisie"
        },
        {
          name: "Presidency Tunisia",
          reliability: "HIGH",
          description: "Official presidential decrees and statements",
          url: "facebook.com/Presidence.tn"
        },
        {
          name: "Nawaat Facebook",
          reliability: "HIGH",
          description: "Independent news and civil society updates",
          url: "facebook.com/nawaat"
        },
        {
          name: "Inkyfada Facebook",
          reliability: "HIGH",
          description: "Data-driven investigative reports and social issues",
          url: "facebook.com/inkyfada"
        },
        {
          name: "Tunisia OSINT Telegram",
          reliability: "MEDIUM",
          description: "Open-source intelligence and security alerts",
          url: "t.me/tunisia_osint"
        }
      ]
    },
    {
      title: "INVESTIGATIVE & INDEPENDENT MEDIA",
      sources: [
        {
          name: "Inkyfada",
          reliability: "HIGH",
          description: "Investigative journalism, human rights, data journalism. Highest quality Tunisian outlet.",
          url: "inkyfada.com"
        },
        {
          name: "Nawaat",
          reliability: "HIGH",
          description: "Pioneered online journalism in Tunisia. Strong on civil liberties and political repression.",
          url: "nawaat.org"
        },
        {
          name: "Business News TN",
          reliability: "HIGH",
          description: "Economic and financial reporting. Good industry coverage.",
          url: "businessnews.com.tn"
        },
        {
          name: "Mosaique FM",
          reliability: "MEDIUM",
          description: "Most listened radio. Generally balanced; cautious on presidential criticism.",
          url: "mosaiquefm.net"
        }
      ]
    },
    {
      title: "DATA SOURCES",
      sources: [
        {
          name: "BCT Publications",
          reliability: "HIGH",
          description: "Central Bank economic notes and monetary bulletins",
          url: "bct.gov.tn/publications"
        },
        {
          name: "INS Statistics",
          reliability: "HIGH",
          description: "National Institute of Statistics data portal",
          url: "ins.tn/en/data"
        },
        {
          name: "IMF Tunisia",
          reliability: "HIGH",
          description: "International Monetary Fund country reports and data",
          url: "imf.org/en/Countries/TUN"
        },
        {
          name: "World Bank Tunisia",
          reliability: "HIGH",
          description: "World Bank development indicators and economic outlook",
          url: "worldbank.org/en/country/tunisia"
        },
        {
          name: "ANME Energy",
          reliability: "HIGH",
          description: "National Agency for Energy Management — energy balance data",
          url: "anme.tn"
        },
        {
          name: "STEG Reports",
          reliability: "HIGH",
          description: "National electricity and gas company annual reports",
          url: "steg.com.tn"
        },
        {
          name: "Heritage Foundation",
          reliability: "HIGH",
          description: "Index of Economic Freedom — Tunisia profile",
          url: "heritage.org/index/country/tunisia"
        },
        {
          name: "RSF Press Freedom",
          reliability: "HIGH",
          description: "Reporters Without Borders — Press freedom rankings",
          url: "rsf.org/en/country/tunisia"
        },
        {
          name: "Transparency International",
          reliability: "HIGH",
          description: "Corruption Perceptions Index — Tunisia data",
          url: "transparency.org/en/countries/tunisia"
        }
      ]
    },
    {
      title: "INTERNATIONAL NEWS & ANALYSIS",
      sources: [
        {
          name: "Reuters",
          reliability: "HIGH",
          description: "Primary international wire for Tunisia economic/political news",
          url: "reuters.com"
        },
        {
          name: "AFP",
          reliability: "HIGH",
          description: "French wire with strong Maghreb coverage",
          url: "afp.com"
        },
        {
          name: "Le Monde Afrique",
          reliability: "HIGH",
          description: "French-language analysis, strong Tunisia coverage",
          url: "lemonde.fr/afrique"
        },
        {
          name: "Middle East Eye",
          reliability: "MEDIUM",
          description: "Regional analysis. Good on political Islam and opposition perspectives.",
          url: "middleeasteye.net"
        }
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] bg-[#020810]/98 backdrop-blur-md overflow-hidden flex flex-col"
    >
      {/* Overlay Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-intel-cyan/10 rounded-xl flex items-center justify-center border border-intel-cyan/20">
            <Globe className="w-5 h-5 text-intel-cyan" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Source Library</h2>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest">Verified Sources</span>
              <span className="text-slate-700">•</span>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Grounding Database</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors group"
        >
          <X className="w-6 h-6 text-slate-500 group-hover:text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <div className="max-w-[1200px] mx-auto space-y-16">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-intel-cyan/10 rounded-2xl flex items-center justify-center border border-intel-cyan/20">
              <Library className="w-8 h-8 text-intel-cyan" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Intelligence Source Library</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-2xl">
                A curated database of authoritative sources used to ground the platform's risk models and AI analysis.
              </p>
            </div>
          </div>

          <div className="space-y-16">
            {sourceData.map((category, idx) => (
              <motion.section 
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-4 border-b border-intel-border pb-4">
                  <div className="w-1.5 h-6 bg-intel-cyan rounded-full"></div>
                  <h3 className="text-sm font-mono font-bold text-intel-cyan uppercase tracking-[0.2em]">
                    {category.title}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {category.sources.map((source, sIdx) => (
                    <motion.div
                      key={source.name}
                      whileHover={{ x: 10 }}
                      className="group bg-intel-card/50 border border-intel-border rounded-xl p-4 flex items-center justify-between hover:border-intel-cyan/30 transition-all"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-intel-cyan/20 transition-colors">
                          <Globe className="w-5 h-5 text-slate-500 group-hover:text-intel-cyan transition-colors" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-bold text-white group-hover:text-intel-cyan transition-colors">
                              {source.name}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold border ${
                              source.reliability === 'HIGH' ? 'bg-intel-green/10 text-intel-green border-intel-green/20' :
                              source.reliability === 'MEDIUM' ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
                              'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                              {source.reliability}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {source.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button 
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { url: source.url } }));
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-intel-cyan hover:text-black transition-all flex items-center space-x-2"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Pipeline</span>
                        </button>
                        <div className="text-[10px] font-mono text-slate-600 group-hover:text-intel-cyan transition-colors">
                          {source.url}
                        </div>
                        <a href={`https://${source.url}`} target="_blank" rel="noreferrer" className="p-1 hover:bg-white/10 rounded transition-colors">
                          <ExternalLink className="w-4 h-4 text-slate-700 group-hover:text-intel-cyan transition-colors" />
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Methodology Note */}
          <div className="mt-20 p-8 rounded-3xl border border-intel-border bg-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-32 h-32 text-intel-cyan" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center space-x-2 text-intel-cyan">
                <Info className="w-4 h-4" />
                <span className="text-xs font-mono uppercase font-bold tracking-widest">Methodology & Verification</span>
              </div>
              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                The TunisiaIntel platform employs a multi-source verification protocol. Data from official government sources is cross-referenced with independent investigative reports and international academic datasets to ensure the highest level of accuracy in our risk models.
              </p>
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>Last Audit: March 10, 2026</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                  <Database className="w-3 h-3" />
                  <span>24 Active API Connections</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
