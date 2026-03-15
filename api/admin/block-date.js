import supabase from "../_lib/supabase.js";
import { cors, adminAuth } from "../_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!adminAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { property_name, blocked_date, reason } = req.body;

  if (!property_name || !blocked_date) {
    return res.status(400).json({ error: "property_name and blocked_date are required" });
  }

  const validReasons = ["maintenance", "manual_block"];
  const resolvedReason = reason && validReasons.includes(reason) ? reason : "manual_block";

  const { data, error } = await supabase
    .from("blocked_dates")
    .insert({ property_name, blocked_date, reason: resolvedReason })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "That date is already blocked for this property" });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ message: "Date blocked successfully", blocked: data });
}
