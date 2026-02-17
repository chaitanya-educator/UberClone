import { driverService } from "./driver.service.js";

// ============================================
// DRIVER CONTROLLER - HTTP Request/Response Layer
// ============================================
// Handles HTTP requests and responses
// No business logic - just calls service layer
// Uses try-catch blocks for error handling
//
// Architecture Layers:
// 1. Controller (THIS FILE) → Handles HTTP requests/responses
// 2. Service → Contains business logic
// 3. Repository → Handles database operations
//
// Responsibilities:
// - Extract data from request (req.body, req.params, req.user)
// - Call appropriate service method
// - Send HTTP response with proper status code
// - Error handling (via try-catch blocks)

// ============================================
// CREATE DRIVER PROFILE
// ============================================
// Endpoint: POST /api/driver/profile
// Access: Private (DRIVER only)
// Purpose: Create driver profile after signup
//
// Request Headers:
//   Authorization: Bearer <jwt_token>
//
// Request Body Example:
// {
//     "languagePreference": "HINDI",
//     "city": "MUMBAI",
//     "aadharNumber": "123456789012",
//     "licenseNumber": "MH1234567890",
//     "rcNumber": "MH01AB1234",
//     "vehicleType": "CAR",
//     "vehicleModel": "Honda City",        // Optional
//     "vehicleColor": "White",             // Optional
//     "profilePicture": "https://..."      // Optional
// }
//
// Response (201 Created):
// {
//     "success": true,
//     "data": { driver profile with 70% completion },
//     "message": "Driver profile created successfully"
// }
//
// Error Responses:
// - 400: Validation error (invalid data)
// - 401: Unauthorized (no token or invalid token)
// - 403: Forbidden (not DRIVER role)
// - 500: Server error
export const createProfile = async (req, res) => {
    try {
        // ============================================
        // STEP 1: Extract data from request
        // ============================================
        // req.user is set by authenticate middleware
        // Contains: _id, name, email, phone, role
        const userId = req.user._id;

        // req.body contains profile data
        // Already validated by validate middleware
        const profileData = req.body;

        // ============================================
        // STEP 2: Call service to create profile
        // ============================================
        // Service handles business logic
        // Returns formatted driver profile
        const driver = await driverService.createProfile(userId, profileData);

        // ============================================
        // STEP 3: Send success response
        // ============================================
        // Status 201: Created (resource successfully created)
        res.status(201).json({
            success: true,
            data: driver,
            message: 'Driver profile created successfully'
        });
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // Log error for debugging
        console.error('Error in createProfile:', error);

        // Send error response
        // Status 500: Internal Server Error
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create driver profile'
        });
    }
};

// ============================================
// GET DRIVER PROFILE
// ============================================
// Endpoint: GET /api/driver/me
// Access: Private (DRIVER only)
// Purpose: Get logged-in driver's profile
//
// Request Headers:
//   Authorization: Bearer <jwt_token>
//
// Response (200 OK):
// {
//     "success": true,
//     "data": { complete driver profile },
//     "message": "Driver profile retrieved successfully"
// }
//
// Error Responses:
// - 401: Unauthorized (no token or invalid token)
// - 403: Forbidden (not DRIVER role)
// - 404: Not found (profile doesn't exist)
// - 500: Server error
export const getProfile = async (req, res) => {
    try {
        // ============================================
        // STEP 1: Extract userId from request
        // ============================================
        // req.user is set by authenticate middleware
        const userId = req.user._id;

        // ============================================
        // STEP 2: Call service to get profile
        // ============================================
        // Service handles business logic
        // Throws error if profile not found
        const driver = await driverService.getProfile(userId);

        // ============================================
        // STEP 3: Send success response
        // ============================================
        // Status 200: OK (request successful)
        res.status(200).json({
            success: true,
            data: driver,
            message: 'Driver profile retrieved successfully'
        });
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // Log error for debugging
        console.error('Error in getProfile:', error);

        // Send error response
        // Status 500: Internal Server Error
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve driver profile'
        });
    }
};

