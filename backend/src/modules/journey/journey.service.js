import { Ride } from '../model/journey.model.js';
import { User } from '../model/user.model.js';
import { Driver } from '../model/driver.model.js';
import QRCode from 'qrcode';

// ============================================
// JOURNEY SERVICE - Business Logic Layer
// ============================================
// Contains all journey-related business logic
// Controllers call these functions
// Handles validation, data transformation, and orchestration

class JourneyService {

    // ============================================
    // CREATE JOURNEY (RIDER)
    // ============================================
    // Purpose: Rider creates a new journey request
    //
    // Flow:
    // 1. Validate rider exists
    // 2. Calculate estimated fare based on distance
    // 3. Create journey with REQUESTED status
    // 4. Return journey details
    //
    // Parameters:
    //   - riderId: ObjectId of User (RIDER role)
    //   - journeyData: Object with journey details
    //
    // Returns: Created journey object
    async createJourney(riderId, journeyData) {
        // Validate rider exists
        const rider = await User.findById(riderId);
        if (!rider) {
            throw new Error('Rider not found');
        }

        // Calculate estimated fare (simple calculation: base + distance-based)
        const estimatedFare = this.calculateEstimatedFare(
            journeyData.pickupCoordinates,
            journeyData.dropoffCoordinates,
            journeyData.vehicleType
        );

        // Create journey
        const journey = new Ride({
            riderId,
            vehicleType: journeyData.vehicleType,
            pickup: {
                address: journeyData.pickupAddress,
                location: {
                    type: 'Point',
                    coordinates: journeyData.pickupCoordinates  // [longitude, latitude]
                }
            },
            dropoff: {
                address: journeyData.dropoffAddress,
                location: {
                    type: 'Point',
                    coordinates: journeyData.dropoffCoordinates  // [longitude, latitude]
                }
            },
            estimatedFare,
            paymentMethod: journeyData.paymentMethod,
            status: 'REQUESTED'
        });

        await journey.save();
        await journey.populate('riderId', 'name email phone');

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // ACCEPT JOURNEY (DRIVER)
    // ============================================
    // Purpose: Driver accepts a journey request
    //
    // Flow:
    // 1. Validate driver exists and is online/verified
    // 2. Validate journey exists and is still REQUESTED
    // 3. Assign driver to journey
    // 4. Update status to ACCEPTED
    // 5. Set acceptedAt timestamp
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride (Journey)
    //   - driverId: ObjectId of Driver
    //
    // Returns: Updated journey object
    async acceptJourney(journeyId, driverId) {
        // Validate driver
        const driver = await Driver.findById(driverId).populate('userId');
        if (!driver) {
            throw new Error('Driver not found');
        }

        if (!driver.status.isOnline) {
            throw new Error('Driver must be online to accept journeys');
        }

        if (!driver.status.isVerified) {
            throw new Error('Driver must be verified to accept journeys');
        }

        // Validate journey
        const journey = await Ride.findById(journeyId);
        if (!journey) {
            throw new Error('Journey not found');
        }

        if (journey.status !== 'REQUESTED') {
            throw new Error('Journey is no longer available');
        }

        // Check vehicle type match
        if (journey.vehicleType !== driver.vehicleInfo.vehicleType) {
            throw new Error('Vehicle type does not match journey request');
        }

        // Assign driver and update status
        journey.driverId = driverId;
        journey.status = 'ACCEPTED';
        journey.acceptedAt = new Date();

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // UPDATE JOURNEY STATUS (DRIVER)
    // ============================================
    // Purpose: Driver updates journey status (ARRIVED, STARTED)
    //
    // Flow:
    // 1. Validate journey exists and driver owns it
    // 2. Validate status transition is valid
    // 3. Update status and timestamp
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride (Journey)
    //   - driverId: ObjectId of Driver
    //   - newStatus: New status (ARRIVED or STARTED)
    //
    // Returns: Updated journey object
    async updateJourneyStatus(journeyId, driverId, newStatus) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate driver owns this journey
        if (!journey.driverId || journey.driverId.toString() !== driverId.toString()) {
            throw new Error('You are not assigned to this journey');
        }

        // Validate status transition
        if (!journey.isValidStatusTransition(newStatus)) {
            throw new Error(`Cannot transition from ${journey.status} to ${newStatus}`);
        }

        // Update status and timestamp
        journey.status = newStatus;

        if (newStatus === 'ARRIVED') {
            journey.arrivedAt = new Date();
        } else if (newStatus === 'STARTED') {
            journey.startedAt = new Date();
        }

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // COMPLETE JOURNEY (DRIVER)
    // ============================================
    // Purpose: Driver completes the journey
    //
    // Flow:
    // 1. Validate journey exists and driver owns it
    // 2. Validate journey is in STARTED status
    // 3. Update journey with completion data
    // 4. Update payment status
    // 5. Update driver stats
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride (Journey)
    //   - driverId: ObjectId of Driver
    //   - completionData: { actualFare, distance, duration }
    //
    // Returns: Updated journey object
    async completeJourney(journeyId, driverId, completionData) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate driver owns this journey
        if (!journey.driverId || journey.driverId.toString() !== driverId.toString()) {
            throw new Error('You are not assigned to this journey');
        }

        // Validate journey is started
        if (journey.status !== 'STARTED') {
            throw new Error('Journey must be started before completion');
        }

        // Update journey
        journey.status = 'COMPLETED';
        journey.completedAt = new Date();
        journey.actualFare = completionData.actualFare;
        journey.distance = completionData.distance;
        journey.duration = completionData.duration;
        journey.paymentStatus = 'COMPLETED';

        await journey.save();

        // Update driver stats
        await Driver.findByIdAndUpdate(driverId, {
            $inc: { 'stats.totalRides': 1 }
        });

        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // CANCEL JOURNEY
    // ============================================
    // Purpose: Cancel a journey (by rider or driver)
    //
    // Flow:
    // 1. Validate journey exists
    // 2. Validate user is rider or driver
    // 3. Check if journey can be cancelled
    // 4. Update status to CANCELLED
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride (Journey)
    //   - userId: ObjectId of User (rider) or Driver
    //   - reason: Cancellation reason
    //   - cancelledBy: 'RIDER' or 'DRIVER'
    //
    // Returns: Updated journey object
    async cancelJourney(journeyId, userId, reason, cancelledBy) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate user is part of this journey
        const isRider = journey.riderId.toString() === userId.toString();
        const isDriver = journey.driverId && journey.driverId.toString() === userId.toString();

        if (!isRider && !isDriver) {
            throw new Error('You are not authorized to cancel this journey');
        }

        // Check if journey can be cancelled
        if (!journey.canBeCancelled()) {
            throw new Error('Journey cannot be cancelled in current status');
        }

        // Update journey
        journey.status = 'CANCELLED';
        journey.cancelledAt = new Date();
        journey.cancellationReason = reason;
        journey.cancelledBy = cancelledBy;

        await journey.save();
        await journey.populate([
            { path: 'riderId', select: 'name email phone' },
            { path: 'driverId', populate: { path: 'userId', select: 'name email phone' } }
        ]);

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // GET JOURNEY BY ID
    // ============================================
    // Purpose: Get journey details
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride (Journey)
    //   - userId: ObjectId of User or Driver (for authorization)
    //
    // Returns: Journey object
    async getJourneyById(journeyId, userId) {
        const journey = await Ride.findById(journeyId)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            });

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Validate user is part of this journey
        const isRider = journey.riderId._id.toString() === userId.toString();
        const isDriver = journey.driverId && journey.driverId._id.toString() === userId.toString();

        if (!isRider && !isDriver) {
            throw new Error('You are not authorized to view this journey');
        }

        return this.formatJourneyResponse(journey);
    }

