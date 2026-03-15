import supabase from "../../_lib/supabase.js";
import { cors, adminAuth } from "../../_lib/helpers.js";

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (!adminAuth(req, res)) return;
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query;
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

  return res.json({ message: "Pricing updated", pricing: data });
}
