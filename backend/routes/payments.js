import { Router } from "express";
import { initiateMpesa, queryMpesa, createPaypalOrder, capturePaypalOrder } from "../controllers/paymentController.js";

const router = Router();

// Single POST /api/payments endpoint routed by action field
router.post("/", async (req, res) => {
  const { action } = req.body ?? {};
  if (action === "mpesa-initiate") return initiateMpesa(req, res);
  if (action === "mpesa-query")    return queryMpesa(req, res);
  if (action === "paypal-create")  return createPaypalOrder(req, res);
  if (action === "paypal-capture") return capturePaypalOrder(req, res);
  return res.status(400).json({ error: "Invalid action. Use: mpesa-initiate, mpesa-query, paypal-create, paypal-capture" });
});

export default router;
