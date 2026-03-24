import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock,
  AlertTriangle, Shield, Users, Gavel, Radio,
  ExternalLink, Filter, Search, BarChart3,
  TrendingUp, X, Info, Download, Eye,
  UserX, Lock, Unlock, FileText, Globe,
  Activity, Zap
} from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';

type EventType =
  | 'protest'
  | 'arrest'
  | 'trial'
  | 'release'
  | 'economic'
  | 'political'
  | 'diplomatic'
  | 'decree'
  | 'anniversary'
  | 'deadline';

type PrisonerStatus = 'DETAINED' | 'RELEASED' | 'ACQUITTED' | 'FLED';
type ChargeCategory = 'TERRORISM' | 'DECREE54' | 'DISORDER' | 'CONSPIRACY' | 'OTHER';
type RealReason =
  | 'FACEBOOK_POST'
  | 'WHATSAPP_MESSAGE'
  | 'PROTEST_ATTENDANCE'
  | 'POLITICAL_OPPOSITION'
  | 'JOURNALISM'
  | 'LEGAL_DEFENSE'
  | 'UNION_ACTIVITY'
  | 'HUMAN_RIGHTS'
  | 'PETITION';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  titleAr?: string;
  type: EventType;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  source: string;
  governorate?: string;
  actors?: string[];
  rriImpact?: string;
  rriVariable?: string;
  trialId?: string; // links to trial
  prisonerId?: string; // links to prisoner
  upcoming?: boolean;
  predicted?: boolean;
  predictionProbability?: number;
  internationalAttention?: boolean;
}

interface PoliticalPrisoner {
  id: string;
  name: string;
  nameAr?: string;
  role: string;
  affiliation: string;
  status: PrisonerStatus;
  // Detention
  arrestDate: string; // YYYY-MM-DD
  releaseDate?: string;
  detentionFacility?: string;
  // Legal
  officialCharge: string;
  chargeCategory: ChargeCategory;
  realReason: RealReason;
  realReasonDescription: string;
  gapScore: number; // 0-100, how weaponized is the charge
  // Trial
  trialStatus: string;
  lastHearing?: string;
  nextHearing?: string;
  lawyer?: string;
  lawyerDetained?: boolean;
  // Context
  internationalAttention: string[]; // HRW, Amnesty, EU, etc.
  sources: string[];
  notes?: string;
  // Health
  healthConcerns?: string;
  // RRI
  rriVariables: string[];
  significance: string;
}

