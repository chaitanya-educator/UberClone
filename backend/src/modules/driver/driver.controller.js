import { driverService } from "./driver.service.js";

// ============================================
// DRIVER CONTROLLER - HTTP Request/Response Layer
// ============================================

/**
 * @swagger
 * tags:
 *   name: Driver
 *   description: Driver profile and status management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DriverProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6a7b8c9d0e1"
 *         userId:
 *           type: string
 *           example: "64a1b2c3d4e5f6a7b8c9d0e0"
 *         personalInfo:
 *           type: object
 *           properties:
 *             languagePreference:
 *               type: string
 *               enum: [HINDI, ENGLISH, MARATHI, TAMIL, TELUGU, KANNADA, BENGALI, GUJARATI]
 *             city:
 *               type: string
 *               enum: [MUMBAI, DELHI, BANGALORE, HYDERABAD, CHENNAI, KOLKATA, PUNE, AHMEDABAD]
 *             profilePicture:
 *               type: string
 *               nullable: true
 *             aadharNumber:
 *               type: string
 *               description: Masked aadhar (XXXX XXXX 1234)
 *         documents:
 *           type: object
 *           properties:
 *             licenseNumber:
 *               type: string
 *             licenseExpiry:
 *               type: string
 *               format: date
 *               nullable: true
 *             rcNumber:
 *               type: string
 *             rcExpiry:
 *               type: string
 *               format: date
 *               nullable: true
 *         vehicleInfo:
 *           type: object
 *           properties:
 *             vehicleType:
 *               type: string
 *               enum: [CAR, BIKE, AUTO, E_RICKSHAW, ELECTRIC_SCOOTER]
 *             vehicleNumber:
 *               type: string
 *               nullable: true
 *             vehicleModel:
 *               type: string
 *               nullable: true
 *             vehicleColor:
 *               type: string
 *               nullable: true
 *         status:
 *           type: object
 *           properties:
 *             isOnline:
 *               type: boolean
 *             isVerified:
 *               type: boolean
 *             profileCompletionPercentage:
 *               type: number
 *         stats:
 *           type: object
 *           properties:
 *             rating:
 *               type: number
 *               example: 4.8
 *             totalRides:
 *               type: number
 *               example: 120
 */

/**
 * @swagger
 * /api/driver/profile:
 *   post:
 *     summary: Create driver profile
 *     description: Creates a new driver profile for the authenticated DRIVER user. Requires at minimum language preference, city, aadhar, license, RC number, and vehicle type.
 *     tags:
 *       - Driver
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - languagePreference
 *               - city
 *               - aadharNumber
 *               - licenseNumber
 *               - rcNumber
 *               - vehicleType
 *             properties:
 *               languagePreference:
 *                 type: string
 *                 enum: [HINDI, ENGLISH, MARATHI, TAMIL, TELUGU, KANNADA, BENGALI, GUJARATI]
 *               city:
 *                 type: string
 *                 enum: [MUMBAI, DELHI, BANGALORE, HYDERABAD, CHENNAI, KOLKATA, PUNE, AHMEDABAD]
 *               aadharNumber:
 *                 type: string
 *                 pattern: '^[0-9]{12}$'
 *                 description: 12-digit Aadhar number
 *               licenseNumber:
 *                 type: string
 *               rcNumber:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [CAR, BIKE, AUTO, E_RICKSHAW, ELECTRIC_SCOOTER]
 *               vehicleModel:
 *                 type: string
 *                 description: Optional (e.g. Honda City)
 *               vehicleColor:
 *                 type: string
 *                 description: Optional
 *               profilePicture:
 *                 type: string
 *                 description: Optional URL to profile picture
 *           example:
 *             languagePreference: "HINDI"
 *             city: "MUMBAI"
 *             aadharNumber: "123456789012"
 *             licenseNumber: "MH1234567890"
 *             rcNumber: "MH01AB1234"
 *             vehicleType: "CAR"
 *             vehicleModel: "Honda City"
 *             vehicleColor: "White"
 *     responses:
 *       201:
 *         description: Driver profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Driver profile created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DriverProfile'
 *       400:
 *         description: Validation error or profile already exists
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not a DRIVER
 *       500:
 *         description: Internal server error
 */
