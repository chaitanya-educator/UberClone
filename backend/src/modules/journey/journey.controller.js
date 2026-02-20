import { journeyService } from "./journey.service.js";

/**
 * @swagger
 * tags:
 *   name: Journey
 *   description: Journey (ride) booking, management, and payment
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     JourneyResponse:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64a1b2c3d4e5f6a7b8c9d0e2"
 *         status:
 *           type: string
 *           enum: [REQUESTED, ACCEPTED, ARRIVED, STARTED, COMPLETED, CANCELLED]
 *         vehicleType:
 *           type: string
 *           enum: [CAR, BIKE, AUTO, E_RICKSHAW, ELECTRIC_SCOOTER]
 *         rider:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *         driver:
 *           type: object
 *           nullable: true
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             vehicleModel:
 *               type: string
 *             vehicleColor:
 *               type: string
 *             vehicleNumber:
 *               type: string
 *             rating:
 *               type: number
 *         pickup:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             location:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Point"
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [72.8479, 19.0760]
 *         dropoff:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             location:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: "Point"
 *                 coordinates:
 *                   type: array
 *                   items:
 *                     type: number
 *                   example: [72.8345, 19.0850]
 *         estimatedFare:
 *           type: number
 *           example: 150
 *         actualFare:
 *           type: number
 *           nullable: true
 *           example: 165
 *         paymentMethod:
 *           type: string
 *           enum: [CASH, CARD, UPI, WALLET]
 *         paymentStatus:
 *           type: string
 *           enum: [PENDING, COMPLETED, FAILED]
 *         requestedAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

/**
 * @swagger
 * /api/journey/create:
 *   post:
 *     summary: Create a new journey (Rider)
 *     description: Rider creates a new journey request. The estimated fare is automatically calculated based on pickup/dropoff coordinates and vehicle type.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddress
 *               - pickupCoordinates
 *               - dropoffAddress
 *               - dropoffCoordinates
 *               - vehicleType
 *               - paymentMethod
 *             properties:
 *               pickupAddress:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: "123 Main Street, Mumbai"
 *               pickupCoordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude]"
 *                 example: [72.8479, 19.0760]
 *               dropoffAddress:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 example: "456 Park Avenue, Mumbai"
 *               dropoffCoordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: "[longitude, latitude]"
 *                 example: [72.8345, 19.0850]
 *               vehicleType:
 *                 type: string
 *                 enum: [CAR, BIKE, AUTO, E_RICKSHAW, ELECTRIC_SCOOTER]
 *               paymentMethod:
 *                 type: string
 *                 enum: [CASH, CARD, UPI, WALLET]
 *                 default: CASH
 *               numberOfPassengers:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 default: 1
 *               specialRequests:
 *                 type: string
 *                 maxLength: 500
 *               luggage:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Journey created successfully
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
 *                   example: "Journey created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const createJourney = async (req, res) => {
    try {
        const userId = req.user._id;
        const journeyData = req.body;
        const journey = await journeyService.createJourney(userId, journeyData);
        res.status(201).json({
            success: true,
            data: journey,
            message: 'Journey created successfully'
        });
    } catch (error) {
        console.error('Error in createJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/accept:
 *   post:
 *     summary: Accept a journey (Driver)
 *     description: Driver accepts an open journey request. Driver must be online and verified.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID to accept
 *     responses:
 *       200:
 *         description: Journey accepted successfully
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
 *                   example: "Journey accepted successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Journey already taken or vehicle type mismatch
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a DRIVER or driver is offline/unverified
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const acceptJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const driverId = req.user.driver._id;
        const journey = await journeyService.acceptJourney(journeyId, driverId);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey accepted successfully'
        });
    } catch (error) {
        console.error('Error in acceptJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to accept journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/status:
 *   patch:
 *     summary: Update journey status (Driver)
 *     description: |
 *       Driver updates the journey status.
 *       **Valid transitions:** `ACCEPTED → ARRIVED`, `ARRIVED → STARTED`
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ARRIVED, STARTED]
 *           example:
 *             status: "ARRIVED"
 *     responses:
 *       200:
 *         description: Journey status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Journey status updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Invalid status transition
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const updateJourneyStatus = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { status } = req.body;
        const driverId = req.user.driver._id;
        const journey = await journeyService.updateJourneyStatus(journeyId, driverId, status);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey status updated successfully'
        });
    } catch (error) {
        console.error('Error in updateJourneyStatus:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update journey status'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/complete:
 *   post:
 *     summary: Complete a journey (Driver)
 *     description: Driver marks a journey as completed. Journey must be in STARTED status. Automatically increments driver's total ride count.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID to complete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actualFare
 *               - distance
 *               - duration
 *             properties:
 *               actualFare:
 *                 type: number
 *                 minimum: 1
 *                 example: 245
 *               distance:
 *                 type: number
 *                 minimum: 0
 *                 description: Distance in kilometres
 *                 example: 12.5
 *               duration:
 *                 type: number
 *                 minimum: 0
 *                 description: Duration in minutes
 *                 example: 28
 *     responses:
 *       200:
 *         description: Journey completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Journey completed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Journey not in STARTED status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const completeJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { actualFare, distance, duration } = req.body;
        const driverId = req.user.driver._id;
        const completionData = { actualFare, distance, duration };
        const journey = await journeyService.completeJourney(journeyId, driverId, completionData);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey completed successfully'
        });
    } catch (error) {
        console.error('Error in completeJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/cancel:
 *   post:
 *     summary: Cancel a journey (Rider or Driver)
 *     description: Cancels an active journey. Can be done by the rider or driver. Not allowed once journey is COMPLETED or already CANCELLED.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID to cancel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - cancelledBy
 *             properties:
 *               reason:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 500
 *                 example: "Driver is taking too long"
 *               cancelledBy:
 *                 type: string
 *                 enum: [RIDER, DRIVER]
 *     responses:
 *       200:
 *         description: Journey cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Journey cancelled successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       400:
 *         description: Journey cannot be cancelled in its current status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - User is not part of this journey
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const cancelJourney = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const { reason, cancelledBy } = req.body;
        const userId = req.user._id;
        const journey = await journeyService.cancelJourney(journeyId, userId, reason, cancelledBy);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey cancelled successfully'
        });
    } catch (error) {
        console.error('Error in cancelJourney:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to cancel journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}:
 *   get:
 *     summary: Get journey by ID
 *     description: Retrieves full journey details. Only accessible by the rider or driver associated with the journey.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The journey ID
 *     responses:
 *       200:
 *         description: Journey retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Journey retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/JourneyResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the rider or driver of this journey
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const getJourneyById = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const userId = req.user._id;
        const journey = await journeyService.getJourneyById(journeyId, userId);
        res.status(200).json({
            success: true,
            data: journey,
            message: 'Journey retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getJourneyById:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve journey'
        });
    }
};

/**
 * @swagger
 * /api/journey/rider/history:
 *   get:
 *     summary: Get rider journey history
 *     description: Returns all journeys for the authenticated rider, sorted by most recent. Optional status filter available.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ACCEPTED, ARRIVED, STARTED, COMPLETED, CANCELLED]
 *         description: Filter journeys by status
 *     responses:
 *       200:
 *         description: Rider journeys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Rider journeys retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JourneyResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export const getRiderJourneys = async (req, res) => {
    try {
        const riderId = req.user._id;
        const { status } = req.query;
        const journeys = await journeyService.getRiderJourneys(riderId, status || null);
        res.status(200).json({
            success: true,
            data: journeys,
            message: 'Rider journeys retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getRiderJourneys:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve rider journeys'
        });
    }
};

/**
 * @swagger
 * /api/journey/driver/history:
 *   get:
 *     summary: Get driver journey history
 *     description: Returns all journeys assigned to the authenticated driver, sorted by most recent. Only accessible by DRIVER role.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [REQUESTED, ACCEPTED, ARRIVED, STARTED, COMPLETED, CANCELLED]
 *         description: Filter journeys by status
 *     responses:
 *       200:
 *         description: Driver journeys retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Driver journeys retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JourneyResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a DRIVER
 *       500:
 *         description: Internal server error
 */
