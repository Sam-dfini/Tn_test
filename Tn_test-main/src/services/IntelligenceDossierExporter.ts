import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ─────────────────────────────────────────────────────

export type ReportFormat = 'pdf' | 'csv' | 'json';

export type ReportSection =
  | 'rri_summary'
  | 'economic'
  | 'social'
  | 'security'
  | 'political'
  | 'narrative'
  | 'geopolitical'
  | 'prisoners'
  | 'events'
  | 'threshold_breaches'
  | 'rri_variables'
  | 'sitrep'
  | 'audit_trail';

export interface ReportConfig {
  title: string;
  classification: 'ANALYST' | 'RESTRICTED' | 'PUBLIC';
  format: ReportFormat;
  sections: ReportSection[];
  dateRange: 'today' | '7d' | '30d' | 'all';
  includeCharts: boolean; // PDF only — embed chart snapshots
  includeAIAnalysis: boolean; // PDF only — include AI-generated insights
  analyst: string;
}

export interface ReportData {
  rriState: any;
  data: any;
  articles?: any[];
  events?: any[];
  prisoners?: any[];
  auditLog?: any[];
  aiAnalysis?: string;
  generatedAt: string;
}

// ── Color theme matching TunisiaIntel ─────────────────────────

const COLORS = {
  bg: [5, 7, 10] as [number, number, number],
  card: [10, 14, 20] as [number, number, number],
  border: [26, 34, 45] as [number, number, number],
  cyan: [0, 212, 255] as [number, number, number],
  red: [255, 69, 58] as [number, number, number],
  orange: [255, 159, 10] as [number, number, number],
  green: [48, 209, 88] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  slate: [148, 163, 184] as [number, number, number],
  dark: [71, 85, 105] as [number, number, number],
};

// ── PDF GENERATOR ─────────────────────────────────────────────

