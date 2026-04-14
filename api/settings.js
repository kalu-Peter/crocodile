import supabase from "./_lib/supabase.js";
import { cors } from "./_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) return res.status(500).json({ error: error.message });

  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return res.json(settings);
}