const POLITICAL_PRISONERS: PoliticalPrisoner[] = [
  {
    id: 'PP001',
    name: 'Rached Ghannouchi',
    nameAr: 'راشد الغنوشي',
    role: 'President of Ennahda Movement, Former Parliament Speaker',
    affiliation: 'Ennahda Movement',
    status: 'DETAINED',
    arrestDate: '2023-04-17',
    detentionFacility: 'Mornaguia Prison',
    officialCharge: 'Terrorism conspiracy, plotting against state security',
    chargeCategory: 'TERRORISM',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Leader of largest opposition party. Charged after meeting with NSF members and giving interview to foreign media criticizing presidential power concentration.',
    gapScore: 95,
    trialStatus: 'INDEFINITELY POSTPONED',
    lastHearing: '2024-11-12',
    nextHearing: undefined,
    lawyer: 'Samir Ben Omar',
    lawyerDetained: false,
    internationalAttention: ['HRW', 'Amnesty International', 'EU Parliament', 'US State Department', 'RSF', 'ICC Bar Association'],
    sources: ['HRW report Apr 2023', 'Amnesty urgent action', 'EU Parliament resolution'],
    healthConcerns: 'Diabetic. Reports of inadequate medical care. Age 82.',
    notes: 'Longest-serving political prisoner in current wave. Multiple UN Special Rapporteur communications.',
    rriVariables: ['D42 (judicial independence)', 'L121 (authoritarian index)', 'M131 (opposition cohesion)'],
    significance: 'Most internationally recognized political prisoner. His continued detention is the primary symbol of Tunisia\'s democratic backsliding.',
  },
  {
    id: 'PP002',
    name: 'Noureddine Bhiri',
    nameAr: 'نور الدين البحيري',
    role: 'Former Justice Minister, Ennahda Vice President',
    affiliation: 'Ennahda Movement',
    status: 'DETAINED',
    arrestDate: '2022-01-03',
    detentionFacility: 'Mornaguia Prison',
    officialCharge: 'Terrorism, harboring terrorists',
    chargeCategory: 'TERRORISM',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Former minister targeted for his role in Ennahda government 2011-2013. No specific act cited. Charges reference decade-old political decisions.',
    gapScore: 92,
    trialStatus: 'PRE-TRIAL DETENTION — NO TRIAL DATE SET',
    lastHearing: '2024-09-08',
    lawyer: 'Multiple defense attorneys',
    lawyerDetained: false,
    internationalAttention: ['HRW', 'Amnesty International', 'FIDH'],
    sources: ['Amnesty UA 2022', 'HRW Tunisia report 2023'],
    healthConcerns: 'Heart condition. Multiple hunger strikes in protest of detention conditions.',
    rriVariables: ['D42', 'L121', 'O151 (perceived injustice)'],
    significance: 'Longest detained of current wave (2022). His detention without trial exceeds maximum legal pre-trial detention periods under Tunisian law.',
  },
  {
    id: 'PP003',
    name: 'Ghazi Chaouachi',
    nameAr: 'غازي الشواشي',
    role: 'Secretary General of Destourian Democratic Party',
    affiliation: 'National Salvation Front (NSF)',
    status: 'DETAINED',
    arrestDate: '2023-02-11',
    detentionFacility: 'Mornaguia Prison',
    officialCharge: 'Terrorism conspiracy, plotting against state security',
    chargeCategory: 'TERRORISM',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Arrested during wave targeting NSF leadership. Specific charge: attending NSF meeting and signing opposition statement calling for return to democratic governance.',
    gapScore: 97,
    trialStatus: 'INDEFINITELY POSTPONED',
    lastHearing: '2025-01-15',
    internationalAttention: ['HRW', 'Amnesty', 'EU Parliament', 'CPJ'],
    sources: ['HRW Feb 2023', 'Amnesty urgent action Feb 2023'],
    rriVariables: ['D42', 'M131', 'O151'],
    significance: 'Part of coordinated February 2023 mass arrest of opposition. Attending a political meeting classified as terrorism.',
  },
  {
    id: 'PP004',
    name: 'Jaouhar Ben Mbarek',
    nameAr: 'جوهر بن مبارك',
    role: 'Constitutional Law Professor, NSF Co-founder',
    affiliation: 'National Salvation Front (NSF)',
    status: 'DETAINED',
    arrestDate: '2023-02-11',
    detentionFacility: 'Mornaguia Prison',
    officialCharge: 'Conspiracy against state security, terrorism',
    chargeCategory: 'TERRORISM',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Academic and civil society figure. Arrested same day as Chaouachi. Known for constitutional analysis critical of Saied\'s 2021 power grab. Publicly stated Saied\'s constitution was legally invalid.',
    gapScore: 98,
    trialStatus: 'PRE-TRIAL — NO DATE',
    lastHearing: '2025-02-03',
    internationalAttention: ['HRW', 'Amnesty', 'International Association of Constitutional Law', 'EU'],
    sources: ['HRW Feb 2023', 'IACL statement'],
    healthConcerns: 'Multiple reported hunger strikes. Diabetic.',
    rriVariables: ['D42', 'D50 (trust in institutions)', 'O151'],
    significance: 'His detention represents the criminalization of academic criticism of the regime. Constitutional law professor jailed for saying the constitution is illegal.',
  },
  {
    id: 'PP005',
    name: 'Abir Moussi',
    nameAr: 'عبير موسي',
    role: 'President of Free Destourian Party (PDL)',
    affiliation: 'PDL (Free Destourian Party)',
    status: 'DETAINED',
    arrestDate: '2023-10-03',
    detentionFacility: 'Women\'s Prison, Manouba',
    officialCharge: 'Disturbing public order, attacking the head of state',
    chargeCategory: 'DISORDER',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Arrested after staging sit-in at administrative court to protest exclusion from elections. Was herself an opposition figure who had previously criticized Ennahda — now jailed by the same regime she once supported.',
    gapScore: 85,
    trialStatus: 'MULTIPLE HEARINGS — NO VERDICT',
    lastHearing: '2025-03-01',
    internationalAttention: ['Amnesty International', 'EU Parliament'],
    sources: ['Amnesty Oct 2023', 'AFP reports'],
    rriVariables: ['D42', 'O151'],
    significance: 'Her arrest shows the regime jails even former allies. Sitting protest outside a court building classified as attacking the state.',
  },
  {
    id: 'PP006',
    name: 'Issam Chebbi',
    nameAr: 'عصام الشابي',
    role: 'Secretary General of Republican Party',
    affiliation: 'National Salvation Front (NSF)',
    status: 'DETAINED',
    arrestDate: '2023-02-11',
    detentionFacility: 'Mornaguia Prison',
    officialCharge: 'Terrorism conspiracy',
    chargeCategory: 'TERRORISM',
    realReason: 'POLITICAL_OPPOSITION',
    realReasonDescription: 'Party leader arrested in February 2023 wave. Specific evidence: signed NSF joint statement calling for democratic transition.',
    gapScore: 96,
    trialStatus: 'INDEFINITELY POSTPONED',
    lastHearing: '2025-01-20',
    internationalAttention: ['HRW', 'Amnesty', 'FIDH', 'EU Parliament'],
    sources: ['HRW Feb 2023'],
    rriVariables: ['D42', 'M131'],
    significance: 'Signing a political statement classified as terrorism. Sets precedent for criminalization of all organized opposition.',
  },
  {
    id: 'PP007',
    name: 'Khalifa Guesmi',
    nameAr: 'خليفة القاسمي',
    role: 'Journalist — Radio Express FM',
    affiliation: 'Independent Journalism',
    status: 'DETAINED',
    arrestDate: '2023-05-11',
    detentionFacility: 'Unknown',
    officialCharge: 'Spreading false information (Decree 54)',
    chargeCategory: 'DECREE54',
    realReason: 'JOURNALISM',
    realReasonDescription: 'Arrested for radio broadcast reporting on security forces deployment during protests. Decree 54 applied to factual reporting.',
    gapScore: 88,
    trialStatus: 'TRIAL ONGOING',
    lastHearing: '2025-02-14',
    internationalAttention: ['RSF', 'CPJ', 'IFJ'],
    sources: ['RSF May 2023', 'CPJ alert'],
    rriVariables: ['D44 (press freedom)', 'D42'],
    significance: 'Factual reporting on security deployments classified as spreading false information. Decree 54 used to silence eyewitness journalism.',
  },
  {
    id: 'PP008',
    name: 'Borhen Bsaies',
    nameAr: 'برهان بسيس',
    role: 'TV Presenter and Political Commentator',
    affiliation: 'Independent Media',
    status: 'DETAINED',
    arrestDate: '2023-05-11',
    detentionFacility: 'Unknown',
    officialCharge: 'Spreading false information, harming public security (Decree 54)',
    chargeCategory: 'DECREE54',
    realReason: 'JOURNALISM',
    realReasonDescription: 'Television commentator arrested for on-air analysis critical of presidential economic policies. Arrest coordinated same day as Guesmi.',
    gapScore: 90,
    trialStatus: 'TRIAL ONGOING',
    lastHearing: '2025-02-14',
    internationalAttention: ['RSF', 'CPJ', 'Reporters Committee'],
    sources: ['RSF May 2023', 'CPJ urgent action'],
    rriVariables: ['D44', 'L126 (propaganda use)'],
    significance: 'Television analysis classified as public security threat. Part of coordinated silencing of broadcast media critical voices.',
  },
  {
    id: 'PP009',
    name: 'Sonia Dahmani',
    nameAr: 'سونيا الدهماني',
    role: 'Lawyer and Political Commentator',
    affiliation: 'Independent',
    status: 'DETAINED',
    arrestDate: '2024-05-11',
    detentionFacility: 'Unknown',
    officialCharge: 'Spreading false information (Decree 54)',
    chargeCategory: 'DECREE54',
    realReason: 'JOURNALISM',
    realReasonDescription: 'Arrested live on television during a panel discussion. Said "those who want to come to Tunisia, what kind of people would want to come here" — sarcastic remark about government claims. Taken from TV studio by plainclothes police.',
    gapScore: 99,
    trialStatus: 'CONVICTED — APPEAL PENDING',
    lastHearing: '2025-01-08',
    internationalAttention: ['RSF', 'CPJ', 'Amnesty', 'IBA', 'EU Parliament'],
    sources: ['RSF May 2024', 'CPJ May 2024', 'video evidence widely circulated'],
    notes: 'Her arrest was filmed live on television. The footage went viral internationally. One of the most documented cases of Decree 54 abuse.',
    rriVariables: ['D44', 'L126', 'O151'],
    significance: 'Arrested on live television for a sarcastic comment. Most internationally visible Decree 54 case. Footage widely shared as evidence of Tunisia\'s democratic backsliding.',
  },
  {
    id: 'PP010',
    name: 'Mohamed Zran',
    nameAr: 'محمد الزران',
    role: 'Film Director',
    affiliation: 'Cultural sector',
    status: 'DETAINED',
    arrestDate: '2024-02-20',
    detentionFacility: 'Unknown',
    officialCharge: 'Terrorism, inciting violence',
    chargeCategory: 'TERRORISM',
    realReason: 'HUMAN_RIGHTS',
    realReasonDescription: 'Documentary filmmaker arrested for film about irregular migration showing dangerous conditions. Film criticizes state\'s failure to protect migrants. Terrorism charge applied to documentary filmmaking.',
    gapScore: 94,
    trialStatus: 'PRE-TRIAL DETENTION',
    lastHearing: '2025-02-01',
    internationalAttention: ['RSF', 'Human Rights Watch', 'International Federation of Film Producers'],
    sources: ['HRW Feb 2024', 'RSF alert'],
    rriVariables: ['D44', 'D42'],
    significance: 'Documentary about migration policy classified as terrorism. Criminalizes photographic evidence of state failures.',
  },
  {
    id: 'PP011',
    name: 'Anis Maaloul',
    nameAr: 'أنيس معلول',
    role: 'Activist and blogger',
    affiliation: 'Independent civil society',
    status: 'DETAINED',
    arrestDate: '2023-09-15',
    detentionFacility: 'Unknown',
    officialCharge: 'Spreading false information (Decree 54)',
    chargeCategory: 'DECREE54',
    realReason: 'FACEBOOK_POST',
    realReasonDescription: 'Facebook post sharing Nawaat article about water cuts in Sfax. Post shared widely. Arrest came 3 days after post.',
    gapScore: 100,
    trialStatus: 'TRIAL ONGOING',
    lastHearing: '2025-01-22',
    internationalAttention: ['FTDES', 'Amnesty'],
    sources: ['FTDES monitoring report', 'Nawaat documentation'],
    rriVariables: ['D44', 'O151'],
    significance: 'Sharing a news article classified as spreading false information. Demonstrates Decree 54 used to suppress circulation of factual reporting.',
  },
  {
    id: 'PP012',
    name: 'Mehdi Zagrouba',
    nameAr: 'مهدي زغروبة',
    role: 'Defense Attorney',
    affiliation: 'Tunisian Bar Association',
    status: 'DETAINED',
    arrestDate: '2024-01-30',
    detentionFacility: 'Unknown',
    officialCharge: 'Complicity in terrorism',
    chargeCategory: 'TERRORISM',
    realReason: 'LEGAL_DEFENSE',
    realReasonDescription: 'Defense lawyer for multiple political prisoners. Arrested while meeting with clients in prison. Charge: "complicity in terrorism" for providing legal defense to terrorism suspects.',
    gapScore: 100,
    trialStatus: 'PRE-TRIAL DETENTION',
    lastHearing: '2025-03-05',
    internationalAttention: ['IBA', 'Lawyers for Lawyers', 'EU Bar Associations', 'HRW'],
    sources: ['IBA HRIJ Jan 2024', 'Lawyers for Lawyers urgent action'],
    notes: 'His arrest sends direct message to all lawyers: defend opposition clients and face terrorism charges. Unprecedented in Tunisia.',
    rriVariables: ['D42', 'O151', 'L121'],
    significance: 'Defense attorney jailed for legal representation. Criminalizes legal defense itself. Unprecedented direct attack on bar independence.',
  },
];

