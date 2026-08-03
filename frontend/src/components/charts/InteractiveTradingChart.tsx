import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { formatPrice } from '../../utils/formatters';
import styles from './InteractiveTradingChart.module.css';

export interface ChartCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp: string;
}

export interface ChartPositionOverlay {
  side: 'buy' | 'sell';
  price_open: number;
  tp?: number;
  sl?: number;
  price_current?: number;
}

export interface InteractiveTradingChartProps {
  symbol: string;
  symbolLabel?: string;
  candles: ChartCandle[];
  quote?: { last: number; bid: number; ask: number } | null;
  timeframe: string;
  onTimeframeChange: (minutes: number, label: string) => void;
  positions?: ChartPositionOverlay[];
  loading?: boolean;
  error?: string | null;
  onLoadMoreHistory?: () => void;
  height?: number;
}

interface InternalCandle {
  o: number;
  h: number;
  l: number;
  c: number;
}

interface TfOption {
  kind?: 'custom' | 'disabled' | 'select';
  label?: string;
  minutes?: number;
  seconds?: number;
  group?: string;
  text?: string;
}

const TF_OPTIONS: TfOption[] = [
  { kind: 'custom' },
  { group: 'Seconds' },
  { kind: 'disabled', seconds: 1, text: '1 second' },
  { kind: 'disabled', seconds: 5, text: '5 seconds' },
  { kind: 'disabled', seconds: 10, text: '10 seconds' },
  { kind: 'disabled', seconds: 15, text: '15 seconds' },
  { kind: 'disabled', seconds: 30, text: '30 seconds' },
  { group: 'Minutes' },
  { kind: 'select', minutes: 1, label: '1m', text: '1 minute' },
  { kind: 'select', minutes: 3, label: '3m', text: '3 minutes' },
  { kind: 'select', minutes: 5, label: '5m', text: '5 minutes' },
  { kind: 'select', minutes: 15, label: '15m', text: '15 minutes' },
  { kind: 'select', minutes: 30, label: '30m', text: '30 minutes' },
  { group: 'Hours' },
  { kind: 'select', minutes: 60, label: '1H', text: '1 hour' },
  { kind: 'select', minutes: 120, label: '2H', text: '2 hours' },
  { kind: 'select', minutes: 240, label: '4H', text: '4 hours' },
  { kind: 'select', minutes: 360, label: '6H', text: '6 hours' },
  { kind: 'select', minutes: 720, label: '12H', text: '12 hours' },
  { group: 'Days' },
  { kind: 'select', minutes: 1440, label: '1D', text: '1 day' },
  { group: 'Weeks' },
  { kind: 'select', minutes: 10080, label: '1W', text: '1 week' },
  { group: 'Months' },
  { kind: 'select', minutes: 43200, label: '1M', text: '1 month' },
];

const RANGE_ITEMS = ['5y', '1y', '6m', '3m', '1m', '5d', '1d', '⇄'] as const;

/** Approximate lookback windows for bottom range bar (client-side viewport). */
const RANGE_MS: Record<string, number | null> = {
  '5y': 5 * 365.25 * 24 * 3600 * 1000,
  '1y': 365.25 * 24 * 3600 * 1000,
  '6m': 182.625 * 24 * 3600 * 1000,
  '3m': 91.3125 * 24 * 3600 * 1000,
  '1m': 30 * 24 * 3600 * 1000,
  '5d': 5 * 24 * 3600 * 1000,
  '1d': 24 * 3600 * 1000,
  '⇄': null,
};

const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const PAD_RIGHT = 62;
const MIN_VIEW_CANDLES = 8;
const ZOOM_INTENSITY = 0.0015;
const SVG_NS = 'http://www.w3.org/2000/svg';

function niceStep(raw: number): number {
  if (!raw || raw <= 0 || !isFinite(raw)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const frac = raw / base;
  let niceFrac: number;
  if (frac < 1.5) niceFrac = 1;
  else if (frac < 3) niceFrac = 2;
  else if (frac < 7) niceFrac = 5;
  else niceFrac = 10;
  return niceFrac * base;
}

function fmtTime(d: Date): string {
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

function fmtDateTime(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getUTCDay()]} ${d.getUTCDate().toString().padStart(2, '0')} ${months[d.getUTCMonth()]} '${d.getUTCFullYear().toString().slice(2)} ${fmtTime(d)}`;
}

function toInternal(candles: ChartCandle[]): { data: InternalCandle[]; times: Date[] } {
  const data = candles.map((c) => ({
    o: c.open,
    h: c.high,
    l: c.low,
    c: c.close,
  }));
  const times = candles.map((c) => new Date(c.timestamp));
  return { data, times };
}

function applyQuoteToCandles(candles: ChartCandle[], quote: InteractiveTradingChartProps['quote']): ChartCandle[] {
  if (!candles.length || !quote || !Number.isFinite(quote.last)) return candles;
  const next = candles.slice();
  const last = { ...next[next.length - 1] };
  last.close = quote.last;
  last.high = Math.max(last.high, quote.last);
  last.low = Math.min(last.low, quote.last);
  next[next.length - 1] = last;
  return next;
}

function symbolInitial(symbol: string): string {
  const s = symbol.replace(/[^a-zA-Z0-9]/g, '');
  return (s[0] ?? '?').toUpperCase();
}

