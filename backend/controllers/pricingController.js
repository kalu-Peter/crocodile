import supabase from "../db/supabase.js";

export async function getPricingForProperty(req, res) {
  const { property } = req.params;

  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .eq("property_name", property)
    .order("min_guests");

  if (error) return res.status(500).json({ error: error.message });
  if (!data.length)
    return res
      .status(404)
      .json({ error: `No pricing found for property: ${property}` });

  res.json(data);
}

/**
 * Calculate the price for a given property, guest count, and night count.
 * Returns the matching pricing tier or the last (highest) tier if over range.
 */
export function calculateTotalPrice(pricingRows, guests, nights) {
  if (!pricingRows.length) return 0;
  const tier =
    pricingRows.find((p) => guests >= p.min_guests && guests <= p.max_guests) ||
    pricingRows[pricingRows.length - 1];
  return tier.price * guests * nights;
}