const CALENDAR_EVENTS: CalendarEvent[] = [
  // 2026 events
  {
    id: 'CE001', date: '2026-03-15',
    title: 'Sfax Water Protest — Day 4',
    type: 'protest', severity: 4,
    description: 'Ongoing water cuts. Residents blockade municipality. 200+ participants.',
    source: 'Nawaat', governorate: 'Sfax',
    rriImpact: '+0.03', rriVariable: 'B21',
  },
  {
    id: 'CE002', date: '2026-03-10',
    title: 'Journalist Detained Under Decree 54',
    type: 'arrest', severity: 4,
    description: 'Investigative journalist arrested for reporting on BCT reserves.',
    source: 'RSF', governorate: 'Tunis',
    rriImpact: '+0.02', rriVariable: 'D44',
  },
  {
    id: 'CE003', date: '2026-02-14',
    title: 'Guesmi & Bsaies Trial Hearing',
    type: 'trial', severity: 3,
    description: 'Regular hearing for journalists detained since May 2023. No verdict expected.',
    source: 'FTDES', governorate: 'Tunis',
    trialId: 'T001', prisonerId: 'PP007',
    internationalAttention: true,
  },
  {
    id: 'CE004', date: '2026-02-10',
    title: 'BCT: FX Reserves Fall to 84 Days',
    type: 'economic', severity: 4,
    description: 'Monthly bulletin confirms reserves below 90-day warning threshold.',
    source: 'BCT', rriImpact: '+0.05', rriVariable: 'A_FX',
  },
  {
    id: 'CE005', date: '2026-01-28',
    title: 'UGTT Strike Warning Issued',
    type: 'political', severity: 4,
    description: 'Formal 72-hour notice covering public sector.',
    source: 'UGTT', governorate: 'Tunis',
    rriImpact: '+0.04', rriVariable: 'M_UGTT',
  },
  {
    id: 'CE006', date: '2026-01-08',
    title: 'Sonia Dahmani Appeal Hearing',
    type: 'trial', severity: 3,
    description: 'Appeal of Decree 54 conviction for live TV comment.',
    source: 'CPJ', governorate: 'Tunis',
    prisonerId: 'PP009', trialId: 'T002',
    internationalAttention: true,
  },
  {
    id: 'CE007', date: '2025-12-20',
    title: 'VPN Blocking Attempt — 48hrs',
    type: 'decree', severity: 3,
    description: 'ATI implements VPN blocking. Circumvention widely shared.',
    source: 'OONI/Nawaat',
    rriImpact: '+0.03', rriVariable: 'C37',
  },
  {
    id: 'CE008', date: '2025-11-18',
    title: 'Sfax Water — 6hrs/Day Confirmed',
    type: 'political', severity: 4,
    description: 'SONEDE confirms reduced supply. Opposition disputes explanation.',
    source: 'SONEDE', governorate: 'Sfax',
    rriImpact: '+0.04', rriVariable: 'B21',
  },
  {
    id: 'CE009', date: '2024-05-11',
    title: 'Sonia Dahmani Arrested on Live TV',
    type: 'arrest', severity: 5,
    description: 'Lawyer arrested from television studio during live broadcast for Decree 54.',
    source: 'RSF/Video evidence', governorate: 'Tunis',
    prisonerId: 'PP009',
    rriImpact: '+0.05', rriVariable: 'D44',
    internationalAttention: true,
  },
  {
    id: 'CE010', date: '2024-02-20',
    title: 'Film Director Mohamed Zran Arrested',
    type: 'arrest', severity: 4,
    description: 'Documentary filmmaker arrested for migration film. Terrorism charges.',
    source: 'HRW', governorate: 'Tunis',
    prisonerId: 'PP010', rriImpact: '+0.03',
  },
  {
    id: 'CE011', date: '2024-01-30',
    title: 'Defense Lawyer Zagrouba Arrested',
    type: 'arrest', severity: 5,
    description: 'Lawyer arrested during prison visit to client. "Complicity in terrorism".',
    source: 'IBA', governorate: 'Tunis',
    prisonerId: 'PP012',
    rriImpact: '+0.06', rriVariable: 'D42',
    internationalAttention: true,
  },
  {
    id: 'CE012', date: '2023-10-03',
    title: 'Abir Moussi Arrested at Court',
    type: 'arrest', severity: 4,
    description: 'Opposition leader arrested staging sit-in at administrative court.',
    source: 'AFP', governorate: 'Tunis',
    prisonerId: 'PP005', rriImpact: '+0.04',
  },
  {
    id: 'CE013', date: '2023-05-11',
    title: 'Mass Journalist Arrests — Decree 54',
    type: 'arrest', severity: 5,
    description: 'Guesmi and Bsaies arrested same day. Coordinated crackdown on broadcast media.',
    source: 'RSF', governorate: 'Tunis',
    rriImpact: '+0.06', rriVariable: 'D44',
    internationalAttention: true,
  },
  {
    id: 'CE014', date: '2023-04-17',
    title: 'Ghannouchi Arrested',
    type: 'arrest', severity: 5,
    description: 'Ennahda leader arrested on terrorism charges. HQ raided.',
    source: 'Multiple', governorate: 'Tunis',
    prisonerId: 'PP001',
    rriImpact: '+0.08', rriVariable: 'M131',
    internationalAttention: true,
  },
  {
    id: 'CE015', date: '2023-02-11',
    title: 'Mass NSF Leader Arrests',
    type: 'arrest', severity: 5,
    description: 'Chaouachi, Ben Mbarek, Chebbi arrested same day. Terrorism charges.',
    source: 'HRW', governorate: 'Tunis',
    rriImpact: '+0.10', rriVariable: 'M131',
    internationalAttention: true,
  },
  // Upcoming / predicted
  {
    id: 'CE016', date: '2026-04-15',
    title: 'Ghannouchi Hearing (Expected)',
    type: 'trial', severity: 3,
    description: 'Next scheduled hearing for terrorism case. Likely postponed.',
    source: 'Defense team', prisonerId: 'PP001',
    upcoming: true,
  },
  {
    id: 'CE017', date: '2026-07-25',
    title: '5th Anniversary — July 25 Power Grab',
    type: 'anniversary', severity: 4,
    description: 'Regime celebration vs opposition protest day. Heavy security expected.',
    source: 'Historical pattern', governorate: 'Tunis',
    upcoming: true, predicted: true, predictionProbability: 95,
    rriImpact: '+0.02',
  },
  {
    id: 'CE018', date: '2026-09-30',
    title: 'IMF Q3 Debt Deadline',
    type: 'deadline', severity: 5,
    description: 'External debt repayment deadline. No IMF deal = default risk.',
    source: 'BCT/IMF',
    upcoming: true, rriImpact: '+0.15', rriVariable: 'A06',
  },
  {
    id: 'CE019', date: '2026-04-01',
    title: 'BCT Monthly Bulletin — March 2026',
    type: 'economic', severity: 2,
    description: 'Monthly BCT statistics release. FX reserves update expected.',
    source: 'BCT', upcoming: true,
  },
  {
    id: 'CE020', date: '2026-05-03',
    title: 'RSF Press Freedom Index — Annual Release',
    type: 'diplomatic', severity: 3,
    description: 'Reporters Without Borders annual index. Tunisia rank expected to decline further.',
    source: 'RSF', upcoming: true, rriVariable: 'D44',
  },
];

