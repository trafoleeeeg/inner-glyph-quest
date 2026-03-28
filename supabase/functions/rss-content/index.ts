import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// RSS feeds by topic
const RSS_FEEDS: Record<string, string[]> = {
  motivation: [
    "https://jamesclear.com/feed",
    "https://zenhabits.net/feed/",
  ],
  mindfulness: [
    "https://www.mindful.org/feed/",
  ],
  productivity: [
    "https://blog.rescuetime.com/feed/",
  ],
  fitness: [
    "https://www.nerdfitness.com/blog/feed/",
  ],
  psychology: [
    "https://www.psychologytoday.com/intl/blog/feed",
  ],
  habits: [
    "https://jamesclear.com/feed",
  ],
};

async function fetchRSSFeed(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { 
      headers: { "User-Agent": "NeuroTracker/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    
    // Simple XML parsing for RSS items
    const items: any[] = [];
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
    
    for (const itemXml of itemMatches.slice(0, 5)) {
      const title = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() || "";
      const description = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim().slice(0, 200) || "";
      const link = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() || "";
      
      if (title) {
        items.push({ title, description, link });
      }
    }
    return items;
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic } = await req.json();
    const feedUrls = RSS_FEEDS[topic] || RSS_FEEDS.motivation;
    
    const allItems: any[] = [];
    for (const url of feedUrls) {
      const items = await fetchRSSFeed(url);
      const source = new URL(url).hostname.replace("www.", "");
      allItems.push(...items.map(i => ({ ...i, source, topic })));
    }

    // Shuffle and limit
    const shuffled = allItems.sort(() => Math.random() - 0.5).slice(0, 8);

    return new Response(JSON.stringify({ items: shuffled }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", items: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
