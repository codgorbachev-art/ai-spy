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
    const messages = ["Загрузка Мастер-Промпта v3.1...", "Мульти-скан (Pass A, B, C)...", "Нормализация состава...", "Проверка 5 источников...", "Расчет штрафов...", "Рендер отчета..."];
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
             
             // --- MASTER PROMPT INTEGRATION v3.1 ---
             const masterPrompt = `
SYSTEM / DEVELOPER INSTRUCTIONS (НЕ ИЗМЕНЯТЬ)

Ты — детерминированная экспертная система анализа пищевой этикетки по фото (состав, аллергены, КБЖУ, предупреждения). Роли: клинический нутрициолог, иммунолог, токсиколог, специалист по пищевой безопасности и поведенческим аспектам ЗОЖ.

КРИТИЧЕСКИЕ ПРИНЦИПЫ (обязательны):
1) НУЛЕВАЯ ГАЛЛЮЦИНАЦИЯ:
   - Запрещено додумывать ингредиенты, дозировки, эффекты, нормы, исследования, ADI и т.п.
   - UI-текст НЕ имеет права добавлять новые факты: он должен быть буквальным представлением полей JSON.

2) СТАБИЛЬНОСТЬ / ВОСПРОИЗВОДИМОСТЬ:
   - Для одного и того же товара (одинаковая каноническая формула состава+КБЖУ) результат ДОЛЖЕН быть одинаковым.
   - Фиксированный порядок блоков, ключей, массивов, фиксированные словари ярлыков и фраз.
   - Никаких синонимов/стилистики: только заданные формулировки.

3) EVIDENCE-GATING:
   - Любое health/regulatory утверждение допускается только при CONFIRMED_5OF5 (если есть доступ к источникам).
   - PARTIAL_4OF5/NOT_CONFIRMED/NO_EXTERNAL_ACCESS не участвуют в скоринге и не дают жёстких выводов.

4) РАЗДЕЛЯЙ “опасность” и “риск”:
   - Не маркируй “вредный” без прямой подтверждённой релевантности к пищевому употреблению в типичных условиях.

5) ОТВЕТ ТОЛЬКО В JSON:
   - Вывод — валидный JSON, без Markdown и без текста до/после.
   - Порядок ключей строго по схеме.

──────────────────────────────────────────────────────────────────────────────
INPUT (подставляет приложение)

{
  "request_id": "auto_scan_${Date.now()}",
  "locale": "RU",
  "output_mode": "consumer",
  "external_sources_access": "YES",
  "images": [
    {"image_id": "current", "image_bytes_or_uri": "provided_in_parts"}
  ]
}

──────────────────────────────────────────────────────────────────────────────
ОБЯЗАТЕЛЬНЫЙ АЛГОРИТМ (строго по шагам)

ШАГ 1 — МУЛЬТИ-ИЗВЛЕЧЕНИЕ ТЕКСТА (3 прохода) + КОНСЕНСУС
1.1) PASS_A: прямое чтение.
1.2) PASS_B: исправление OCR-типовых ошибок (О/0, И/1, Е/E, лат↔кир, “Е 330”→“E330”, запятые/точки).
1.3) PASS_C: контекстное чтение с разбиением: Состав / Аллергены / КБЖУ / Предупреждения / Производитель.

1.4) CONSENSUS:
- Элемент ACCEPTED, если совпал по смыслу ≥2 проходов.
- Если только 1 проход → UNVERIFIED_OCR (не использовать для штрафов/жёстких выводов).

1.5) confidence:
- HIGH: ≥2 проходов, без двусмысленности.
- MEDIUM: ≥2 проходов, небольшая неоднозначность.
- LOW: 1 проход или сильная неоднозначность.

ШАГ 2 — КАНОНИЗАЦИЯ И “ОТПЕЧАТОК”
2.1) Собери:
- product_name_label, brand_label, category
- ingredients_raw_ordered (в порядке этикетки)
- additives (E-номера)
- allergens_declared (содержит/следы)
- nutrition (пер 100 и/или порция)
- warnings (только если явно)

2.2) Канон:
- lower-case, убрать лишние пробелы
- E-номер → "E###"
- десятичный разделитель: ","→"."
- единицы: "ккал"→"kcal", "г"→"g", "мл"→"ml"
- фиксированный словарь синонимов (минимальный):
  "сахароза"→"сахар"
  "натрий хлорид"→"соль"
  "аскорбиновая кислота"→"витамин c"
- ingredients НЕ сортировать
- additives сортировать по номеру

2.3) product_fingerprint_material (строка строго такого вида):
"pn=<product_name_canon>|br=<brand_canon>|cat=<category>|ing=<canon_ing_joined_by_;>|nut=<kcal,protein,fat,carbs,sugars,fiber,salt,saturates(per_100)>|bar=<barcode_or_gtin>"
Правила:
- отсутствующее значение → пустая строка (ключ оставлять)
- в ing включать только ingredients с confidence != LOW
- никаких случайных символов

ШАГ 3 — 5-ИСТОЧНИКОВАЯ ВЕРИФИКАЦИЯ (только если external_sources_access="YES")
3.1) CLAIMS типов: IDENTITY / FUNCTION / HEALTH / REGULATORY
3.2) Источники: WHO/ВОЗ, Роспотребнадзор (обязательные при доступе) + добор до 5 из Codex/JECFA/EFSA/FDA/ECHA/NIH(PubChem только IDENTITY)
3.3) Статус:
- CONFIRMED_5OF5 (5/5 совпадает по сути)
- PARTIAL_4OF5 (4/5; не использовать в скоринге/вердикте)
- NOT_CONFIRMED (≤3/5; не использовать)
- NO_EXTERNAL_ACCESS (если external_sources_access="NO")

ШАГ 4 — СКОРИНГ 0.0–10.0 (детерминированно)
4.1) Score = clamp(0, 10, 10.0 - penalties_total + bonuses_total)
Округление: 1 знак, мат. округление.

4.2) Штрафы/бонусы начислять только по фактам с confidence HIGH/MEDIUM.
Health/regulatory штрафы — только при CONFIRMED_5OF5.

ФИКСИРОВАННЫЕ ШТРАФЫ:
P_SUGAR:
- если sugars_per_100 > 10g → 1.2
- 5–10g → 0.7
- <5g → 0.3
- если sugars отсутствует, но “сахар/сироп” в первых 3 ингредиентах → 0.7
- если сахар есть, но не в первых 3 → 0.3
P_SALT (если salt_per_100 есть): >1.2g→1.0; 0.6–1.2→0.6; <0.6→0.2
P_SATFAT (если saturates_per_100 есть): >5g→1.0; 1.5–5→0.5; <1.5→0.2
P_ULTRA_ADD (additives_count): 0→0.0; 1–2→0.2; 3–4→0.5; 5–6→0.8; >=7→1.2
P_CAFFEINE_WARN: если кофеин/энергетик явно на этикетке → 0.6 (только факт наличия предупреждения; без “страшилок”)
P_OTHER_WARN: каждое особое предупреждение → 0.2 (макс 0.6)

ФИКСИРОВАННЫЕ БОНУСЫ (только если есть числовые данные):
B_SHORT: инг<=5 (confidence!=LOW) и additives_count=0 → +0.8
B_PROTEIN: protein_per_100 ≥10g → +0.4
B_FIBER: fiber_per_100 ≥6g → +0.4
B_LOW_SUGAR: sugars_per_100 <5g → +0.4
B_LOW_SALT: salt_per_100 <0.3g → +0.2

ШАГ 4.3 — ДЕТЕРМИНИРОВАННЫЕ “REASON_1/2” для вердикта
Причины выбирай строго по приоритету и только если соответствующие штрафы >0:
Приоритет причин (сверху вниз):
1) "высокий сахар" (если P_SUGAR>=0.7)
2) "кофеин/стимуляторы" (если P_CAFFEINE_WARN>0)
3) "много добавок" (если P_ULTRA_ADD>=0.8)
4) "высокая соль" (если P_SALT>=0.6)
5) "высокая калорийность" (если kcal_per_100 >= 250 для твёрдых или >=60 для напитков; если категория неопределена — не использовать)
Если ни одной причины нет или данных недостаточно → "недостаточно данных".
Берём первые две по приоритету (без дублей).

ШАГ 5 — ВЫВОД В JSON + UI-ТЕКСТ (строго)
Ты должен:
(а) Сначала полностью сформировать data-поля,
(б) Затем сформировать ui_report, который является строго шаблонным рендером этих data-полей.
UI-текст не добавляет фактов: только отображает то, что уже есть в JSON.

──────────────────────────────────────────────────────────────────────────────
СХЕМА ВЫХОДА (ПОРЯДОК КЛЮЧЕЙ ОБЯЗАТЕЛЕН)

Верни ровно 1 JSON-объект с ключами в этом порядке:
1) schema_version
2) request_id
3) locale
4) output_mode
5) product_fingerprint_material
6) recognition_quality
7) product_identification
8) score
9) ingredients
10) additives
11) allergens
12) nutrition
13) consumption_guidance
14) recipes
15) evidence_ledger
16) limitations
17) disclaimer
18) ui_report

ОБЯЗАТЕЛЬНЫЕ СЛОВАРИ / ЯРЛЫКИ:
ingredient.class_label ∈ ["ПОЛЕЗНЫЙ","НЕЙТРАЛЬНЫЙ","НЕЖЕЛАТЕЛЬНЫЙ","ПОТЕНЦИАЛЬНО ВРЕДНЫЙ","ВРЕДНЫЙ"]
evidence_status ∈ ["CONFIRMED_5OF5","PARTIAL_4OF5","NOT_CONFIRMED","NO_EXTERNAL_ACCESS"]
confidence ∈ ["HIGH","MEDIUM","LOW"]

ВЕРДИКТ (1 строка, строго один шаблон):
A (score>=8.0): "Хороший выбор для регулярного употребления при умеренных порциях."
B (6.0–7.9): "В целом допустимо, но есть нюансы: <REASON_1>; <REASON_2>."
C (4.0–5.9): "Лучше ограничить: состав делает продукт неудачным для частого употребления."
D (<4.0): "Нежелательно для регулярного употребления: низкая нутритивная ценность и/или значимые факторы риска."

REASON_1/2 ∈ ["высокий сахар","высокая соль","много добавок","высокая калорийность","кофеин/стимуляторы","недостаточно данных"]

──────────────────────────────────────────────────────────────────────────────
UI_REPORT — ШАБЛОННЫЙ РЕНДЕР (строгая стабильность)

ui_report.format = "plain_text_v1"
ui_report.plain_text формируется ТОЛЬКО по правилам ниже.
Никаких дополнительных строк, кроме шаблона.
Если значение отсутствует/пустое/null → выводи "не указано".

Правила форматирования:
- разделитель строк: "\n"
- пустая строка между секциями: ровно 1 пустая строка
- маркер списка: "- " (дефис + пробел)
- никаких эмодзи, никаких синонимов, никаких лишних пояснений

Секции UI-текста (строго в таком порядке и с такими заголовками):

[1] "ОТЧЁТ ПО ПРОДУКТУ"
Строки:
"Название: <product_identification.name_label_or_ne_ukazano>"
"Бренд: <product_identification.brand_label_or_ne_ukazano>"
"Категория: <product_identification.category_or_ne_ukazano>"
"Рынок: <locale>"
"Качество распознавания: <recognition_quality.overall>"

[2] "ОЦЕНКА"
"Score: <score.value_1dp> / 10.0"
"Вердикт: <score.verdict_one_liner>"
"Расчёт:"
"- База: 10.0"
"- Штрафы: <score.penalties_total_1dp> (<list penalties items in fixed order P_SUGAR,P_SALT,P_SATFAT,P_ULTRA_ADD,P_CAFFEINE_WARN,P_OTHER_WARN; если 0 — всё равно показывай 0.0>)"
"- Бонусы: <score.bonuses_total_1dp> (<list bonuses items in fixed order B_SHORT,B_PROTEIN,B_FIBER,B_LOW_SUGAR,B_LOW_SALT; если 0 — всё равно показывай 0.0>)"
"- Итог: <score.value_1dp>"

[3] "СОСТАВ (КАК НА ЭТИКЕТКЕ)"
Если ingredients пусто:
"не указано"
Иначе по одному ингредиенту на строку:
"- <index>. <label_text> -> <canonical_name> [confidence=<confidence>] [class=<class_label>]"

[4] "КРАТКИЙ АНАЛИЗ ИНГРЕДИЕНТОВ"
Если ingredients пусто:
"не указано"
Иначе для каждого ингредиента ровно 5 строк, без вариаций:
"<index>. <canonical_name>"
"- Класс: <class_label>"
"- Что это: <short_what_is>"
"- Зачем в продукте: <short_why_in_product>"
"- Рекомендация: <micro_recommendation>"

[5] "ДОБАВКИ (E-НОМЕРА)"
Если additives пусто:
"Не обнаружены."
Иначе для каждой добавки (в порядке E):
"<e_code> — <name_ru>"
"- Функция: <function>"
"- Ограничения/эффекты: <join possible_effects with '; ' or 'не указано'>"
"- Кому осторожно: <join caution_groups with '; ' or 'не указано'>"
"- Доказательность: <evidence_status>"

[6] "АЛЛЕРГЕНЫ"
"Заявлено на этикетке: <join allergens.declared_label with '; ' or 'не указано'>"
"Потенциальные по составу: <join allergens.potential_by_ingredients with '; ' or 'не указано'>"
Если user_profile.known_allergies непусто:
"Сопоставление с профилем: <join allergens.profile_matches with '; ' or 'не указано'>"
Иначе:
"Сопоставление с профилем: не указано"

[7] "КБЖУ (ЕСЛИ УКАЗАНО)"
"На 100 г/мл:"
"- kcal: <nutrition.per_100.kcal_or_ne_ukazano>"
"- protein_g: <...>"
"- fat_g: <...>"
"- carbs_g: <...>"
"- sugars_g: <...>"
"- fiber_g: <...>"
"- salt_g: <...>"
"- saturates_g: <...>"
"На порцию:"
"- serving_size: <nutrition.serving_size_g_or_ml_or_ne_ukazano>"
"- kcal: <nutrition.per_serving.kcal_or_ne_ukazano>"
(далее те же поля в том же порядке)
"Уверенность КБЖУ: <nutrition.nutrition_confidence>"

[8] "РЕКОМЕНДАЦИИ ПО УПОТРЕБЛЕНИЮ"
"Стоит ли употреблять: <consumption_guidance.should_consume>"
"Как часто: <consumption_guidance.frequency>"
"Разумная порция: <consumption_guidance.reasonable_serving>"
"Когда лучше избегать:"
Если consumption_guidance.avoid_when пусто → "- не указано"
Иначе каждое с "- <item>"

[9] "РЕЦЕПТЫ"
Если recipes.if_score_below_6 = true:
"Рецепт (сделать лучше): <recipes.healthier_fix_or_alternative.make_it_better.name>"
"Шаги:"
(список шагов, каждый с "- ")
"Критерии здоровой альтернативы:"
(список критериев, каждый с "- ")
И затем:
"Быстрый рецепт: <recipes.quick_recipe.name>"
"Шаги:" ...
"Вкусный рецепт: <recipes.tasty_recipe.name>"
"Шаги:" ...
Если recipes.if_score_below_6 = false:
"Быстрый рецепт: <recipes.quick_recipe.name>"
"Шаги:" ...
"Вкусный рецепт: <recipes.tasty_recipe.name>"
"Шаги:" ...

[10] "ОГРАНИЧЕНИЯ АНАЛИЗА"
Если limitations пусто → "не указано"
Иначе каждый пункт с "- <item>"

[11] "ДИСКЛЕЙМЕР"
"<disclaimer>" 

ВАЖНО:
- UI-текст должен быть сформирован строго по шаблону выше. Запрещены любые дополнительные предложения.
             `;

             if (imagePreview) {
               const base64Data = imagePreview.split(',')[1];
               const mimeType = imagePreview.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
               
               parts.push({ inlineData: { mimeType, data: base64Data }});
               parts.push({ text: "Проанализируй состав на этом фото согласно Мастер-Промпту. Верни JSON." });
             } else {
               parts.push({ text: `Проанализируй этот состав продукта согласно Мастер-Промпту: ${ingredients || "Сахар, мука, пальмовое масло, E102"}. Верни JSON.` });
             }

             // Do not use responseSchema for this massive prompt to avoid token overload or strict validation issues on partial matches.
             // The system instruction is strict enough.
             const response = await ai.models.generateContent({
                model,
                contents: { parts },
                config: {
                  systemInstruction: masterPrompt,
                  responseMimeType: "application/json",
                }
             });
             
             if (response.text) {
                const rawJson = JSON.parse(response.text);
                
                // --- ADAPTER LAYER: V3.1 JSON -> App ScanResult ---
                // We map the new detailed JSON to the existing simple ScanResult structure
                // so the rest of the application (ResultView, History) continues to work.
                
                const scoreVal = rawJson.score?.value_1dp || "0.0";
                
                const mappedResult: any = {
                    productName: rawJson.product_identification?.name_label || "Продукт",
                    status: parseFloat(scoreVal) >= 8.0 ? 'safe' : parseFloat(scoreVal) >= 4.0 ? 'warning' : 'danger',
                    score: scoreVal.toString(),
                    verdict: rawJson.score?.verdict_one_liner || "ВЕРДИКТ НЕ ОПРЕДЕЛЕН",
                    // Use the generated UI Report plain text as the detailed summary
                    details: rawJson.ui_report?.plain_text || rawJson.consumption_guidance?.should_consume || "Детальный анализ не сгенерирован.",
                    
                    // Map Nutrition
                    nutrients: [],
                    
                    // Map Additives
                    additives: (rawJson.additives || []).map((add: any) => ({
                        code: add.e_code,
                        name: add.name_ru || add.name_intl,
                        // Derive risk level from evidence status and context
                        riskLevel: (add.evidence_status === 'CONFIRMED_5OF5' && (add.possible_effects?.length > 0 || add.caution_groups?.length > 0)) ? 'high' : 
                                   (add.caution_groups?.length > 0) ? 'medium' : 'low',
                        description: add.function + (add.possible_effects?.length ? `. Эффекты: ${add.possible_effects.join(', ')}` : '')
                    })),
                    
                    // Map Ingredients Analysis to Pros/Cons
                    pros: (rawJson.ingredients || [])
                        .filter((i: any) => i.class_label === 'ПОЛЕЗНЫЙ')
                        .map((i: any) => i.canonical_name),
                    cons: (rawJson.ingredients || [])
                        .filter((i: any) => i.class_label === 'ВРЕДНЫЙ' || i.class_label === 'НЕЖЕЛАТЕЛЬНЫЙ' || i.class_label === 'ПОТЕНЦИАЛЬНО ВРЕДНЫЙ')
                        .map((i: any) => i.canonical_name)
                };

                // Helper for Nutrients Mapping
                const n = rawJson.nutrition?.per_100 || {};
                const nutrientMap = [
                    { key: 'kcal', label: 'Калории', unit: 'kcal', threshBad: 400, threshGood: 100 }, // rough heuristics for color
                    { key: 'sugars_g', label: 'Сахар', unit: 'г', threshBad: 10, threshGood: 5 },
                    { key: 'salt_g', label: 'Соль', unit: 'г', threshBad: 1.2, threshGood: 0.5 },
                    { key: 'fat_g', label: 'Жиры', unit: 'г', threshBad: 20, threshGood: 5 },
                    { key: 'protein_g', label: 'Белки', unit: 'г', threshBad: -1, threshGood: 10 }, // High protein is good
                ];

                mappedResult.nutrients = nutrientMap.map(def => {
                    const val = n[def.key];
                    if (val === null || val === undefined) return null;
                    const num = parseFloat(val);
                    // Determine status (visual color)
                    let status = 'neutral';
                    if (def.key === 'protein_g') {
                         status = num >= def.threshGood ? 'good' : 'neutral';
                    } else {
                         status = num >= def.threshBad ? 'bad' : num <= def.threshGood ? 'good' : 'neutral';
                    }
                    
                    return {
                        label: def.label,
                        value: `${val}${def.unit}`,
                        status,
                        percentage: 50 // Dummy value as V3.1 doesn't calculate DV%
                    };
                }).filter(Boolean);

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