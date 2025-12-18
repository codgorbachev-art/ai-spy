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
    const messages = ["Инициализация Gemini 3 Flash...", "OCR Чтение этикетки...", "Поиск E-добавок...", "Анализ токсичности...", "Расчет Health Score...", "Формирование отчета..."];
    let step = 0;
    const msgInterval = setInterval(() => {
      if (step < messages.length) setStatusMessage(messages[step++]);
    }, 800);

    const progInterval = setInterval(() => setProgress(p => p < 90 ? p + 2 : p), 100);

    try {
      const apiKey = process.env.API_KEY; 
      let resultData: any;

      if (apiKey) {
         try {
             const ai = new GoogleGenAI({ apiKey });
             const model = 'gemini-3-flash-preview'; 
             
             const parts: any[] = [];
             
             const systemInstruction = `
               Ты — эксперт-технолог пищевой промышленности и токсиколог.
               Проанализируй состав продукта.
               Верни JSON с полями: productName (string), status (safe/warning/danger), score (0.0-10.0 string), verdict (caps short string), details (string), nutrients (array of {label, value, status, percentage}), additives (array of {code, name, riskLevel, description}), pros (string array), cons (string array).
             `;

             if (imagePreview) {
               const base64Data = imagePreview.split(',')[1];
               const mimeType = imagePreview.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
               
               parts.push({ inlineData: { mimeType, data: base64Data }});
               parts.push({ text: "Проанализируй состав на этом фото. Верни строго валидный JSON." });
             } else {
               parts.push({ text: `Проанализируй этот состав продукта: ${ingredients || "Сахар, мука, пальмовое масло, E102"}. Верни строго валидный JSON.` });
             }

             const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                  systemInstruction: systemInstruction,
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      productName: { type: Type.STRING, description: "Название продукта" },
                      status: { type: Type.STRING, enum: ["safe", "warning", "danger"] },
                      score: { type: Type.STRING, description: "Число 0.0-10.0" },
                      verdict: { type: Type.STRING, description: "Короткий вердикт" },
                      details: { type: Type.STRING, description: "Резюме анализа" },
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
                             description: { type: Type.STRING }
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
          ...resultData
        });
      }, 500);

    } catch (e) {
      console.error("Critical Scanner Error:", e);
      setAppState(AppState.IDLE);
      // Removed alert to prevent UI blocking.
      // Reset logic implicitly handled by state remaining in IDLE or user retrying.
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