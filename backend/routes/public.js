import { Router } from "express";
import { getProperties } from "../controllers/propertiesController.js";
import { getPricingForProperty } from "../controllers/pricingController.js";
import { checkAvailability } from "../controllers/availabilityController.js";
import { createReservation } from "../controllers/reservationsController.js";
import { stkPush, stkStatus, stkCallback } from "../controllers/mpesaController.js";

const router = Router();

// GET /api/properties
router.get("/properties", getProperties);

// GET /api/pricing/:property
router.get("/pricing/:property", getPricingForProperty);

// GET /api/availability?property=&checkin=&checkout=
router.get("/availability", checkAvailability);

// POST /api/reservations
router.post("/reservations", createReservation);

// M-Pesa
router.post("/mpesa/stk-push", stkPush);
router.get("/mpesa/status",    stkStatus);
router.post("/mpesa/callback", stkCallback);

export default router;
