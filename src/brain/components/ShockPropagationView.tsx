import React, { useState, useEffect, useCallback, useRef, WheelEvent, MouseEvent } from 'react';
import { usePipeline } from '../../context/PipelineContext';
import {
  simulatePropagation, compareToHistorical, HISTORICAL_WAVES,
  type PropagationResult, type HistoricalWave,
} from '../../services/propagationEngine';
import govData from '../../data/governorates.json';

// ── Pre-projected GeoJSON paths (VW=520, VH=760) ──────────────
const GOV_PATHS: Record<string, { path: string; cx: number; cy: number }> = {
  tunis:       { path: "M350.9,71.0L353.0,70.9L351.2,69.6L352.4,67.3L347.9,63.2L348.7,61.9L353.2,64.0L357.1,65.5L362.2,68.9L363.3,69.6L358.4,73.1L357.5,73.7L357.0,74.2L355.3,76.1L350.8,76.7L348.6,76.9L345.9,76.9L344.1,78.9L342.7,80.1L344.5,81.0L343.7,81.7L342.5,83.2L342.1,83.8L340.2,85.5L338.4,85.3L337.9,85.3L335.9,84.5L335.7,84.4L333.1,84.2L333.3,84.7L334.3,86.3L334.4,87.9L327.4,88.4L324.8,85.4L320.1,82.3L319.4,81.6L316.4,79.0L319.4,77.9L322.8,78.7L325.1,77.8L325.0,77.7L326.6,77.8L328.8,77.4L331.6,77.6L331.5,77.4L331.2,74.8L331.1,74.4L331.0,74.0L330.6,73.2L330.7,73.2L331.4,72.7L332.7,72.4L334.3,71.9L334.3,71.9L337.4,73.3L339.7,73.0L339.9,72.4L343.5,72.4L344.1,71.3L346.5,70.4L346.2,71.7L347.5,71.5L350.0,71.2L350.9,71.0Z", cx: 339.8, cy: 76.1 },
  ben_arous:   { path: "M361.0,84.0L369.7,86.3L369.2,88.8L364.6,93.3L364.3,93.5L359.4,99.6L360.2,100.3L362.5,100.0L363.9,100.4L364.7,102.2L359.8,107.2L360.6,110.7L355.7,112.1L350.6,114.1L347.2,113.4L350.4,108.2L344.0,106.5L339.3,107.0L335.3,101.4L335.4,98.0L329.6,100.0L320.8,96.3L320.9,95.7L321.0,95.8L328.2,89.2L327.4,88.4L334.4,87.9L334.3,86.3L333.3,84.7L333.1,84.2L335.7,84.4L337.9,85.3L340.2,85.5L342.1,83.8L342.6,83.2L343.7,81.7L344.5,81.0L342.7,80.1L344.1,78.9L345.9,76.9L346.3,76.9L348.6,76.9L349.2,76.9L355.3,76.1L351.7,79.9L354.5,81.2L358.0,82.9L359.6,83.7L361.0,84.0Z", cx: 347.0, cy: 91.3 },
  ariana:      { path: "M351.8,68.4L351.2,69.6L353.0,70.9L350.9,71.0L346.2,71.7L346.5,70.4L344.1,71.3L343.5,72.4L342.4,72.4L339.9,72.4L339.7,73.0L337.4,73.3L334.3,71.9L334.3,71.9L331.4,72.7L330.7,73.2L330.6,73.2L331.1,74.4L331.1,74.6L329.3,74.7L328.6,73.4L326.3,72.0L326.4,71.9L325.8,69.7L324.1,70.2L319.5,72.5L315.0,72.3L313.7,73.7L311.9,73.8L311.7,73.5L316.9,68.6L318.4,63.8L321.1,59.1L321.9,57.9L328.0,49.4L332.3,46.1L343.2,46.3L338.7,51.3L343.1,58.6L343.6,59.5L347.4,61.3L348.7,61.9L347.9,63.2L352.4,67.3L351.8,68.4Z", cx: 334.6, cy: 67.7 },
  nabeul:      { path: "M414.4,65.8L415.1,65.4L431.3,55.2L430.8,52.3L439.9,50.9L449.7,48.1L453.5,52.2L451.2,54.0L451.6,58.1L451.9,58.3L457.2,62.6L459.9,66.7L460.3,70.8L458.4,72.2L454.5,75.2L449.1,78.8L438.2,86.4L437.7,86.8L433.3,93.3L423.3,108.0L420.5,112.1L414.6,113.4L409.8,114.5L406.3,115.2L404.4,116.1L396.6,119.6L388.7,120.6L387.0,121.8L383.5,120.4L377.5,122.6L366.2,121.7L365.9,123.7L363.1,121.1L360.6,110.7L359.8,107.2L364.7,102.2L363.9,100.4L362.5,100.0L360.2,100.3L359.4,99.6L364.3,93.5L369.2,88.8L369.3,88.4L369.7,86.3L371.4,86.7L377.7,85.0L388.6,79.1L389.9,72.1L391.1,71.3L393.4,69.6L407.0,70.5L414.4,65.8Z", cx: 405.4, cy: 88.1 },
  manouba:     { path: "M329.3,74.7L331.1,74.6L331.5,77.4L331.6,77.6L328.8,77.4L326.6,77.8L325.0,77.7L325.1,77.8L322.8,78.7L319.4,77.9L316.4,79.0L320.1,82.3L324.8,85.4L328.2,89.2L321.0,95.8L318.5,91.7L314.2,95.0L304.0,98.4L302.9,96.8L300.6,98.2L298.9,99.6L297.5,97.5L293.2,97.3L292.1,94.5L290.4,94.2L290.5,91.1L288.3,86.1L285.4,85.6L281.8,84.8L276.1,82.6L267.3,80.8L266.8,80.7L259.7,74.2L264.9,71.0L281.1,66.7L286.8,68.0L293.3,59.7L296.5,60.6L298.6,61.3L307.1,62.0L309.3,65.7L315.7,64.8L317.7,66.0L316.9,68.6L311.7,73.5L311.9,73.8L313.7,73.7L315.0,72.3L319.5,72.5L324.1,70.2L325.8,69.7L326.4,71.9L326.3,72.0L328.6,73.4L329.3,74.7Z", cx: 307.8, cy: 79.0 },
  bizerte:     { path: "M285.7,21.3L287.8,22.1L300.4,22.2L300.9,28.5L302.8,28.8L305.4,29.2L307.3,29.4L316.0,29.9L318.0,30.1L326.5,30.1L328.8,32.0L337.3,33.2L342.9,36.5L352.0,37.7L349.4,39.6L346.8,41.4L345.1,44.3L343.9,45.6L343.2,46.3L332.3,46.1L328.0,49.4L321.9,57.9L318.4,63.8L317.7,66.0L315.7,64.8L309.3,65.7L307.1,62.0L298.6,61.3L293.3,59.7L286.8,68.0L281.1,66.7L266.1,70.7L264.9,71.0L257.5,75.5L249.0,81.0L240.4,85.6L233.1,80.6L238.2,72.8L232.9,69.8L230.0,70.6L219.8,66.8L221.3,63.1L216.2,60.7L216.7,57.0L216.3,56.4L212.8,51.5L202.5,51.8L199.7,47.2L201.1,44.1L198.8,41.5L214.7,31.5L219.3,31.9L220.4,34.1L225.5,33.0L233.0,32.3L242.7,27.8L249.4,29.2L250.1,29.3L259.3,25.7L264.4,25.3L275.3,22.4L285.0,21.0L285.7,21.3Z", cx: 276.1, cy: 46.7 },
  zaghouan:    { path: "M340.5,146.7L335.1,146.8L333.8,146.4L331.9,148.8L333.6,150.5L327.7,152.7L324.6,149.7L323.2,149.9L325.1,156.4L320.0,160.2L314.4,155.9L305.4,156.0L302.4,152.7L298.3,152.5L297.0,152.5L295.6,153.8L293.2,149.3L283.6,149.5L285.3,146.1L282.3,139.8L275.9,136.6L273.2,137.8L267.1,134.7L264.3,133.6L279.0,128.1L284.1,124.6L285.9,119.6L285.4,115.3L284.9,114.6L283.5,112.3L285.4,111.3L295.7,102.3L300.6,98.2L302.9,96.8L304.0,98.4L314.2,95.0L318.5,91.7L320.9,95.7L320.8,96.3L329.6,100.0L335.4,98.0L335.3,101.4L339.3,107.0L339.1,107.0L344.0,106.5L350.4,108.2L347.2,113.4L350.6,114.1L355.7,112.1L360.6,110.7L363.1,121.1L365.9,123.7L365.3,126.5L364.3,130.1L364.1,131.0L363.4,134.3L356.7,135.9L350.5,135.7L350.4,136.5L350.3,142.3L339.6,145.0L340.5,146.7Z", cx: 320.3, cy: 128.2 },
  jendouba:    { path: "M120.7,88.7L121.1,87.8L116.5,81.2L138.0,79.6L147.1,74.8L142.5,70.4L144.2,65.8L145.9,61.1L160.6,61.1L172.3,55.5L180.1,61.0L179.3,64.5L189.8,68.4L186.9,71.7L181.8,73.9L178.4,77.9L178.7,78.1L178.1,79.9L190.0,80.3L192.3,83.6L191.7,91.4L191.8,91.5L194.6,94.7L199.7,101.4L195.7,106.2L194.6,111.7L186.1,111.7L180.6,113.9L173.1,116.9L157.9,119.5L148.9,117.0L148.5,117.0L138.7,118.5L129.2,121.1L117.3,124.5L109.8,124.5L111.8,119.3L108.3,114.9L84.1,115.0L80.1,110.6L99.2,104.9L116.7,95.8L117.2,95.6L120.7,88.7Z", cx: 153.2, cy: 93.0 },
  beja:        { path: "M198.2,115.4L189.9,111.7L194.6,111.7L195.7,106.2L199.7,101.4L199.4,101.1L194.6,94.7L193.1,93.0L191.7,91.4L192.3,83.6L190.0,80.3L178.1,79.9L178.7,78.1L178.4,77.9L181.8,73.9L186.9,71.7L189.8,68.4L188.8,68.0L179.3,64.5L180.1,61.0L172.3,55.5L181.7,51.1L198.2,41.8L198.8,41.5L201.1,44.1L199.7,47.2L202.5,51.8L212.8,51.5L216.7,57.0L216.2,60.7L221.3,63.1L220.1,66.0L219.8,66.8L230.0,70.6L232.9,69.8L238.2,72.8L233.1,80.6L236.6,82.9L240.4,85.6L243.5,83.9L249.0,81.0L257.5,75.5L259.7,74.2L266.8,80.7L276.1,82.6L281.8,84.8L288.3,86.1L290.5,91.1L290.4,94.2L292.1,94.5L293.2,97.3L297.5,97.5L298.9,99.6L295.7,102.3L285.4,111.3L278.0,115.3L268.4,117.1L259.3,116.4L259.4,115.8L256.3,112.3L247.6,113.3L233.9,114.0L234.3,115.0L230.3,121.7L222.5,125.0L221.6,122.2L209.8,120.9L205.8,123.5L203.3,123.1L204.1,119.8L198.5,115.5L198.2,115.4Z", cx: 226.1, cy: 88.4 },
  tataouine:   { path: "M107.2,522.3L107.6,521.4L191.7,509.6L197.4,508.8L257.3,499.3L260.6,493.0L282.8,490.9L293.5,498.7L302.1,502.9L310.1,506.6L311.4,509.0L310.7,502.2L300.5,498.4L306.0,490.3L313.1,485.5L310.4,481.4L309.5,473.7L317.4,473.2L304.7,467.7L303.2,465.5L313.1,463.3L327.8,461.9L330.5,460.1L338.6,460.5L350.7,454.7L359.2,452.5L360.5,452.2L371.5,445.3L372.3,444.5L377.9,447.9L391.8,449.7L384.9,453.6L383.9,454.3L395.6,459.3L404.9,460.0L412.3,460.5L438.3,462.7L440.5,460.5L443.3,459.8L447.0,460.6L446.3,468.7L453.6,476.9L458.9,499.2L454.4,504.3L470.3,533.4L486.4,532.2L486.9,535.1L464.1,541.5L463.3,541.5L463.4,548.3L443.9,555.3L410.6,577.1L400.5,576.6L396.7,577.7L395.4,588.4L378.6,601.9L360.4,601.4L336.0,624.9L333.5,628.0L330.1,632.2L348.1,670.1L352.6,687.6L349.7,700.2L340.6,708.2L300.6,745.4L285.3,746.8L259.0,754.4L198.7,566.6L107.2,522.3Z", cx: 348.1, cy: 580.0 },
  medenine:    { path: "M411.0,382.1L411.4,377.6L420.7,377.0L431.1,378.6L439.3,379.4L444.3,381.5L452.2,384.8L444.3,392.8L442.1,396.5L441.9,400.9L438.7,400.9L439.3,396.1L437.2,396.0L429.9,400.8L430.9,404.9L427.6,405.2L426.1,399.5L421.9,394.0L419.2,394.0L417.5,398.0L409.3,394.6L410.6,386.8L411.0,382.1Z M391.8,449.7L377.9,447.9L372.3,444.5L371.5,445.3L360.5,452.2L350.7,454.7L338.6,460.5L330.5,460.1L327.8,461.9L313.1,463.3L303.2,465.5L301.5,462.9L304.8,461.4L306.5,448.9L293.5,447.7L280.7,439.5L290.9,440.3L319.2,438.6L329.6,432.0L334.6,426.8L345.5,425.5L351.5,424.7L357.5,418.1L364.8,410.1L371.8,402.7L378.8,404.3L403.5,397.5L411.7,400.5L411.3,402.4L411.0,403.9L409.8,410.5L405.8,415.3L406.3,420.5L413.8,421.6L417.1,422.1L434.7,415.3L437.0,410.5L433.8,407.5L438.8,404.6L448.6,405.4L459.6,420.0L455.0,427.7L466.7,436.8L467.1,436.9L515.1,452.3L517.1,456.8L507.5,465.9L504.3,496.9L502.7,512.1L515.4,518.2L518.8,528.6L491.6,538.2L463.4,548.3L463.3,541.5L464.1,541.5L486.9,535.1L486.4,532.2L470.3,533.4L454.4,504.3L458.9,499.2L453.6,476.9L446.3,468.7L447.0,460.6L443.3,459.8L440.5,460.5L438.3,462.7L412.3,460.5L404.9,460.0L395.6,459.3L383.9,454.3L384.9,453.6L391.8,449.7Z", cx: 420.0, cy: 435.0 },
  gabes:       { path: "M340.1,386.3L362.0,400.4L371.8,402.7L364.8,410.1L357.5,418.1L351.5,424.7L345.5,425.5L334.6,426.8L329.6,432.0L319.2,438.6L304.7,439.4L290.9,440.3L280.7,439.5L279.5,438.7L273.6,434.6L269.3,426.1L254.7,418.6L254.7,416.8L257.9,415.7L268.1,408.2L257.4,404.7L257.3,404.8L248.9,402.9L246.4,397.7L241.7,397.0L232.6,393.0L224.6,380.6L221.4,359.1L233.5,353.7L232.1,353.1L223.9,350.4L220.3,345.6L222.8,345.3L233.8,342.7L250.3,343.8L259.6,341.7L257.5,338.0L278.9,337.0L284.1,342.1L292.8,344.0L293.4,340.7L297.3,341.5L299.9,345.9L305.3,349.0L306.0,345.6L311.5,344.5L313.7,346.7L322.0,349.3L320.7,350.9L323.4,365.9L324.3,370.9L327.9,374.4L332.4,378.8L339.9,386.2L340.1,386.3Z", cx: 286.5, cy: 390.0 },
  kebili:      { path: "M306.3,490.1L306.0,490.3L300.5,498.4L310.7,502.2L311.4,509.0L310.1,506.6L302.1,502.9L293.5,498.7L282.8,490.9L260.6,493.0L257.3,499.3L197.4,508.8L191.7,509.6L107.6,521.4L102.3,489.2L76.5,465.7L76.7,459.2L46.9,451.5L42.9,451.9L40.8,451.0L27.0,433.3L27.6,426.9L45.1,422.4L52.9,418.0L80.9,402.2L85.1,399.9L101.5,391.4L110.3,386.8L122.6,380.5L142.8,366.0L145.5,359.6L146.5,357.1L171.2,355.2L175.0,352.6L175.3,352.6L194.8,353.0L210.0,347.2L210.4,347.1L211.3,346.7L222.8,345.3L220.3,345.6L223.9,350.4L232.1,353.1L233.5,353.7L221.4,359.1L224.6,380.6L232.6,393.0L242.0,397.2L241.7,397.0L246.4,397.7L248.9,402.9L257.3,404.8L257.4,404.7L268.1,408.2L257.9,415.7L254.7,416.8L254.7,418.6L269.3,426.1L273.6,434.6L279.5,438.7L280.7,439.5L293.5,447.7L306.5,448.9L304.8,461.4L301.5,462.9L304.7,467.7L317.4,473.2L309.5,473.7L310.4,481.4L313.1,485.5L306.3,490.1Z", cx: 195.0, cy: 435.0 },
  tozeur:      { path: "M80.9,402.2L52.9,418.0L45.1,422.4L27.6,426.9L26.4,426.2L14.6,411.2L1.0,385.0L2.4,371.7L4.8,360.9L4.9,360.5L12.4,354.5L17.2,347.1L36.4,343.6L45.4,325.0L58.0,321.6L78.8,311.1L79.9,310.4L79.1,313.0L72.6,322.3L72.7,326.0L68.9,333.0L72.3,335.6L88.3,348.1L104.3,349.9L104.3,357.6L106.5,359.8L141.6,359.0L145.5,359.6L142.8,366.0L122.6,380.5L101.5,391.4L85.1,399.9L80.9,402.2Z", cx: 66.0, cy: 368.0 },
  gafsa:       { path: "M207.3,293.9L215.3,293.9L225.8,296.5L226.3,302.1L220.8,306.9L224.1,307.6L231.2,308.7L232.8,314.4L232.8,314.3L243.9,316.9L247.8,316.7L254.3,325.5L262.5,327.3L261.4,330.3L259.2,330.6L260.7,337.8L257.5,338.0L259.6,341.7L250.3,343.8L233.8,342.7L222.8,345.3L220.3,345.6L211.3,346.7L210.0,347.2L194.8,353.0L175.3,352.6L175.0,352.6L171.2,355.2L146.5,357.1L145.5,359.6L141.6,359.0L140.1,359.0L106.5,359.8L104.3,357.6L104.3,349.9L88.3,348.1L81.7,342.9L68.9,333.0L72.7,326.0L72.6,322.3L76.0,317.4L79.1,313.0L79.9,310.4L91.4,302.9L92.4,297.7L99.5,292.5L99.1,290.8L105.3,292.2L124.7,300.7L125.1,300.7L135.2,303.6L141.5,299.5L152.3,292.4L176.0,284.6L178.0,283.9L182.1,289.8L187.3,292.3L197.0,296.8L205.9,293.9L207.3,293.9Z", cx: 173.3, cy: 326.0 },
  sousse:      { path: "M395.1,173.5L398.5,177.3L397.2,178.3L397.7,179.6L400.6,179.7L401.8,181.0L404.0,181.5L402.6,183.0L401.7,184.0L402.2,185.8L402.1,186.4L398.0,186.5L397.7,187.6L397.5,188.4L397.7,192.1L399.4,193.4L398.8,193.9L395.3,197.2L393.3,196.6L390.9,196.7L389.1,196.8L384.1,201.7L385.3,204.0L382.3,205.4L379.1,206.6L379.0,211.0L381.7,213.8L392.6,211.5L396.4,213.4L394.8,213.7L388.0,217.3L387.9,223.6L379.0,219.8L375.4,218.2L373.6,211.9L368.4,209.8L362.0,210.1L355.8,202.6L352.7,198.9L347.3,191.5L340.7,184.3L339.0,182.5L335.9,180.3L338.4,173.8L346.9,168.4L349.3,158.0L351.6,158.0L344.5,154.5L341.2,148.0L339.6,145.0L350.3,142.3L350.5,135.7L356.7,135.9L356.9,135.8L363.4,134.3L364.1,131.0L365.3,126.5L366.2,121.7L377.5,122.6L383.5,120.4L387.0,121.8L379.5,127.5L377.0,142.5L376.2,146.7L378.5,150.7L382.2,157.1L385.4,161.2L386.3,162.3L391.6,169.1L394.1,172.4L395.1,173.5Z", cx: 377.8, cy: 176.7 },
  monastir:    { path: "M409.3,213.7L402.6,214.5L401.5,212.7L397.8,213.2L396.4,213.4L392.6,211.5L381.7,213.8L379.0,211.0L379.1,206.6L382.3,205.4L385.3,204.0L384.1,201.7L389.1,196.8L393.3,196.6L395.3,197.2L398.8,193.9L399.4,193.4L397.7,192.1L397.5,188.4L398.0,186.5L402.1,186.4L401.9,187.1L402.2,185.8L401.7,184.0L402.6,183.0L404.0,181.5L414.0,183.8L419.1,182.0L424.7,183.1L421.7,189.8L424.6,190.9L427.3,192.0L433.3,194.4L434.3,194.7L441.0,196.7L442.9,196.9L449.9,197.9L450.4,199.8L447.4,206.0L448.7,207.5L444.4,206.5L443.7,206.7L441.0,207.6L436.1,207.2L432.0,210.9L424.3,214.3L421.4,218.9L415.6,218.8L409.3,213.7Z", cx: 412.7, cy: 199.9 },
  mahdia:      { path: "M431.7,243.3L430.4,244.7L424.1,246.6L420.5,242.2L419.0,237.4L418.2,234.6L415.1,234.7L408.3,239.8L397.9,235.8L391.7,236.4L389.2,239.5L389.0,245.1L384.0,246.1L371.1,252.7L360.6,247.8L356.9,248.2L354.5,248.4L345.6,246.9L344.1,241.8L339.2,236.2L342.7,229.0L339.6,226.8L337.7,225.6L340.5,217.9L340.9,216.8L349.4,212.2L343.7,205.5L355.8,202.6L362.0,210.1L368.4,209.8L373.6,211.9L375.4,218.2L379.0,219.8L387.9,223.6L388.0,217.3L394.8,213.7L401.5,212.7L402.6,214.5L409.3,213.7L415.6,218.8L421.4,218.9L424.3,214.3L432.0,210.9L436.1,207.2L441.0,207.6L444.4,206.5L448.7,207.5L452.3,211.6L450.5,215.7L449.3,218.0L445.7,225.2L452.7,233.1L454.9,234.0L464.8,238.1L465.9,239.6L455.2,242.0L451.8,246.0L451.2,246.8L447.3,254.3L433.6,249.2L435.4,245.5L431.7,243.3Z", cx: 405.0, cy: 228.9 },
  sfax:        { path: "M429.9,280.4L428.5,283.1L421.8,285.6L418.4,289.7L412.6,296.6L409.2,300.6L399.9,302.1L394.6,305.8L386.9,312.2L372.5,316.1L358.0,326.0L353.9,327.0L342.3,329.9L335.3,331.7L322.0,349.3L313.7,346.7L311.5,344.5L306.0,345.6L305.3,349.0L299.9,345.9L297.3,341.5L293.4,340.7L292.8,344.0L284.1,342.1L278.9,337.0L257.5,338.0L260.7,337.8L259.2,330.6L261.4,330.3L262.5,327.3L254.3,325.5L247.8,316.7L243.9,316.9L232.8,314.3L232.8,314.4L231.2,308.7L224.1,307.6L220.8,306.9L226.3,302.1L225.8,296.5L215.3,293.9L207.3,293.9L205.9,293.9L197.0,296.8L187.3,292.3L182.1,289.8L178.0,283.9L176.0,284.6L196.0,277.6L197.1,275.8L192.1,274.3L194.9,269.1L200.6,266.8L210.4,262.8L225.4,261.4L225.8,260.9L231.0,255.4L221.5,251.0L218.8,243.9L222.1,241.4L209.4,232.8L213.9,225.7L213.1,225.2L232.4,213.3L248.0,213.5L251.6,218.1L252.7,222.4L247.9,225.5L249.0,227.0L256.5,229.2L261.9,236.3L265.0,235.2L272.7,238.9L277.6,238.7L277.1,242.7L277.4,244.3L301.0,246.5L310.8,244.4L315.4,248.8L318.3,260.7L324.1,262.4L323.7,265.2L312.5,276.2L304.5,291.7L302.7,304.3L309.8,306.2L314.2,310.7L324.6,312.8L313.8,318.3L309.4,319.7L299.9,328.5L286.1,329.9L282.8,333.2L284.9,337.0L281.1,336.9L278.9,337.0L284.1,342.1L292.8,344.0L293.4,340.7L297.3,341.5L299.9,345.9L305.3,349.0L306.0,345.6L311.5,344.5L313.7,346.7L322.0,349.3L335.3,331.7L342.3,329.9L353.9,327.0L358.0,326.0L372.5,316.1L386.9,312.2L394.6,305.8L399.9,302.1L409.2,300.6L412.6,296.6L418.4,289.7L421.8,285.6L428.5,283.1L429.9,280.4Z", cx: 340.0, cy: 295.0 },
  kairouan:    { path: "M310.8,244.4L301.0,246.5L277.4,244.3L277.1,242.7L277.6,238.7L272.7,238.9L265.0,235.2L261.9,236.3L256.5,229.2L249.0,227.0L247.9,225.5L252.7,222.4L251.6,218.1L248.0,213.5L246.3,213.5L244.0,202.5L238.3,203.8L226.1,195.7L221.2,191.4L226.7,188.8L238.4,192.2L242.9,190.7L257.0,187.5L255.8,185.2L252.1,183.7L253.0,179.3L257.8,177.6L256.4,174.7L250.1,173.2L251.7,170.2L281.3,154.1L283.6,149.5L293.2,149.3L295.6,153.8L297.0,152.5L302.4,152.7L305.4,156.0L314.4,155.9L320.0,160.2L325.1,156.4L323.2,149.9L324.6,149.7L327.7,152.7L333.6,150.5L331.9,148.8L333.8,146.4L335.1,146.8L340.5,146.7L341.2,148.0L344.5,154.5L351.6,158.0L349.3,158.0L346.9,168.4L338.4,173.8L335.9,180.3L339.0,182.5L347.3,191.5L352.7,198.9L355.8,202.6L343.7,205.5L349.4,212.2L344.9,214.6L340.9,216.8L337.7,225.6L339.6,226.8L342.7,229.0L339.2,236.2L344.1,241.8L345.6,246.9L341.2,246.1L324.4,256.3L324.3,260.8L324.1,262.4L318.3,260.7L315.4,248.8L310.8,244.4Z", cx: 301.5, cy: 200.0 },
  kasserine:   { path: "M164.8,185.0L179.0,188.8L187.4,191.7L184.0,194.0L186.3,197.7L199.1,199.2L199.6,200.2L209.6,199.2L212.1,199.9L213.2,205.6L225.5,209.0L231.3,213.3L232.4,213.3L213.1,225.2L213.9,225.7L209.4,232.8L222.1,241.4L218.8,243.9L221.5,251.0L231.0,255.4L225.4,261.4L210.8,262.8L210.4,262.8L194.9,269.1L192.1,274.3L197.1,275.8L196.0,277.6L176.0,284.6L165.4,288.1L152.3,292.4L135.2,303.6L124.7,300.7L105.3,292.2L99.1,290.8L97.0,282.8L94.4,272.9L102.1,267.3L102.6,262.2L117.9,243.6L120.7,240.3L102.3,235.1L100.5,220.4L108.9,214.7L109.9,214.0L106.2,200.7L111.4,200.4L112.5,197.5L114.6,193.8L127.6,194.1L132.6,196.3L137.3,196.3L139.8,191.1L144.3,185.5L148.2,183.3L149.4,182.6L152.7,183.6L161.1,184.0L164.8,185.0Z", cx: 163.7, cy: 234.0 },
  sidi_bouzid: { path: "M277.1,242.7L277.4,244.3L301.0,246.5L310.8,244.4L315.4,248.8L318.3,260.7L324.1,262.4L323.7,265.2L312.5,276.2L304.5,291.7L302.7,304.3L309.8,306.2L314.2,310.7L324.6,312.8L313.8,318.3L309.4,319.7L299.9,328.5L286.1,329.9L282.8,333.2L284.9,337.0L281.1,336.9L260.7,337.8L259.2,330.6L261.4,330.3L262.5,327.3L254.3,325.5L247.8,316.7L243.9,316.9L232.8,314.3L231.2,308.7L224.1,307.6L220.8,306.9L226.3,302.1L225.8,296.5L215.3,293.9L207.3,293.9L205.9,293.9L197.0,296.8L182.1,289.8L178.0,283.9L196.0,277.6L197.1,275.8L192.1,274.3L194.9,269.1L200.6,266.8L210.4,262.8L225.4,261.4L231.0,255.4L221.5,251.0L218.8,243.9L222.1,241.4L209.4,232.8L213.9,225.7L213.1,225.2L232.4,213.3L248.0,213.5L251.6,218.1L252.7,222.4L247.9,225.5L249.0,227.0L256.5,229.2L261.9,236.3L265.0,235.2L272.7,238.9L277.6,238.7L277.1,242.7Z", cx: 255.0, cy: 280.0 },
  kef:         { path: "M185.7,131.3L187.4,130.7L192.4,136.3L194.1,140.3L191.6,142.8L197.6,145.9L207.8,151.6L208.6,156.6L208.8,160.5L203.2,163.6L200.0,166.0L195.2,173.6L191.3,177.7L194.1,183.2L190.2,184.7L194.1,192.9L189.0,190.6L187.4,191.7L179.0,188.8L164.8,185.0L161.1,184.0L152.7,183.6L149.4,182.6L148.2,183.3L144.3,185.5L141.5,188.9L139.8,191.1L137.3,196.3L132.6,196.3L127.6,194.1L114.6,193.8L112.5,197.5L111.4,200.4L106.2,200.7L105.2,197.0L95.7,190.0L94.4,176.7L96.3,165.4L96.5,164.5L102.0,151.9L100.8,143.8L106.8,132.3L109.8,124.5L117.3,124.5L129.2,121.1L138.7,118.5L148.9,117.0L157.9,119.5L173.1,116.9L180.6,113.9L183.6,118.3L184.4,125.9L185.7,131.3Z", cx: 155.6, cy: 162.7 },
  siliana:     { path: "M244.0,202.5L246.3,213.5L231.3,213.3L225.5,209.0L213.2,205.6L212.1,199.9L209.6,199.2L199.6,200.2L199.1,199.2L186.3,197.7L184.0,194.0L187.4,191.7L189.0,190.6L194.1,192.9L190.2,184.7L194.1,183.2L191.3,177.7L195.2,173.6L200.0,166.0L203.2,163.6L208.8,160.5L208.6,156.6L207.8,151.6L197.6,145.9L191.6,142.8L194.1,140.3L192.4,136.3L187.4,130.7L185.7,131.3L184.4,125.9L183.6,118.3L180.6,113.9L186.1,111.7L189.9,111.7L198.5,115.5L204.1,119.8L203.3,123.1L205.8,123.5L209.8,120.9L221.6,122.2L222.5,125.0L230.3,121.7L234.3,115.0L233.9,114.0L247.6,113.3L256.5,112.5L259.4,115.8L259.3,116.4L268.4,117.1L278.0,115.3L283.5,112.3L285.4,115.3L285.9,119.6L284.1,124.6L279.0,128.1L264.3,133.6L267.1,134.7L273.2,137.8L275.9,136.6L282.3,139.8L285.3,146.1L281.3,154.1L265.8,162.5L251.7,170.2L250.1,173.2L256.4,174.7L257.8,177.6L253.0,179.3L252.1,183.7L255.8,185.2L257.0,187.5L242.9,190.7L238.4,192.2L226.7,188.8L221.2,191.4L226.1,195.7L238.3,203.8L244.0,202.5Z", cx: 227.0, cy: 156.1 },
};

