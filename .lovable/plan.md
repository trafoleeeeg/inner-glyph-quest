

## Анимированный котёнок на Lottie

### Подход
Используем библиотеку `lottie-react` + бесплатные Lottie-анимации котят с LottieFiles. Для каждого состояния настроения — отдельная анимация.

### Анимации (5 состояний)
| Состояние | Анимация | Источник |
|-----------|----------|----------|
| `sleeping` | Спящий котёнок | LottieFiles (JSON в public/) |
| `sad` | Грустный котёнок | LottieFiles |
| `neutral` | Сидящий, моргает | LottieFiles |
| `happy` | Играет / прыгает | LottieFiles |
| `ecstatic` | Танцует / искрится | LottieFiles |
| `eating` (кормление) | Ест из миски | LottieFiles |

### Файлы

| Действие | Файл |
|---|---|
| Установить | `lottie-react` (npm) |
| Скачать | 5-6 Lottie JSON в `public/animations/cat-*.json` |
| Переписать | `src/components/Companion.tsx` — заменить emoji на `<Lottie>` с переключением анимаций по состоянию |
| Изменить | `src/pages/Index.tsx` — добавить проп `justFed` для анимации кормления при выполнении привычки |

### Логика Companion.tsx
1. По `moodKey` выбираем JSON-файл анимации
2. При `justFed=true` — на 3 секунды показываем анимацию еды + сердечки (framer-motion overlay)
3. Эволюция по уровням — меняем размер контейнера + добавляем CSS-аксессуары (корона, бантик) поверх Lottie
4. Всё остальное (фразы, энергия, прогресс) — остаётся как есть

### Кормление
В `Index.tsx` при `completeMission`: `setCompanionFed(true)` → через 3 сек `setCompanionFed(false)`. Передаём проп в `<Companion justFed={companionFed}>`.

