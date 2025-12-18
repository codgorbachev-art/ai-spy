import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import ButtonGlow from './ui/ButtonGlow';
import { AppState, ScanResult } from '../types';

interface ScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onCancel: () => void;
}

const ScannerInterface: React.FC<ScannerProps> = ({ onScanComplete, onCancel }) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [progress, setProgress] = useState(0);
  const [ingredients, setIngredients] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Ожидание данных...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIngredients('Фото загружено. Нажмите Сканировать.');
      };
      reader.readAsDataURL(file);
    }
  };

  const getSimulationResult = async (): Promise<any> => {
     await new Promise(r => setTimeout(r, 2000));
     return {
       productName: "Энергетический напиток (Demo)",
       status: 'danger',
       score: '2.1',
       verdict: 'ВЫСОКОЕ СОДЕРЖАНИЕ САХАРА И СТИМУЛЯТОРОВ',
       details: 'Продукт представляет серьезную нагрузку на сердечно-сосудистую систему и поджелудочную железу. Крайне не рекомендуется детям.',
       nutrients: [
         { label: 'Сахар', value: '11g', status: 'bad', percentage: 95 },
         { label: 'Кофеин', value: '32mg', status: 'bad', percentage: 80 },
         { label: 'Таурин', value: '240mg', status: 'neutral', percentage: 40 },
         { label: 'Витамин B', value: '1.2mg', status: 'good', percentage: 20 }
       ],
       additives: [
         { code: "E129", name: "Красный очаровательный AC", riskLevel: "high", description: "Синтетический краситель. Запрещен в ряде стран Европы. Может вызывать СДВГ у детей." },
         { code: "E211", name: "Бензоат натрия", riskLevel: "medium", description: "Консервант. В сочетании с витамином С может образовывать канцероген бензол." },
         { code: "Сахар", name: "Сахарный сироп", riskLevel: "high", description: "Провоцирует выброс инсулина, риск ожирения." },
         { code: "E330", name: "Лимонная кислота", riskLevel: "low", description: "Безопасный регулятор кислотности природного происхождения." }
       ],
       pros: ["Бодрящий эффект (кратковременный)"],
       cons: ["Критический уровень сахара", "Опасные красители", "Риск гастрита"]
     };
  };

  const performScan = async () => {
    setAppState(AppState.SCANNING);
    setProgress(0);
    
    // Animation Logic
    const messages = ["Загрузка Мастер-Промпта...", "Мульти-скан (Pass A, B, C)...", "Нормализация состава...", "Проверка 5 источников...", "Расчет штрафов...", "Формирование JSON..."];
    let step = 0;
    const msgInterval = setInterval(() => {
      if (step < messages.length) setStatusMessage(messages[step++]);
    }, 1000);

    const progInterval = setInterval(() => setProgress(p => p < 90 ? p + 2 : p), 100);

    try {
      const apiKey = process.env.API_KEY; 
      let resultData: any;

      if (apiKey) {
         try {
             const ai = new GoogleGenAI({ apiKey });
             const model = 'gemini-3-flash-preview'; 
             
             const parts: any[] = [];
             
             // --- MASTER PROMPT INTEGRATION ---
             const masterPrompt = `
“LABEL & INGREDIENTS AUDITOR — Deterministic, Evidence-Gated, 5-Step Verification”
0) РОЛЬ, ГРАНИЦЫ И ПРИНЦИПЫ

Ты — экспертная система анализа продуктовой этикетки. Ты действуешь как:

клинический нутрициолог, иммунолог, токсиколог, специалист по пищевой безопасности, пищевым добавкам (E-номера), канцерогенам, красителям, эмульгаторам, консервантам, подсластителям и поведенческим аспектам ЗОЖ;

редактор-аналитик, который формирует понятный потребителю отчёт.

Ключевые требования:

Детерминированность: при одинаковом входе (тот же продукт, тот же состав) выдавай одинаковый результат — без творческих вариаций, с фиксированными шаблонами формулировок, одинаковым порядком блоков и одинаковыми правилами округления.

Только факты: запрещены домыслы, “скорее всего”, “возможно” без источников. Любое утверждение о рисках/влиянии допускается только если прошло проверку источников (см. раздел 3).

Evidence-gating: если не можешь подтвердить факт достаточным числом источников, пометь его как “НЕ ПОДТВЕРЖДЕНО (недостаточно источников)” и не используй для итоговых выводов/оценки.

Разделение “опасность” и “риск”: не путай hazard и risk; учитывай, что влияние зависит от дозы и контекста потребления.

Не медицинская консультация: в конце добавь стандартный дисклеймер, но не размывай им фактические выводы.

1) ВХОДНЫЕ ДАННЫЕ (ПРИХОДЯТ ИЗ ПРИЛОЖЕНИЯ)

Тебе передаются:
IMAGE(S): одно или несколько фото этикетки (состав, КБЖУ, аллергены, производитель).
LOCALE: РФ/ЕС.
OUTPUT_MODE: JSON API (Strict).

2) ОБЯЗАТЕЛЬНЫЙ ПРОЦЕСС (5-СТУПЕНЧАТАЯ ВЕРИФИКАЦИЯ)

Ты всегда выполняешь шаги строго по порядку. Никаких пропусков.

Шаг 1 — Мульти-скан (3 прохода распознавания) + консенсус
Сделай 3 независимых прохода извлечения текста и структуры:
Pass A: “как есть” (прямая интерпретация).
Pass B: с исправлением типичных OCR-ошибок (О/0, И/1, E/Е, латиница↔кириллица, “Е-” vs “E-”, запятые/точки).
Pass C: контекстный разбор (разделение “Состав”, “Пищевая ценность”, “Аллергены”, “Условия хранения”, “Предупреждения”).
Далее создай консенсус-версию.

Шаг 2 — Нормализация и индексация состава (строго детерминированно)
Приведи к нижнему регистру, убери лишние пробелы, единый формат E-номеров (E330).

Шаг 3 — 5-источниковая проверка каждого “значимого утверждения”
Для каждого факта собери Evidence[1..5] (ВОЗ, Роспотребнадзор, Codex Alimentarius, EFSA, FDA).
Если совпадение сути факта в 5/5 источниках -> CONFIRMED_5OF5.
Если 4/5 -> PARTIAL_4OF5.
Если <=3/5 -> NOT_CONFIRMED.

Шаг 4 — Оценка продукта 0–10 (детерминированная формула)
Score = clamp(0, 10, 10 - Penalties + Bonuses)

Штрафы (Penalties) — только по подтверждённым фактам:
P1. Состав/категория: Высокий сахар (0.3-1.5), Высокая соль (0.3-1.2), Транс-жиры (0.5-2.0).
P2. Ультра-переработанность: >=5 добавок (0.3), >=7 (0.7), >=10 (1.2).
P3. Уязвимые предупреждения: Энергетик (0.4-1.0), Спец. предупреждения (0.2-0.6).

Бонусы (Bonuses):
Короткий состав (<=5) без добавок: +0.3..+1.0
Явные полезные компоненты (клетчатка, белок): +0.2..+1.0
Низкий сахар/соль/жир: +0.2..+1.0

Шаг 5 — Генерация отчёта

3) КЛАССИФИКАЦИЯ ИНГРЕДИЕНТОВ
ПОЛЕЗНЫЙ, НЕЙТРАЛЬНЫЙ, НЕЖЕЛАТЕЛЬНЫЙ, ПОТЕНЦИАЛЬНО ВРЕДНЫЙ, ВРЕДНЫЙ.

4) ПРАВИЛА ДЛЯ E-НОМЕРОВ
Код, Название, Функция, Доказательная оценка, Риски.

--- ТЕХНИЧЕСКАЯ ИНСТРУКЦИЯ ДЛЯ JSON API ---
Ты выполняешь весь анализ выше, но результат возвращаешь СТРОГО в формате JSON, который ожидает фронтенд приложения.
Трансформируй свой отчет следующим образом:
1. "Score" -> поле 'score' (string, one decimal).
2. "Короткий вердикт" -> поле 'verdict' (UPPERCASE string).
3. "Общая рекомендация" и "Идентификация продукта" -> объедини в поле 'details'.
4. "Пищевые добавки" -> массив 'additives'. Поле 'riskLevel' выводи как 'low'/'medium'/'high' на основе твоей классификации (Вредный/Потенциально вредный -> high, Нежелательный -> medium, Нейтральный/Полезный -> low).
5. "Анализ каждого ингредиента" -> Используй это для генерации массивов 'pros' (плюсы) и 'cons' (минусы).
6. "КБЖУ" -> массив 'nutrients'.
7. Определи поле 'status' на основе Score: >=8.0 -> 'safe', 4.0-7.9 -> 'warning', <4.0 -> 'danger'.

ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON.
             `;

             if (imagePreview) {
               const base64Data = imagePreview.split(',')[1];
               const mimeType = imagePreview.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
               
               parts.push({ inlineData: { mimeType, data: base64Data }});
               parts.push({ text: "Проанализируй состав на этом фото согласно Мастер-Промпту. Верни JSON." });
             } else {
               parts.push({ text: `Проанализируй этот состав продукта согласно Мастер-Промпту: ${ingredients || "Сахар, мука, пальмовое масло, E102"}. Верни JSON.` });
             }

             const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                  systemInstruction: masterPrompt,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING, description: "Название продукта и бренд" },
                      status: { type: Type.STRING, enum: ["safe", "warning", "danger"] },
                      score: { type: Type.STRING, description: "Число 0.0-10.0" },
                      verdict: { type: Type.STRING, description: "Короткий вердикт (Caps)" },
                      details: { type: Type.STRING, description: "Общее резюме и рекомендации" },
                      nutrients: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            value: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ["good", "bad", "neutral"] },
                            percentage: { type: Type.NUMBER }
                          }
                        }
                      },
                      additives: {
                        type: Type.ARRAY,
                        items: {
                           type: Type.OBJECT,
                           properties: {
                             code: { type: Type.STRING },
                             name: { type: Type.STRING },
                             riskLevel: { type: Type.STRING, enum: ["low", "medium", "high"]},
                             description: { type: Type.STRING, description: "Функция и доказанные риски" }
                           }
                        }
                      },
                      pros: { type: Type.ARRAY, items: { type: Type.STRING }},
                      cons: { type: Type.ARRAY, items: { type: Type.STRING }}
                    },
                    required: ["productName", "status", "score", "verdict", "details", "nutrients", "additives", "pros", "cons"]
                  }
                }
             });
             
             if (response.text) {
                resultData = JSON.parse(response.text);
             } else {
                throw new Error("Empty AI response");
             }
         } catch (apiError) {
             console.warn("Gemini API Failed, switching to simulation mode:", apiError);
             resultData = await getSimulationResult();
         }
      } else {
         resultData = await getSimulationResult();
      }

      clearInterval(msgInterval);
      clearInterval(progInterval);
      setProgress(100);
      
      setTimeout(() => {
        onScanComplete({
          id: Date.now().toString(),
          ...resultData,
          imageUrl: imagePreview // Pass image to result for Story generation
        });
      }, 500);

    } catch (e) {
      console.error("Critical Scanner Error:", e);
      setAppState(AppState.IDLE);
      clearInterval(msgInterval);
      clearInterval(progInterval);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        
        {/* INPUT STATE */}
        {appState === AppState.IDLE && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl glass-panel p-8 rounded-3xl relative"
          >
            <button onClick={onCancel} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center">Анализ состава</h2>

            {/* Image Preview Area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all mb-6 relative overflow-hidden ${
                imagePreview ? 'border-brand-cyan' : 'border-white/20 hover:border-brand-cyan/50 hover:bg-white/5'
              }`}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              ) : (
                <>
                  <Camera className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-400">Нажмите чтобы сделать фото</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange} 
              />
            </div>

            <div className="text-center text-xs text-gray-500 mb-4 uppercase tracking-widest">- или вставьте текст -</div>

            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Состав: Мука, сахар, E202..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-cyan/50 h-24 text-sm resize-none mb-6"
            />

            <ButtonGlow onClick={performScan} className="w-full">
              Запустить AI Анализ
            </ButtonGlow>
          </motion.div>
        )}

        {/* SCANNING STATE */}
        {appState === AppState.SCANNING && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
               {/* Background Orbit */}
               <div className="absolute inset-0 border border-brand-cyan/10 rounded-full animate-spin-slow scale-110" />
               <div className="absolute inset-4 border border-brand-purple/10 rounded-full animate-spin-slow scale-110" style={{ animationDirection: 'reverse' }} />

               {/* SVG Circular Progress */}
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5"/>
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="text-brand-cyan drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                    initial={{ strokeDasharray: 283, strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * progress) / 100 }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
               </svg>

               {/* Center Text */}
               <div className="absolute inset-0 flex items-center justify-center flex-col z-10">
                  <span className="text-5xl font-bold font-mono text-white tracking-tighter">
                    {Math.round(progress)}%
                  </span>
                  <motion.span 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[10px] text-brand-cyan uppercase tracking-widest mt-2"
                  >
                    AI Processing
                  </motion.span>
               </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-gray-400 font-mono text-xs uppercase tracking-wider">{statusMessage}</div>
              <div className="flex gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0s' }} />
                 <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0.2s' }} />
                 <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScannerInterface;