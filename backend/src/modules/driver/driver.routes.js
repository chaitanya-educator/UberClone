import express from 'express';
import {
    createProfile,
    getProfile,
    updateProfile,
    updateStatus,
    getProfileCompletion
} from './driver.controller.js';
import { authenticate, authorizeRole } from '../../common/middleware/auth.middleware.js';
import { validate } from '../../common/middleware/auth.validate.js';
import {
    createDriverProfileSchema,
    updateDriverProfileSchema,
    updateStatusSchema
} from './driver.validation.js';

// ============================================
// DRIVER ROUTES
// ============================================
// All routes require authentication and DRIVER role
// Base path: /api/driver (mounted in app.js)
//
// Route Flow:
// 1. Request comes in
// 2. authenticate middleware → Verify JWT token
// 3. authorizeRole middleware → Check if user has DRIVER role
// 4. validate middleware → Validate request data (if applicable)
// 5. Controller function → Handle request
//
// Middleware Order Matters:
// - authenticate MUST come before authorizeRole (need user data first)
// - validate MUST come before controller (validate data first)

const router = express.Router();

// ============================================
// CREATE DRIVER PROFILE
// ============================================
// POST /api/driver/register
// Access: Private (Any authenticated user can apply to be driver)
// Purpose: Create driver profile after signup
//
// NOTE: User role will remain RIDER until admin verifies
// After admin verification, role will be upgraded to DRIVER
router.post(
    '/register',
    authenticate,                           // Middleware 1: Verify JWT token
    validate(createDriverProfileSchema),    // Middleware 2: Validate request body
    createProfile                           // Controller function
);

// ============================================
// GET PROFILE COMPLETION DETAILS
// ============================================
// GET /api/driver/me/completion
// Access: Private (DRIVER only)
// Purpose: See what fields are missing
//
// Middleware Chain:
// 1. authenticate → Verify JWT token, set req.user
// 2. authorizeRole('DRIVER') → Check if user.role === 'DRIVER'
// 3. getProfileCompletion → Handle request
//
// Test in Postman:
// Method: GET
// URL: http://localhost:5000/api/driver/me/completion
// Headers: 
//   {
//     "Authorization": "Bearer <driver_token>"
//   }
router.get(
    '/me/completion',
    authenticate,                // Middleware 1: Verify JWT token
    authorizeRole('DRIVER'),     // Middleware 2: Only DRIVER role allowed
    getProfileCompletion         // Controller function
);

// ============================================
// UPDATE DRIVER STATUS (ONLINE/OFFLINE)
// ============================================
// PATCH /api/driver/me/status
// Access: Private (DRIVER only)
// Purpose: Toggle availability
//
// Middleware Chain:
// 1. authenticate → Verify JWT token, set req.user
// 2. authorizeRole('DRIVER') → Check if user.role === 'DRIVER'
// 3. validate(updateStatusSchema) → Validate request body
// 4. updateStatus → Handle request
//
// Test in Postman:
// Method: PATCH
// URL: http://localhost:5000/api/driver/me/status
// Headers: 
//   {
//     "Authorization": "Bearer <driver_token>",
//     "Content-Type": "application/json"
//   }
// Body (JSON):
//   {
//     "isOnline": true
//   }
router.patch(
    '/me/status',
    authenticate,                    // Middleware 1: Verify JWT token
    authorizeRole('DRIVER'),         // Middleware 2: Only DRIVER role allowed
    validate(updateStatusSchema),    // Middleware 3: Validate request body
    updateStatus                     // Controller function
);

// ============================================
// GET DRIVER PROFILE
// ============================================
// GET /api/driver/me
// Access: Private (DRIVER only)
// Purpose: Get logged-in driver's profile
//
// Middleware Chain:
// 1. authenticate → Verify JWT token, set req.user
// 2. authorizeRole('DRIVER') → Check if user.role === 'DRIVER'
// 3. getProfile → Handle request
//
// Test in Postman:
// Method: GET
// URL: http://localhost:5000/api/driver/me
// Headers: 
//   {
//     "Authorization": "Bearer <driver_token>"
//   }
router.get(
    '/me',
    authenticate,                // Middleware 1: Verify JWT token
    authorizeRole('DRIVER'),     // Middleware 2: Only DRIVER role allowed
    getProfile                   // Controller function
);

// ============================================
// UPDATE DRIVER PROFILE
// ============================================
// PATCH /api/driver/me
// Access: Private (DRIVER only)
// Purpose: Update optional fields
//
// Middleware Chain:
// 1. authenticate → Verify JWT token, set req.user
// 2. authorizeRole('DRIVER') → Check if user.role === 'DRIVER'
// 3. validate(updateDriverProfileSchema) → Validate request body
// 4. updateProfile → Handle request
//
// Test in Postman:
// Method: PATCH
// URL: http://localhost:5000/api/driver/me
// Headers: 
//   {
//     "Authorization": "Bearer <driver_token>",
//     "Content-Type": "application/json"
//   }
// Body (JSON):
//   {
//     "vehicleModel": "Honda City",
//     "vehicleColor": "White",
//     "profilePicture": "https://example.com/pic.jpg"
//   }
router.patch(
    '/me',
    authenticate,                           // Middleware 1: Verify JWT token
    authorizeRole('DRIVER'),                // Middleware 2: Only DRIVER role allowed
    validate(updateDriverProfileSchema),    // Middleware 3: Validate request body
    updateProfile                           // Controller function
);

// ============================================
// EXPORT ROUTER
// ============================================
// Router will be mounted in app.js at /api/driver
// Example: app.use('/api/driver', driverRoutes)

export default router;