export const getDriverJourneys = async (req, res) => {
    try {
        const driverId = req.user.driver._id;
        const { status } = req.query;
        const journeys = await journeyService.getDriverJourneys(driverId, status || null);
        res.status(200).json({
            success: true,
            data: journeys,
            message: 'Driver journeys retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getDriverJourneys:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve driver journeys'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/payment-qr:
 *   get:
 *     summary: Generate payment QR code (Rider)
 *     description: Generates a base64 QR code image for payment after journey completion. Only available once journey is COMPLETED and payment is still PENDING.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The completed journey ID
 *     responses:
 *       200:
 *         description: Payment QR generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Payment QR generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     journeyId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       example: 245
 *                     paymentMethod:
 *                       type: string
 *                       example: "UPI"
 *                     qrCode:
 *                       type: string
 *                       description: Base64 encoded PNG image (data:image/png;base64,...)
 *       400:
 *         description: Journey not completed or payment already done
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the rider of this journey
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const generatePaymentQR = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const riderId = req.user._id;
        const paymentQR = await journeyService.generatePaymentQR(journeyId, riderId);
        res.status(200).json({
            success: true,
            data: paymentQR,
            message: 'Payment QR generated successfully'
        });
    } catch (error) {
        console.error('Error in generatePaymentQR:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate payment QR'
        });
    }
};

/**
 * @swagger
 * /api/journey/{journeyId}/confirm-payment:
 *   post:
 *     summary: Confirm payment (Rider)
 *     description: Marks the journey payment as completed. Idempotent — safe to call multiple times; returns `alreadyPaid: true` if already paid.
 *     tags:
 *       - Journey
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: journeyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The completed journey ID
 *     responses:
 *       200:
 *         description: Payment confirmed (or already completed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Payment confirmed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     journeyId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       example: 245
 *                     paymentMethod:
 *                       type: string
 *                     alreadyPaid:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Journey not in COMPLETED status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the rider of this journey
 *       404:
 *         description: Journey not found
 *       500:
 *         description: Internal server error
 */
export const confirmPayment = async (req, res) => {
    try {
        const { journeyId } = req.params;
        const riderId = req.user._id;
        const result = await journeyService.confirmPayment(journeyId, riderId);
        res.status(200).json({
            success: true,
            data: result,
            message: result.alreadyPaid ? 'Payment already completed' : 'Payment confirmed successfully'
        });
    } catch (error) {
        console.error('Error in confirmPayment:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to confirm payment'
        });
    }
};
