export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  category: 'habit' | 'mood' | 'dream' | 'desire' | 'health';
  completed: boolean;
  icon: string;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  totalMissions: number;
  dreamsLogged: number;
}

export interface MoodEntry {
  timestamp: number;
  mood: number; // 1-5
  energy: number; // 1-5
  note: string;
}

export interface DreamEntry {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  tags: string[];
  lucidity: number; // 1-5
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export const defaultStats: UserStats = {
  level: 3,
  xp: 340,
  xpToNext: 500,
  energy: 72,
  maxEnergy: 100,
  streak: 5,
  totalMissions: 47,
  dreamsLogged: 12,
};

export const defaultMissions: Mission[] = [
  { id: '1', title: 'Утренняя медитация', description: '10 минут тишины и осознанности', xpReward: 30, category: 'habit', completed: false, icon: '🧘' },
  { id: '2', title: 'Записать сон', description: 'Зафиксируй что снилось сегодня', xpReward: 25, category: 'dream', completed: false, icon: '🌙' },
  { id: '3', title: 'Чекин настроения', description: 'Как ты себя чувствуешь прямо сейчас?', xpReward: 15, category: 'mood', completed: true, icon: '💫' },
  { id: '4', title: 'Прогулка 30 мин', description: 'Выйди на свежий воздух', xpReward: 35, category: 'health', completed: false, icon: '🚶' },
  { id: '5', title: 'Записать желание', description: 'Чего ты хочешь на самом деле?', xpReward: 20, category: 'desire', completed: false, icon: '✨' },
  { id: '6', title: 'Холодный душ', description: 'Перезагрузи нервную систему', xpReward: 40, category: 'health', completed: false, icon: '🧊' },
];

export const defaultAchievements: Achievement[] = [
  { id: '1', title: 'Первый шаг', description: 'Выполни первую миссию', icon: '🏆', unlocked: true, progress: 1, maxProgress: 1 },
  { id: '2', title: 'Сновидец', description: 'Запиши 10 снов', icon: '🌌', unlocked: true, progress: 12, maxProgress: 10 },
  { id: '3', title: 'Неделя огня', description: 'Стрик 7 дней подряд', icon: '🔥', unlocked: false, progress: 5, maxProgress: 7 },
  { id: '4', title: 'Мастер привычек', description: 'Выполни 100 миссий', icon: '⚡', unlocked: false, progress: 47, maxProgress: 100 },
  { id: '5', title: 'Самопознание', description: 'Заполни 30 чекинов настроения', icon: '🔮', unlocked: false, progress: 18, maxProgress: 30 },
];

export const categoryColors: Record<Mission['category'], string> = {
  habit: 'primary',
  mood: 'energy',
  dream: 'dream',
  desire: 'secondary',
  health: 'accent',
};

export const categoryLabels: Record<Mission['category'], string> = {
  habit: 'Привычка',
  mood: 'Настроение',
  dream: 'Сон',
  desire: 'Желание',
  health: 'Здоровье',
};
