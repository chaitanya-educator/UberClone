import express from "express";
import { authorizeRole } from "../../common/middleware/auth.middleware";
import { authenticate } from "../../common/middleware/auth.middleware.js";
// import { registerDriver } from "./driver.controller.js";
const router = express.Router();

// Only DRIVER role can access these routes
router.post(
  "/register",
    authenticate,authorizeRole("DRIVER"),
  registerDriver,
);

// router.get("/profile", authenticate, authorizeRole("DRIVER"), getDriverProfile);

// router.patch(
//   "/availability",
//   authenticate,
//   authorizeRole("DRIVER"),
//   validate(updateAvailabilitySchema),
//   updateAvailability,
// );

export default router;
