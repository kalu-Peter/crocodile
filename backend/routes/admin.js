import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import {
  getAllReservations,
  confirmReservation,
  cancelReservation,
  blockDate,
  getBlockedDates,
  unblockDate,
  getAllPricing,
  updatePricing,
  getSeasonalPricing,
  createSeasonalPricing,
  updateSeasonalPricing,
  deleteSeasonalPricing,
} from "../controllers/adminController.js";

const router = Router();

// All admin routes require the secret header
router.use(adminAuth);

// Reservations
router.get("/reservations",            getAllReservations);
router.put("/reservations/:id/confirm", confirmReservation);
router.put("/reservations/:id/cancel",  cancelReservation);

// Blocked dates
router.post("/block-date",    blockDate);
router.get("/blocked-dates",  getBlockedDates);
router.delete("/block-date/:id", unblockDate);

// Pricing
router.get("/pricing",        getAllPricing);
router.put("/pricing/:id",    updatePricing);

// Seasonal Pricing
router.get("/seasonal-pricing",           getSeasonalPricing);
router.post("/seasonal-pricing",          createSeasonalPricing);
router.put("/seasonal-pricing/:id",       updateSeasonalPricing);
router.delete("/seasonal-pricing/:id",    deleteSeasonalPricing);

export default router;
