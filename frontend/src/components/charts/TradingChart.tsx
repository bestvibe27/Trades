import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts';

interface TradingChartProps {
  data: CandlestickData[];
  symbol: string;
  height?: number;
  onCrosshairMove?: (price: number, time: number) => void;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  data, 
  symbol, 
  height = 400,
  onCrosshairMove 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Resolve theme variables
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue('--bg-elev-1').trim() || '#0f1524';
    const text = styles.getPropertyValue('--text-dim').trim() || '#b9c3d9';
    const grid = styles.getPropertyValue('--border').trim() || '#22304f';
    const up = styles.getPropertyValue('--profit').trim() || '#00c853';
    const down = styles.getPropertyValue('--loss').trim() || '#d50000';

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: bg },
        textColor: text,
      },
      grid: {
        vertLines: { color: grid + '80' },
        horzLines: { color: grid + '80' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: grid,
      },
      timeScale: {
        borderColor: grid,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: up,
      downColor: down,
      borderDownColor: down,
      borderUpColor: up,
      wickDownColor: down,
      wickUpColor: up,
    });

    // Set initial data and fit view
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    // Handle crosshair move
    // Tooltip element
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '10';
    tooltip.style.minWidth = '160px';
    tooltip.style.transform = 'translate(-50%, -100%)';
    tooltip.style.padding = '8px 10px';
    tooltip.style.borderRadius = '10px';
    tooltip.style.background = 'rgba(19, 27, 46, 0.95)';
    tooltip.style.border = `1px solid ${grid}`;
    tooltip.style.color = text;
    tooltip.style.fontSize = '12px';
    tooltip.style.boxShadow = '0 10px 30px rgba(0,0,0,0.35)';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 120ms ease';
    tooltipRef.current = tooltip;
    chartContainerRef.current.appendChild(tooltip);

    const showTooltip = (x: number, y: number, ohlc: CandlestickData, t: number) => {
      if (!tooltipRef.current) return;
      const dt = new Date((t as number) * 1000);
      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y}px`;
      tooltipRef.current.style.opacity = '1';
      tooltipRef.current.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px"><span>${dt.toLocaleString()}</span></div>
        <div style="display:grid;grid-template-columns:auto auto;gap:6px;margin-top:6px">
          <span style="color:${text}">O</span><span>${ohlc.open}</span>
          <span style="color:${text}">H</span><span>${ohlc.high}</span>
          <span style="color:${text}">L</span><span>${ohlc.low}</span>
          <span style="color:${text}">C</span><span>${ohlc.close}</span>
        </div>`;
    };

    const hideTooltip = () => {
      if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
    };

    chart.subscribeCrosshairMove((param) => {
      if (
        !param.point || !param.time ||
        param.point.x < 0 || param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 || param.point.y > height
      ) {
        hideTooltip();
        return;
      }
      const ohlc = param.seriesData.get(candlestickSeries) as CandlestickData | undefined;
      if (ohlc) {
        showTooltip(param.point.x, param.point.y, ohlc, param.time as number);
        if (onCrosshairMove) onCrosshairMove(ohlc.close, param.time as number);
      } else {
        hideTooltip();
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      window.removeEventListener('resize', handleResize);
      if (tooltipRef.current && chartContainerRef.current) {
        chartContainerRef.current.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
      chart.remove();
    };
  }, [data, height, onCrosshairMove]);

  useEffect(() => {
    if (seriesRef.current && data) {
      // Update data smoothly and fit content (useful when switching symbol/TF)
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return (
    <div className="w-full" style={{ position: 'relative' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{symbol} Chart</h3>
        <div className="text-sm text-gray-500">
          {data.length} candles
        </div>
      </div>
      <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px`, position: 'relative' }} />
    </div>
  );
};

export default TradingChart;