// ============================================
// UPDATE DRIVER PROFILE
// ============================================
// Endpoint: PATCH /api/driver/me
// Access: Private (DRIVER only)
// Purpose: Update driver profile (optional fields)
//
// Request Headers:
//   Authorization: Bearer <jwt_token>
//
// Request Body Example (all fields optional):
// {
//     "vehicleModel": "Honda City",
//     "vehicleColor": "White",
//     "profilePicture": "https://cloudinary.com/...",
//     "licenseExpiry": "2026-12-31"
// }
//
// Response (200 OK):
// {
//     "success": true,
//     "data": { updated profile with new completion % },
//     "message": "Profile updated successfully"
// }
//
// Error Responses:
// - 400: Validation error (invalid data)
// - 401: Unauthorized (no token or invalid token)
// - 403: Forbidden (not DRIVER role)
// - 404: Not found (profile doesn't exist)
// - 500: Server error
export const updateProfile = async (req, res) => {
    try {
        // ============================================
        // STEP 1: Extract data from request
        // ============================================
        const userId = req.user._id;
        const updateData = req.body;

        // ============================================
        // STEP 2: Call service to update profile
        // ============================================
        // Service handles business logic
        // Returns updated driver profile
        const driver = await driverService.updateProfile(userId, updateData);

        // ============================================
        // STEP 3: Send success response
        // ============================================
        // Status 200: OK (request successful)
        res.status(200).json({
            success: true,
            data: driver,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // Log error for debugging
        console.error('Error in updateProfile:', error);

        // Send error response
        // Status 500: Internal Server Error
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update driver profile'
        });
    }
};

// ============================================
// UPDATE DRIVER STATUS (ONLINE/OFFLINE)
// ============================================
// Endpoint: PATCH /api/driver/me/status
// Access: Private (DRIVER only)
// Purpose: Toggle driver availability
//
// Request Headers:
//   Authorization: Bearer <jwt_token>
//
// Request Body:
// {
//     "isOnline": true    // true = go online, false = go offline
// }
//
// Response (200 OK):
// {
//     "success": true,
//     "data": { driver with updated status },
//     "message": "Status updated to ONLINE"
// }
//
// Error Responses:
// - 400: Validation error (invalid data)
// - 401: Unauthorized (no token or invalid token)
// - 403: Forbidden (not DRIVER role OR profile < 70% OR not verified)
// - 404: Not found (profile doesn't exist)
// - 500: Server error
//
// Business Rules:
// - Can only go online if profile >= 70% complete
// - Can only go online if verified by admin
// - Can always go offline (no restrictions)
export const updateStatus = async (req, res) => {
    try {
        // ============================================
        // STEP 1: Extract data from request
        // ============================================
        const userId = req.user._id;
        const { isOnline } = req.body;  // Extract isOnline from body

        // ============================================
        // STEP 2: Call service to update status
        // ============================================
        // Service handles business logic and validation
        // Throws error if driver cannot go online
        const driver = await driverService.updateStatus(userId, isOnline);

        // ============================================
        // STEP 3: Send success response
        // ============================================
        // Status 200: OK (request successful)
        // Dynamic message based on status
        res.status(200).json({
            success: true,
            data: driver,
            message: `Status updated to ${isOnline ? 'ONLINE' : 'OFFLINE'}`
        });
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // Log error for debugging
        console.error('Error in updateStatus:', error);

        // Send error response
        // Status 500: Internal Server Error
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update driver status'
        });
    }
};

// ============================================
// GET PROFILE COMPLETION DETAILS
// ============================================
// Endpoint: GET /api/driver/me/completion
// Access: Private (DRIVER only)
// Purpose: Show what fields are missing
//
// Request Headers:
//   Authorization: Bearer <jwt_token>
//
// Response (200 OK):
// {
//     "success": true,
//     "data": {
//         "completionPercentage": 70,
//         "missingFields": [
//             { "field": "profilePicture", "weight": 10, "label": "Profile Picture" },
//             { "field": "vehicleModel", "weight": 5, "label": "Vehicle Model" }
//         ],
//         "canGoOnline": false,
//         "isVerified": false
//     },
//     "message": "Profile completion details"
// }
//
// Error Responses:
// - 401: Unauthorized (no token or invalid token)
// - 403: Forbidden (not DRIVER role)
// - 404: Not found (profile doesn't exist)
// - 500: Server error
//
// Use Case:
// - Show driver their profile completion percentage
// - Show what fields they need to fill
// - Show if they can go online
// - Show if admin has verified them
export const getProfileCompletion = async (req, res) => {
    try {
        // ============================================
        // STEP 1: Extract userId from request
        // ============================================
        const userId = req.user._id;

        // ============================================
        // STEP 2: Call service to get completion details
        // ============================================
        // Service returns completion percentage and missing fields
        const completion = await driverService.getProfileCompletion(userId);

        // ============================================
        // STEP 3: Send success response
        // ============================================
        // Status 200: OK (request successful)
        res.status(200).json({
            success: true,
            data: completion,
            message: 'Profile completion details'
        });
    } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================
        // Log error for debugging
        console.error('Error in getProfileCompletion:', error);

        // Send error response
        // Status 500: Internal Server Error
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get profile completion details'
        });
    }
};