// ── govs not in paths dict (fallback to point) ────────────────
const NODES_META = Object.fromEntries(
  (govData.governorates as any[]).map((g) => [
    g.id, {
      id: g.id,
      name: g.name?.en || g.id,
      cx: GOV_PATHS[g.id]?.cx ?? 260,
      cy: GOV_PATHS[g.id]?.cy ?? 380,
      riskScore: g.rri_score ?? 1.5,
      cascadeRisk: g.cascade_risk ?? 0.3,
    }
  ])
);

const ADJ = govData.adjacency_graph as Record<string, string[]>;

// ── colour helpers ─────────────────────────────────────────────
const STATUS_COLOR: Record<string, { fill: string; stroke: string; glow: string }> = {
  origin:      { fill: 'rgba(255,45,85,0.55)',  stroke: '#ff2d55', glow: '#ff2d55' },
  high:        { fill: 'rgba(255,107,53,0.45)', stroke: '#ff6b35', glow: '#ff6b35' },
  medium:      { fill: 'rgba(255,214,10,0.35)', stroke: '#ffd60a', glow: '#ffd60a' },
  low:         { fill: 'rgba(48,209,88,0.20)',  stroke: '#30d158', glow: '#30d158' },
  unreachable: { fill: 'rgba(15,23,42,0.0)',    stroke: 'rgba(40,60,90,0.6)', glow: 'transparent' },
};

