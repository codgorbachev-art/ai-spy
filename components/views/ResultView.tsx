import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanResult, Additive, StoryLayoutSpec } from '../../types';
import ButtonGlow from '../ui/ButtonGlow';
import { Check, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Leaf, Zap, Brain, X, Info, Activity, Share2, Download, Sparkles, Instagram } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';
import { GoogleGenAI } from "@google/genai";

export const ResultView: React.FC<{ result: ScanResult; onBack: () => void; onScanNew: () => void }> = ({ result, onBack, onScanNew }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'nutrients'>('overview');
  const [expandedAdditive, setExpandedAdditive] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [storySpec, setStorySpec] = useState<StoryLayoutSpec | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  const scoreNum = parseFloat(result.score);
  const scoreColor = scoreNum >= 8 ? '#4ade80' : scoreNum >= 5 ? '#facc15' : '#ef4444'; // green-400, yellow-400, red-500

  // Identify Critical Risks (High or Medium risk additives)
  const criticalRisks = useMemo(() => {
    return result.additives?.filter((a: Additive) => a.riskLevel === 'high' || a.riskLevel === 'medium').slice(0, 3) || [];
  }, [result.additives]);

  // SVG Gauge Calculations
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (scoreNum / 10) * circumference; 

  const generateAIStory = async () => {
     if (storySpec) return; // Already generated
     setIsGeneratingShare(true);

     try {
       const apiKey = process.env.API_KEY;
       if (!apiKey) throw new Error("No API Key");

       const ai = new GoogleGenAI({ apiKey });
       const model = 'gemini-3-flash-preview';

       const reportText = JSON.stringify(result);
       
       const prompt = `
PROMPT V2 (вставлять целиком)

Роль: ты — дизайнер-генератор Stories для health-продуктов. На вход ты получаешь итоговый отчёт анализа состава. На выход ты даёшь ОДНУ спецификацию для генерации одной Story-картинки (9:16, 1080×1920).
Ключевое требование: одинаковый отчёт → одинаковая Story. Никаких случайных элементов, никаких вариаций формулировок, один и тот же порядок блоков.

Вход:
REPORT_TEXT: финальный отчёт (структура 1–10).
PRODUCT_MOCKUP: (A) PNG мокап/вырезка продукта или (B) фото продукта или (C) отсутствует.
LANG: язык (RU).

ШАГ 1 — Извлеки данные из отчёта (строго)
Найди и зафиксируй:
Score (X.X / 10.0)
VerdictLine (короткий вердикт из отчёта, 1 строка)
VerdictCategory:
GOOD если Score ≥ 8.0
MEDIUM если 6.0 ≤ Score < 8.0
BAD если Score < 6.0

MainPoints:
GOOD: выбери ровно 3 преимущества
MEDIUM: выбери ровно 2 плюса + 2 риска (итого 4)
BAD: выбери ровно 4 риска
Правила для пунктов:
Каждый пункт 3–6 слов, без длинных фраз.
Только факты из отчёта. Ничего не придумывай.
Иконки:
плюсы начинаются с “✓”
риски начинаются с “⚠”

ШАГ 2 — Цветовой стиль (строго)
GOOD: зелёная палитра, мягкий mint-градиент + green glow по краям.
MEDIUM: тёплая янтарная палитра, песочно-бежевый→мягкий amber-градиент + amber glow по краям.
BAD: кораллово-красная палитра, светлый розово-коралловый градиент + red glow по краям.
Запрет: не использовать серый “пыльный” фон как основной.

ШАГ 3 — Композиция (фиксированная)
Картинка 1080×1920, safe-areas соблюдены.
Слои сверху вниз:
Background: мягкий градиент + лёгкий pop-паттерн (точки/волны) 3–6% opacity.
Edge Glow: подсветка по краям (цвет по категории), тонкая рамка 6–10px.
Product Mockup: снизу слева, аккуратный cutout, лёгкая тень, небольшое “floating”.
Score (главный элемент): по центру крупно “X.X” и рядом маленькое “/10”.
Score Label: под оценкой, pill-плашка: “ОЦЕНКА СОСТАВА”.
Headline: одна строка (коротко): либо “ПЛЮСЫ”, либо “ПЛЮСЫ / РИСКИ”, либо “РИСКИ”.
MainPoints block: 3–4 коротких пункта, аккуратные карточки одинакового стиля.
Bottom Slogan (2 слова): крупная стикер-плашка по центру снизу.
Micro disclaimer: очень мелко: “Оценка по составу. Не медсовет.”

ШАГ 4 — Слоган (2 слова) детерминированно
Выбери слоган ТОЛЬКО из списка по категории:
GOOD: “Чистый выбор”, “Зелёный свет”, “Можно брать”
MEDIUM: “Есть нюансы”, “Умеренно можно”, “Смотри состав”
BAD: “Сладкий разгон”, “Химозный флекс”, “Печаль состава”
Правило выбора:
Если в рисках есть сахар/сироп → BAD слоган “Сладкий разгон”, иначе “Печаль состава”.
Для MEDIUM всегда “Есть нюансы”.
Для GOOD всегда “Можно брать”.

REPORT_TEXT = """${reportText}"""
PRODUCT_MOCKUP = """User image provided"""
LANG = "RU"

--- TECHNICAL INSTRUCTION FOR JSON OUTPUT ---
Although you are a Story Designer, the application needs the output in RAW JSON format to render the UI.
Transform your "LAYOUT_SPEC" into this exact JSON structure:
{
  "spec": {
    "score": "X.X",
    "verdictCategory": "GOOD" | "MEDIUM" | "BAD",
    "shortVerdict": "VerdictLine string",
    "bulletsTitle": "Headline string (e.g. РИСКИ)",
    "bullets": ["✓ Point 1", "⚠ Point 2"],
    "slogan": "Slogan string",
    "colors": {
       "background": "#HexCodeForGradientStart", 
       "glow": "#HexCodeForEdgeGlow", 
       "accent": "#HexCodeForAccent"
    }
  }
}
Return ONLY valid JSON.
`;
      
       const response = await ai.models.generateContent({
         model,
         contents: { role: 'user', parts: [{ text: prompt }] },
         config: { responseMimeType: "application/json" }
       });

       if (response.text) {
         const json = JSON.parse(response.text);
         if (json.spec) {
            setStorySpec(json.spec);
         } else {
            // Fallback if structure varies slightly
             setStorySpec(json);
         }
       }

     } catch (e) {
       console.error("Story Gen Error:", e);
       // Fallback manual spec if AI fails
       setStorySpec({
         score: result.score,
         verdictCategory: scoreNum >= 8 ? 'GOOD' : scoreNum >= 6 ? 'MEDIUM' : 'BAD',
         shortVerdict: result.verdict,
         bulletsTitle: scoreNum >= 6 ? 'ГЛАВНОЕ' : 'РИСКИ',
         bullets: result.pros?.slice(0, 3) || [],
         slogan: 'PURESCAN AI',
         colors: {
           background: scoreNum >= 8 ? '#064e3b' : scoreNum >= 6 ? '#713f12' : '#7f1d1d',
           glow: scoreColor,
           accent: '#ffffff'
         }
       });
     } finally {
       setIsGeneratingShare(false);
     }
  };

  const handleDownloadImage = async () => {
    if (!shareRef.current) return;
    try {
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: null,
        scale: 2, 
        useCORS: true,
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `purescan-${result.productName || 'story'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Share generation failed", err);
      alert("Не удалось создать изображение.");
    }
  };

  const openShare = () => {
    setShowShareModal(true);
    generateAIStory();
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-20">
      
      {/* SHARE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm h-[85vh] flex flex-col"
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white z-50"
              >
                <X className="w-8 h-8" />
              </button>

              {/* THE STORY CARD (Rendered for capture) */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {isGeneratingShare && !storySpec ? (
                   <div className="text-center space-y-4">
                      <Sparkles className="w-12 h-12 text-brand-cyan animate-pulse mx-auto" />
                      <p className="text-brand-cyan font-mono animate-pulse">GENERATING STORY...</p>
                   </div>
                ) : (
                  <div 
                    ref={shareRef}
                    className="w-full aspect-[9/16] relative bg-[#050505] overflow-hidden shadow-2xl flex flex-col font-sans select-none"
                    style={{
                      background: `linear-gradient(160deg, ${storySpec?.colors.background || '#000'} 0%, #000 100%)`
                    }}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20" 
                         style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                    />
                    
                    {/* Glow Frame */}
                    <div className="absolute inset-0 border-[8px] border-opacity-50" style={{ borderColor: storySpec?.colors.glow }} />
                    <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />

                    {/* Product Mockup (Floating) */}
                    <div className="absolute bottom-32 -left-12 w-64 h-64 z-10 transform rotate-12">
                       {result.imageUrl ? (
                         <img src={result.imageUrl} className="w-full h-full object-cover rounded-3xl shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform" style={{ boxShadow: `0 20px 50px ${storySpec?.colors.glow}40` }} />
                       ) : (
                         <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center">
                            <Leaf className="w-20 h-20 text-white/50" />
                         </div>
                       )}
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-20 flex-1 flex flex-col p-8 pt-16">
                       
                       {/* Header Score */}
                       <div className="flex flex-col items-center mb-2">
                          <h1 className="text-8xl font-black tracking-tighter text-white drop-shadow-2xl" style={{ textShadow: `0 0 30px ${storySpec?.colors.glow}` }}>
                             {storySpec?.score}
                          </h1>
                          <div className="flex items-baseline gap-1">
                             <span className="text-xl font-bold text-white/50">/10</span>
                          </div>
                       </div>
                       
                       {/* Score Label Pill */}
                       <div className="flex justify-center mb-8">
                         <div className="px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] bg-white text-black">
                             ОЦЕНКА СОСТАВА
                         </div>
                       </div>

                       {/* Verdict */}
                       <div className="text-center mb-8 px-4">
                          <p className="text-lg font-bold text-white uppercase leading-tight drop-shadow-md">
                            {storySpec?.shortVerdict}
                          </p>
                       </div>

                       {/* Bullets */}
                       <div className="ml-auto w-3/4 space-y-3 mb-auto">
                          <h3 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2 border-b border-white/20 pb-1" style={{ color: storySpec?.colors.accent }}>
                             {storySpec?.bulletsTitle}
                          </h3>
                          {storySpec?.bullets.map((b, i) => {
                             const isRisk = b.includes('⚠');
                             return (
                               <div key={i} className={`flex items-start gap-2 backdrop-blur-sm p-2 rounded-lg border border-white/5 ${isRisk ? 'bg-red-500/10' : 'bg-black/20'}`}>
                                  {isRisk ? <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" /> : <Check className="w-4 h-4 shrink-0 text-green-400" />}
                                  <span className="text-sm font-bold text-white leading-tight">{b.replace(/[✓⚠]/g, '')}</span>
                               </div>
                             );
                          })}
                       </div>

                       {/* Slogan Badge */}
                       <div className="absolute bottom-12 right-0 left-0 flex justify-center z-30">
                          <div className="transform rotate-[-2deg] bg-white text-black font-black text-2xl uppercase italic py-2 px-6 shadow-xl border-4 border-black" style={{ boxShadow: `10px 10px 0px ${storySpec?.colors.glow}` }}>
                             {storySpec?.slogan}
                          </div>
                       </div>

                       {/* Footer */}
                       <div className="absolute bottom-4 w-full text-center left-0">
                          <p className="text-[8px] uppercase tracking-widest opacity-50 text-white">
                             Оценка по составу. Не медсовет.
                          </p>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <ButtonGlow 
                   onClick={handleDownloadImage} 
                   className="flex-1 !py-3 !text-xs !bg-brand-cyan/20 !border-brand-cyan/40"
                   disabled={!storySpec}
                >
                  <Instagram className="w-4 h-4 mr-2" /> Скачать для Stories
                </ButtonGlow>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl border-white/10"
      >
        {/* Animated Background Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-screen" />
        
        {/* Score Gauge */}
        <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
            {/* Background Circle */}
            <svg height="160" width="160" className="transform -rotate-90">
              <circle stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} fill="transparent" r={normalizedRadius} cx="80" cy="80" />
              <motion.circle
                stroke={scoreColor} strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }} strokeLinecap="round" fill="transparent" r={normalizedRadius} cx="80" cy="80"
                initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: "easeOut" }}
                className="drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <motion.span 
                 initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}
                 className="text-5xl font-bold tracking-tighter text-white"
               >
                 {result.score}
               </motion.span>
               <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Health Score</span>
            </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 text-center md:text-left z-10">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl font-bold text-white mb-2">{result.productName || 'Продукт'}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold bg-white/5 border backdrop-blur-md ${
                 result.status === 'safe' ? 'border-green-500/30 text-green-400' : 
                 result.status === 'warning' ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'
               }`}>
                 {result.status === 'safe' ? <ShieldCheck className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                 {result.verdict}
               </div>
            </div>
          </motion.div>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
             <ButtonGlow variant="secondary" onClick={onBack} className="!px-5 !py-2 !text-xs !bg-white/5 !text-white/80 !border-white/10">Назад</ButtonGlow>
             <ButtonGlow onClick={onScanNew} className="!px-6 !py-2 !text-xs !text-white !border-brand-cyan/30">Новый скан</ButtonGlow>
             <ButtonGlow onClick={openShare} className="!px-5 !py-2 !text-xs !bg-brand-purple/20 !border-brand-purple/30 !text-brand-purple hover:!bg-brand-purple/30">
               <Share2 className="w-4 h-4 mr-2 inline" /> Поделиться
             </ButtonGlow>
          </div>
        </div>
      </motion.div>

      {/* Modern Tabs */}
      <div className="flex p-1 bg-black/40 border border-white/10 rounded-2xl mb-8 backdrop-blur-xl sticky top-24 z-30 shadow-xl mx-2 md:mx-0 overflow-x-auto">
        {(['overview', 'ingredients', 'nutrients'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[100px] py-3 rounded-xl text-sm font-bold tracking-wide transition-all relative ${
              activeTab === tab ? 'text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab" 
                className="absolute inset-0 bg-gradient-to-tr from-brand-cyan to-brand-purple rounded-xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center gap-2 ${activeTab === tab ? 'text-white' : ''}`}>
               {tab === 'overview' && <Brain className="w-4 h-4" />}
               {tab === 'ingredients' && <Leaf className="w-4 h-4" />}
               {tab === 'nutrients' && <Activity className="w-4 h-4" />}
               <span className="capitalize">{tab === 'overview' ? 'Обзор' : tab === 'ingredients' ? 'Состав' : 'КБЖУ'}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Verdict */}
                <div className="glass-panel p-6 rounded-3xl md:col-span-2 relative overflow-hidden border-brand-purple/20">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/20 rounded-full blur-3xl" />
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-brand-purple">
                     <Brain className="w-6 h-6" /> AI Вердикт
                   </h3>
                   <p className="text-gray-200 leading-relaxed text-lg font-light">{result.details}</p>
                </div>

                {/* --- NEW SECTION: CRITICAL ALERTS --- */}
                {criticalRisks.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }} 
                    className="md:col-span-2 bg-red-900/10 border border-red-500/30 rounded-3xl p-6 relative overflow-hidden"
                  >
                     <div className="absolute -left-10 -top-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
                     <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-lg relative z-10">
                       <AlertTriangle className="w-5 h-5 animate-pulse" /> Критические предупреждения
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                       {criticalRisks.map((item: Additive, idx: number) => (
                         <div key={idx} className="bg-black/40 border border-red-500/20 rounded-xl p-3 flex flex-col">
                           <div className="flex justify-between items-start mb-1">
                             <span className="text-white font-bold">{item.code}</span>
                             <span className="text-[10px] bg-red-500/20 text-red-400 px-2 rounded uppercase font-bold">{item.riskLevel}</span>
                           </div>
                           <span className="text-gray-400 text-xs truncate">{item.name}</span>
                         </div>
                       ))}
                     </div>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="glass-panel p-6 rounded-3xl border-l-4 border-green-500/50 bg-green-500/5"
                >
                   <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2 text-lg">
                     <ShieldCheck className="w-5 h-5" /> Плюсы
                   </h3>
                   <ul className="space-y-3">
                     {result.pros?.map((p: string, i: number) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-black/20 p-2 rounded-lg">
                         <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {p}
                       </li>
                     ))}
                     {!result.pros?.length && <li className="text-gray-500 italic">Нет явных плюсов</li>}
                   </ul>
                </motion.div>

                <motion.div 
                  initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="glass-panel p-6 rounded-3xl border-l-4 border-red-500/50 bg-red-500/5"
                >
                   <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2 text-lg">
                     <AlertTriangle className="w-5 h-5" /> Минусы
                   </h3>
                   <ul className="space-y-3">
                     {result.cons?.map((c: string, i: number) => (
                       <li key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-black/20 p-2 rounded-lg">
                         <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" /> {c}
                       </li>
                     ))}
                     {!result.cons?.length && <li className="text-gray-500 italic">Нет явных минусов</li>}
                   </ul>
                </motion.div>
             </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-gray-400 text-sm">Найдено компонентов: {result.additives?.length || 0}</span>
                <span className="text-[10px] text-gray-600 uppercase">Нажмите для подробностей</span>
              </div>
              
              {result.additives?.length ? result.additives.map((item: Additive, i: number) => (
                <motion.div 
                  key={i} 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setExpandedAdditive(expandedAdditive === item.code ? null : item.code)}
                  className={`glass-panel rounded-2xl overflow-hidden cursor-pointer border transition-all duration-300 ${
                    expandedAdditive === item.code 
                      ? 'border-brand-cyan/40 bg-brand-cyan/5 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                      : item.riskLevel === 'high' 
                        ? 'border-red-500/40 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : item.riskLevel === 'medium' 
                          ? 'border-yellow-500/40 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                          : 'border-white/10 hover:border-brand-cyan/50 hover:bg-black/5'
                  }`}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            {/* UPDATED: Name with Color Indicator */}
                            <div className="font-bold text-white text-lg flex items-center gap-3">
                                {(item.riskLevel === 'high' || item.riskLevel === 'medium') && (
                                   <div className={`w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${
                                      item.riskLevel === 'high' ? 'bg-red-500 text-red-500' : 'bg-yellow-500 text-yellow-500'
                                   }`} />
                                )}
                                {item.name} 
                            </div>
                            
                            {/* MINI RISK PILL (List View) */}
                            <div className="flex gap-1">
                                <div className={`w-2 h-4 rounded-sm ${item.riskLevel === 'low' || item.riskLevel === 'medium' || item.riskLevel === 'high' ? 'bg-green-500' : 'bg-gray-800'}`}></div>
                                <div className={`w-2 h-4 rounded-sm ${item.riskLevel === 'medium' || item.riskLevel === 'high' ? 'bg-yellow-500' : 'bg-gray-800'}`}></div>
                                <div className={`w-2 h-4 rounded-sm ${item.riskLevel === 'high' ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">{item.code}</span>
                          <span className={`text-xs font-bold uppercase ${
                            item.riskLevel === 'high' ? 'text-red-400' : item.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {item.riskLevel === 'high' ? 'Высокий риск' : item.riskLevel === 'medium' ? 'Средний риск' : 'Безопасно'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedAdditive === item.code ? <ChevronUp className="w-5 h-5 text-gray-400 ml-4"/> : <ChevronDown className="w-5 h-5 text-gray-400 ml-4"/>}
                  </div>
                  
                  <AnimatePresence>
                    {expandedAdditive === item.code && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/20"
                      >
                         <div className="p-6 text-sm text-gray-300 border-t border-white/5">
                           
                           {/* Detailed Hazard Spectrum (Expanded View) */}
                           <div className="mb-6 relative pt-6 pb-2">
                               <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-widest font-bold absolute -top-1 w-full">
                                   <span>Безопасно</span>
                                   <span className="text-center">С осторожностью</span>
                                   <span className="text-right">Опасно</span>
                               </div>
                               
                               <div className="h-3 w-full rounded-full relative shadow-inner bg-gray-800 overflow-hidden">
                                   {/* Gradient Background */}
                                   <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 opacity-80"></div>
                               </div>

                               {/* The Pointer */}
                               <motion.div 
                                   initial={{ left: '0%' }}
                                   animate={{ left: item.riskLevel === 'high' ? '90%' : item.riskLevel === 'medium' ? '50%' : '10%' }}
                                   transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                   className="absolute top-4 w-1 h-6 bg-white shadow-[0_0_10px_white] z-10 transform -translate-x-1/2"
                               >
                                   <div className="w-3 h-3 bg-white rounded-full absolute -top-1.5 -left-1 shadow-lg border-2 border-black"></div>
                               </motion.div>
                           </div>

                           <div className="flex items-start gap-4 mb-4">
                              <div className={`p-3 rounded-xl shrink-0 ${
                                  item.riskLevel === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                                  item.riskLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                                  'bg-green-500/10 text-green-400 border border-green-500/20'
                              }`}>
                                {item.riskLevel === 'high' ? <AlertTriangle className="w-6 h-6"/> : 
                                 item.riskLevel === 'medium' ? <Info className="w-6 h-6"/> : 
                                 <ShieldCheck className="w-6 h-6"/>}
                              </div>
                              <div>
                                 <h4 className={`font-bold text-base mb-1 ${
                                    item.riskLevel === 'high' ? 'text-red-400' : 
                                    item.riskLevel === 'medium' ? 'text-yellow-400' : 
                                    'text-green-400'
                                 }`}>
                                   {item.riskLevel === 'high' ? 'Высокая токсичность' : 
                                    item.riskLevel === 'medium' ? 'Потенциальный аллерген' : 
                                    'Одобрено к употреблению'}
                                 </h4>
                                 <p className="leading-relaxed text-gray-300">
                                   {item.description}
                                 </p>
                              </div>
                           </div>

                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )) : (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-white/10 rounded-3xl">
                  Компоненты не найдены.
                </div>
              )}
            </div>
          )}

          {activeTab === 'nutrients' && (
            <div className="grid grid-cols-1 gap-6">
               <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                     <Zap className="w-6 h-6 text-yellow-500" /> Пищевая ценность (на 100г)
                  </h3>
                  
                  <div className="space-y-6">
                    {result.nutrients.map((n: any, i: number) => (
                      <div key={i} className="relative group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-200 font-bold text-lg">{n.label}</span>
                          <div className="text-right flex items-baseline gap-2">
                             <span className="font-bold text-2xl text-white tracking-tight">{n.value}</span>
                             {n.percentage && <span className="text-xs font-mono text-gray-400 bg-black/30 px-1.5 rounded">{n.percentage}%</span>}
                          </div>
                        </div>
                        
                        {/* Sleek Progress Bar */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${Math.min(n.percentage || 0, 100)}%` }}
                            transition={{ delay: 0.1 * i, duration: 1, type: "spring", stiffness: 50 }}
                            className={`h-full rounded-full relative overflow-hidden ${
                              n.status === 'good' ? 'bg-gradient-to-r from-green-600 to-green-400' : 
                              n.status === 'bad' ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'
                            }`}
                          >
                             <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                          </motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="glass-panel p-6 rounded-3xl flex items-center justify-center text-center border-t border-white/10">
                 <p className="text-sm text-gray-400">
                   * Процент от суточной нормы (ДН) рассчитан для диеты 2000 ккал.
                 </p>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};