function getThemeColors(): { up: string; down: string; grid: string; textDim: string; text: string } {
  if (typeof window === 'undefined') {
    return { up: '#3b82f6', down: '#ef4444', grid: '#1f2a40', textDim: '#9aa6bd', text: '#e8eefb' };
  }
  const root = getComputedStyle(document.documentElement);
  return {
    up: root.getPropertyValue('--accent').trim() || '#3b82f6',
    down: root.getPropertyValue('--loss').trim() || '#ef4444',
    grid: root.getPropertyValue('--border').trim() || '#1f2a40',
    textDim: root.getPropertyValue('--text-dim').trim() || '#9aa6bd',
    text: root.getPropertyValue('--text').trim() || '#e8eefb',
  };
}

const InteractiveTradingChart: React.FC<InteractiveTradingChartProps> = ({
  symbol,
  symbolLabel,
  candles: candlesProp,
  quote,
  timeframe,
  onTimeframeChange,
  positions = [],
  loading = false,
  error = null,
  onLoadMoreHistory,
  height: heightProp = 400,
}) => {
  const [chartHeight, setChartHeight] = useState(heightProp);
  const [tfOpen, setTfOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('minutes');
  const [modalInterval, setModalInterval] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [tfFocusIndex, setTfFocusIndex] = useState(0);
  const [activeRange, setActiveRange] = useState('⇄');
  const [utcClock, setUtcClock] = useState('');
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, change: 0, pct: 0, up: true });

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hoverPriceRef = useRef<HTMLDivElement>(null);
  const hoverDateRef = useRef<HTMLDivElement>(null);
  const lastPriceRef = useRef<HTMLDivElement>(null);
  const cornerHandleRef = useRef<HTMLDivElement>(null);
  const tfPanelRef = useRef<HTMLButtonElement>(null);
  const tfDropdownRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const onLoadMoreHistoryRef = useRef(onLoadMoreHistory);
  onLoadMoreHistoryRef.current = onLoadMoreHistory;

  const renderChartRef = useRef<(() => void) | null>(null);

  const engineRef = useRef({
    W: 800,
    H: chartHeight,
    candles: [] as InternalCandle[],
    times: [] as Date[],
    n: 0,
    viewOffset: 0,
    viewCount: 0,
    maxV: 0,
    minV: 0,
    vRange: 1,
    plotW: 0,
    plotH: 0,
    slot: 1,
    candleW: 4,
    manualPriceScale: false,
    vLine: null as SVGLineElement | null,
    hLine: null as SVGLineElement | null,
    rafScheduled: false,
    isLeftDragging: false,
    leftDragLastX: 0,
    leftDragLastY: 0,
    isRightDragging: false,
    rightDragLastX: 0,
    rightDragMoved: false,
    isDraggingHeight: false,
    dragStartY: 0,
    dragStartHeight: 0,
    loadHistoryRequested: false,
  });

  const liveCandles = useMemo(() => applyQuoteToCandles(candlesProp, quote), [candlesProp, quote]);

  const selectableOptions = useMemo(
    () => TF_OPTIONS.filter((o): o is TfOption & { kind: 'select'; minutes: number; label: string; text: string } => o.kind === 'select'),
    []
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1600);
  }, []);

  const fmtPriceLocal = useCallback(
    (v: number) => {
      try {
        return formatPrice(v, symbol);
      } catch {
        return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    },
    [symbol]
  );
  const fmtPriceLocalRef = useRef(fmtPriceLocal);
  fmtPriceLocalRef.current = fmtPriceLocal;
  const seriesKeyRef = useRef(`${symbol}|${timeframe}`);
  const pendingRangeRef = useRef<string | null>(null);

  const applyTimeframe = useCallback(
    (minutes: number, label: string) => {
      onTimeframeChange(minutes, label);
      showToast(`Timeframe: ${label}`);
      setTfOpen(false);
    },
    [onTimeframeChange, showToast]
  );

  // UTC clock
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tick = () => {
      const now = new Date();
      setUtcClock(
        `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setChartHeight(heightProp);
  }, [heightProp]);

  // Close TF dropdown on outside click
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onDocClick = () => setTfOpen(false);
    if (tfOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [tfOpen]);

  // Chart engine
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!wrap || !svg) return;

    const eng = engineRef.current;
    const colors = getThemeColors();

    const visibleCandles = () => eng.candles.slice(eng.viewOffset, eng.viewOffset + eng.viewCount);

    const computeScale = () => {
      const vis = visibleCandles();
      if (!vis.length) {
        eng.maxV = 1;
        eng.minV = 0;
        eng.vRange = 1;
        return;
      }
      const allVals = vis.flatMap((c) => [c.h, c.l]);
      eng.maxV = Math.max(...allVals);
      eng.minV = Math.min(...allVals);
      eng.vRange = eng.maxV - eng.minV;
      if (!eng.vRange || !isFinite(eng.vRange)) {
        eng.vRange = Math.max(1, Math.abs(eng.maxV) * 0.01) || 1;
      }
    };

    const yFor = (v: number) => PAD_TOP + ((eng.maxV - v) / eng.vRange) * eng.plotH;
    const priceAt = (my: number) => eng.maxV - ((my - PAD_TOP) / eng.plotH) * eng.vRange;
    const xFor = (i: number) => i * eng.slot + eng.slot / 2;
    const pixelXForIdx = (idx: number) => (idx - eng.viewOffset) * eng.slot;

    const addEl = (tag: string, attrs: Record<string, string>) => {
      const e = document.createElementNS(SVG_NS, tag);
      for (const k of Object.keys(attrs)) e.setAttribute(k, attrs[k]);
      svg.appendChild(e);
      return e;
    };

    const updateHeaderState = (candle: InternalCandle, refOpen: number) => {
      const up = candle.c >= refOpen;
      const diff = candle.c - refOpen;
      const pct = refOpen ? (diff / refOpen) * 100 : 0;
      setOhlc({ o: candle.o, h: candle.h, l: candle.l, c: candle.c, change: diff, pct, up });
    };

    const buildTimeLabels = () => {
      const count = 11;
      const labels: { label: string; bold: boolean; x: number }[] = [];
      for (let k = 0; k < count; k++) {
        const localIdx = Math.round(((eng.viewCount - 1) * k) / (count - 1));
        const globalIdx = Math.max(0, Math.min(eng.n - 1, eng.viewOffset + localIdx));
        const d = eng.times[globalIdx];
        if (!d || isNaN(d.getTime())) continue;
        labels.push({ label: fmtTime(d), bold: d.getUTCMinutes() === 0, x: xFor(localIdx) });
      }
      return labels;
    };

    const render = () => {
      if (!eng.n) {
        svg.innerHTML = '';
        return;
      }

      svg.innerHTML = '';
      svg.setAttribute('width', String(eng.W));
      svg.setAttribute('height', String(eng.H));
      svg.setAttribute('viewBox', `0 0 ${eng.W} ${eng.H}`);

      const priceStep = niceStep(eng.vRange / 8);
      const priceStart = Math.ceil(eng.minV / priceStep) * priceStep;
      for (let v = priceStart; v <= eng.maxV + priceStep * 0.001; v += priceStep) {
        const y = yFor(v);
        addEl('line', { x1: '0', y1: String(y), x2: String(eng.plotW), y2: String(y), stroke: colors.grid, 'stroke-width': '1' });
        const label = addEl('text', {
          x: String(eng.plotW + 6),
          y: String(y + 4),
          fill: colors.textDim,
          'font-size': '11',
          'font-family': 'inherit',
        });
        label.textContent = fmtPriceLocalRef.current(v);
      }

      const idxStep = Math.max(1, Math.round(niceStep(eng.viewCount / 12)));
      const idxStart = Math.ceil(eng.viewOffset / idxStep) * idxStep;
      for (let idx = idxStart; idx <= eng.viewOffset + eng.viewCount; idx += idxStep) {
        const x = pixelXForIdx(idx);
        addEl('line', {
          x1: String(x),
          y1: String(PAD_TOP),
          x2: String(x),
          y2: String(PAD_TOP + eng.plotH),
          stroke: colors.grid,
          'stroke-width': '1',
        });
      }

      visibleCandles().forEach((c, i) => {
        const x = xFor(i);
        const up = c.c >= c.o;
        const color = up ? colors.up : colors.down;
        const wickWidth = Math.max(1, Math.min(eng.candleW * 0.18, 3));
        let wy1 = yFor(c.h);
        let wy2 = yFor(c.l);
        if (wy2 - wy1 < 1) {
          const mid = (wy1 + wy2) / 2;
          wy1 = mid - 0.5;
          wy2 = mid + 0.5;
        }
        addEl('line', {
          x1: String(x),
          y1: String(wy1),
          x2: String(x),
          y2: String(wy2),
          stroke: color,
          'stroke-width': String(wickWidth),
          'stroke-linecap': 'round',
        });
        const bodyTop = yFor(Math.max(c.o, c.c));
        const bodyBot = yFor(Math.min(c.o, c.c));
        addEl('rect', {
          x: String(x - eng.candleW / 2),
          y: String(bodyTop),
          width: String(eng.candleW),
          height: String(Math.max(bodyBot - bodyTop, 1)),
          fill: color,
        });
      });

      // Position overlays (entry / TP / SL) with axis labels
      positionsRef.current.forEach((pos) => {
        const profitColor =
          getComputedStyle(document.documentElement).getPropertyValue('--profit').trim() || '#22c55e';
        const lines: { price: number; color: string; dash?: string; label: string }[] = [
          { price: pos.price_open, color: pos.side === 'buy' ? colors.up : colors.down, label: 'Entry' },
        ];
        if (pos.tp != null && pos.tp > 0) {
          lines.push({ price: pos.tp, color: profitColor, dash: '4,2', label: 'TP' });
        }
        if (pos.sl != null && pos.sl > 0) {
          lines.push({ price: pos.sl, color: colors.down, dash: '4,2', label: 'SL' });
        }
        lines.forEach(({ price, color, dash, label }) => {
          const y = yFor(price);
          if (y < PAD_TOP || y > PAD_TOP + eng.plotH) return;
          addEl('line', {
            x1: '0',
            y1: String(y),
            x2: String(eng.plotW),
            y2: String(y),
            stroke: color,
            'stroke-width': '1.5',
            ...(dash ? { 'stroke-dasharray': dash } : {}),
          });
          const tag = addEl('text', {
            x: String(eng.plotW - 4),
            y: String(y - 4),
            fill: color,
            'font-size': '10',
            'font-family': 'inherit',
            'font-weight': '600',
            'text-anchor': 'end',
          });
          tag.textContent = `${label} ${fmtPriceLocalRef.current(price)}`;
        });
      });

      const lastCandle = eng.candles[eng.n - 1];
      const prevCandle = eng.n > 1 ? eng.candles[eng.n - 2] : lastCandle;
      const lastUp = lastCandle.c >= prevCandle.c;
      const lastY = yFor(lastCandle.c);

      addEl('line', {
        x1: '0',
        y1: String(lastY),
        x2: String(eng.plotW),
        y2: String(lastY),
        stroke: lastUp ? colors.up : colors.down,
        'stroke-width': '1',
        'stroke-dasharray': '1,3',
      });

      buildTimeLabels().forEach((t) => {
        const label = addEl('text', {
          x: String(t.x),
          y: String(eng.H - 8),
          fill: t.bold ? colors.text : colors.textDim,
          'font-size': '11',
          'font-family': 'inherit',
          'font-weight': t.bold ? '600' : '400',
        });
        label.textContent = t.label;
      });

      if (lastPriceRef.current) {
        lastPriceRef.current.classList.toggle(styles.priceTagLastDown, !lastUp);
        lastPriceRef.current.style.top = `${lastY}px`;
        lastPriceRef.current.textContent = fmtPriceLocalRef.current(lastCandle.c);
      }

      updateHeaderState(lastCandle, lastCandle.o);

      eng.vLine = addEl('line', {
        x1: '-100',
        y1: String(PAD_TOP),
        x2: '-100',
        y2: String(PAD_TOP + eng.plotH),
        stroke: colors.textDim,
        'stroke-width': '1',
        'stroke-dasharray': '3,3',
      }) as SVGLineElement;
      eng.hLine = addEl('line', {
        x1: '0',
        y1: '-100',
        x2: String(eng.plotW),
        y2: '-100',
        stroke: colors.textDim,
        'stroke-width': '1',
        'stroke-dasharray': '3,3',
      }) as SVGLineElement;
    };

    const computeLayoutAndRender = () => {
      eng.plotW = eng.W - PAD_RIGHT;
      eng.plotH = eng.H - PAD_TOP - PAD_BOTTOM;
      eng.slot = eng.viewCount > 0 ? eng.plotW / eng.viewCount : eng.plotW;
      eng.candleW = Math.max(2, Math.min(eng.slot * 0.6, 40));
      render();
    };

    renderChartRef.current = computeLayoutAndRender;

    const scheduleRender = () => {
      if (eng.rafScheduled) return;
      eng.rafScheduled = true;
      requestAnimationFrame(() => {
        eng.rafScheduled = false;
        computeLayoutAndRender();
      });
    };

    const panChart = (deltaX: number) => {
      if (!deltaX || !eng.slot) return;
      const indexShift = deltaX / eng.slot;
      let target = eng.viewOffset + indexShift;

      if (target < eng.viewCount * 0.15 && onLoadMoreHistoryRef.current && !eng.loadHistoryRequested) {
        eng.loadHistoryRequested = true;
        onLoadMoreHistoryRef.current();
        setTimeout(() => {
          eng.loadHistoryRequested = false;
        }, 2000);
      }

      target = Math.max(0, Math.min(eng.n - eng.viewCount, target));
      eng.viewOffset = target;
      scheduleRender();
    };

    const panPriceVertical = (deltaY: number) => {
      if (!deltaY || !eng.plotH) return;
      const shift = (deltaY * eng.vRange) / eng.plotH;
      eng.maxV += shift;
      eng.minV += shift;
      eng.manualPriceScale = true;
      scheduleRender();
    };

    const horizontalZoom = (deltaY: number) => {
      const factor = Math.exp(deltaY * ZOOM_INTENSITY);
      const centerIdx = eng.viewOffset + eng.viewCount / 2;
      let newViewCount = eng.viewCount * factor;
      newViewCount = Math.max(MIN_VIEW_CANDLES, Math.min(eng.n, newViewCount));
      let newViewOffset = centerIdx - newViewCount / 2;
      newViewOffset = Math.max(0, Math.min(eng.n - newViewCount, newViewOffset));
      eng.viewCount = newViewCount;
      eng.viewOffset = newViewOffset;
      if (!eng.manualPriceScale) computeScale();
      scheduleRender();
    };

    const verticalZoom = (deltaY: number, my: number) => {
      const factor = Math.exp(deltaY * ZOOM_INTENSITY);
      const anchorPrice = priceAt(my);
      const newRange = Math.max(0.01, eng.vRange * factor);
      const ratioAbove = (eng.maxV - anchorPrice) / eng.vRange;
      eng.maxV = anchorPrice + ratioAbove * newRange;
      eng.minV = eng.maxV - newRange;
      eng.vRange = newRange;
      eng.manualPriceScale = true;
      scheduleRender();
    };

    const resizeToContainer = () => {
      eng.W = wrap.clientWidth || 800;
      eng.H = chartHeight;
      computeLayoutAndRender();
    };

    const syncCandles = (resetView: boolean) => {
      const { data, times } = toInternal(liveCandles);
      const prevLen = eng.n;
      eng.candles = data;
      eng.times = times;
      eng.n = data.length;
      if (resetView || !prevLen) {
        eng.viewOffset = 0;
        eng.viewCount = eng.n || MIN_VIEW_CANDLES;
        eng.manualPriceScale = false;
      } else if (eng.viewOffset + eng.viewCount > eng.n) {
        eng.viewOffset = Math.max(0, eng.n - eng.viewCount);
      }
      computeScale();
      computeLayoutAndRender();
    };

    const isOnHandle = (target: EventTarget | null) =>
      target === cornerHandleRef.current || (target instanceof Element && target.closest(`.${styles.cornerResizeHandle}`));

    const onMouseMove = (e: MouseEvent) => {
      if (isOnHandle(e.target)) return;
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      wrap.style.cursor =
        eng.isRightDragging || eng.isLeftDragging ? 'grabbing' : mx > eng.plotW ? 'ns-resize' : '';

      if (mx < 0 || mx > eng.plotW || my < PAD_TOP || my > PAD_TOP + eng.plotH || !eng.n) return;

      let localIdx = Math.floor(mx / eng.slot);
      localIdx = Math.max(0, Math.min(eng.viewCount - 1, localIdx));
      const globalIdx = eng.viewOffset + localIdx;
      const candle = eng.candles[globalIdx];
      if (!candle) return;
      const cx = xFor(localIdx);

      eng.vLine?.setAttribute('x1', String(cx));
      eng.vLine?.setAttribute('x2', String(cx));
      eng.hLine?.setAttribute('y1', String(my));
      eng.hLine?.setAttribute('y2', String(my));

      const priceAtCursor = priceAt(my);
      if (hoverPriceRef.current) {
        hoverPriceRef.current.classList.add(styles.priceTagHoverShow);
        hoverPriceRef.current.style.top = `${my}px`;
        hoverPriceRef.current.textContent = fmtPriceLocalRef.current(priceAtCursor);
      }
      if (hoverDateRef.current && eng.times[globalIdx]) {
        hoverDateRef.current.classList.add(styles.dateTagShow);
        hoverDateRef.current.style.left = `${cx}px`;
        hoverDateRef.current.style.bottom = '8px';
        hoverDateRef.current.textContent = fmtDateTime(eng.times[globalIdx]);
      }

      const last = eng.candles[eng.n - 1];
      updateHeaderState(candle, last?.o ?? candle.o);
    };

    const onMouseLeave = () => {
      eng.vLine?.setAttribute('x1', '-100');
      eng.vLine?.setAttribute('x2', '-100');
      eng.hLine?.setAttribute('y1', '-100');
      eng.hLine?.setAttribute('y2', '-100');
      hoverPriceRef.current?.classList.remove(styles.priceTagHoverShow);
      hoverDateRef.current?.classList.remove(styles.dateTagShow);
      const last = eng.candles[eng.n - 1];
      if (last) updateHeaderState(last, last.o);
    };

    const onMouseDownLeft = (e: MouseEvent) => {
      if (e.button !== 0 || isOnHandle(e.target)) return;
      eng.isLeftDragging = true;
      eng.leftDragLastX = e.clientX;
      eng.leftDragLastY = e.clientY;
      wrap.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const onMouseDownRight = (e: MouseEvent) => {
      if (e.button !== 2 || isOnHandle(e.target)) return;
      eng.isRightDragging = true;
      eng.rightDragMoved = false;
      eng.rightDragLastX = e.clientX;
      document.body.style.userSelect = 'none';
      e.preventDefault();
    };

    const onWindowMouseMove = (e: MouseEvent) => {
      if (eng.isLeftDragging) {
        const dx = e.clientX - eng.leftDragLastX;
        const dy = e.clientY - eng.leftDragLastY;
        eng.leftDragLastX = e.clientX;
        eng.leftDragLastY = e.clientY;
        if (dx) panChart(-dx);
        if (dy) panPriceVertical(dy);
      }
      if (eng.isRightDragging) {
        const dx = e.clientX - eng.rightDragLastX;
        eng.rightDragLastX = e.clientX;
        if (!eng.rightDragMoved && Math.abs(dx) > 3) eng.rightDragMoved = true;
        if (eng.rightDragMoved) panChart(dx);
      }
      if (eng.isDraggingHeight) {
        const delta = e.clientY - eng.dragStartY;
        const next = Math.max(260, Math.min(800, eng.dragStartHeight + delta));
        setChartHeight(next);
      }
    };

    const endLeftDrag = () => {
      if (!eng.isLeftDragging) return;
      eng.isLeftDragging = false;
      document.body.style.userSelect = '';
      wrap.style.cursor = '';
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      if (e.button === 0) endLeftDrag();
      if (e.button === 2 && eng.isRightDragging) {
        eng.isRightDragging = false;
        document.body.style.userSelect = '';
      }
      if (eng.isDraggingHeight) {
        eng.isDraggingHeight = false;
        cornerHandleRef.current?.classList.remove(styles.cornerResizeDragging);
        document.body.style.userSelect = '';
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (isOnHandle(e.target)) return;
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const lineScale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const rawDeltaX = e.deltaX * lineScale;
      const rawDeltaY = e.deltaY * lineScale;
      const shiftDeltaX = e.shiftKey ? (rawDeltaX !== 0 ? rawDeltaX : rawDeltaY) : 0;
      const horizontalIntent = e.shiftKey || Math.abs(rawDeltaX) > Math.abs(rawDeltaY);

      if (horizontalIntent && mx <= eng.plotW && my >= PAD_TOP && my <= PAD_TOP + eng.plotH) {
        e.preventDefault();
        panChart(e.shiftKey ? shiftDeltaX : rawDeltaX);
        return;
      }

      e.preventDefault();
      if (mx > eng.plotW) verticalZoom(rawDeltaY, my);
      else horizontalZoom(rawDeltaY);
    };

    const onDblClick = (e: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      if (mx > eng.plotW) {
        eng.manualPriceScale = false;
        computeScale();
        scheduleRender();
        showToast('Price scale: Auto');
      } else {
        eng.viewOffset = 0;
        eng.viewCount = eng.n;
        if (!eng.manualPriceScale) computeScale();
        scheduleRender();
        showToast('Zoom reset');
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (eng.rightDragMoved) e.preventDefault();
    };

    const onCornerMouseDown = (e: MouseEvent) => {
      eng.isDraggingHeight = true;
      eng.dragStartY = e.clientY;
      eng.dragStartHeight = chartHeight;
      cornerHandleRef.current?.classList.add(styles.cornerResizeDragging);
      document.body.style.userSelect = 'none';
      e.preventDefault();
      e.stopPropagation();
    };

    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('mouseleave', onMouseLeave);
    wrap.addEventListener('mousedown', onMouseDownLeft);
    wrap.addEventListener('mousedown', onMouseDownRight);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('dblclick', onDblClick);
    wrap.addEventListener('contextmenu', onContextMenu);
    wrap.addEventListener('dragstart', (e) => e.preventDefault());
    cornerHandleRef.current?.addEventListener('mousedown', onCornerMouseDown);
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('blur', endLeftDrag);

    const ro = new ResizeObserver(resizeToContainer);
    ro.observe(wrap);

    syncCandles(true);

    return () => {
      renderChartRef.current = null;
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('mouseleave', onMouseLeave);
      wrap.removeEventListener('mousedown', onMouseDownLeft);
      wrap.removeEventListener('mousedown', onMouseDownRight);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('dblclick', onDblClick);
      wrap.removeEventListener('contextmenu', onContextMenu);
      cornerHandleRef.current?.removeEventListener('mousedown', onCornerMouseDown);
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('blur', endLeftDrag);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  const applyVisibleRange = useCallback((rangeKey: string) => {
    const eng = engineRef.current;
    if (!eng.n) return;

    const ms = RANGE_MS[rangeKey];
    if (ms == null) {
      pendingRangeRef.current = null;
      eng.viewOffset = 0;
      eng.viewCount = eng.n;
    } else {
      const lastTs = eng.times[eng.n - 1]?.getTime();
      if (!lastTs || !Number.isFinite(lastTs)) return;
      const cutoff = lastTs - ms;
      let startIdx = 0;
      for (let i = 0; i < eng.n; i++) {
        const t = eng.times[i]?.getTime();
        if (t != null && t >= cutoff) {
          startIdx = i;
          break;
        }
      }
      eng.viewOffset = startIdx;
      eng.viewCount = Math.max(MIN_VIEW_CANDLES, eng.n - startIdx);
      // If the loaded history is shorter than the requested range, pull more
      if (startIdx === 0 && onLoadMoreHistoryRef.current && eng.times[0] && eng.times[0].getTime() > cutoff) {
        pendingRangeRef.current = rangeKey;
        onLoadMoreHistoryRef.current();
      } else {
        pendingRangeRef.current = null;
      }
    }
    eng.manualPriceScale = false;
    const vis = eng.candles.slice(eng.viewOffset, eng.viewOffset + eng.viewCount);
    if (vis.length) {
      const allVals = vis.flatMap((c) => [c.h, c.l]);
      eng.maxV = Math.max(...allVals);
      eng.minV = Math.min(...allVals);
      eng.vRange = eng.maxV - eng.minV || 1;
    }
    renderChartRef.current?.();
  }, []);

  // Sync candle data without resetting view on live updates
  useEffect(() => {
    const eng = engineRef.current;
    const prevN = eng.n;
    const prevFirstTs = eng.times[0]?.getTime();
    const prevLastTs = eng.times[eng.n - 1]?.getTime();
    const { data, times } = toInternal(liveCandles);

    const newFirstTs = times[0]?.getTime();
    const newLastTs = times[times.length - 1]?.getTime();
    const seriesKey = `${symbol}|${timeframe}`;
    const seriesReset = seriesKeyRef.current !== seriesKey || !prevN || liveCandles.length === 0;
    if (seriesKeyRef.current !== seriesKey) {
      seriesKeyRef.current = seriesKey;
      pendingRangeRef.current = null;
      setActiveRange('⇄');
    }

    const prepended =
      !seriesReset &&
      prevN > 0 &&
      data.length > prevN &&
      newFirstTs != null &&
      prevFirstTs != null &&
      newFirstTs < prevFirstTs;

    eng.candles = data;
    eng.times = times;
    eng.n = data.length;

    if (seriesReset) {
      eng.viewOffset = 0;
      eng.viewCount = eng.n || MIN_VIEW_CANDLES;
      eng.manualPriceScale = false;
    } else if (prepended) {
      const added = eng.n - prevN;
      eng.viewOffset += added;
    } else if (newLastTs && prevLastTs && newLastTs !== prevLastTs && eng.viewOffset + eng.viewCount >= prevN - 1) {
      eng.viewOffset = Math.max(0, eng.n - eng.viewCount);
    }

    if (eng.viewCount > eng.n) eng.viewCount = Math.max(MIN_VIEW_CANDLES, eng.n);
    if (eng.viewOffset + eng.viewCount > eng.n) {
      eng.viewOffset = Math.max(0, eng.n - eng.viewCount);
    }

    if (eng.n) {
      const vis = eng.candles.slice(eng.viewOffset, eng.viewOffset + eng.viewCount);
      if (vis.length && !eng.manualPriceScale) {
        const allVals = vis.flatMap((c) => [c.h, c.l]);
        eng.maxV = Math.max(...allVals);
        eng.minV = Math.min(...allVals);
        eng.vRange = eng.maxV - eng.minV || 1;
      }
    }

    eng.H = chartHeight;
    const wrap = wrapRef.current;
    if (wrap) eng.W = wrap.clientWidth || eng.W;
    renderChartRef.current?.();

    // Re-apply a pending range after history pagination fills in more bars
    if (pendingRangeRef.current && eng.n > prevN) {
      const key = pendingRangeRef.current;
      requestAnimationFrame(() => applyVisibleRange(key));
    }
  }, [liveCandles, chartHeight, positions, symbol, timeframe, applyVisibleRange]);

  const handleTfKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!tfOpen) setTfOpen(true);
      else setTfFocusIndex((i) => (i + 1) % selectableOptions.length);
    } else if (e.key === 'Escape') {
      setTfOpen(false);
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setTfFocusIndex((i) => (i + 1) % selectableOptions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setTfFocusIndex((i) => (i - 1 + selectableOptions.length) % selectableOptions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = selectableOptions[tfFocusIndex];
      if (opt?.minutes && opt.label) applyTimeframe(opt.minutes, opt.label);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTfOpen(false);
      tfPanelRef.current?.focus();
    }
  };

  const modalValid = Number.isFinite(parseInt(modalInterval, 10)) && parseInt(modalInterval, 10) > 0;

  const changeSign = ohlc.change >= 0 ? '+' : '';

  return (
    <div className={styles.root} aria-label={`${symbol} chart`}>
      <div className={styles.bodyRow}>
        <div className={styles.leftToolbarWrap}>
          <button
            type="button"
            ref={tfPanelRef}
            className={`${styles.tfPanel} ${tfOpen ? styles.tfPanelOpen : ''}`}
            aria-haspopup="listbox"
            aria-expanded={tfOpen}
            title="Change timeframe"
            onClick={(e) => {
              e.stopPropagation();
              setTfOpen((v) => !v);
            }}
            onKeyDown={handleTfKeyDown}
          >
            <span className={styles.tfPanelLabel}>{timeframe}</span>
            <span className={styles.tfPanelCaret}>&#9662;</span>
          </button>

          <div
            ref={tfDropdownRef}
            className={`${styles.tfDropdown} ${tfOpen ? styles.tfDropdownShow : ''}`}
            role="listbox"
            aria-label="Select timeframe"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleDropdownKeyDown}
          >
            <button
              type="button"
              className={`${styles.tfAddCustom} ${tfFocusIndex === -1 ? styles.tfOptionFocused : ''}`}
              onClick={() => {
                setTfOpen(false);
                setModalOpen(true);
                setModalInterval('');
                setModalType('minutes');
              }}
            >
              <span className={styles.tfPlus}>+</span> Add custom interval...
            </button>

            {TF_OPTIONS.map((opt, idx) => {
              if (opt.kind === 'custom') return null;
              if (opt.group) {
                return (
                  <div key={`g-${opt.group}-${idx}`} className={styles.tfGroupTitle}>
                    {opt.group}
                  </div>
                );
              }
              if (opt.kind === 'disabled') {
                return (
                  <button
                    key={`d-${opt.seconds}`}
                    type="button"
                    className={`${styles.tfOption} ${styles.tfOptionDisabled}`}
                    onClick={() => showToast("Sub-minute resolution isn't available for this data feed")}
                  >
                    {opt.text}
                  </button>
                );
              }
              const selIdx = selectableOptions.findIndex((s) => s.minutes === opt.minutes);
              const selected = opt.label === timeframe;
              const focused = selIdx === tfFocusIndex;
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`${styles.tfOption} ${selected ? styles.tfOptionSelected : ''} ${focused ? styles.tfOptionFocused : ''}`}
                  onClick={() => opt.minutes && opt.label && applyTimeframe(opt.minutes, opt.label)}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.chartArea}>
          <div className={styles.symbolBar}>
            <span className={styles.symbolIcon}>{symbolInitial(symbol)}</span>
            <span className={styles.symbolName}>{symbolLabel ?? symbol}</span>
            <span className={styles.symbolSub}>&middot; {timeframe} &middot;</span>
            <span className={styles.ohlc}>
              O<b className={ohlc.up ? styles.ohlcUp : styles.ohlcDown}>{fmtPriceLocal(ohlc.o)}</b>{' '}
              H<b className={ohlc.up ? styles.ohlcUp : styles.ohlcDown}>{fmtPriceLocal(ohlc.h)}</b>{' '}
              L<b className={ohlc.up ? styles.ohlcUp : styles.ohlcDown}>{fmtPriceLocal(ohlc.l)}</b>{' '}
              C<b className={ohlc.up ? styles.ohlcUp : styles.ohlcDown}>{fmtPriceLocal(ohlc.c)}</b>{' '}
              <span className={ohlc.up ? styles.ohlcUp : styles.ohlcDown}>
                {changeSign}{ohlc.change.toFixed(2)} ({changeSign}{ohlc.pct.toFixed(2)}%)
              </span>
            </span>
          </div>

          <div
            className={styles.chartSvgWrap}
            ref={wrapRef}
            style={{ minHeight: chartHeight }}
          >
            {loading && <div className={styles.skeleton} aria-hidden />}
            {!loading && error && (
              <div className={styles.overlay}>
                <p className={`${styles.overlayMessage} ${styles.overlayError}`}>{error}</p>
              </div>
            )}
            {!loading && !error && liveCandles.length === 0 && (
              <div className={styles.overlay}>
                <p className={styles.overlayMessage}>No candle data for {symbol}</p>
              </div>
            )}

            <svg ref={svgRef} className={styles.chartSvg} height={chartHeight} aria-hidden={loading || !!error} />
            <div ref={lastPriceRef} className={`${styles.priceTag} ${styles.priceTagLast}`} />
            <div ref={hoverPriceRef} className={`${styles.priceTag} ${styles.priceTagHover}`} />
            <div ref={hoverDateRef} className={styles.dateTag} />
            <div
              ref={cornerHandleRef}
              className={styles.cornerResizeHandle}
              title="Drag to resize chart height"
            />
          </div>

          <div className={styles.rangeBar}>
            {RANGE_ITEMS.map((item) => (
              <button
                key={item}
                type="button"
                className={`${styles.rangeItem} ${activeRange === item ? styles.rangeItemActive : ''}`}
                onClick={() => {
                  setActiveRange(item);
                  applyVisibleRange(item);
                  showToast(item === '⇄' ? 'Range: Fit all' : `Range: ${item}`);
                }}
              >
                {item}
              </button>
            ))}
            <div className={styles.rangeDivider} />
            <div className={styles.rangeRight}>
              <span>{utcClock}</span>
              <span className={styles.rangeAuto}>auto</span>
              <span
                role="button"
                tabIndex={0}
                title="Reset price scale to auto"
                onClick={() => {
                  const eng = engineRef.current;
                  eng.manualPriceScale = false;
                  const vis = eng.candles.slice(eng.viewOffset, eng.viewOffset + eng.viewCount);
                  if (vis.length) {
                    const allVals = vis.flatMap((c) => [c.h, c.l]);
                    eng.maxV = Math.max(...allVals);
                    eng.minV = Math.min(...allVals);
                    eng.vRange = eng.maxV - eng.minV || 1;
                  }
                  renderChartRef.current?.();
                  showToast('Price scale: Auto');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.click();
                  }
                }}
              >
                ⚙
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.toast} ${toastVisible ? styles.toastShow : ''}`} role="status">
        {toastMsg}
      </div>

      <div
        className={`${styles.modalOverlay} ${modalOpen ? styles.modalOverlayShow : ''}`}
        onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
      >
        <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Add custom interval">
          <div className={styles.modalHeader}>
            <span>Add custom interval</span>
            <button type="button" className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Close">
              x
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalField}>
              <label htmlFor="tfModalType">Type</label>
              <select id="tfModalType" value={modalType} onChange={(e) => setModalType(e.target.value)}>
                <option value="minutes">minutes</option>
                <option value="hours">hours</option>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label htmlFor="tfModalInterval">Interval</label>
              <input
                id="tfModalInterval"
                type="number"
                min={1}
                step={1}
                placeholder="e.g. 45"
                value={modalInterval}
                onChange={(e) => setModalInterval(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.modalBtn} onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={`${styles.modalBtn} ${styles.modalBtnPrimary} ${modalValid ? styles.modalBtnPrimaryEnabled : ''}`}
              disabled={!modalValid}
              onClick={() => {
                const v = parseInt(modalInterval, 10);
                if (!Number.isFinite(v) || v <= 0) return;
                const perUnit: Record<string, number> = { minutes: 1, hours: 60, days: 1440, weeks: 10080, months: 43200 };
                const abbrev: Record<string, string> = { minutes: 'm', hours: 'H', days: 'D', weeks: 'W', months: 'M' };
                const minutes = v * (perUnit[modalType] ?? 1);
                const label = `${v}${abbrev[modalType] ?? 'm'}`;
                applyTimeframe(minutes, label);
                setModalOpen(false);
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTradingChart;