const rriColor = (v: number) => v >= 2.5 ? '#ff2d55' : v >= 2.0 ? '#ff9f0a' : v >= 1.5 ? '#ffd60a' : '#30d158';

// ── inject CSS once ────────────────────────────────────────────
let _cssInjected = false;
function injectCSS() {
  if (_cssInjected) return; _cssInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes spv-scan { 0%{transform:translateY(-40px)} 100%{transform:translateY(800px)} }
    @keyframes spv-pulse { 0%{r:0;opacity:.8} 100%{r:80;opacity:0} }
    @keyframes spv-dash  { to{stroke-dashoffset:-16} }
    @keyframes spv-blink { 0%,100%{opacity:1} 50%{opacity:.4} }
  `;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────
const ShockPropagationView: React.FC = () => {
  const { rriState } = usePipeline();
  const cascadeProb = rriState?.cascade_probability ?? 0.58;
  const rri         = rriState?.rri ?? 2.31;
  const pRev        = rriState?.p_revolution ?? 0.34;

  const [originId, setOriginId]   = useState('kasserine');
  const [maxDays, setMaxDays]     = useState(30);
  const [result, setResult]       = useState<PropagationResult | null>(null);
  const [match, setMatch]         = useState<{ wave: HistoricalWave; score: number } | null>(null);
  const [animDay, setAnimDay]     = useState(0);
  const [playing, setPlaying]     = useState(false);
  const [tab, setTab]             = useState<'map' | 'sir' | 'history'>('map');
  const [hovered, setHovered]     = useState<string | null>(null);

  // Pan/zoom state
  const [zoom, setZoom]           = useState(1);
  const [pan, setPan]             = useState({ x: 0, y: 0 });
  const [dragging, setDragging]   = useState(false);
  const dragStart                 = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const svgRef                    = useRef<SVGSVGElement>(null);

  useEffect(() => { injectCSS(); }, []);

  // Run simulation
  const runSim = useCallback(() => {
    const meta = NODES_META[originId];
    if (!meta) return;
    const sim = simulatePropagation(
      originId, meta.name, ADJ,
      govData.governorates as any[], cascadeProb, maxDays,
    );
    // Ensure ALL 24 govs appear (fill unreachable for any missing)
    (govData.governorates as any[]).forEach((g) => {
      if (!sim.nodes[g.id]) {
        sim.nodes[g.id] = {
          governorateId: g.id,
          governorateName: g.name?.en || g.id,
          probability: 0,
          expectedDays: maxDays + 1,
          path: [],
          riskScore: 0,
          status: 'unreachable',
        };
      }
    });
    setResult(sim);
    setAnimDay(0);

    let bestScore = 0, bestWave: HistoricalWave | null = null;
    for (const wave of HISTORICAL_WAVES) {
      const s = compareToHistorical(sim, wave);
      if (s > bestScore) { bestScore = s; bestWave = wave; }
    }
    if (bestWave) setMatch({ wave: bestWave, score: bestScore });
  }, [originId, maxDays, cascadeProb]);

  useEffect(() => { runSim(); }, [runSim]);

  // Animation
  useEffect(() => {
    if (!playing || !result) return;
    if (animDay >= maxDays) { setPlaying(false); return; }
    const t = setTimeout(() => setAnimDay(d => d + 1), 100);
    return () => clearTimeout(t);
  }, [playing, animDay, maxDays, result]);

  const visibleIds = result
    ? new Set(
        Object.values(result.nodes)
          .filter(n => !playing || n.expectedDays <= animDay || n.status === 'origin')
          .map(n => n.governorateId)
      )
    : new Set<string>(Object.keys(NODES_META));

  // Zoom on wheel
  const onWheel = useCallback((e: WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(z => Math.min(6, Math.max(0.5, z + delta * z)));
  }, []);

  // Pan
  const onMouseDown = (e: MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };
  const onMouseUp = () => setDragging(false);

  const sir = result?.sirData ?? [];
  const SW = 480, SH = 130;
  const sx = (d: number) => (d / maxDays) * SW;
  const sy = (v: number) => SH - v * SH;
  const sirPath = (k: 'S'|'I'|'R') =>
    sir.map((p,i)=>`${i===0?'M':'L'}${sx(p.day).toFixed(1)},${sy((p as any)[k]).toFixed(1)}`).join(' ');

  const highCount  = result ? Object.values(result.nodes).filter(n => n.status === 'high').length   : 0;
  const reachCount = result ? Object.values(result.nodes).filter(n => n.status !== 'unreachable').length : 0;
  const originMeta = NODES_META[originId];

  return (
    <div style={{
      width:'100%', height:'100vh', background:'#05070f',
      display:'flex', flexDirection:'column', overflow:'hidden',
      fontFamily:'"IBM Plex Mono","Courier New",monospace', color:'#c9d1e0',
    }}>

      {/* TOP BAR */}
      <div style={{
        height:52, flexShrink:0, background:'rgba(0,0,0,0.75)',
        borderBottom:'1px solid rgba(255,45,85,0.2)',
        display:'flex', alignItems:'center', padding:'0 20px', gap:28,
        backdropFilter:'blur(12px)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{
            width:8,height:8,borderRadius:'50%',background:rriColor(rri),
            boxShadow:`0 0 10px ${rriColor(rri)}`,
            animation:'spv-blink 2s infinite',
          }}/>
          <span style={{fontSize:11,letterSpacing:3,color:'#8899aa',fontWeight:600}}>SHOCK PROPAGATION</span>
          <span style={{fontSize:10,color:'rgba(255,45,85,0.5)',letterSpacing:2}}>EQ.17</span>
        </div>
        {[
          {l:'RRI',      v:rri.toFixed(2),              c:rriColor(rri)},
          {l:'CASCADE',  v:`${(cascadeProb*100).toFixed(0)}%`, c:'#a78bfa'},
          {l:'P(REV)',   v:`${(pRev*100).toFixed(0)}%`, c:'#ff9f0a'},
          {l:'REACHED',  v:`${reachCount}/24`,           c:'#30d158'},
          {l:'HIGH',     v:String(highCount),            c:'#ff2d55'},
        ].map(m=>(
          <div key={m.l} style={{display:'flex',alignItems:'baseline',gap:5}}>
            <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:1}}>{m.l}</span>
            <span style={{fontSize:13,color:m.c,fontWeight:700,textShadow:`0 0 10px ${m.c}44`}}>{m.v}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:3}}>
          {(['map','sir','history'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              background:tab===t?'rgba(255,45,85,0.12)':'transparent',
              border:`1px solid ${tab===t?'rgba(255,45,85,0.45)':'rgba(255,255,255,0.07)'}`,
              color:tab===t?'#ff6b8a':'#3a4a5a',
              padding:'4px 13px',borderRadius:3,cursor:'pointer',
              fontSize:10,letterSpacing:2,textTransform:'uppercase',transition:'all .15s',
            }}>{t==='sir'?'SIR MODEL':t}</button>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div style={{
        height:42,flexShrink:0,background:'rgba(0,2,10,0.85)',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:16,
      }}>
        <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:2}}>ORIGIN</span>
        <select value={originId} onChange={e=>setOriginId(e.target.value)} style={{
          background:'rgba(8,16,30,0.9)',border:'1px solid rgba(255,45,85,0.3)',
          color:'#ff6b8a',padding:'3px 8px',borderRadius:3,fontSize:11,cursor:'pointer',outline:'none',
        }}>
          {Object.values(NODES_META).sort((a,b)=>a.name.localeCompare(b.name)).map(g=>(
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:2}}>HORIZON</span>
        <select value={maxDays} onChange={e=>setMaxDays(Number(e.target.value))} style={{
          background:'rgba(8,16,30,0.9)',border:'1px solid rgba(255,45,85,0.3)',
          color:'#ff6b8a',padding:'3px 8px',borderRadius:3,fontSize:11,cursor:'pointer',outline:'none',
        }}>
          {[14,30,60,90].map(d=><option key={d} value={d}>{d}D</option>)}
        </select>
        <button onClick={()=>{if(playing)setPlaying(false);else{setAnimDay(0);setPlaying(true);}}} style={{
          background:playing?'rgba(255,45,85,0.15)':'rgba(255,45,85,0.07)',
          border:`1px solid ${playing?'rgba(255,45,85,0.55)':'rgba(255,45,85,0.25)'}`,
          color:'#ff6b8a',padding:'4px 14px',borderRadius:3,cursor:'pointer',fontSize:11,letterSpacing:1,
        }}>{playing?'■ STOP':'▶ SIMULATE'}</button>
        {playing&&(
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:100,height:2,background:'rgba(255,255,255,0.07)',borderRadius:2,overflow:'hidden'}}>
              <div style={{width:`${(animDay/maxDays)*100}%`,height:'100%',
                background:'linear-gradient(90deg,#ff2d55,#ff6b35)',transition:'width .1s'}}/>
            </div>
            <span style={{fontSize:10,color:'#ff6b8a'}}>D{animDay}/{maxDays}</span>
          </div>
        )}
        <div style={{marginLeft:'auto',fontSize:9,color:'#2a3a4a',letterSpacing:1}}>
          SCROLL TO ZOOM · DRAG TO PAN
        </div>
        <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}} style={{
          background:'transparent',border:'1px solid rgba(255,255,255,0.06)',
          color:'#3a4a5a',padding:'3px 10px',borderRadius:3,cursor:'pointer',fontSize:9,letterSpacing:1,
        }}>RESET</button>
      </div>

      {/* BODY */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>

        {/* ══ MAP ══════════════════════════════════════════ */}
        {tab==='map'&&(
          <>
            <div style={{
              flex:1,position:'relative',overflow:'hidden',
              background:'radial-gradient(ellipse at 45% 35%,rgba(8,18,45,0.95) 0%,#05070f 70%)',
              cursor:dragging?'grabbing':'grab',
            }}>
              <svg
                ref={svgRef}
                width="100%" height="100%"
                viewBox="0 0 520 760"
                style={{display:'block',userSelect:'none'}}
                onWheel={onWheel}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <defs>
                  <filter id="spv-glow-red"    x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-orange" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                  <filter id="spv-glow-edge"   x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                {/* Pan+zoom group */}
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom}) translate(${(1-zoom)*0 / zoom},${(1-zoom)*0 / zoom})`}
                  style={{transformOrigin:'260px 380px'}}>

                  {/* Scanline */}
                  <rect x={-60} y={-40} width={640} height={4} fill="rgba(255,45,85,0.04)"
                    style={{animation:'spv-scan 8s linear infinite'}}/>

                  {/* Governorate shapes — sfax last so clickable on top */}
                  {Object.entries(GOV_PATHS)
                    .sort(([a], [b]) => a === 'sfax' ? 1 : b === 'sfax' ? -1 : 0)
                    .map(([gid, geo]) => {
                    const node   = result?.nodes[gid];
                    const vis    = visibleIds.has(gid);
                    const status = node?.status ?? 'unreachable';
                    const col    = STATUS_COLOR[status] ?? STATUS_COLOR.unreachable;
                    const isOrigin = gid === originId;
                    const isHov    = hovered === gid;
                    const filterId = status==='origin'||status==='high' ? 'spv-glow-red'
                                   : status==='medium' ? 'spv-glow-orange'
                                   : status==='low' ? 'spv-glow-yellow' : undefined;

                    return (
                      <g key={gid}
                        onMouseEnter={()=>setHovered(gid)}
                        onMouseLeave={()=>setHovered(null)}
                        onClick={e=>{e.stopPropagation();setOriginId(gid);}}
                        style={{cursor:'pointer'}}
                      >
                        <path
                          d={geo.path}
                          fill={vis ? col.fill : 'rgba(8,16,35,0.4)'}
                          stroke={vis ? col.stroke : 'rgba(25,45,75,0.5)'}
                          strokeWidth={isOrigin?2.5:isHov?1.8:1}
                          filter={vis&&filterId?`url(#${filterId})`:undefined}
                          opacity={vis?1:0.6}
                          style={{transition:'fill .4s,stroke .4s,opacity .4s'}}
                        />
                        {/* Hovered border glow */}
                        {isHov&&(
                          <path d={geo.path} fill="none"
                            stroke={col.stroke} strokeWidth={3} opacity={0.4}
                            filter={`url(#${filterId??'spv-glow-yellow'})`}/>
                        )}
                        {/* Centroid label */}
                        <text x={geo.cx} y={geo.cy}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={vis?9:8} fontWeight={vis?700:400}
                          fill={vis&&status!=='unreachable'?'rgba(255,255,255,0.9)':'rgba(60,90,120,0.7)'}
                          fontFamily="IBM Plex Mono,monospace"
                          style={{pointerEvents:'none',userSelect:'none'}}
                        >
                          {NODES_META[gid]?.name.toUpperCase().slice(0,8)}
                        </text>
                        {/* Probability badge */}
                        {vis&&node&&node.status!=='unreachable'&&(
                          <text x={geo.cx} y={geo.cy+11}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={8} fill={col.glow} fontWeight={700}
                            fontFamily="IBM Plex Mono,monospace"
                            style={{pointerEvents:'none'}}
                          >
                            {Math.round(node.probability*100)}%
                          </text>
                        )}
                        {/* Day badge top-right of centroid */}
                        {vis&&node&&node.status!=='unreachable'&&node.status!=='origin'&&(
                          <text x={geo.cx+18} y={geo.cy-6}
                            fontSize={7} fill="#ff9f0a"
                            fontFamily="IBM Plex Mono,monospace"
                            style={{pointerEvents:'none'}}
                          >D{node.expectedDays}</text>
                        )}
                      </g>
                    );
                  })}

                  {/* Adjacency edges (on top, active ones) */}
                  {Object.entries(ADJ).map(([fromId, neighbors]) =>
                    neighbors.map(toId => {
                      if (toId < fromId) return null;
                      const fromMeta = NODES_META[fromId];
                      const toMeta   = NODES_META[toId];
                      if (!fromMeta||!toMeta) return null;
                      const bothVis = visibleIds.has(fromId)&&visibleIds.has(toId);
                      const fromNode = result?.nodes[fromId];
                      const toNode   = result?.nodes[toId];
                      const active = bothVis
                        && fromNode?.status!=='unreachable'
                        && toNode?.status!=='unreachable';
                      if (!active) return null;
                      return (
                        <line key={`${fromId}-${toId}`}
                          x1={fromMeta.cx} y1={fromMeta.cy}
                          x2={toMeta.cx}   y2={toMeta.cy}
                          stroke="rgba(255,107,53,0.5)" strokeWidth={1.5}
                          strokeDasharray="5 3"
                          filter="url(#spv-glow-edge)"
                          style={{animation:'spv-dash 0.8s linear infinite',pointerEvents:'none'}}
                        />
                      );
                    })
                  )}

                  {/* Origin pulse rings */}
                  {originMeta&&[0,1,2].map(i=>(
                    <circle key={i}
                      cx={originMeta.cx} cy={originMeta.cy}
                      r={0} fill="none"
                      stroke="rgba(255,45,85,0.5)" strokeWidth={2}
                      style={{
                        animation:`spv-pulse 2.4s ease-out ${i*0.7}s infinite`,
                        transformOrigin:`${originMeta.cx}px ${originMeta.cy}px`,
                      }}
                    />
                  ))}

                </g>
              </svg>

              {/* Hover tooltip */}
              {hovered&&result?.nodes[hovered]&&(()=>{
                const n   = result.nodes[hovered];
                const m   = NODES_META[hovered];
                const col = STATUS_COLOR[n.status]??STATUS_COLOR.unreachable;
                return (
                  <div style={{
                    position:'absolute',top:16,right:16,
                    background:'rgba(2,6,18,0.97)',
                    border:`1px solid ${col.stroke}`,borderRadius:6,
                    padding:'14px 18px',minWidth:210,pointerEvents:'none',
                    boxShadow:`0 0 30px ${col.glow}22`,backdropFilter:'blur(12px)',
                  }}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:col.glow,marginBottom:10}}>
                      {m?.name.toUpperCase()}
                    </div>
                    {[
                      {l:'STATUS',  v:n.status.toUpperCase(),              c:col.glow},
                      {l:'PROB',    v:`${(n.probability*100).toFixed(1)}%`,c:'#e2e8f0'},
                      {l:'DAY',     v:n.status==='origin'?'D0':`D${n.expectedDays}`,c:'#ff9f0a'},
                      {l:'CASCADE', v:`${((m?.cascadeRisk??0)*100)|0}%`,   c:'#a78bfa'},
                      {l:'PATH LEN',v:String(n.path.length),               c:'#64748b'},
                    ].map(r=>(
                      <div key={r.l} style={{display:'flex',justifyContent:'space-between',marginBottom:5,gap:12}}>
                        <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:1}}>{r.l}</span>
                        <span style={{fontSize:10,color:r.c,fontWeight:600}}>{r.v}</span>
                      </div>
                    ))}
                    {n.path.length>0&&(
                      <div style={{marginTop:8,fontSize:8,color:'#2a3a4a',lineHeight:1.6}}>
                        {n.path.map(id=>NODES_META[id]?.name).join(' → ')}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{position:'absolute',bottom:12,left:16,fontSize:8,color:'#1e2e40',letterSpacing:2}}>
                CLICK GOVERNORATE TO SET ORIGIN
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{
              width:230,flexShrink:0,borderLeft:'1px solid rgba(255,255,255,0.04)',
              background:'rgba(0,2,10,0.92)',display:'flex',flexDirection:'column',overflowY:'auto',
            }}>
              <div style={{padding:'16px 14px 0'}}>
                <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:10}}>STATUS</div>
                {[
                  {s:'origin',      l:'Ignition Point'},
                  {s:'high',        l:'High  ≥60%'},
                  {s:'medium',      l:'Medium ≥30%'},
                  {s:'low',         l:'Low    <30%'},
                  {s:'unreachable', l:'Not reached'},
                ].map(({s,l})=>(
                  <div key={s} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{width:10,height:10,borderRadius:2,flexShrink:0,
                      background:STATUS_COLOR[s].fill,
                      border:`1px solid ${STATUS_COLOR[s].stroke}`,
                      boxShadow:s!=='unreachable'?`0 0 6px ${STATUS_COLOR[s].glow}`:'none',
                    }}/>
                    <span style={{fontSize:10,color:'#4a5a6a'}}>{l}</span>
                  </div>
                ))}
              </div>

              <div style={{height:1,background:'rgba(255,255,255,0.04)',margin:'12px 0'}}/>

              {result&&(
                <div style={{padding:'0 14px'}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:10}}>SIMULATION</div>
                  {[
                    {l:'ORIGIN',   v:result.originName},
                    {l:'CASCADE P',v:`${(result.cascadeProbability*100).toFixed(0)}%`},
                    {l:'HORIZON',  v:`${result.maxReach}D`},
                    {l:'REACHED',  v:`${reachCount} GOV`},
                    {l:'HIGH RISK',v:`${highCount} GOV`},
                    {l:'PEAK I',   v:`${(Math.max(...sir.map(p=>p.I))*100).toFixed(1)}%`},
                    {l:'R₀',       v:(0.4*(0.5+cascadeProb)/0.15).toFixed(2)},
                  ].map(r=>(
                    <div key={r.l} style={{display:'flex',justifyContent:'space-between',
                      marginBottom:6,borderBottom:'1px solid rgba(255,255,255,0.03)',paddingBottom:6}}>
                      <span style={{fontSize:9,color:'#3a4a5a',letterSpacing:1}}>{r.l}</span>
                      <span style={{fontSize:11,color:'#8899bb',fontWeight:600}}>{r.v}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{height:1,background:'rgba(255,255,255,0.04)',margin:'4px 0 12px'}}/>

              {match&&(
                <div style={{padding:'0 14px'}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:8}}>HIST. MATCH</div>
                  <div style={{
                    background:'rgba(255,45,85,0.06)',border:'1px solid rgba(255,45,85,0.2)',
                    borderRadius:4,padding:'10px 12px',
                  }}>
                    <div style={{fontSize:11,color:'#ff6b8a',marginBottom:4,fontWeight:600}}>{match.wave.name}</div>
                    <div style={{fontSize:10,color:'#ff9f0a',marginBottom:6}}>{(match.score*100).toFixed(0)}% SIMILARITY</div>
                    <div style={{fontSize:9,color:'#4a5568',lineHeight:1.5}}>{match.wave.outcome}</div>
                  </div>
                </div>
              )}

              {result&&(
                <div style={{padding:'12px 14px 16px'}}>
                  <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:2,marginBottom:8}}>SPREAD SEQUENCE</div>
                  {Object.values(result.nodes)
                    .filter(n=>n.status!=='unreachable')
                    .sort((a,b)=>a.expectedDays-b.expectedDays)
                    .slice(0,12)
                    .map((n,i)=>{
                      const col = STATUS_COLOR[n.status]??STATUS_COLOR.unreachable;
                      const vis = !playing||n.expectedDays<=animDay;
                      return (
                        <div key={n.governorateId} style={{
                          display:'flex',alignItems:'center',gap:7,marginBottom:5,
                          opacity:vis?1:0.25,transition:'opacity .3s',
                        }}>
                          <span style={{fontSize:8,color:'#2a3a4a',width:14}}>{String(i+1).padStart(2,'0')}</span>
                          <div style={{width:6,height:6,borderRadius:'50%',flexShrink:0,
                            background:col.glow,boxShadow:`0 0 4px ${col.glow}`}}/>
                          <span style={{fontSize:9,color:'#4a5a6a',flex:1,overflow:'hidden',
                            textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {NODES_META[n.governorateId]?.name.toUpperCase()}
                          </span>
                          <span style={{fontSize:8,color:'#ff9f0a'}}>D{n.expectedDays}</span>
                          <span style={{fontSize:8,color:col.glow}}>{Math.round(n.probability*100)}%</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ SIR ══════════════════════════════════════════ */}
        {tab==='sir'&&(
          <div style={{flex:1,padding:'32px 40px',overflowY:'auto'}}>
            <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:3,marginBottom:6}}>EPIDEMIC PROTEST MODEL</div>
            <div style={{fontSize:20,color:'#c9d1e0',fontWeight:700,marginBottom:4}}>SIR — EQ.4</div>
            <div style={{fontSize:11,color:'#4a5a6a',marginBottom:28}}>
              β={( 0.4*(0.5+cascadeProb)).toFixed(3)} · γ=0.150 · R₀={(0.4*(0.5+cascadeProb)/0.15).toFixed(2)}
            </div>
            {sir.length>0&&(
              <>
                <div style={{background:'rgba(0,4,12,0.8)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:8,padding:'24px 28px',marginBottom:24}}>
                  <svg width={SW} height={SH} style={{overflow:'visible'}}>
                    {[0.25,0.5,0.75].map(v=>(
                      <React.Fragment key={v}>
                        <line x1={0} y1={sy(v)} x2={SW} y2={sy(v)} stroke="rgba(255,255,255,0.04)" strokeWidth={1}/>
                        <text x={-6} y={sy(v)+4} textAnchor="end" fontSize={8} fill="#2a3a4a" fontFamily="IBM Plex Mono,monospace">{(v*100).toFixed(0)}%</text>
                      </React.Fragment>
                    ))}
                    {[0,maxDays/4,maxDays/2,3*maxDays/4,maxDays].map(d=>(
                      <text key={d} x={sx(d)} y={SH+14} textAnchor="middle" fontSize={8} fill="#2a3a4a" fontFamily="IBM Plex Mono,monospace">D{Math.round(d)}</text>
                    ))}
                    <path d={sirPath('I')} fill="none" stroke="#ff2d55" strokeWidth={2.5}/>
                    <path d={`${sirPath('I')} L${SW},${SH} L0,${SH} Z`} fill="rgba(255,45,85,0.07)"/>
                    <path d={sirPath('S')} fill="none" stroke="#30d158" strokeWidth={2}/>
                    <path d={sirPath('R')} fill="none" stroke="#4a5a6a" strokeWidth={2}/>
                  </svg>
                  <div style={{display:'flex',gap:20,marginTop:16}}>
                    {[{c:'#30d158',l:'Susceptible'},{c:'#ff2d55',l:'Infected'},{c:'#4a5a6a',l:'Recovered'}].map(lg=>(
                      <div key={lg.l} style={{display:'flex',alignItems:'center',gap:7}}>
                        <div style={{width:20,height:2,background:lg.c,boxShadow:`0 0 5px ${lg.c}`}}/>
                        <span style={{fontSize:10,color:'#4a5a6a'}}>{lg.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                  {[
                    {l:'PEAK INFECTED',  v:`${(Math.max(...sir.map(p=>p.I))*100).toFixed(1)}%`,c:'#ff2d55'},
                    {l:'PEAK DAY',       v:`D${sir.indexOf(sir.reduce((b,p)=>p.I>b.I?p:b,sir[0]))}`,c:'#ff9f0a'},
                    {l:'R₀',            v:(0.4*(0.5+cascadeProb)/0.15).toFixed(2),c:'#a78bfa'},
                    {l:'FINAL RECOVERED',v:`${((sir[sir.length-1]?.R??0)*100).toFixed(1)}%`,c:'#30d158'},
                  ].map(m=>(
                    <div key={m.l} style={{background:'rgba(0,4,12,0.8)',border:`1px solid ${m.c}22`,borderRadius:6,padding:'12px 16px',minWidth:130}}>
                      <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:2,marginBottom:6}}>{m.l}</div>
                      <div style={{fontSize:16,color:m.c,fontWeight:700}}>{m.v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ HISTORY ══════════════════════════════════════ */}
        {tab==='history'&&(
          <div style={{flex:1,padding:'32px 40px',overflowY:'auto'}}>
            <div style={{fontSize:9,color:'#3a4a5a',letterSpacing:3,marginBottom:6}}>PATTERN RECOGNITION</div>
            <div style={{fontSize:20,color:'#c9d1e0',fontWeight:700,marginBottom:28}}>Historical Wave Comparison</div>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {HISTORICAL_WAVES.map(wave=>{
                const score = result?compareToHistorical(result,wave):0;
                const isMatch = score>0.35;
                return (
                  <div key={wave.name} style={{
                    background:'rgba(0,4,12,0.8)',
                    border:`1px solid ${isMatch?'rgba(255,45,85,0.3)':'rgba(255,255,255,0.05)'}`,
                    borderRadius:8,padding:'18px 22px',
                    boxShadow:isMatch?'0 0 25px rgba(255,45,85,0.07)':'none',
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:13,color:'#c9d1e0',fontWeight:700,marginBottom:3}}>{wave.name}</div>
                        <div style={{fontSize:10,color:'#ff9f0a'}}>{wave.outcome}</div>
                      </div>
                      <div style={{
                        background:isMatch?'rgba(255,45,85,0.12)':'rgba(255,255,255,0.04)',
                        border:`1px solid ${isMatch?'rgba(255,45,85,0.4)':'rgba(255,255,255,0.06)'}`,
                        borderRadius:4,padding:'5px 10px',textAlign:'center',minWidth:60,
                      }}>
                        <div style={{fontSize:16,fontWeight:700,color:isMatch?'#ff2d55':'#3a4a5a'}}>{(score*100).toFixed(0)}%</div>
                        <div style={{fontSize:8,color:'#3a4a5a',letterSpacing:1}}>MATCH</div>
                      </div>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {wave.steps.map((step,i)=>(
                        <div key={i} style={{
                          background:step.intensity>0.7?'rgba(255,45,85,0.1)':'rgba(255,255,255,0.04)',
                          border:`1px solid ${step.intensity>0.7?'rgba(255,45,85,0.3)':'rgba(255,255,255,0.06)'}`,
                          borderRadius:3,padding:'3px 8px',fontSize:9,display:'flex',gap:5,
                        }}>
                          <span style={{color:'#ff9f0a'}}>D{step.day}</span>
                          <span style={{color:'#7a8a9a'}}>{NODES_META[step.governorateId]?.name??step.governorateId}</span>
                          <span style={{color:step.intensity>0.7?'#ff2d55':'#3a4a5a'}}>{(step.intensity*100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShockPropagationView;
