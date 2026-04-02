import supabase from "../_lib/supabase.js";
import { cors, adminAuth } from "../_lib/helpers.js";

function datesInRange(start, end) {
  const dates = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!adminAuth(req, res)) return;

  if (req.method === "GET") {
    const { property } = req.query;
    let query = supabase
      .from("blocked_dates")
      .select("id, property_name, blocked_date, reason, created_at")
      .order("blocked_date");
    if (property) query = query.eq("property_name", property);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  if (req.method === "POST") {
    const { property_name, blocked_date, start_date, end_date, reason } = req.body;

    if (!property_name) {
      return res.status(400).json({ error: "property_name is required" });
    }

    const validReasons = ["maintenance", "manual_block", "owner_stay"];
    const resolvedReason = reason && validReasons.includes(reason) ? reason : "manual_block";

    // Resolve date range
    const rangeStart = start_date ?? blocked_date;
    const rangeEnd = end_date ?? blocked_date;

    if (!rangeStart) {
      return res.status(400).json({ error: "A date or date range is required" });
    }

    const dates = datesInRange(rangeStart, rangeEnd);
    if (dates.length === 0) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    const rows = dates.map((d) => ({
      property_name,
      blocked_date: d,
      reason: resolvedReason,
    }));

    const { data, error } = await supabase
      .from("blocked_dates")
      .upsert(rows, { onConflict: "property_name,blocked_date", ignoreDuplicates: true })
      .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({
      message: `${dates.length} date(s) blocked for ${property_name}`,
      count: dates.length,
      blocked: data,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