    // ============================================
    // GET RIDER JOURNEYS
    // ============================================
    // Purpose: Get rider's journey history
    //
    // Parameters:
    //   - riderId: ObjectId of User (RIDER)
    //   - status: Optional status filter
    //
    // Returns: Array of journeys
    async getRiderJourneys(riderId, status = null) {
        const query = { riderId };

        if (status) {
            query.status = status;
        }

        const journeys = await Ride.find(query)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        return journeys.map(journey => this.formatJourneyResponse(journey));
    }

    // ============================================
    // GET DRIVER JOURNEYS
    // ============================================
    // Purpose: Get driver's journey history
    //
    // Parameters:
    //   - driverId: ObjectId of Driver
    //   - status: Optional status filter
    //
    // Returns: Array of journeys
    async getDriverJourneys(driverId, status = null) {
        const query = { driverId };

        if (status) {
            query.status = status;
        }

        const journeys = await Ride.find(query)
            .populate('riderId', 'name email phone')
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name email phone' }
            })
            .sort({ createdAt: -1 });

        return journeys.map(journey => this.formatJourneyResponse(journey));
    }

    // ============================================
    // CALCULATE ESTIMATED FARE
    // ============================================
    // Purpose: Calculate estimated fare based on distance and vehicle type
    //
    // Parameters:
    //   - pickupCoords: [longitude, latitude]
    //   - dropoffCoords: [longitude, latitude]
    //   - vehicleType: Vehicle type
    //
    // Returns: Estimated fare (number)
    calculateEstimatedFare(pickupCoords, dropoffCoords, vehicleType) {
        // Calculate distance using Haversine formula
        const distance = this.calculateDistance(pickupCoords, dropoffCoords);

        // Base fares and rates per km for different vehicle types
        const pricing = {
            'CAR': { base: 50, perKm: 12 },
            'BIKE': { base: 20, perKm: 6 },
            'AUTO': { base: 30, perKm: 8 },
            'E_RICKSHAW': { base: 25, perKm: 7 },
            'ELECTRIC_SCOOTER': { base: 15, perKm: 5 }
        };

        const { base, perKm } = pricing[vehicleType];
        const fare = base + (distance * perKm);

        return Math.round(fare);
    }

    // ============================================
    // CALCULATE DISTANCE
    // ============================================
    // Purpose: Calculate distance between two coordinates using Haversine formula
    //
    // Parameters:
    //   - coords1: [longitude, latitude]
    //   - coords2: [longitude, latitude]
    //
    // Returns: Distance in kilometers
    calculateDistance(coords1, coords2) {
        const [lon1, lat1] = coords1;
        const [lon2, lat2] = coords2;

        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return distance;
    }

    // Convert degrees to radians
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    // ============================================
    // FORMAT JOURNEY RESPONSE
    // ============================================
    // Purpose: Format journey data for API response
    //
    // Parameters:
    //   - journey: Ride document from database
    //
    // Returns: Formatted object for API response
    formatJourneyResponse(journey) {
        const response = {
            _id: journey._id,
            status: journey.status,
            vehicleType: journey.vehicleType,

            rider: {
                _id: journey.riderId._id,
                name: journey.riderId.name,
                email: journey.riderId.email,
                phone: journey.riderId.phone
            },

            driver: journey.driverId ? {
                _id: journey.driverId._id,
                name: journey.driverId.userId.name,
                email: journey.driverId.userId.email,
                phone: journey.driverId.userId.phone,
                vehicleModel: journey.driverId.vehicleInfo.vehicleModel,
                vehicleColor: journey.driverId.vehicleInfo.vehicleColor,
                vehicleNumber: journey.driverId.vehicleInfo.vehicleNumber,
                rating: journey.driverId.stats.rating
            } : null,

            pickup: journey.pickup,
            dropoff: journey.dropoff,

            estimatedFare: journey.estimatedFare,
            actualFare: journey.actualFare,
            distance: journey.distance,
            duration: journey.duration,

            paymentMethod: journey.paymentMethod,
            paymentStatus: journey.paymentStatus,

            requestedAt: journey.requestedAt,
            acceptedAt: journey.acceptedAt,
            arrivedAt: journey.arrivedAt,
            startedAt: journey.startedAt,
            completedAt: journey.completedAt,
            cancelledAt: journey.cancelledAt,

            cancellationReason: journey.cancellationReason,
            cancelledBy: journey.cancelledBy,

            rating: journey.rating,
            feedback: journey.feedback,

            createdAt: journey.createdAt,
            updatedAt: journey.updatedAt
        };

        return response;
    }

    // ============================================
    // GENERATE PAYMENT QR
    // ============================================
    // Purpose: Generate a QR code for payment
    // The QR encodes { journeyId, amount, paymentMethod }
    // Rider scans QR to pay driver
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride
    //   - riderId: ObjectId of User (RIDER)
    //
    // Returns: { qrCode (base64 data URI), amount, journeyId }
    async generatePaymentQR(journeyId, riderId) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        // Only the rider of this journey can request QR
        if (journey.riderId.toString() !== riderId.toString()) {
            throw new Error('You are not authorized to generate payment for this journey');
        }

        // Only COMPLETED journeys need payment
        if (journey.status !== 'COMPLETED') {
            throw new Error('Payment QR only available for completed journeys');
        }

        if (journey.paymentStatus === 'COMPLETED') {
            throw new Error('Payment has already been completed');
        }

        const amount = journey.actualFare || journey.estimatedFare;

        // Build QR data payload
        const qrData = JSON.stringify({
            journeyId: journey._id.toString(),
            amount,
            paymentMethod: journey.paymentMethod,
            timestamp: Date.now()
        });

        // Generate base64 QR code image
        const qrCode = await QRCode.toDataURL(qrData, {
            width: 256,
            margin: 2,
            color: {
                dark: '#1a1a2e',
                light: '#ffffff'
            }
        });

        return {
            journeyId: journey._id,
            amount,
            paymentMethod: journey.paymentMethod,
            qrCode
        };
    }

    // ============================================
    // CONFIRM PAYMENT
    // ============================================
    // Purpose: Mark journey payment as completed
    // Simulates a payment confirmation received
    //
    // Parameters:
    //   - journeyId: ObjectId of Ride
    //   - riderId: ObjectId of User (RIDER)
    //
    // Returns: Updated journey object
    async confirmPayment(journeyId, riderId) {
        const journey = await Ride.findById(journeyId);

        if (!journey) {
            throw new Error('Journey not found');
        }

        if (journey.riderId.toString() !== riderId.toString()) {
            throw new Error('You are not authorized to confirm payment for this journey');
        }

        if (journey.status !== 'COMPLETED') {
            throw new Error('Can only confirm payment for completed journeys');
        }

        if (journey.paymentStatus === 'COMPLETED') {
            return { alreadyPaid: true, journeyId: journey._id };
        }

        journey.paymentStatus = 'COMPLETED';
        await journey.save();

        return {
            alreadyPaid: false,
            journeyId: journey._id,
            amount: journey.actualFare || journey.estimatedFare,
            paymentMethod: journey.paymentMethod
        };
    }
}

// ============================================
// EXPORT SINGLE INSTANCE
// ============================================
export const journeyService = new JourneyService();