export function generatePDF(
  config: ReportConfig,
  reportData: ReportData
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const MARGIN = 20;
  const CONTENT_W = W - MARGIN * 2;
  let y = MARGIN;

  // ── Helper functions ────────────────────────────────────────

  const newPage = () => {
    doc.addPage();
    y = MARGIN;
    drawPageHeader();
    drawPageFooter();
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > H - 25) newPage();
  };

  const setFont = (
    style: 'normal' | 'bold' | 'italic' = 'normal',
    size: number = 10
  ) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
  };

  const setColor = (rgb: [number, number, number]) => {
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  };

  const drawLine = (color: [number, number, number] = COLORS.border) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, W - MARGIN, y);
    y += 4;
  };

  const drawAccelerometers = () => {
    checkPageBreak(60);
    sectionHeader('Risk Accelerometers — System Triggers');

    const accelerants = [
      { label: 'Economic Stress', value: reportData.data.economy.inflation > 10 ? 0.9 : 0.6, color: COLORS.red },
      { label: 'Social Mobilisation', value: reportData.data.social.ugtt_mobilisation_level === 'HIGH' ? 0.85 : 0.5, color: COLORS.orange },
      { label: 'Political Fragmentation', value: 0.75, color: COLORS.cyan },
      { label: 'External Pressure', value: (reportData.data.geopolitical?.imf_deal_probability || 31) < 40 ? 0.8 : 0.4, color: COLORS.red },
      { label: 'Security Volatility', value: 0.65, color: COLORS.orange },
    ];

    const chartH = 40;
    const barW = (CONTENT_W - 20) / accelerants.length;
    const chartY = y + chartH;

    // Draw axes
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.line(MARGIN, chartY, MARGIN + CONTENT_W, chartY); // X axis
    doc.line(MARGIN, y, MARGIN, chartY); // Y axis

    accelerants.forEach((a, i) => {
      const bx = MARGIN + 5 + i * (barW + 4);
      const bh = a.value * chartH;
      
      // Bar
      doc.setFillColor(a.color[0], a.color[1], a.color[2]);
      doc.rect(bx, chartY - bh, barW, bh, 'F');
      
      // Label
      setFont('normal', 5);
      setColor(COLORS.slate);
      doc.text(a.label.toUpperCase(), bx + barW / 2, chartY + 4, { align: 'center', maxWidth: barW });
      
      // Value
      setFont('bold', 6);
      setColor(COLORS.white);
      doc.text(`${(a.value * 100).toFixed(0)}%`, bx + barW / 2, chartY - bh - 2, { align: 'center' });
    });

    y += chartH + 15;
  };

  const addText = (
    text: string,
    x: number,
    options: {
      color?: [number, number, number];
      size?: number;
      style?: 'normal' | 'bold' | 'italic';
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    } = {}
  ) => {
    setFont(options.style || 'normal', options.size || 9);
    setColor(options.color || COLORS.slate);
    doc.text(text, x, y, {
      align: options.align || 'left',
      maxWidth: options.maxWidth,
    });
  };

  const addLabel = (label: string, value: string, x: number, valueColor?: [number, number, number]) => {
    setFont('normal', 7);
    setColor(COLORS.dark);
    doc.text(label.toUpperCase(), x, y);
    setFont('bold', 9);
    setColor(valueColor || COLORS.white);
    doc.text(value, x, y + 4);
    return 10;
  };

  const sectionHeader = (title: string, icon?: string) => {
    checkPageBreak(20);
    y += 4;
    // Background bar
    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.roundedRect(MARGIN, y - 4, CONTENT_W, 12, 1, 1, 'F');
    // Cyan accent line
    doc.setFillColor(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2]);
    doc.rect(MARGIN, y - 4, 2, 12, 'F');
    // Title
    setFont('bold', 9);
    setColor(COLORS.cyan);
    doc.text(title.toUpperCase(), MARGIN + 6, y + 3);
    y += 14;
  };

  const metricRow = (
    label: string,
    value: string,
    status?: 'critical' | 'warning' | 'ok' | 'neutral',
    x: number = MARGIN,
    w: number = CONTENT_W
  ) => {
    checkPageBreak(8);
    const statusColor =
      status === 'critical' ? COLORS.red :
      status === 'warning' ? COLORS.orange :
      status === 'ok' ? COLORS.green :
      COLORS.slate;

    setFont('normal', 8);
    setColor(COLORS.slate);
    doc.text(label, x + 3, y);
    setFont('bold', 8);
    setColor(statusColor);
    doc.text(value, x + w - 3, y, { align: 'right' });
    // Subtle separator
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.setLineWidth(0.1);
    doc.line(x, y + 2, x + w, y + 2);
    y += 7;
  };

  // ── Page header / footer ────────────────────────────────────

  const drawPageHeader = () => {
    // Top bar background
    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.rect(0, 0, W, 14, 'F');
    // Logo text
    setFont('bold', 11);
    setColor(COLORS.white);
    doc.text('TUNISIA', MARGIN, 9);
    setFont('bold', 11);
    setColor(COLORS.cyan);
    doc.text('INTEL', MARGIN + 24, 9);
    // Classification badge
    const classColor =
      config.classification === 'ANALYST' ? COLORS.cyan :
      config.classification === 'RESTRICTED' ? COLORS.orange :
      COLORS.green;
    setFont('bold', 7);
    setColor(classColor);
    doc.text(
      `// ${config.classification} //`,
      W - MARGIN,
      9,
      { align: 'right' }
    );
    // Date
    setFont('normal', 7);
    setColor(COLORS.dark);
    doc.text(
      new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      }),
      W / 2,
      9,
      { align: 'center' }
    );
    y = 18;
  };

  const drawPageFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.rect(0, H - 10, W, 10, 'F');
    setFont('normal', 6);
    setColor(COLORS.dark);
    doc.text(
      `TUNISIAINTEL v2.0 · Generated ${reportData.generatedAt} · Analyst: ${config.analyst} · Page ${pageNum}`,
      W / 2,
      H - 3,
      { align: 'center' }
    );
    doc.text(
      'NOT FOR PUBLIC DISTRIBUTION · Based on open-source intelligence only',
      W / 2,
      H - 7,
      { align: 'center' }
    );
  };

  // ── PAGE 1: COVER ──────────────────────────────────────────

  // Dark background
  doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
  doc.rect(0, 0, W, H, 'F');

  // Pyramid SVG - draw geometrically
  const px = W / 2, py = 60, ps = 30;
  doc.setDrawColor(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2]);
  doc.setLineWidth(0.5);
  // Outer triangle
  doc.triangle(px, py - ps, px - ps, py + ps * 0.5, px + ps, py + ps * 0.5, 'S');
  // Center point
  const cx2 = px, cy2 = py + ps * 0.12;
  // Inner lines to center
  doc.line(px, py - ps, cx2, cy2);
  doc.line(px - ps, py + ps * 0.5, cx2, cy2);
  doc.line(px + ps, py + ps * 0.5, cx2, cy2);
  // Inner triangle
  doc.triangle(px, py - ps * 0.45, px - ps * 0.38, py + ps * 0.32, px + ps * 0.38, py + ps * 0.32, 'S');

  // Classification strip
  const classColor =
    config.classification === 'ANALYST' ? COLORS.cyan :
    config.classification === 'RESTRICTED' ? COLORS.orange :
    COLORS.green;
  doc.setFillColor(classColor[0], classColor[1], classColor[2]);
  doc.rect(0, 102, W, 0.5, 'F');
  doc.rect(0, 115, W, 0.5, 'F');
  setFont('bold', 8);
  setColor(classColor);
  doc.text(
    `— ${config.classification} INTELLIGENCE REPORT —`,
    W / 2, 110, { align: 'center' }
  );

  // Title
  setFont('bold', 22);
  setColor(COLORS.white);
  doc.text('TUNISIA', W / 2, 130, { align: 'center' });
  setFont('bold', 22);
  setColor(COLORS.cyan);
  doc.text('INTEL', W / 2, 142, { align: 'center' });

  // Report title
  setFont('normal', 12);
  setColor(COLORS.slate);
  doc.text(config.title, W / 2, 158, { align: 'center' });

  // Date range
  const dateRangeLabel =
    config.dateRange === 'today' ? 'Daily Intelligence Report' :
    config.dateRange === '7d' ? '7-Day Intelligence Review' :
    config.dateRange === '30d' ? '30-Day Strategic Assessment' :
    'Comprehensive Intelligence Dossier';
  setFont('normal', 9);
  setColor(COLORS.dark);
  doc.text(dateRangeLabel, W / 2, 167, { align: 'center' });

  // Key metrics on cover
  const coverY = 185;
  const metW = (CONTENT_W - 10) / 3;

  const coverMetrics = [
    {
      label: 'R(t) Index',
      value: reportData.rriState.rri.toFixed(4),
      color: reportData.rriState.rri >= 2.625 ? COLORS.red : COLORS.orange
    },
    {
      label: 'P(Revolution)',
      value: (reportData.rriState.p_rev * 100).toFixed(1) + '%',
      color: COLORS.orange
    },
    {
      label: 'Risk Status',
      value: reportData.rriState.rri >= 2.625 ? 'CRITICAL' : 'ELEVATED',
      color: reportData.rriState.rri >= 2.625 ? COLORS.red : COLORS.orange
    },
  ];

  coverMetrics.forEach((m, i) => {
    const mx = MARGIN + i * (metW + 5);
    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.roundedRect(mx, coverY, metW, 22, 2, 2, 'F');
    doc.setDrawColor(m.color[0], m.color[1], m.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(mx, coverY, metW, 22, 2, 2, 'S');

    setFont('normal', 6);
    setColor(COLORS.dark);
    doc.text(m.label.toUpperCase(), mx + metW / 2, coverY + 6, { align: 'center' });

    setFont('bold', 14);
    setColor(m.color);
    doc.text(m.value, mx + metW / 2, coverY + 16, { align: 'center' });
  });

  // Generated info
  setFont('normal', 7);
  setColor(COLORS.dark);
  doc.text([
    `Generated: ${reportData.generatedAt}`,
    `Analyst: ${config.analyst}`,
    `Sections: ${config.sections.join(', ')}`,
    `Format: Intelligence Report — TUNISIAINTEL v2.0`,
  ], W / 2, 220, { align: 'center' });

  // Bottom border on cover
  doc.setFillColor(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2]);
  doc.rect(0, H - 3, W, 3, 'F');

  // ── PAGE 2+: CONTENT ───────────────────────────────────────

  doc.addPage();
  doc.setFillColor(COLORS.bg[0], COLORS.bg[1], COLORS.bg[2]);
  doc.rect(0, 0, W, H, 'F');
  drawPageHeader();
  drawPageFooter();

  // ── SECTION: RRI Summary ────────────────────────────────────

  if (config.sections.includes('rri_summary')) {
    sectionHeader('Revolutionary Risk Index (RRI) — Current State');

    // Big R(t) display
    const rriColor = reportData.rriState.rri >= 2.625 ? COLORS.red : COLORS.orange;
    setFont('bold', 36);
    setColor(rriColor);
    doc.text(reportData.rriState.rri.toFixed(4), MARGIN, y);
    setFont('normal', 8);
    setColor(COLORS.dark);
    doc.text('R(t) — Revolutionary Risk Index', MARGIN + 52, y - 6);
    doc.text(
      reportData.rriState.rri >= 2.625
        ? '⚠ REVOLUTION THRESHOLD BREACHED (>2.625)'
        : 'ELEVATED — Below revolution threshold',
      MARGIN + 52,
      y
    );
    y += 12;

    // Metrics grid
    const metrics4 = [
      {
        label: 'P(Revolution)',
        value: (reportData.rriState.p_rev * 100).toFixed(1) + '%',
        status: reportData.rriState.p_rev > 0.7 ? 'critical' : 'warning'
      },
      {
        label: 'Velocity V(t)',
        value: (reportData.rriState.velocity > 0 ? '+' : '') + reportData.rriState.velocity.toFixed(3),
        status: reportData.rriState.velocity > 0.15 ? 'critical' : 'neutral'
      },
      {
        label: 'Pattern Match HPS',
        value: (reportData.rriState.pattern_similarity * 100).toFixed(0) + '%',
        status: reportData.rriState.pattern_similarity > 0.65 ? 'critical' : 'warning'
      },
      {
        label: 'Cascade Risk',
        value: (reportData.rriState.cascade_probability * 100).toFixed(0) + '%',
        status: reportData.rriState.cascade_probability > 0.6 ? 'critical' : 'warning'
      },
      {
        label: 'Compound Stress CS(t)',
        value: reportData.rriState.compound_stress?.toFixed(3) || 'N/A',
        status: 'neutral'
      },
      {
        label: 'Model Confidence',
        value: (reportData.rriState.model_confidence * 100).toFixed(0) + '%',
        status: 'neutral'
      },
      {
        label: 'Variables Active',
        value: String(reportData.rriState.variables_count),
        status: 'neutral'
      },
      {
        label: 'Threshold Breaches',
        value: String(reportData.rriState.threshold_breaches?.length || 0),
        status: (reportData.rriState.threshold_breaches?.length || 0) > 5 ? 'critical' : 'warning'
      },
    ];

    // 2-column grid
    const colW = (CONTENT_W - 6) / 2;
    metrics4.forEach((m, i) => {
      const col = i % 2;
      const mx = MARGIN + col * (colW + 6);
      if (col === 0 && i > 0) checkPageBreak(8);
      const statusColor =
        m.status === 'critical' ? COLORS.red :
        m.status === 'warning' ? COLORS.orange :
        m.status === 'ok' ? COLORS.green :
        COLORS.slate;
      setFont('normal', 7);
      setColor(COLORS.dark);
      doc.text(m.label.toUpperCase(), mx, y);
      setFont('bold', 9);
      setColor(statusColor);
      doc.text(m.value, mx + colW, y, { align: 'right' });
      if (col === 1 || i === metrics4.length - 1) {
        doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, y + 2, W - MARGIN, y + 2);
        y += 8;
      }
    });

    // Pattern label
    if (reportData.rriState.pattern_label) {
      setFont('italic', 7);
      setColor(COLORS.dark);
      doc.text(
        `Pattern match: ${reportData.rriState.pattern_label}`,
        MARGIN, y
      );
      y += 8;
    }

    y += 4;
  }

  // ── SECTION: AI Strategic Analysis ──────────────────────────

  if (config.includeAIAnalysis && reportData.aiAnalysis) {
    checkPageBreak(80);
    sectionHeader('AI Strategic Intelligence Analysis');

    // AI Analyst Box
    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.setDrawColor(COLORS.cyan[0], COLORS.cyan[1], COLORS.cyan[2]);
    doc.setLineWidth(0.1);
    
    const aiText = reportData.aiAnalysis;
    const splitText = doc.splitTextToSize(aiText, CONTENT_W - 10);
    const boxH = splitText.length * 5 + 15;
    
    doc.roundedRect(MARGIN, y - 2, CONTENT_W, boxH, 2, 2, 'FD');

    setFont('italic', 8);
    setColor(COLORS.cyan);
    doc.text('Generated by TUNISIAINTEL AI Analyst Engine — Strategic Overview', MARGIN + 5, y + 4);
    y += 12;

    setFont('normal', 9);
    setColor(COLORS.white);
    splitText.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, MARGIN + 5, y);
      y += 5;
    });
    y += 10;
  }

  // ── SECTION: Accelerometers ─────────────────────────────────

  if (config.includeCharts) {
    drawAccelerometers();
  }

  // ── SECTION: Economic ───────────────────────────────────────

  if (config.sections.includes('economic')) {
    checkPageBreak(60);
    sectionHeader('Economic Intelligence');

    const econ = reportData.data.economy;
    const econMetrics = [
      { label: 'FX Reserves', value: `${econ.fx_reserves} days import cover`, status: econ.fx_reserves < 90 ? 'critical' : 'ok' as any },
      { label: 'Inflation (CPI)', value: `${econ.inflation}%`, status: econ.inflation > 8 ? 'critical' : 'warning' as any },
      { label: 'TND/USD', value: String(econ.tnd_usd), status: 'neutral' as any },
      { label: 'Unemployment', value: `${econ.unemployment}%`, status: econ.unemployment > 16 ? 'warning' : 'ok' as any },
      { label: 'Public Debt', value: `${econ.public_debt}% GDP`, status: econ.public_debt > 80 ? 'critical' : 'warning' as any },
      { label: 'GDP Growth', value: `${econ.gdp_growth}%`, status: econ.gdp_growth < 1 ? 'warning' : 'ok' as any },
      { label: 'Trade Deficit', value: `${econ.trade_deficit}B TND`, status: 'warning' as any },
      { label: 'Remittances', value: `${econ.remittances_total_bnd}B TND`, status: 'ok' as any },
    ];

    econMetrics.forEach(m => metricRow(m.label, m.value, m.status));
    y += 4;
  }

  // ── SECTION: SITREP (Situation Report) ──────────────────────

  if (config.sections.includes('sitrep')) {
    checkPageBreak(80);
    sectionHeader('Automated Situation Report (SITREP)');

    const sitrep = reportData.data.sitrep || {
      summary: 'Automated intelligence scan of current stability variables.',
      key_threats: ['Economic threshold breaches', 'Social mobilization signals'],
      status: 'ADVISORY'
    };

    doc.setFillColor(COLORS.card[0], COLORS.card[1], COLORS.card[2]);
    doc.roundedRect(MARGIN, y - 4, CONTENT_W, 40, 2, 2, 'F');
    
    setFont('bold', 10);
    setColor(sitrep.status === 'CRITICAL' ? COLORS.red : COLORS.cyan);
    doc.text(`STATUS: ${sitrep.status}`, MARGIN+5, y + 2);
    
    setFont('normal', 8);
    setColor(COLORS.white);
    const summaryLines = doc.splitTextToSize(sitrep.summary, CONTENT_W - 10);
    doc.text(summaryLines, MARGIN+5, y + 8);
    
    y += (summaryLines.length * 4) + 12;
    
    setFont('bold', 8);
    setColor(COLORS.slate);
    doc.text('KEY OPERATIONAL THREATS:', MARGIN+5, y);
    y += 5;
    
    sitrep.key_threats.forEach((threat: string) => {
      setFont('normal', 8);
      setColor(COLORS.red);
      doc.text(`• ${threat}`, MARGIN + 8, y);
      y += 5;
    });
    
    y += 8;
  }

  // ── SECTION: Analyst Audit Trail ────────────────────────────

  if (config.sections.includes('audit_trail') && reportData.auditLog) {
    checkPageBreak(60);
    sectionHeader('Analyst Audit Trail — Intelligence Integrity');

    const auditRows = reportData.auditLog.slice(0, 15).map((a: any) => [
      new Date(a.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      a.type,
      a.label || a.field,
      String(a.oldValue ?? 'N/A') + ' -> ' + String(a.value),
      a.source
    ]);

    if (auditRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Time', 'Action', 'Target', 'Change', 'Source']],
        body: auditRows,
        theme: 'plain',
        styles: {
          fontSize: 7,
          textColor: [148, 163, 184],
          fillColor: [10, 14, 20],
          lineColor: [26, 34, 45],
          lineWidth: 0.1,
        },
        headStyles: {
          fontSize: 6,
          textColor: [0, 212, 255],
          fillColor: [5, 7, 10],
          fontStyle: 'bold',
        },
        margin: { left: MARGIN, right: MARGIN },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ── SECTION: Social ─────────────────────────────────────────

  if (config.sections.includes('social')) {
    checkPageBreak(60);
    sectionHeader('Social Intelligence');

    const social = reportData.data.social;
    const socialMetrics = [
      { label: 'Protest Events (30 days)', value: String(social.protest_events_30d), status: social.protest_events_30d > 20 ? 'critical' : 'warning' as any },
      { label: 'UGTT Mobilisation', value: social.ugtt_mobilisation_level, status: social.ugtt_mobilisation_level === 'HIGH' ? 'critical' : 'warning' as any },
      { label: 'Decree 54 Charged', value: String(social.decree54_charged), status: 'critical' as any },
      { label: 'Water Crisis Govs', value: String(social.water_crisis_govs), status: social.water_crisis_govs > 5 ? 'critical' : 'warning' as any },
      { label: 'UGTT Strike Count 2025', value: String(social.ugtt_strike_count_2025 || 847), status: 'warning' as any },
    ];

    socialMetrics.forEach(m => metricRow(m.label, m.value, m.status));
    y += 4;
  }

  // ── SECTION: Political Prisoners ────────────────────────────

  if (config.sections.includes('prisoners')) {
    checkPageBreak(60);
    sectionHeader('Political Prisoners — Detention Tracker');

    const prisonerRows = [
      ['Rached Ghannouchi', 'Ennahda Leader', 'Terrorism', String(Math.floor((Date.now() - new Date('2023-04-17').getTime()) / 86400000)) + 'd'],
      ['Noureddine Bhiri', 'Former Justice Minister', 'Terrorism', String(Math.floor((Date.now() - new Date('2022-01-03').getTime()) / 86400000)) + 'd'],
      ['Ghazi Chaouachi', 'NSF Secretary General', 'Terrorism', String(Math.floor((Date.now() - new Date('2023-02-11').getTime()) / 86400000)) + 'd'],
      ['Jaouhar Ben Mbarek', 'Constitutional Scholar', 'Terrorism', String(Math.floor((Date.now() - new Date('2023-02-11').getTime()) / 86400000)) + 'd'],
      ['Abir Moussi', 'PDL Leader', 'Public Order', String(Math.floor((Date.now() - new Date('2023-10-03').getTime()) / 86400000)) + 'd'],
      ['Sonia Dahmani', 'Lawyer/Commentator', 'Decree 54', String(Math.floor((Date.now() - new Date('2024-05-11').getTime()) / 86400000)) + 'd'],
      ['Mehdi Zagrouba', 'Defense Attorney', 'Terrorism', String(Math.floor((Date.now() - new Date('2024-01-30').getTime()) / 86400000)) + 'd'],
    ];

    autoTable(doc, {
      startY: y,
      head: [['Name', 'Role', 'Official Charge', 'Days Detained']],
      body: prisonerRows,
      theme: 'plain',
      styles: {
        fontSize: 8,
        textColor: [148, 163, 184],
        fillColor: [10, 14, 20],
        lineColor: [26, 34, 45],
        lineWidth: 0.2,
      },
      headStyles: {
        fontSize: 7,
        textColor: [0, 212, 255],
        fillColor: [5, 7, 10],
        fontStyle: 'bold',
      },
      columnStyles: {
        3: { textColor: [255, 69, 58], fontStyle: 'bold' },
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── SECTION: Threshold Breaches ─────────────────────────────

  if (config.sections.includes('threshold_breaches') &&
      reportData.rriState.threshold_breaches?.length > 0) {
    checkPageBreak(40);
    sectionHeader('Active Threshold Breaches');

    reportData.rriState.threshold_breaches.forEach((breach: string) => {
      checkPageBreak(7);
      doc.setFillColor(40, 10, 10);
      doc.rect(MARGIN, y - 3, CONTENT_W, 6, 'F');
      doc.setFillColor(COLORS.red[0], COLORS.red[1], COLORS.red[2]);
      doc.rect(MARGIN, y - 3, 1.5, 6, 'F');
      setFont('normal', 7);
      setColor(COLORS.red);
      doc.text(`⚠ ${breach}`, MARGIN + 4, y + 1);
      y += 8;
    });
    y += 4;
  }

  // ── SECTION: Geopolitical ────────────────────────────────────

  if (config.sections.includes('geopolitical')) {
    checkPageBreak(50);
    sectionHeader('Geopolitical Intelligence');

    const geo = reportData.data.geopolitical || {};
    const geoMetrics = [
      { label: 'IMF Deal Probability', value: `${geo.imf_deal_probability || 31}%`, status: (geo.imf_deal_probability || 31) < 40 ? 'critical' : 'warning' as any },
      { label: 'EU Relations', value: geo.eu_relations || 'STRAINED', status: 'warning' as any },
      { label: 'US Relations', value: geo.us_relations || 'NEUTRAL', status: 'neutral' as any },
      { label: 'France Relations', value: geo.france_relations || 'DIPLOMATIC', status: 'neutral' as any },
      { label: 'Gulf Support', value: geo.gulf_support || 'LIMITED', status: 'neutral' as any },
    ];

    geoMetrics.forEach(m => metricRow(m.label, m.value, m.status));
    y += 4;
  }

  // ── SECTION: Recent Events ────────────────────────────────────

  if (config.sections.includes('events') &&
      reportData.events && reportData.events.length > 0) {
    checkPageBreak(50);
    sectionHeader('Intelligence Events — Recent');

    const eventRows = reportData.events.slice(0, 10).map((e: any) => [
      new Date(e.last_updated || e.created_at).toLocaleDateString('en-GB'),
      e.title?.slice(0, 40) || 'Untitled',
      e.category || 'general',
      e.governorate || 'National',
      String(e.severity || 1),
      String(e.article_count || 0),
    ]);

    if (eventRows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Date', 'Event', 'Category', 'Location', 'Sev', 'Sources']],
        body: eventRows,
        theme: 'plain',
        styles: {
          fontSize: 7,
          textColor: [148, 163, 184],
          fillColor: [10, 14, 20],
          lineColor: [26, 34, 45],
          lineWidth: 0.2,
        },
        headStyles: {
          fontSize: 6,
          textColor: [0, 212, 255],
          fillColor: [5, 7, 10],
          fontStyle: 'bold',
        },
        margin: { left: MARGIN, right: MARGIN },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ── SECTION: Narrative Intelligence ──────────────────────────

  if (config.sections.includes('narrative')) {
    checkPageBreak(40);
    sectionHeader('Narrative Intelligence Summary');

    setFont('normal', 8);
    setColor(COLORS.slate);
    const narrativeText = [
      'TUNISIAINTEL Narrative Intelligence Engine monitors media coverage',
      'across critical, neutral, and pro-government sources to detect',
      'propaganda techniques and narrative divergence.',
      '',
      'Sources monitored: Nawaat (Critical), Inkyfada (Critical),',
      'Business News (Neutral), Mosaique FM (Neutral), TAP (Pro-Gov),',
      'Reuters (Neutral), Middle East Eye (Critical), Jeune Afrique (Neutral).',
    ];
    narrativeText.forEach(line => {
      checkPageBreak(6);
      doc.text(line, MARGIN, y);
      y += 5;
    });
    y += 4;
  }

  // ── FINAL PAGE: Disclaimer ────────────────────────────────────

  newPage();

  sectionHeader('Disclaimer & Methodology');

  const disclaimerText = [
    'This report was generated by TUNISIAINTEL v2.0, an AI-powered open-source',
    'intelligence platform monitoring Tunisia political risk.',
    '',
    'DATA SOURCES: RSS feeds from 15 monitored sources, BCT financial data,',
    'INS statistical data, civil society reports, and international organizations',
    'including HRW, Amnesty International, RSF, and ACLED.',
    '',
    'RRI METHODOLOGY: The Revolutionary Risk Index (R(t)) is computed using',
    '20 equations based on Samir Dni (2025) with TUNISIAINTEL extensions.',
    'The model is a structured monitoring tool, not a probabilistic oracle.',
    'P_rev values carry wide confidence intervals and should be interpreted',
    'as risk signals, not forecasts.',
    '',
    'LIMITATIONS: Parameters are expert-calibrated, not empirically estimated.',
    'The model has not been validated through out-of-sample testing.',
    'Results should inform analysis, not replace independent judgment.',
    '',
    'CLASSIFICATION: This report is marked ' + config.classification + '.',
    'Distribution should be consistent with this classification level.',
    '',
    'NOT FOR PUBLIC DISTRIBUTION without appropriate review.',
    'Based exclusively on open-source, publicly available information.',
    'Verify all information independently before operational use.',
  ];

  disclaimerText.forEach(line => {
    checkPageBreak(6);
    if (line === '') { y += 3; return; }
    setFont(
      line.includes('METHODOLOGY') || line.includes('SOURCES') ||
      line.includes('LIMITATIONS') || line.includes('CLASSIFICATION') ||
      line.includes('NOT FOR')
        ? 'bold' : 'normal',
      7
    );
    setColor(
      line.includes('NOT FOR') ? COLORS.orange : COLORS.slate
    );
    doc.text(line, MARGIN, y, { maxWidth: CONTENT_W });
    y += 5;
  });

  // Add page footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter();
  }

  // Save
  const filename = `TunisiaIntel_${config.classification}_${
    config.dateRange}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ── CSV GENERATOR ─────────────────────────────────────────────

export function generateCSV(
  config: ReportConfig,
  reportData: ReportData
): void {
  const rows: string[][] = [];
  const header = ['Category', 'Metric', 'Value', 'Status', 'Generated'];
  const ts = reportData.generatedAt;

  rows.push(header);

  if (config.sections.includes('rri_summary')) {
    const rri = reportData.rriState;
    [
      ['RRI', 'R(t) Index', rri.rri.toFixed(4), rri.rri >= 2.625 ? 'CRITICAL' : 'ELEVATED'],
      ['RRI', 'P(Revolution)', (rri.p_rev * 100).toFixed(1) + '%', 'HIGH'],
      ['RRI', 'Velocity V(t)', rri.velocity.toFixed(4), rri.velocity > 0.15 ? 'ALERT' : 'NOMINAL'],
      ['RRI', 'Cascade Risk', (rri.cascade_probability * 100).toFixed(0) + '%', rri.cascade_probability > 0.6 ? 'CRITICAL' : 'HIGH'],
      ['RRI', 'Pattern HPS', (rri.pattern_similarity * 100).toFixed(0) + '%', 'HIGH'],
      ['RRI', 'Model Confidence', (rri.model_confidence * 100).toFixed(0) + '%', 'NOMINAL'],
    ].forEach(r => rows.push([...r, ts]));
  }

  if (config.sections.includes('economic')) {
    const e = reportData.data.economy;
    [
      ['Economy', 'FX Reserves', e.fx_reserves + ' days', e.fx_reserves < 90 ? 'WARNING' : 'OK'],
      ['Economy', 'Inflation', e.inflation + '%', 'HIGH'],
      ['Economy', 'TND/USD', String(e.tnd_usd), 'NOMINAL'],
      ['Economy', 'Unemployment', e.unemployment + '%', 'HIGH'],
      ['Economy', 'Public Debt', e.public_debt + '% GDP', 'CRITICAL'],
      ['Economy', 'GDP Growth', e.gdp_growth + '%', 'LOW'],
    ].forEach(r => rows.push([...r, ts]));
  }

  if (config.sections.includes('social')) {
    const s = reportData.data.social;
    [
      ['Social', 'Protest Events 30d', String(s.protest_events_30d), s.protest_events_30d > 20 ? 'CRITICAL' : 'HIGH'],
      ['Social', 'UGTT Mobilisation', s.ugtt_mobilisation_level, s.ugtt_mobilisation_level === 'HIGH' ? 'CRITICAL' : 'NOMINAL'],
      ['Social', 'Decree 54 Charged', String(s.decree54_charged), 'CRITICAL'],
      ['Social', 'Water Crisis Govs', String(s.water_crisis_govs), 'CRITICAL'],
    ].forEach(r => rows.push([...r, ts]));
  }

  if (config.sections.includes('prisoners')) {
    const prisoners = [
      ['Rached Ghannouchi', 'Terrorism', '2023-04-17'],
      ['Noureddine Bhiri', 'Terrorism', '2022-01-03'],
      ['Ghazi Chaouachi', 'Terrorism', '2023-02-11'],
      ['Sonia Dahmani', 'Decree 54', '2024-05-11'],
      ['Mehdi Zagrouba', 'Terrorism', '2024-01-30'],
    ];
    prisoners.forEach(([name, charge, arrest]) => {
      const days = Math.floor(
        (Date.now() - new Date(arrest).getTime()) / 86400000
      );
      rows.push(['Prisoner', name, days + ' days detained', charge, ts]);
    });
  }

  // Events
  if (config.sections.includes('events') && reportData.events) {
    reportData.events.slice(0, 20).forEach((e: any) => {
      rows.push([
        'Event',
        e.title || 'Untitled',
        `${e.category} / ${e.governorate || 'National'} / SEV ${e.severity}`,
        `${e.article_count || 0} sources`,
        e.last_updated || ts,
      ]);
    });
  }

  // Convert to CSV
  const csvContent = rows.map(row =>
    row.map(cell =>
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TunisiaIntel_${config.dateRange}_${
    new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── JSON GENERATOR ────────────────────────────────────────────

export function generateJSON(
  config: ReportConfig,
  reportData: ReportData
): void {
  const output: any = {
    meta: {
      platform: 'TUNISIAINTEL v2.0',
      generated: reportData.generatedAt,
      analyst: config.analyst,
      classification: config.classification,
      sections: config.sections,
      dateRange: config.dateRange,
    },
  };

  if (config.sections.includes('rri_summary')) {
    output.rri = {
      value: reportData.rriState.rri,
      p_rev: reportData.rriState.p_rev,
      velocity: reportData.rriState.velocity,
      velocity_label: reportData.rriState.velocity_label,
      cascade_probability: reportData.rriState.cascade_probability,
      pattern_similarity: reportData.rriState.pattern_similarity,
      pattern_label: reportData.rriState.pattern_label,
      compound_stress: reportData.rriState.compound_stress,
      model_confidence: reportData.rriState.model_confidence,
      variables_count: reportData.rriState.variables_count,
      threshold_breaches: reportData.rriState.threshold_breaches,
      ci_low: reportData.rriState.ci_low,
      ci_high: reportData.rriState.ci_high,
      status: reportData.rriState.rri >= 2.625 ? 'CRITICAL' : 'ELEVATED',
    };
  }

  if (config.sections.includes('economic')) {
    output.economy = reportData.data.economy;
  }

  if (config.sections.includes('social')) {
    output.social = reportData.data.social;
  }

  if (config.sections.includes('geopolitical')) {
    output.geopolitical = reportData.data.geopolitical;
  }

  if (config.sections.includes('events') && reportData.events) {
    output.events = reportData.events;
  }

  output.disclaimer =
    'Based on open-source intelligence only. ' +
    'Not for operational use without independent verification. ' +
    'TUNISIAINTEL v2.0 — Political Risk Intelligence Platform.';

  const blob = new Blob(
    [JSON.stringify(output, null, 2)],
    { type: 'application/json' }
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TunisiaIntel_${config.dateRange}_${
    new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main dispatcher ───────────────────────────────────────────

export function generateReport(
  config: ReportConfig,
  reportData: ReportData
): void {
  switch (config.format) {
    case 'pdf': return generatePDF(config, reportData);
    case 'csv': return generateCSV(config, reportData);
    case 'json': return generateJSON(config, reportData);
  }
}
