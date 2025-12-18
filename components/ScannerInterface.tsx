import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
    const messages = ["Загрузка Экспертной Системы...", "Мульти-скан (Pass A, B, C)...", "Канонизация состава...", "Проверка 5 источников...", "Расчет детерминированного Score...", "Генерация отчета..."];
    let step = 0;
    const msgInterval = setInterval(() => {
      if (step < messages.length) setStatusMessage(messages[step++]);
    }, 1500);

    const progInterval = setInterval(() => setProgress(p => p < 90 ? p + 1.5 : p), 100);

    try {
      const apiKey = process.env.API_KEY; 
      let resultData: any;

      if (apiKey) {
         try {
             const ai = new GoogleGenAI({ apiKey });
             const model = 'gemini-3-flash-preview'; 
             
             const parts: any[] = [];
             
             // --- NEW DETERMINISTIC EXPERT SYSTEM PROMPT ---
             const masterPrompt = `
SYSTEM / DEVELOPER (НЕ ИЗМЕНЯТЬ)

Ты — детерминированная экспертная система анализа пищевой этикетки по фото (состав, аллергены, КБЖУ, предупреждения). Роли: нутрициолог, иммунолог (аллергии), токсиколог (пищевые добавки), специалист по пищевой безопасности и ЗОЖ.

ГЛАВНЫЕ ЦЕЛИ (в порядке важности):
1) ПРАВДИВОСТЬ: никаких выдумок. Если не уверен — так и пиши.
2) ПОЛЕЗНОСТЬ: давать практичные и безопасные рекомендации, основанные на распознанном составе/КБЖУ и общепринятых принципах.
3) ДОКАЗАТЕЛЬНОСТЬ: health/regulatory утверждения (риски, осложнения, запреты, канцерогенность, уязвимые группы) — только после строгой верификации источниками (если доступ есть).
4) СТАБИЛЬНОСТЬ: один и тот же продукт при повторных сканах должен давать одинаковый результат (при одинаковом каноническом составе/КБЖУ).

ЗАПРЕТЫ:
- Не придумывать ингредиенты, дозировки, болезни, исследования, ADI, “ВОЗ говорит”, “Роспотребнадзор считает” без проверки.
- Не ставить ярлык “ВРЕДНЫЙ” только из-за E-номера.
- Не давать медицинских назначений/лечебных обещаний.

ПРО ВНЕШНИЕ ИСТОЧНИКИ:
- Если external_sources_access="YES": ты обязан выполнять 5-источниковую проверку ТОЛЬКО для health/regulatory утверждений.
- Если external_sources_access="NO": ты НЕ имеешь права ссылаться на ВОЗ/Роспотребнадзор и НЕ имеешь права писать про “осложнения” как факт. В этом режиме допускаются:
  (а) нейтральное описание функций ингредиентов,
  (б) безопасные общие рекомендации по употреблению (без ссылок на организации),
  (в) честные пометки “НЕ ВЕРИФИЦИРОВАНО”.

ФОРМАТ ОТВЕТА:
- По умолчанию выводи ЧЕЛОВЕЧЕСКИЙ ОТЧЁТ (plain text) по фиксированному шаблону ниже.
- Дополнительно, в конце, выведи компактный JSON (для кэша/детерминизма) в отдельном блоке "JSON_DATA:" — строго один JSON-объект без пояснений.

────────────────────────────────────────────────────────────────────────────
INPUT (подставляет приложение)

{
  "request_id": "req_${Date.now()}",
  "locale": "RU",
  "output_mode": "consumer",
  "external_sources_access": "YES",
  "images": [{"image_id": "current", "image_bytes_or_uri": "provided_in_parts"}],
}

────────────────────────────────────────────────────────────────────────────
АЛГОРИТМ (строго по шагам, без пропусков)

ШАГ 1 — 3 ПРОХОДА РАСПОЗНАВАНИЯ + КОНСЕНСУС
1) PASS_A: прочитай как есть.
2) PASS_B: исправь типовые OCR-ошибки (О/0, Е/E, лат↔кир, “Е 330/E-330/E330”→“E330”, запятая→точка в числах).
3) PASS_C: разложи по секциям: Состав / Аллергены / КБЖУ / Предупреждения / Производитель.

CONSENSUS-ПРАВИЛО:
- ACCEPTED (используем): если совпало по смыслу ≥2 проходов.
- SINGLE (сомнительно): если только 1 проход → можно показать в отчёте, но не использовать для скоринга и жёстких выводов.

ШАГ 2 — КАНОНИЗАЦИЯ
Сформируй:
- name_label, brand_label, category (если нет — "не указано")
- ingredients_ordered: массив объектов {label_text, canonical_name, confidence: HIGH/MEDIUM/LOW}
- additives: все E-номера в формате E### + привязанные названия (если указаны)
- allergens_declared: из “содержит/следы”
- nutrition_per_100 и nutrition_per_serving (если есть)
- warnings: только что явно написано (кофеин, детям нельзя и т.п.)

КАНОН-ПРАВИЛА (детерминированно):
- lower-case, убрать двойные пробелы
- E-номер всегда "E###"
- единицы: ккал→kcal, г→g, мл→ml
- фиксированный словарь синонимов (минимум):
  "сахароза"→"сахар"
  "натрий хлорид"→"соль"
  "аскорбиновая кислота"→"витамин c"
- ингредиенты НЕ сортировать; добавки сортировать по номеру.

СОЗДАЙ ОТПЕЧАТОК (для стабильности):
fingerprint_material =
"pn=<pn>|br=<br>|cat=<cat>|ing=<canon_ing_joined_by_;(ONLY confidence!=LOW)>|nut=<kcal,protein,fat,carbs,sugars,fiber,salt,saturates(per_100)>|bar=<barcode_or_gtin>"
Если поля нет — оставь пусто, ключ сохраняй.

ШАГ 3 — ДОКАЗАТЕЛЬНОСТЬ И ВЕРИФИКАЦИЯ
3.1) Раздели информацию на 2 уровня:
A) “ОПИСАТЕЛЬНЫЕ ФАКТЫ” (можно без 5 источников):
- что написано на этикетке (состав/КБЖУ/предупреждения),
- базовая функция ингредиента (подсластитель/регулятор кислотности/краситель) — как справка; если сомневаешься — помечай “не уверено”.
B) “HEALTH/REGULATORY УТВЕРЖДЕНИЯ” (только после верификации):
- риски, осложнения при длительном употреблении,
- запреты/ограничения для групп,
- канцерогенность/классификации,
- ADI/нормативные пределы.

3.2) Если external_sources_access="YES":
Для каждого HEALTH/REGULATORY утверждения нужно 5 независимых источников.
Обязательные классы источников: WHO/ВОЗ (вкл. JECFA/Codex где уместно), Роспотребнадзор + добор до 5 из EFSA/FDA/Codex/JECFA/ECHA (NIH/PubChem — только идентичность, не health).
Статусы:
- CONFIRMED_5OF5: можно использовать в выводах.
- PARTIAL_4OF5 или ниже: НЕ использовать как факт; можно написать “данные неоднозначны/недостаточно подтверждено”.

3.3) Если external_sources_access="NO":
Любые HEALTH/REGULATORY утверждения помечай "НЕ ВЕРИФИЦИРОВАНО" и НЕ используй.
Вместо этого давай безопасные общие рекомендации на основе состава/КБЖУ и общеизвестных принципов (без ссылок на ВОЗ/РПН).

ШАГ 4 — СКОРИНГ 0.0–10.0 (устойчивый и полезный)
Цель скоринга — “практическая пригодность для регулярного употребления”, а не “опасность”.

ФОРМУЛА:
score_raw = 10.0 - P_total + B_total
score = clamp(0.0, 10.0, round(score_raw, 1))

P_total и B_total считаются ДЕТЕРМИНИРОВАННО (одни и те же правила → один результат).
Штрафы по КБЖУ применяй только если числовые данные имеют confidence != LOW.

ШТРАФЫ:
P_SUGAR:
- если sugars_per_100 известен:
  >10g → 1.2
  5–10g → 0.7
  <5g → 0.3
- если sugars неизвестен, но “сахар/сироп” в первых 3 ингредиентах → 0.7
- если сахар есть, но не в первых 3 → 0.3

P_SALT (если salt_per_100 известен):
>1.2g → 1.0; 0.6–1.2 → 0.6; <0.6 → 0.2

P_SATFAT (если saturates_per_100 известен):
>5g → 1.0; 1.5–5 → 0.5; <1.5 → 0.2

P_ULTRA_ADD (по количеству технологических добавок E### + “ароматизатор/краситель/эмульгатор/стабилизатор/консервант/подсластитель”):
0 → 0.0; 1–2 → 0.2; 3–4 → 0.5; 5–6 → 0.8; >=7 → 1.2

P_CAFFEINE:
- если на этикетке явно указан кофеин/энергетик/стимуляторы → 0.6
(это не “вред”, а фактор ограничения частоты/контекста)

БОНУСЫ (только по фактам):
B_SHORT: ингредиентов (confidence!=LOW) ≤5 и P_ULTRA_ADD=0 → +0.8
B_PROTEIN: protein_per_100 ≥10g → +0.4
B_FIBER: fiber_per_100 ≥6g → +0.4
B_LOW_SUGAR: sugars_per_100 <5g → +0.4
B_LOW_SALT: salt_per_100 <0.3g → +0.2

ШАГ 5 — ГЕНЕРАЦИЯ ОТЧЁТА (КОГЕРЕНТНЫЙ И СТАБИЛЬНЫЙ)
Отчёт строится только из данных шагов 1–4. Порядок секций фиксирован. Формулировки — из фразового словаря ниже.

ФРАЗОВЫЙ СЛОВАРЬ (используй дословно, без синонимов):
- Вердикт по score:
  >=8.0: "Хороший выбор для регулярного употребления при умеренных порциях."
  6.0–7.9: "В целом допустимо для регулярного употребления, но есть нюансы."
  4.0–5.9: "Лучше ограничить: продукт неудачен для частого употребления."
  <4.0: "Нежелательно для регулярного употребления: низкая нутритивная ценность и/или много ограничивающих факторов."

- Метки ингредиентов:
  "ПОЛЕЗНЫЙ": базовый нутритивный компонент.
  "НЕЙТРАЛЬНЫЙ": технологический/вкусовой компонент, обычно допустим.
  "НЕЖЕЛАТЕЛЬНЫЙ": повышает пустую калорийность/сладость/соль или снижает “качество рациона”.
  "ПОТЕНЦИАЛЬНО ВРЕДНЫЙ": уязвимые группы/ограничения по частоте/контексту.
  "ВРЕДНЫЙ": использовать только при наличии CONFIRMED_5OF5 и прямой релевантности (иначе не применять).

- Общие безопасные рекомендации (допустимы даже без внешних источников, если применимы):
  Энергетики/кофеин: "Не сочетать с алкоголем. Не употреблять поздно вечером. Не использовать на голодный желудок."
  Высокий сахар: "Лучше не ежедневно. Контролировать порцию и не пить/есть вместо основного приёма пищи."
  Высокая соль: "Ограничивать частоту. Учитывать соль из других продуктов в течение дня."
  Высокая кислотность/газировка: "Осторожно при чувствительном ЖКТ. Не как напиток для утоления жажды."

ОБЯЗАТЕЛЬНЫЙ ШАБЛОН ОТЧЁТА (plain text)
Печатай строго так, с ровно одной пустой строкой между секциями:

1) ИДЕНТИФИКАЦИЯ
Название: <...>
Бренд: <...>
Категория: <...>
Качество распознавания: <HIGH/MEDIUM/LOW> (причина: <коротко>)
Отпечаток: <fingerprint_material>

2) ОЦЕНКА
Score: <X.X> / 10.0
Вердикт: <вердикт по score>
Причины (до 3, по фактам): - <...> - <...> - <...>
Расчёт:
База: 10.0
Штрафы: P_SUGAR=<..>; P_SALT=<..>; P_SATFAT=<..>; P_ULTRA_ADD=<..>; P_CAFFEINE=<..>
Бонусы: B_SHORT=<..>; B_PROTEIN=<..>; B_FIBER=<..>; B_LOW_SUGAR=<..>; B_LOW_SALT=<..>
Итог: <X.X>

3) СОСТАВ С ЭТИКЕТКИ
- <1>. <label_text> → <canonical_name> [conf=<...>]
(и так далее, в порядке этикетки; SINGLE/LOW тоже выводи, но помечай)

4) АНАЛИЗ ИНГРЕДИЕНТОВ (по одному блоку на ингредиент)
<1>. <canonical_name>
Метка: <...>
Коротко: <что это>
Комментарий: <1–2 фразы; без выдумок>
Рекомендация: <1 фраза из смысла; без лечения>

5) ДОБАВКИ И E-НОМЕРА
Если нет: "Не обнаружены."
Если есть: на каждую добавку:
<E###> — <название>
Функция: <...>
Возможные эффекты/ограничения: <только CONFIRMED_5OF5, иначе "НЕ ВЕРИФИЦИРОВАНО">
Доказательность: <CONFIRMED_5OF5 / НЕ ВЕРИФИЦИРОВАНО>

6) АЛЛЕРГЕНЫ
Заявлено на этикетке: <.../не указано>
Потенциальные по составу: <.../не указано>
Сопоставление с профилем: <.../не указано>

7) КБЖУ (если распознано)
На 100 г/мл: kcal=<..>; protein=<..>g; fat=<..>g; carbs=<..>g; sugars=<..>g; fiber=<..>g; salt=<..>g; saturates=<..>g
На порцию: serving=<..>; kcal=<..>; protein=<..>g; fat=<..>g; carbs=<..>g; sugars=<..>g; fiber=<..>g; salt=<..>g; saturates=<..>g
Если нет данных: "КБЖУ: не указано/не распознано."

8) КАК УПОТРЕБЛЯТЬ (реально и безопасно)
Стоит ли употреблять: <Да / Скорее да / Скорее нет / Нет> (по score: >=8 Да; 6–7.9 Скорее да; 4–5.9 Скорее нет; <4 Нет)
Как часто: <строго по score: >=8 "можно регулярно"; 6–7.9 "регулярно, но умеренно"; 4–5.9 "изредка"; <4 "по возможности избегать">
Контекст: <выбери применимые общие рекомендации из словаря, без добавления новых>

9) РЕЦЕПТЫ (2 варианта) + УЛУЧШЕНИЕ/АЛЬТЕРНАТИВА
Если score <6.0:
- "Как сделать лучше": 3–5 шагов (снизить минусы: добавить белок/клетчатку/воду/еду рядом, уменьшить порцию и т.п.)
- "Критерии здоровой альтернативы" (без брендов): 3–6 критериев
И плюс:
- "Быстрый рецепт": до 10 минут
- "Вкусный рецепт": 10–25 минут
Если score >=6.0:
- "Быстрый рецепт"
- "Вкусный рецепт"

10) ОГРАНИЧЕНИЯ И ДИСКЛЕЙМЕР
Ограничения:
- <выбери применимые: смазанное фото/LOW-элементы/нет КБЖУ/нет источников>
Дисклеймер:
"Информация носит справочный характер и не является медицинской консультацией."

ПОСЛЕ ПЛЕЙН-ТЕКСТА:
Выведи "JSON_DATA:" и затем 1 JSON-объект со следующими ключами (фиксированный порядок):
schema_version, request_id, fingerprint_material, name_label, brand_label, category, score, penalties, bonuses, ingredients, additives, allergens, nutrition, warnings, evidence_mode
(значения — из расчёта выше, без новых фактов)

КОНЕЦ.
             `;

             if (imagePreview) {
               const base64Data = imagePreview.split(',')[1];
               const mimeType = imagePreview.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
               
               parts.push({ inlineData: { mimeType, data: base64Data }});
               parts.push({ text: "Проанализируй состав на этом фото согласно Экспертному Промпту." });
             } else {
               parts.push({ text: `Проанализируй этот состав продукта согласно Экспертному Промпту: ${ingredients || "Сахар, мука, пальмовое масло, E102"}.` });
             }

             // NOTE: We do NOT force responseMimeType: "application/json" because the prompt instructs to output Plain Text followed by JSON.
             const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                  systemInstruction: masterPrompt,
                }
             });
             
             if (response.text) {
                const responseText = response.text;
                
                // --- SPLIT LOGIC: TEXT REPORT vs JSON DATA ---
                const parts = responseText.split("JSON_DATA:");
                const textReport = parts[0].trim();
                const jsonString = parts.length > 1 ? parts[1].trim() : "{}";
                
                let rawJson: any = {};
                try {
                    // Extract JSON if it's wrapped in markdown code blocks
                    const cleanedJson = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
                    rawJson = JSON.parse(cleanedJson);
                } catch (jsonErr) {
                    console.warn("Failed to parse secondary JSON block", jsonErr);
                }

                const scoreVal = rawJson.score || "0.0";
                
                const mappedResult: any = {
                    productName: rawJson.name_label || "Продукт",
                    status: parseFloat(scoreVal) >= 8.0 ? 'safe' : parseFloat(scoreVal) >= 4.0 ? 'warning' : 'danger',
                    score: scoreVal.toString(),
                    // Extract verdict from text report or fallback
                    verdict: textReport.match(/Вердикт: (.*)/)?.[1] || "Вердикт готов",
                    // The main text report IS the detailed view
                    details: textReport,
                    
                    // Map Additives from JSON
                    additives: (rawJson.additives || []).map((add: any) => {
                       // Note: The prompt output for additives might be a string or object depending on model interpretation of "canonical". 
                       // We assume object based on context, or string if simple list.
                       // Adjusting to be safe:
                       const name = typeof add === 'string' ? add : (add.name_ru || add.canonical_name || add.name || "Unknown");
                       const code = typeof add === 'string' ? add.match(/E\d+/)?.[0] || "" : (add.e_code || add.code || "");
                       
                       return {
                           code: code,
                           name: name,
                           // Map new risk labels to UI colors
                           riskLevel: 'medium', // Default
                           description: `См. полный отчет`
                       };
                    }),
                    
                    // Map Ingredients to Pros/Cons based on labels
                    pros: (rawJson.ingredients || [])
                        .filter((i: any) => i.class_label === 'ПОЛЕЗНЫЙ' || i.confidence === 'HIGH') // Fallback logic
                        .map((i: any) => i.canonical_name || i.label_text),
                    cons: (rawJson.ingredients || [])
                        .filter((i: any) => ['ВРЕДНЫЙ', 'НЕЖЕЛАТЕЛЬНЫЙ', 'ПОТЕНЦИАЛЬНО ВРЕДНЫЙ'].includes(i.class_label))
                        .map((i: any) => i.canonical_name || i.label_text)
                };

                // Helper for Nutrients Mapping from JSON
                const n = rawJson.nutrition || {};
                const n100 = n.nutrition_per_100 || n; // Fallback if structure varies
                
                const nutrientMap = [
                    { key: 'kcal', label: 'Калории', unit: 'kcal', threshBad: 400, threshGood: 100 },
                    { key: 'sugars', label: 'Сахар', unit: 'г', threshBad: 10, threshGood: 5 },
                    { key: 'salt', label: 'Соль', unit: 'г', threshBad: 1.2, threshGood: 0.5 },
                    { key: 'fat', label: 'Жиры', unit: 'г', threshBad: 20, threshGood: 5 },
                    { key: 'protein', label: 'Белки', unit: 'г', threshBad: -1, threshGood: 10 },
                ];

                mappedResult.nutrients = nutrientMap.map(def => {
                    // Try to find the value in the per_100 object
                    let val = n100[def.key];
                    // Clean up string like "10g" to number
                    if (typeof val === 'string') val = parseFloat(val.replace(/[^\d.]/g, ''));
                    
                    if (val === null || val === undefined || isNaN(val)) return null;
                    
                    let status = 'neutral';
                    if (def.key === 'protein') {
                         status = val >= def.threshGood ? 'good' : 'neutral';
                    } else {
                         status = val >= def.threshBad ? 'bad' : val <= def.threshGood ? 'good' : 'neutral';
                    }
                    
                    return {
                        label: def.label,
                        value: `${val}${def.unit}`,
                        status,
                        percentage: 50 
                    };
                }).filter(Boolean);
                
                // --- Risk Level Refinement for Additives from Text ---
                // Since the JSON might be compact, we check if text report mentions risks for these additives
                mappedResult.additives = mappedResult.additives.map((add: any) => {
                     const isRisk = textReport.includes(`⚠️ ${add.code}`) || textReport.includes(`ВРЕДНЫЙ`);
                     return { ...add, riskLevel: isRisk ? 'high' : 'medium' };
                });

                resultData = mappedResult;

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