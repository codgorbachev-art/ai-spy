import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, HistoryItem } from '../../types';
import { Crown, History, TrendingUp } from 'lucide-react';

export const DashboardView: React.FC<{ 
  user: User; 
  history: HistoryItem[]; 
  onScan: () => void; 
  onUpgrade: () => void;
  onHistoryClick: (item: HistoryItem) => void;
}> = ({ user, history, onScan, onUpgrade, onHistoryClick }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Chart Logic
  const chartData = useMemo(() => {
     return [...history].slice(0, 10).reverse().map((item) => ({
        id: item.id,
        score: parseFloat(item.score),
        name: item.productName,
        date: item.date
     }));
  }, [history]);

  const width = 100;
  const height = 50;
  
  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : 50;
    const y = height - (d.score / 10) * height;
    return { x, y, ...d };
  });

  const pathD = points.length > 1 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : points.length === 1 ? `M 0,${points[0].y} L 100,${points[0].y}` : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`
    : '';

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group hover:border-brand-purple/50 transition-colors">
          <div className="relative z-10">
            <h3 className="text-gray-400 text-sm font-medium mb-1">Ваш план</h3>
            <div className="text-2xl font-bold flex items-center gap-2 text-white">
              {user.plan} <Crown className={`w-4 h-4 ${user.plan === 'PRO' || user.plan === 'ULTRA' ? 'text-brand-purple' : 'text-gray-600'}`} />
            </div>
          </div>
          {user.plan === 'FREE' && (
             <button onClick={onUpgrade} className="mt-4 text-xs text-brand-cyan hover:underline text-left">Улучшить тариф &rarr;</button>
          )}
        </div>
        <div className="glass-panel p-6 rounded-2xl">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Проверено продуктов</h3>
           <div className="text-2xl font-bold text-white">{history.length}</div>
        </div>
        <div className="glass-panel p-6 rounded-2xl">
           <h3 className="text-gray-400 text-sm font-medium mb-1">Средний Health Score</h3>
           <div className="text-2xl font-bold text-green-400">
             {history.length > 0 
               ? (history.reduce((acc, curr) => acc + parseFloat(curr.score), 0) / history.length).toFixed(1) 
               : '0.0'}
           </div>
        </div>
      </div>

      {/* Health Trend Chart */}
      {history.length > 0 && (
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-brand-cyan" /> Динамика Health Score
            </h3>
            <span className="text-xs text-gray-500 uppercase">Последние сканирования</span>
          </div>

          <div className="relative h-48 w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                </linearGradient>
              </defs>

              <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" strokeDasharray="1 1" />
              <line x1="0" y1={height/2} x2="100" y2={height/2} stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" strokeDasharray="1 1" />
              <line x1="0" y1={height} x2="100" y2={height} stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />

              <motion.path d={areaD} fill="url(#gradientArea)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />
              <motion.path 
                d={pathD} fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
                className="drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]"
              />

              {points.map((p, i) => (
                <g key={i}>
                  <circle 
                    cx={p.x} cy={p.y} r="1.5" fill="#fff" stroke="#00f0ff" strokeWidth="0.5"
                    className="cursor-pointer hover:r-2 transition-all"
                    onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle 
                    cx={p.x} cy={p.y} r="5" fill="transparent" className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}
            </svg>

            <AnimatePresence>
              {hoveredPoint !== null && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.9 }}
                  style={{ left: `${points[hoveredPoint].x}%`, top: `${(points[hoveredPoint].y / height) * 100}%` }}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-[130%]"
                >
                  <div className="glass-panel px-3 py-2 rounded-lg border-brand-cyan/30 bg-black/90 shadow-[0_0_15px_rgba(0,240,255,0.2)] whitespace-nowrap">
                    <div className="font-bold text-xs text-white mb-0.5">{points[hoveredPoint].name}</div>
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[10px] text-gray-400">{points[hoveredPoint].date}</span>
                      <span className={`text-xs font-bold ${points[hoveredPoint].score >= 8 ? 'text-green-400' : points[hoveredPoint].score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>Score: {points[hoveredPoint].score}</span>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-black/90 border-r border-b border-brand-cyan/30 transform rotate-45 absolute left-1/2 -bottom-1 -translate-x-1/2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Action */}
      <div 
        onClick={onScan}
        className="glass-card p-8 rounded-3xl border border-dashed border-white/20 hover:border-brand-cyan/50 cursor-pointer group transition-all"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-brand-cyan/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <div className="w-12 h-12 rounded-full border-2 border-brand-cyan flex items-center justify-center">
                <span className="text-2xl text-brand-cyan">+</span>
             </div>
          </div>
          <h3 className="text-xl font-bold text-white">Новый анализ</h3>
          <p className="text-gray-400 text-sm mt-1">Сфотографируйте состав или загрузите фото</p>
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
          <History className="w-4 h-4 text-brand-cyan" /> История
        </h3>
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">История пуста. Просканируйте первый продукт!</div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onHistoryClick(item)}
                className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
              >
                <div>
                  <div className="font-medium text-white group-hover:text-brand-cyan transition-colors">{item.productName}</div>
                  <div className="text-xs text-gray-500">{item.date}</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  item.status === 'safe' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                  item.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                  'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {item.score}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};