const getDaysSince = (dateStr: string): number => {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const getLiveDetentionClock = (dateStr: string): string => {
  const days = getDaysSince(dateStr);
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)) % 24;
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60)) % 60;
  return `${days}d ${hours}h ${minutes}m`;
};

const getGapScoreLabel = (score: number): string => {
  if (score >= 95) return 'EXTREME WEAPONIZATION';
  if (score >= 80) return 'SEVERE WEAPONIZATION';
  if (score >= 65) return 'HIGH WEAPONIZATION';
  if (score >= 50) return 'MODERATE WEAPONIZATION';
  return 'LOW';
};

const getGapScoreColor = (score: number): string => {
  if (score >= 95) return 'text-intel-red';
  if (score >= 80) return 'text-intel-orange';
  if (score >= 65) return 'text-yellow-500';
  return 'text-slate-400';
};

const EVENT_COLORS: Record<EventType, string> = {
  protest: '#ff9f0a',
  arrest: '#ff453a',
  trial: '#bf5af2',
  release: '#30d158',
  economic: '#00d4ff',
  political: '#0a84ff',
  diplomatic: '#64748b',
  decree: '#ff453a',
  anniversary: '#ff9f0a',
  deadline: '#ff453a',
};

const REAL_REASON_LABELS: Record<RealReason, string> = {
  FACEBOOK_POST: 'Facebook post',
  WHATSAPP_MESSAGE: 'WhatsApp message',
  PROTEST_ATTENDANCE: 'Attending a protest',
  POLITICAL_OPPOSITION: 'Political opposition',
  JOURNALISM: 'Journalism',
  LEGAL_DEFENSE: 'Legal defense',
  UNION_ACTIVITY: 'Union activity',
  HUMAN_RIGHTS: 'Human rights work',
  PETITION: 'Signing a petition',
};

