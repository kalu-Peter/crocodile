import supabase from "../_lib/supabase.js";
import { cors, adminAuth } from "../_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!adminAuth(req, res)) return;

  if (req.method === "GET") {
    const { data, error } = await supabase.from("site_settings").select("key, value");
    if (error) return res.status(500).json({ error: error.message });
    const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
    return res.json(settings);
  }

  if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: "key and value are required" });
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, key, value });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
