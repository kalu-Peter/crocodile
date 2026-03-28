import supabase from "../db/supabase.js";

// ─── Reservations ────────────────────────────────────────────

export async function getAllReservations(req, res) {
  const { data, error } = await supabase
    .from("reservations")
    .select("id, property_name, guests, checkin, checkout, name, email, phone, total_price, confirmed, cancelled, created_at")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function confirmReservation(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("reservations")
    .update({ confirmed: true })
    .eq("id", id)
    .select("id, confirmed, property_name, checkin, checkout")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Reservation not found" });

  res.json({ message: "Reservation confirmed", reservation: data });
}

export async function cancelReservation(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("reservations")
    .update({ cancelled: true, confirmed: false })
    .eq("id", id)
    .select("id, cancelled, property_name, checkin, checkout")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Reservation not found" });

  res.json({ message: "Reservation cancelled", reservation: data });
}

// ─── Blocked Dates ───────────────────────────────────────────

export async function blockDate(req, res) {
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
    // Unique constraint violation
    if (error.code === "23505") {
      return res.status(409).json({ error: "That date is already blocked for this property" });
    }
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ message: "Date blocked successfully", blocked: data });
}

export async function getBlockedDates(req, res) {
  const { property } = req.query;

  let query = supabase
    .from("blocked_dates")
    .select("id, property_name, blocked_date, reason")
    .order("blocked_date");

  if (property) query = query.eq("property_name", property);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function unblockDate(req, res) {
  const { id } = req.params;

  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: "Date unblocked successfully" });
}

// ─── Pricing ─────────────────────────────────────────────────

export async function getAllPricing(req, res) {
  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .order("property_name")
    .order("min_guests");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function updatePricing(req, res) {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return res.status(400).json({ error: "price must be a positive number" });
  }

  const { data, error } = await supabase
    .from("pricing")
    .update({ price: parseFloat(price) })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Pricing row not found" });

  res.json({ message: "Pricing updated", pricing: data });
}

// ─── Seasonal Pricing ─────────────────────────────────────

export async function getSeasonalPricing(req, res) {
  const { villa_id } = req.query;
  let query = supabase.from("seasonal_pricing").select("id, villa_id, label, start_date, end_date, price_per_night, created_at").order("start_date");
  if (villa_id) query = query.eq("villa_id", villa_id);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function createSeasonalPricing(req, res) {
  const { villa_id, label, start_date, end_date, price_per_night } = req.body;

  if (!villa_id || !start_date || !end_date || !price_per_night) {
    return res.status(400).json({ error: "villa_id, start_date, end_date and price_per_night are required" });
  }
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({ error: "end_date must be on or after start_date" });
  }
  if (parseFloat(price_per_night) <= 0) {
    return res.status(400).json({ error: "price_per_night must be a positive number" });
  }

  const { data, error } = await supabase
    .from("seasonal_pricing")
    .insert({ villa_id, label: label || "Custom Rate", start_date, end_date, price_per_night: parseFloat(price_per_night) })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Seasonal pricing rule created", rule: data });
}

export async function updateSeasonalPricing(req, res) {
  const { id } = req.params;
  const { label, start_date, end_date, price_per_night } = req.body;

  const updates = {};
  if (label !== undefined) updates.label = label;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;
  if (price_per_night !== undefined) {
    if (parseFloat(price_per_night) <= 0) return res.status(400).json({ error: "price_per_night must be positive" });
    updates.price_per_night = parseFloat(price_per_night);
  }

  const { data, error } = await supabase
    .from("seasonal_pricing")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Rule not found" });
  res.json({ message: "Seasonal pricing updated", rule: data });
}

export async function deleteSeasonalPricing(req, res) {
  const { id } = req.params;
  const { error } = await supabase.from("seasonal_pricing").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: "Seasonal pricing rule deleted" });
}
