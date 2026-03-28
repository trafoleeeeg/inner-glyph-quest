

## План: 3 задачи

### 1. Милый котёнок — использовать AI-генерацию изображений

SVG-котёнок получается механическим и неприятным, потому что рисовать котят из кода — задача для иллюстратора, а не для SVG-path. Решение: **сгенерировать набор PNG-изображений** милого котёнка через AI (Gemini image model) для каждого состояния и использовать их вместо SVG.

**Шаги:**
1. Сгенерировать 6 PNG через AI Gateway (скрипт): `sleeping`, `sad`, `neutral`, `happy`, `ecstatic`, `eating` — в едином стиле (kawaii, пушистый, тёплые тона)
2. Сохранить в `public/animations/cat-*.png`
3. Переписать `Companion.tsx` — заменить SVG на `<img>` с переключением по состоянию + framer-motion для мягких переходов (fade, scale дыхания, плавающие сердечки/искры поверх)
4. Сохранить всю логику: мудки, фразы, эволюция, кормление

### 2. Раздел «Узнай себя» — AI-анкета для формирования привычек

**Создать**: `src/pages/LifeAnalysisPage.tsx` — пошаговая анкета:
- Шаг 1: Оцени сферы жизни (здоровье, карьера, отношения, финансы, хобби, развитие) — ползунки 1-5
- Шаг 2: Увлечения — выбор тегов + свободный ввод
- Шаг 3: Цели — что хочешь изменить (свободный текст)
- Шаг 4: AI анализирует и рекомендует привычки (через edge function `life-analysis`)

**БД**: таблица `life_profiles` (user_id, answers JSONB, ai_recommendations JSONB, updated_at) + RLS

**Edge function**: `supabase/functions/life-analysis/index.ts` — отправляет анкету в Lovable AI, возвращает рекомендованные привычки

**Навигация**: кнопка «🧭 Узнай себя» на хабе + маршрут `/life-analysis` в App.tsx

### 3. Достижения → в профиль

- **`Index.tsx`**: убрать строку `{achievements.length > 0 && <AchievementsList>}` (строка 377)
- **`ProfilePage.tsx`**: добавить третий таб «Достижения» (`"posts" | "stats" | "achievements"`), при выборе показывать `<AchievementsList>`

### Файлы

| Действие | Файл |
|---|---|
| AI-скрипт | Генерация 6 PNG котёнка → `public/animations/` |
| Переписать | `src/components/Companion.tsx` — PNG вместо SVG |
| Создать | `src/pages/LifeAnalysisPage.tsx` |
| Создать | `supabase/functions/life-analysis/index.ts` |
| Изменить | `src/pages/Index.tsx` — убрать ачивки, добавить кнопку «Узнай себя» |
| Изменить | `src/pages/ProfilePage.tsx` — добавить таб «Достижения» |
| Изменить | `src/App.tsx` — маршрут `/life-analysis` |
| Миграция | Таблица `life_profiles` |

