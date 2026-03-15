import supabase from "../_lib/supabase.js";
import { cors, adminAuth } from "../_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!adminAuth(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { property } = req.query;

  let query = supabase.from("blocked_dates").select("*").order("blocked_date");
  if (property) query = query.eq("property_name", property);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
}
