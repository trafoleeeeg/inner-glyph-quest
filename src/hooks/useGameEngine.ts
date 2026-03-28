import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Variable reward system based on Octalysis Framework + SDT research
// Core drives: Unpredictability (variable rewards), Development & Accomplishment (XP), 
// Ownership (personal stats), Loss & Avoidance (streaks)

const CRITICAL_HIT_CHANCE = 0.15; // 15% chance for 2x XP
const MYSTERY_BOX_CHANCE = 0.1;   // 10% chance after mission completion
const STREAK_MULTIPLIERS = [1, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0]; // day 0-7+

export interface RewardResult {
  baseXP: number;
  bonusXP: number;
  totalXP: number;
  isCriticalHit: boolean;
  mysteryBox: MysteryBoxReward | null;
  streakMultiplier: number;
  coinsEarned: number;
  leveledUp: boolean;
  newLevel?: number;
}

export interface MysteryBoxReward {
  type: 'xp_boost' | 'energy_restore' | 'coins' | 'streak_shield';
  amount: number;
  description: string;
  icon: string;
}

const MYSTERY_REWARDS: Omit<MysteryBoxReward, 'amount'>[] = [
  { type: 'xp_boost', description: 'Бонус опыта!', icon: '⚡' },
  { type: 'energy_restore', description: 'Энергия восстановлена!', icon: '🔋' },
  { type: 'coins', description: 'Нейрокоины!', icon: '💰' },
  { type: 'streak_shield', description: 'Щит стрика!', icon: '🛡️' },
];

function generateMysteryBox(): MysteryBoxReward | null {
  if (Math.random() > MYSTERY_BOX_CHANCE) return null;
  const reward = MYSTERY_REWARDS[Math.floor(Math.random() * MYSTERY_REWARDS.length)];
  const amounts: Record<string, number> = {
    xp_boost: Math.floor(Math.random() * 30 + 20),
    energy_restore: Math.floor(Math.random() * 20 + 10),
    coins: Math.floor(Math.random() * 15 + 5),
    streak_shield: 1,
  };
  return { ...reward, amount: amounts[reward.type] };
}

function getStreakMultiplier(streak: number): number {
  return STREAK_MULTIPLIERS[Math.min(streak, STREAK_MULTIPLIERS.length - 1)];
}

function calculateLevelXP(level: number): number {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

export function useGameEngine() {
  const { user } = useAuth();

  const completeMission = useCallback(async (
    missionId: string,
    baseXP: number,
    currentStreak: number,
    currentXP: number,
    currentXPToNext: number,
    currentLevel: number
  ): Promise<RewardResult> => {
    if (!user) throw new Error("Not authenticated");

    const isCriticalHit = Math.random() < CRITICAL_HIT_CHANCE;
    const streakMultiplier = getStreakMultiplier(currentStreak);
    const mysteryBox = generateMysteryBox();

    let bonusXP = 0;
    if (isCriticalHit) bonusXP += baseXP; // double
    bonusXP += Math.floor(baseXP * (streakMultiplier - 1));
    if (mysteryBox?.type === 'xp_boost') bonusXP += mysteryBox.amount;

    const totalXP = baseXP + bonusXP;
    const coinsEarned = Math.floor(totalXP / 10) + (mysteryBox?.type === 'coins' ? mysteryBox.amount : 0);

    // Check level up
    const newTotalXP = currentXP + totalXP;
    const leveledUp = newTotalXP >= currentXPToNext;
    const newLevel = leveledUp ? currentLevel + 1 : currentLevel;
    const remainingXP = leveledUp ? newTotalXP - currentXPToNext : newTotalXP;
    const newXPToNext = leveledUp ? calculateLevelXP(newLevel) : currentXPToNext;

    // Energy restoration from mystery box
    const energyBoost = mysteryBox?.type === 'energy_restore' ? mysteryBox.amount : 5;

    // Log completion
    await supabase.from("mission_completions").insert({
      user_id: user.id,
      mission_id: missionId,
      xp_earned: baseXP,
      bonus_xp: bonusXP,
    });

    // Update profile
    await supabase.from("profiles").update({
      xp: remainingXP,
      xp_to_next: newXPToNext,
      level: newLevel,
      total_missions_completed: currentLevel, // will be incremented by trigger ideally
      energy: energyBoost, // relative update handled in component
      coins: coinsEarned, // relative update handled in component
    }).eq("user_id", user.id);

    // Log reward if special
    if (isCriticalHit || mysteryBox) {
      await supabase.from("rewards_log").insert({
        user_id: user.id,
        reward_type: isCriticalHit ? 'critical_hit' : 'mystery_box',
        xp_amount: bonusXP,
        coins_amount: coinsEarned,
        description: isCriticalHit ? 'Критический удар! 2x XP' : mysteryBox?.description,
      });
    }

    return {
      baseXP,
      bonusXP,
      totalXP,
      isCriticalHit,
      mysteryBox,
      streakMultiplier,
      coinsEarned,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };
  }, [user]);

  return { completeMission };
}