export const createProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const profileData = req.body;
        const driver = await driverService.createProfile(userId, profileData);
        res.status(201).json({
            success: true,
            data: driver,
            message: 'Driver profile created successfully'
        });
    } catch (error) {
        console.error('Error in createProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create driver profile'
        });
    }
};

/**
 * @swagger
 * /api/driver/me:
 *   get:
 *     summary: Get driver profile
 *     description: Retrieves the complete profile of the currently authenticated driver.
 *     tags:
 *       - Driver
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Driver profile retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DriverProfile'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - User is not a DRIVER
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const driver = await driverService.getProfile(userId);
        res.status(200).json({
            success: true,
            data: driver,
            message: 'Driver profile retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve driver profile'
        });
    }
};

/**
 * @swagger
 * /api/driver/me:
 *   patch:
 *     summary: Update driver profile
 *     description: Updates optional fields of the driver profile such as vehicle model, color, profile picture, and document expiry dates.
 *     tags:
 *       - Driver
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicleModel:
 *                 type: string
 *                 example: "Honda City"
 *               vehicleColor:
 *                 type: string
 *                 example: "White"
 *               profilePicture:
 *                 type: string
 *                 example: "https://cloudinary.com/image.jpg"
 *               licenseExpiry:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-31"
 *               rcExpiry:
 *                 type: string
 *                 format: date
 *                 example: "2027-06-30"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/DriverProfile'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a DRIVER
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updateData = req.body;
        const driver = await driverService.updateProfile(userId, updateData);
        res.status(200).json({
            success: true,
            data: driver,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update driver profile'
        });
    }
};

/**
 * @swagger
 * /api/driver/me/status:
 *   patch:
 *     summary: Update driver online/offline status
 *     description: |
 *       Toggles driver availability.
 *       **Business Rules:**
 *       - Driver can only go ONLINE if profile is ≥ 70% complete AND admin has verified them.
 *       - Driver can always go OFFLINE.
 *     tags:
 *       - Driver
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *                 description: true = go online, false = go offline
 *           example:
 *             isOnline: true
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Status updated to ONLINE"
 *                 data:
 *                   $ref: '#/components/schemas/DriverProfile'
 *       400:
 *         description: Cannot go online - profile incomplete or not verified
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a DRIVER
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 */
export const updateStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { isOnline } = req.body;
        const driver = await driverService.updateStatus(userId, isOnline);
        res.status(200).json({
            success: true,
            data: driver,
            message: `Status updated to ${isOnline ? 'ONLINE' : 'OFFLINE'}`
        });
    } catch (error) {
        console.error('Error in updateStatus:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update driver status'
        });
    }
};

/**
 * @swagger
 * /api/driver/me/completion:
 *   get:
 *     summary: Get profile completion details
 *     description: Returns profile completion percentage and a list of missing optional fields, along with online eligibility status.
 *     tags:
 *       - Driver
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile completion details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile completion details"
 *                 data:
 *                   type: object
 *                   properties:
 *                     completionPercentage:
 *                       type: number
 *                       example: 70
 *                     missingFields:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           field:
 *                             type: string
 *                           weight:
 *                             type: number
 *                           label:
 *                             type: string
 *                       example:
 *                         - field: "profilePicture"
 *                           weight: 10
 *                           label: "Profile Picture"
 *                     canGoOnline:
 *                       type: boolean
 *                       example: false
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a DRIVER
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 */
export const getProfileCompletion = async (req, res) => {
    try {
        const userId = req.user._id;
        const completion = await driverService.getProfileCompletion(userId);
        res.status(200).json({
            success: true,
            data: completion,
            message: 'Profile completion details'
        });
    } catch (error) {
        console.error('Error in getProfileCompletion:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get profile completion details'
        });
    }
};
