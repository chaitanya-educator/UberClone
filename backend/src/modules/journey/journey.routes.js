import express from 'express';
import {
    createJourney,
    acceptJourney,
    updateJourneyStatus,
    completeJourney,
    cancelJourney,
    getJourneyById,
    getRiderJourneys,
    getDriverJourneys,
    generatePaymentQR,
    confirmPayment
} from './journey.controller.js';
import { authenticate, authorizeRole } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/auth.validate.js';
import {
    createJourneySchema,
    updateJourneyStatusSchema,
    completeJourneySchema,
    cancelJourneySchema
} from './journey.validation.js';

// ============================================
// JOURNEY ROUTES
// ============================================
// All routes require authentication
// Base path: /api/journey (mounted in app.js)
//
// Route Flow:
// 1. Request comes in
// 2. authenticate middleware → Verify JWT token
// 3. authorizeRole middleware → Check user role (if needed)
// 4. validate middleware → Validate request data (if applicable)
// 5. Controller function → Handle request
//
// Middleware Order Matters:
// - authenticate MUST come before authorizeRole (need user data first)
// - validate MUST come before controller (validate data first)

const router = express.Router();

// ============================================
// RIDER ROUTES
// ============================================

// ============================================
// CREATE JOURNEY
// ============================================
// POST /api/journey/create
// Access: Private (Any rider)
// Purpose: Rider creates a new journey request
router.post(
    '/create',
    authenticate,                           // Verify JWT token
    validate(createJourneySchema),          // Validate request body
    createJourney                           // Controller function
);

// ============================================
// GET JOURNEY BY ID
// ============================================
// GET /api/journey/:journeyId
// Access: Private (Rider or driver of this journey)
// Purpose: Get specific journey details
router.get(
    '/:journeyId',
    authenticate,                           // Verify JWT token
    getJourneyById                          // Controller function
);

// ============================================
// GET RIDER JOURNEYS HISTORY
// ============================================
// GET /api/journey/rider/history
// Access: Private (Any rider)
// Purpose: Get rider's journey history
// Query params: status (optional)
router.get(
    '/rider/history',
    authenticate,                           // Verify JWT token
    getRiderJourneys                        // Controller function
);

// ============================================
// CANCEL JOURNEY (RIDER)
// ============================================
// POST /api/journey/:journeyId/cancel
// Access: Private (Journey rider only)
// Purpose: Cancel journey as rider
router.post(
    '/:journeyId/cancel',
    authenticate,                           // Verify JWT token
    validate(cancelJourneySchema),          // Validate request body
    cancelJourney                           // Controller function
);

// ============================================
// GENERATE PAYMENT QR
// ============================================
// GET /api/journey/:journeyId/payment-qr
// Access: Private (Journey rider only)
// Purpose: Generate QR code for payment
router.get(
    '/:journeyId/payment-qr',
    authenticate,                           // Verify JWT token
    generatePaymentQR                       // Controller function
);

// ============================================
// CONFIRM PAYMENT
// ============================================
// POST /api/journey/:journeyId/confirm-payment
// Access: Private (Journey rider only)
// Purpose: Confirm payment for completed journey
router.post(
    '/:journeyId/confirm-payment',
    authenticate,                           // Verify JWT token
    confirmPayment                          // Controller function
);

// ============================================
// DRIVER ROUTES
// ============================================

// ============================================
// ACCEPT JOURNEY
// ============================================
// POST /api/journey/:journeyId/accept
// Access: Private (Driver only)
// Purpose: Driver accepts a journey request
router.post(
    '/:journeyId/accept',
    authenticate,                           // Verify JWT token
    authorizeRole('DRIVER'),                // Ensure user is DRIVER
    acceptJourney                           // Controller function
);

// ============================================
// UPDATE JOURNEY STATUS
// ============================================
// PATCH /api/journey/:journeyId/status
// Access: Private (Journey driver only)
// Purpose: Driver updates journey status (ARRIVED, STARTED)
router.patch(
    '/:journeyId/status',
    authenticate,                           // Verify JWT token
    validate(updateJourneyStatusSchema),    // Validate request body
    updateJourneyStatus                     // Controller function
);

// ============================================
// COMPLETE JOURNEY
// ============================================
// POST /api/journey/:journeyId/complete
// Access: Private (Journey driver only)
// Purpose: Driver completes the journey
router.post(
    '/:journeyId/complete',
    authenticate,                           // Verify JWT token
    validate(completeJourneySchema),        // Validate request body
    completeJourney                         // Controller function
);

// ============================================
// GET DRIVER JOURNEYS HISTORY
// ============================================
// GET /api/journey/driver/history
// Access: Private (Any driver)
// Purpose: Get driver's journey history
// Query params: status (optional)
router.get(
    '/driver/history',
    authenticate,                           // Verify JWT token
    authorizeRole('DRIVER'),                // Ensure user is DRIVER
    getDriverJourneys                       // Controller function
);

// ============================================
// EXPORT ROUTER
// ============================================
export default router;
