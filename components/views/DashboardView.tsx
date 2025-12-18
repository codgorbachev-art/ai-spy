import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, HistoryItem } from '../../types';
import { Crown, History, TrendingUp, Plus, ArrowRight, Activity, Zap } from 'lucide-react';
import ButtonGlow from '../ui/ButtonGlow';

export const DashboardView: React.FC<{ 
  user: User; 
  history: HistoryItem[]; 
  onScan: () => void; 
  onUpgrade: () => void;
  onHistoryClick: (item: HistoryItem) => void;
}> = ({ user, history, onScan, onUpgrade, onHistoryClick }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // --- Statistics Calculation ---
  const stats = useMemo(() => {
    const avgScore = history.length > 0 
      ? (history.reduce((acc, curr) => acc + parseFloat(curr.score), 0) / history.length)
      : 0;
    
    return {
      total: history.length,
      avg: avgScore.toFixed(1),
      avgNum: avgScore
    };
  }, [history]);

  // --- Chart Logic ---
  const chartData = useMemo(() => {
     return [...history].slice(0, 10).reverse().map((item) => ({
        id: item.id,
        score: parseFloat(item.score),
        name: item.productName,
        date: item.date
     }));
  }, [history]);

  const width = 100;
  const height = 40;
  const points = chartData.map((d, i) => {
    const x = chartData.length > 1 ? (i / (chartData.length - 1)) * width : 50;
    // Score 0 -> y=height, Score 10 -> y=0
    const y = height - (d.score / 10) * height; 
    return { x, y, ...d };
  });

  const pathD = points.length > 1 
    ? `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
    : points.length === 1 ? `M 0,${points[0].y} L 100,${points[0].y}` : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`
    : '';

  // Avg Score Circle Params
  const circleRadius = 28;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference - (stats.avgNum / 10) * circleCircumference;

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-10">
      
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Привет, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-brand-purple">{user.name}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Твой прогресс осознанного питания</p>
        </div>
        <div className="hidden md:block">
           <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400 uppercase tracking-widest">
             {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
           </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/10 rounded-full blur-2xl group-hover:bg-brand-purple/20 transition-all duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Твой Тариф</p>
                <h3 className="text-3xl font-bold text-white flex items-center gap-2">
                  {user.plan} 
                  {user.plan === 'FREE' ? <span className="text-gray-500 text-lg">PLAN</span> : <Crown className="w-6 h-6 text-brand-purple fill-brand-purple animate-pulse" />}
                </h3>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                <Crown className="w-5 h-5 text-gray-300" />
              </div>
            </div>
            {user.plan === 'FREE' && (
               <button onClick={onUpgrade} className="mt-4 flex items-center gap-2 text-xs font-bold text-brand-cyan hover:text-white transition-colors group/btn">
                 Улучшить возможности <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
               </button>
            )}
          </div>
        </motion.div>

        {/* Card 2: Scans */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel p-6 rounded-3xl relative overflow-hidden group"
        >
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-cyan/10 rounded-full blur-2xl group-hover:bg-brand-cyan/20 transition-all duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Всего Сканов</p>
                <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
              </div>
              <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                <Zap className="w-5 h-5 text-brand-cyan" />
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} animate={{ width: `${Math.min(stats.total * 2, 100)}%` }} 
                 className="h-full bg-gradient-to-r from-brand-cyan to-blue-500" 
               />
            </div>
          </div>
        </motion.div>

        {/* Card 3: Avg Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-panel p-6 rounded-3xl relative overflow-hidden group flex items-center justify-between"
        >
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Средний балл</p>
            <h3 className="text-4xl font-bold text-white tracking-tighter">{stats.avg}</h3>
            <p className={`text-xs mt-1 font-bold ${stats.avgNum >= 8 ? 'text-green-400' : stats.avgNum >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
               {stats.avgNum >= 8 ? 'Отличный рацион' : stats.avgNum >= 5 ? 'Есть риски' : 'Требует внимания'}
            </p>
          </div>
          
          <div className="relative w-20 h-20 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r={circleRadius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="transparent" />
                <motion.circle 
                  cx="50%" cy="50%" r={circleRadius} 
                  stroke={stats.avgNum >= 8 ? '#4ade80' : stats.avgNum >= 5 ? '#facc15' : '#ef4444'} 
                  strokeWidth="6" fill="transparent" strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  initial={{ strokeDashoffset: circleCircumference }}
                  animate={{ strokeDashoffset: circleOffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                />
             </svg>
             <Activity className="w-6 h-6 text-white/50 absolute" />
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CHART SECTION */}
        <motion.div 
           initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
           className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden"
        >
           <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-brand-cyan" /> Динамика качества
            </h3>
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-400 uppercase tracking-widest">
              Последние 10
            </span>
          </div>

          <div className="relative h-56 w-full group cursor-crosshair">
            {history.length > 1 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1={height} x2="100" y2={height} stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                <line x1="0" y1={height/2} x2="100" y2={height/2} stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" strokeDasharray="1 1" />

                {/* Area Fill */}
                <motion.path 
                   d={areaD} fill="url(#chartGradient)" 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} 
                />
                
                {/* Line */}
                <motion.path 
                  d={pathD} fill="none" stroke="#00f0ff" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"
                  filter="url(#glow)"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Interactive Points */}
                {points.map((p, i) => (
                  <g key={i}>
                    {/* Invisible Hit Area - Widened for better UX */}
                    <rect 
                       x={p.x - 4} y="0" width="8" height={height} fill="transparent" style={{ cursor: 'pointer' }}
                       onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Hover Glow Effect */}
                    {hoveredPoint === i && (
                       <motion.circle
                         cx={p.x} cy={p.y} r={4}
                         fill="rgba(0, 240, 255, 0.3)"
                         initial={{ scale: 0 }}
                         animate={{ scale: 1.5 }}
                         transition={{ duration: 0.2 }}
                       />
                    )}
                    
                    {/* Visible Dot */}
                    <motion.circle 
                      cx={p.x} cy={p.y} r={hoveredPoint === i ? 2.5 : 1.5}
                      fill={hoveredPoint === i ? "#fff" : "#00f0ff"}
                      stroke="rgba(0,0,0,0.5)" strokeWidth="0.2"
                      animate={{ scale: hoveredPoint === i ? 1.2 : 1 }}
                      style={{ filter: hoveredPoint === i ? 'drop-shadow(0 0 4px #00f0ff)' : 'none' }}
                    />
                  </g>
                ))}
              </svg>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Недостаточно данных для графика
               </div>
            )}

            {/* Floating Tooltip */}
            <AnimatePresence>
              {hoveredPoint !== null && points[hoveredPoint] && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  style={{ 
                    left: `${points[hoveredPoint].x}%`, 
                    top: `${(points[hoveredPoint].y / height) * 100}%` 
                  }}
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-[150%] pointer-events-none"
                >
                  <div className="glass-panel px-4 py-3 rounded-xl border-brand-cyan/30 bg-[#050505]/90 shadow-[0_0_20px_rgba(0,240,255,0.2)] whitespace-nowrap">
                    <div className="font-bold text-sm text-white">{points[hoveredPoint].name}</div>
                    <div className="flex justify-between items-center gap-4 mt-1">
                      <span className="text-[10px] text-gray-400 font-mono">{points[hoveredPoint].date}</span>
                      <span className={`text-xs font-bold px-1.5 rounded ${
                        points[hoveredPoint].score >= 8 ? 'bg-green-500/20 text-green-400' : 
                        points[hoveredPoint].score >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {points[hoveredPoint].score}
                      </span>
                    </div>
                  </div>
                  {/* Triangle Arrow */}
                  <div className="w-3 h-3 bg-[#050505] border-r border-b border-brand-cyan/30 transform rotate-45 absolute left-1/2 -bottom-1.5 -translate-x-1/2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* NEW SCAN ACTION CARD */}
        <motion.div 
           initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
           className="h-full"
        >
          <div 
             onClick={onScan}
             className="h-full glass-card p-8 rounded-3xl border border-dashed border-white/20 hover:border-brand-cyan/50 cursor-pointer group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] flex flex-col items-center justify-center text-center"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             
             <div className="relative z-10">
               <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                  <div className="w-16 h-16 rounded-full bg-brand-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.5)]">
                     <Plus className="w-8 h-8 text-black" />
                  </div>
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Новый анализ</h3>
               <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">
                 Загрузи фото состава и получи AI разбор за 10 секунд
               </p>
             </div>
          </div>
        </motion.div>
      </div>

      {/* RECENT HISTORY */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="pt-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-brand-purple" /> Последние 3 сканирования
          </h3>
        </div>

        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center text-gray-500 border-dashed border-white/10">
               <p className="mb-4">История пуста</p>
               <ButtonGlow onClick={onScan} variant="secondary" className="!text-xs !py-2 !px-4">Сканировать первый продукт</ButtonGlow>
            </div>
          ) : (
            <>
               {/* Table Header */}
               <div className="px-4 py-2 flex justify-between text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                  <span>Продукт / Дата</span>
                  <span className="pr-12">Score</span>
               </div>
               
               {/* Rows */}
               {history.slice(0, 3).map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  onClick={() => onHistoryClick(item)}
                  className="glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer group border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-10 rounded-full ${
                      item.status === 'safe' ? 'bg-green-500' : item.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    } shadow-[0_0_10px_currentColor] opacity-80`} />
                    
                    <div>
                      <div className="font-bold text-white group-hover:text-brand-cyan transition-colors text-sm md:text-base">
                        {item.productName}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide">{item.date}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className={`w-12 py-1 rounded-lg font-bold font-mono text-center text-sm border ${
                      item.status === 'safe' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                      item.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                      'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      {item.score}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>

    </div>
  );
};