const DetentionClock: React.FC<{
  arrestDate: string;
  size?: 'sm' | 'lg';
}> = ({ arrestDate, size = 'sm' }) => {
  const [clock, setClock] = useState(getLiveDetentionClock(arrestDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getLiveDetentionClock(arrestDate));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [arrestDate]);

  if (size === 'lg') {
    return (
      <div className="text-center space-y-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">In Detention</div>
        <div className="text-3xl font-bold font-mono text-intel-red tabular-nums">{clock}</div>
        <div className="text-[9px] font-mono text-slate-600">
          Since {new Date(arrestDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5">
      <Clock className="w-3 h-3 text-intel-red shrink-0" />
      <span className="text-[10px] font-mono font-bold text-intel-red tabular-nums">{clock}</span>
    </div>
  );
};

const GapScoreBar: React.FC<{
  score: number;
  officialCharge: string;
  realReason: RealReason;
}> = ({ score, officialCharge, realReason }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[9px] font-mono">
      <span className="text-slate-500 uppercase tracking-widest">
        Judicial Weaponization Index
      </span>
      <span className={`font-bold ${getGapScoreColor(score)}`}>
        {score}/100 — {getGapScoreLabel(score)}
      </span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, type: 'spring' }}
        className={`h-full rounded-full ${
          score >= 95 ? 'bg-intel-red' :
          score >= 80 ? 'bg-intel-orange' :
          score >= 65 ? 'bg-yellow-500' : 'bg-intel-cyan'
        }`}
      />
    </div>
    <div className="grid grid-cols-2 gap-2 text-[9px]">
      <div className="space-y-0.5">
        <div className="text-slate-600 uppercase text-[8px]">
          Official charge
        </div>
        <div className="text-intel-red font-mono">
          {officialCharge.slice(0, 40)}
          {officialCharge.length > 40 ? '...' : ''}
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="text-slate-600 uppercase text-[8px]">
          Actual act
        </div>
        <div className="text-intel-green font-mono">
          {REAL_REASON_LABELS[realReason]}
        </div>
      </div>
    </div>
  </div>
);

const PrisonerCard: React.FC<{
  prisoner: PoliticalPrisoner;
  compact?: boolean;
  onClick?: () => void;
}> = ({ prisoner, compact = false, onClick }) => {
  const days = getDaysSince(prisoner.arrestDate);

  if (compact) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        className="flex items-center justify-between p-3 rounded-xl border border-intel-border/40 bg-black/20 cursor-pointer hover:border-intel-red/30 transition-all group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            prisoner.status === 'DETAINED'
              ? 'bg-intel-red animate-pulse'
              : 'bg-intel-green'
          }`} />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate group-hover:text-intel-red transition-colors">
              {prisoner.name}
            </div>
            <div className="text-[9px] text-slate-600 truncate">
              {prisoner.role.slice(0, 35)}
              {prisoner.role.length > 35 ? '...' : ''}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right space-y-0.5">
          <div className="text-[10px] font-mono font-bold text-intel-red tabular-nums">{days}d</div>
          <div className="text-[8px] font-mono text-slate-700 uppercase">{prisoner.chargeCategory}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-2xl border border-intel-border space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
              prisoner.status === 'DETAINED'
                ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                : 'text-intel-green border-intel-green/30 bg-intel-green/10'
            }`}>{prisoner.status}</span>
            <span className="text-[8px] font-mono text-slate-600">
              {prisoner.id}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            {prisoner.name}
          </h3>
          {prisoner.nameAr && (
            <div className="text-sm text-slate-500 font-arabic" dir="rtl">{prisoner.nameAr}</div>
          )}
          <div className="text-[11px] text-slate-400">
            {prisoner.role}
          </div>
          <div className="text-[10px] font-mono text-intel-cyan">
            {prisoner.affiliation}
          </div>
        </div>

        {prisoner.status === 'DETAINED' && (
          <DetentionClock
            arrestDate={prisoner.arrestDate}
            size="lg"
          />
        )}
      </div>

      <GapScoreBar
        score={prisoner.gapScore}
        officialCharge={prisoner.officialCharge}
        realReason={prisoner.realReason}
      />

      <div className="p-4 rounded-xl bg-intel-red/5 border border-intel-red/20 space-y-1">
        <div className="text-[9px] font-mono text-intel-red uppercase tracking-widest">What they actually did</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {prisoner.realReasonDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px]">
        <div className="space-y-1">
          <div className="text-[8px] font-mono text-slate-600 uppercase">Trial Status</div>
          <div className={`font-mono font-bold ${
            prisoner.trialStatus.includes('POSTPONED')
              ? 'text-intel-red'
              : prisoner.trialStatus.includes('CONVICTED')
              ? 'text-intel-red'
              : 'text-intel-orange'
          }`}>{prisoner.trialStatus}</div>
        </div>
        {prisoner.lastHearing && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Last Hearing</div>
            <div className="font-mono text-slate-300">
              {new Date(prisoner.lastHearing).toLocaleDateString('en-GB')}
            </div>
          </div>
        )}
        {prisoner.nextHearing && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Next Hearing</div>
            <div className="font-mono text-intel-cyan">
              {new Date(prisoner.nextHearing).toLocaleDateString('en-GB')}
            </div>
          </div>
        )}
        {prisoner.detentionFacility && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Facility</div>
            <div className="text-slate-400">{prisoner.detentionFacility}</div>
          </div>
        )}
      </div>

      {prisoner.healthConcerns && (
        <div className="flex items-start space-x-2 p-3 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-intel-orange shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-intel-orange uppercase">Health Concerns</div>
            <p className="text-[10px] text-slate-400">
              {prisoner.healthConcerns}
            </p>
          </div>
        </div>
      )}

      {prisoner.internationalAttention.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">International Attention</div>
          <div className="flex flex-wrap gap-1.5">
            {prisoner.internationalAttention.map(org => (
              <span key={org} className="text-[8px] font-mono px-2 py-0.5 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded">
                {org}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">RRI Model Impact</div>
        <div className="flex flex-wrap gap-1.5">
          {prisoner.rriVariables.map(v => (
            <span key={v} className="text-[8px] font-mono px-2 py-0.5 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 rounded">
              {v}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 italic leading-snug">
          {prisoner.significance}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-intel-border/20">
        {prisoner.sources.map(s => (
          <span key={s} className="text-[8px] font-mono text-slate-700">{s}</span>
        ))}
      </div>
    </motion.div>
  );
};

export const PoliticalCalendar: React.FC = () => {
  const { rriState, data } = usePipeline();

  const [view, setView] = useState<'calendar' | 'prisoners' | 'trials'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2)); // March 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPrisoner, setSelectedPrisoner] = useState<PoliticalPrisoner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDateString = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateString(day);
    return CALENDAR_EVENTS.filter(e => e.date === dateStr);
  };

  const detainedPrisoners = POLITICAL_PRISONERS.filter(p => p.status === 'DETAINED');
  const totalDetentionDays = detainedPrisoners.reduce((sum, p) => sum + getDaysSince(p.arrestDate), 0);
  const terrorismForOpinion = POLITICAL_PRISONERS.filter(
    p => p.chargeCategory === 'TERRORISM' &&
    ['POLITICAL_OPPOSITION', 'JOURNALISM', 'FACEBOOK_POST', 'WHATSAPP_MESSAGE', 'LEGAL_DEFENSE', 'PETITION'].includes(p.realReason)
  );
  const avgGapScore = Math.round(POLITICAL_PRISONERS.reduce((sum, p) => sum + p.gapScore, 0) / POLITICAL_PRISONERS.length);

  const filteredPrisoners = POLITICAL_PRISONERS.filter(p => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.affiliation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-intel-cyan" />
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-widest">Political Calendar</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Events · Trials · Political Prisoners · Judicial Weaponization Index
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-black/40 border border-intel-border rounded-xl p-1">
            {[
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'prisoners', label: 'Prisoners', icon: UserX },
              { id: 'trials', label: 'Trials', icon: Gavel },
            ].map(v => {
              const Icon = v.icon;
              return (
                <button key={v.id}
                  onClick={() => setView(v.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                    view === v.id
                      ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Currently Detained', value: detainedPrisoners.length.toString(), color: 'text-intel-red', pulse: true },
            { label: 'Total Detention Days', value: totalDetentionDays.toLocaleString(), color: 'text-intel-red', sub: 'Accumulated across all prisoners' },
            { label: 'Terrorism for Opinions', value: terrorismForOpinion.length.toString(), color: 'text-intel-orange', sub: 'Terrorism law used for speech acts' },
            { label: 'Decree 54 Cases', value: data.social.decree54_charged.toString(), color: 'text-intel-orange' },
            { label: 'Avg Weaponization', value: avgGapScore + '/100', color: 'text-intel-red', sub: 'Judicial gap score average' },
            { label: 'Longest Detention', value: `${getDaysSince('2022-01-03')}d`, color: 'text-intel-red', sub: 'N. Bhiri — since Jan 2022' },
          ].map(stat => (
            <div key={stat.label} className="glass p-4 rounded-2xl border border-intel-border space-y-1">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{stat.label}</div>
              <div className={`text-xl font-bold font-mono ${stat.color} ${stat.pulse ? 'animate-pulse' : ''}`}>
                {stat.value}
              </div>
              {stat.sub && (
                <div className="text-[8px] text-slate-700 leading-snug">
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-bold text-white uppercase tracking-widest">
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[9px] font-mono text-slate-600 uppercase py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-16" />;
                const dateStr = getDateString(day);
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDay === dateStr;
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                const hasArrest = dayEvents.some(e => e.type === 'arrest');
                const hasTrial = dayEvents.some(e => e.type === 'trial');

                return (
                  <motion.button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    whileHover={{ scale: 1.05 }}
                    className={`h-16 rounded-xl border p-1.5 transition-all relative flex flex-col items-start ${
                      isSelected ? 'border-intel-cyan bg-intel-cyan/10' :
                      isToday ? 'border-intel-orange/50 bg-intel-orange/5' :
                      hasArrest || hasTrial ? 'border-intel-red/30 bg-intel-red/5 hover:border-intel-red/50' :
                      dayEvents.length > 0 ? 'border-intel-border/50 bg-black/30 hover:border-intel-border' :
                      'border-transparent hover:border-intel-border/30'
                    }`}
                  >
                    <span className={`text-[11px] font-mono font-bold ${
                      isSelected ? 'text-intel-cyan' : isToday ? 'text-intel-orange' : dayEvents.length > 0 ? 'text-white' : 'text-slate-600'
                    }`}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {dayEvents.slice(0, 4).map((event, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.upcoming ? `${EVENT_COLORS[event.type]}80` : EVENT_COLORS[event.type], border: event.upcoming ? `1px dashed ${EVENT_COLORS[event.type]}` : 'none' }} />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div key={selectedDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => setSelectedDay(null)} className="p-1.5 text-slate-600 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                  </div>
                  {CALENDAR_EVENTS.filter(e => e.date === selectedDay).length === 0 ? (
                    <div className="text-[11px] text-slate-600 text-center py-8">No events recorded for this date.</div>
                  ) : (
                    CALENDAR_EVENTS.filter(e => e.date === selectedDay).map(event => (
                      <div key={event.id} className={`p-4 rounded-xl border space-y-3 ${event.upcoming ? 'border-intel-cyan/20 bg-intel-cyan/5' : event.type === 'arrest' || event.type === 'decree' ? 'border-intel-red/20 bg-intel-red/5' : event.type === 'trial' ? 'border-intel-purple/20 bg-intel-purple/5' : 'border-intel-border/30 bg-black/20'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase" style={{ color: EVENT_COLORS[event.type], borderColor: `${EVENT_COLORS[event.type]}40`, backgroundColor: `${EVENT_COLORS[event.type]}15` }}>{event.type}</span>
                            </div>
                            <div className="text-[11px] font-bold text-white">{event.title}</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{event.description}</p>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Recent Prisoners</div>
                  {detainedPrisoners.slice(0, 6).map(p => (
                    <PrisonerCard key={p.id} prisoner={p} compact onClick={() => { setSelectedPrisoner(p); setView('prisoners'); }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {view === 'prisoners' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search prisoners..." className="w-full bg-black/40 border border-intel-border rounded-xl pl-10 pr-4 py-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-intel-cyan/40" />
          </div>
          <div className="space-y-6">
            <AnimatePresence>
              {(selectedPrisoner ? [selectedPrisoner] : filteredPrisoners).map(prisoner => (
                <div key={prisoner.id}>
                  {selectedPrisoner && (
                    <button onClick={() => setSelectedPrisoner(null)} className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 hover:text-intel-cyan mb-4 transition-all">
                      <ChevronLeft className="w-3 h-3" />
                      <span>All prisoners</span>
                    </button>
                  )}
                  <PrisonerCard prisoner={prisoner} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {view === 'trials' && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-4">
            <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
              <Gavel className="w-5 h-5 text-intel-purple" />
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-widest">Trial Tracker</div>
                <div className="text-[9px] text-slate-500">Upcoming and recent court hearings</div>
              </div>
            </div>
            <div className="space-y-3">
              {POLITICAL_PRISONERS.filter(p => p.nextHearing || p.lastHearing).map(prisoner => (
                <div key={prisoner.id} className="flex items-start justify-between p-4 rounded-xl border border-intel-border/30 bg-black/20 gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] font-bold text-white truncate">{prisoner.name}</div>
                    <div className="text-[10px] text-slate-500">{prisoner.trialStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
