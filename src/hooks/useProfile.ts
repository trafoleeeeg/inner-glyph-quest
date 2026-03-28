import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  xp_to_next: number;
  energy: number;
  max_energy: number;
  streak: number;
  longest_streak: number;
  total_missions_completed: number;
  total_dreams_logged: number;
  last_active_date: string | null;
  coins: number;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    await fetchProfile();
  }, [user, fetchProfile]);

  return { profile, loading, refetch: fetchProfile, updateProfile };
}
