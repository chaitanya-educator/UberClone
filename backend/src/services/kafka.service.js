import { publishMessage, KAFKA_TOPICS } from '../config/kafka.js';

// ============================================
// KAFKA SERVICE
// ============================================
// Business logic layer for Kafka event publishing
// This service is called by controllers to publish events

class KafkaService {
    
    // ============================================
    // JOURNEY REQUESTED EVENT
    // ============================================
    // Published when a rider creates a new journey request
    //
    // Event Flow:
    // 1. Rider creates journey via API
    // 2. Journey saved to database
    // 3. Event published to Kafka
    // 4. Available drivers receive notification
    // 5. Drivers can accept the journey
    async publishJourneyRequested(journey) {
        const event = {
            eventType: 'JOURNEY_REQUESTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            riderName: journey.rider.name,
            riderPhone: journey.rider.phone,
            pickup: {
                address: journey.pickup.address,
                coordinates: journey.pickup.location.coordinates,
            },
            dropoff: {
                address: journey.dropoff.address,
                coordinates: journey.dropoff.location.coordinates,
            },
            vehicleType: journey.vehicleType,
            estimatedFare: journey.estimatedFare,
            paymentMethod: journey.paymentMethod,
            status: journey.status,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_REQUESTED,
            event,
            journey._id.toString() // Use journeyId as key for partitioning
        );
    }

    // ============================================
    // JOURNEY ACCEPTED EVENT
    // ============================================
    // Published when a driver accepts a journey
    //
    // Event Flow:
    // 1. Driver accepts journey via API
    // 2. Journey updated in database
    // 3. Event published to Kafka
    // 4. Rider receives notification
    // 5. Other drivers notified journey is taken
    async publishJourneyAccepted(journey, driver) {
        const event = {
            eventType: 'JOURNEY_ACCEPTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: driver.userId._id.toString(),
            driverName: driver.userId.name,
            driverPhone: driver.userId.phone,
            vehicleInfo: {
                type: driver.vehicleInfo.vehicleType,
                number: driver.vehicleInfo.vehicleNumber,
                model: driver.vehicleInfo.vehicleModel,
                color: driver.vehicleInfo.vehicleColor,
            },
            driverRating: driver.stats.rating,
            status: journey.status,
            acceptedAt: journey.acceptedAt,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_ACCEPTED,
            event,
            journey._id.toString()
        );
    }

    // ============================================
    // JOURNEY STARTED EVENT
    // ============================================
    // Published when driver starts the journey
    //
    // Event Flow:
    // 1. Driver clicks "Start Journey"
    // 2. Journey status updated to STARTED
    // 3. Event published to Kafka
    // 4. Rider receives real-time notification
    // 5. Tracking begins
    async publishJourneyStarted(journey) {
        const event = {
            eventType: 'JOURNEY_STARTED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: journey.driver._id.toString(),
            status: journey.status,
            startedAt: journey.startedAt,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_STARTED,
            event,
            journey._id.toString()
        );
    }

    // ============================================
    // JOURNEY COMPLETED EVENT
    // ============================================
    // Published when journey is completed
    //
    // Event Flow:
    // 1. Driver completes journey
    // 2. Fare calculated and saved
    // 3. Event published to Kafka
    // 4. Rider receives completion notification
    // 5. Payment processing triggered
    async publishJourneyCompleted(journey) {
        const event = {
            eventType: 'JOURNEY_COMPLETED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id.toString(),
            driverId: journey.driver._id.toString(),
            status: journey.status,
            completedAt: journey.completedAt,
            actualFare: journey.actualFare,
            distance: journey.distance,
            duration: journey.duration,
            paymentMethod: journey.paymentMethod,
            paymentStatus: journey.paymentStatus,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_COMPLETED,
            event,
            journey._id.toString()
        );
    }

    // ============================================
    // JOURNEY CANCELLED EVENT
    // ============================================
    // Published when journey is cancelled
    //
    // Event Flow:
    // 1. Rider or driver cancels journey
    // 2. Cancellation reason recorded
    // 3. Event published to Kafka
    // 4. Both parties notified
    // 5. Cancellation fee calculated (if applicable)
    async publishJourneyCancelled(journey) {
        const event = {
            eventType: 'JOURNEY_CANCELLED',
            timestamp: new Date().toISOString(),
            journeyId: journey._id.toString(),
            riderId: journey.rider._id ? journey.rider._id.toString() : null,
            driverId: journey.driver?._id ? journey.driver._id.toString() : null,
            status: journey.status,
            cancelledAt: journey.cancelledAt,
            cancelledBy: journey.cancelledBy,
            cancellationReason: journey.cancellationReason,
        };

        return await publishMessage(
            KAFKA_TOPICS.JOURNEY_CANCELLED,
            event,
            journey._id.toString()
        );
    }

    // ============================================
    // DRIVER LOCATION UPDATE EVENT
    // ============================================
    // Published when driver's location changes
    //
    // Event Flow:
    // 1. Driver app sends location update
    // 2. Location validated and saved
    // 3. Event published to Kafka
    // 4. Rider sees real-time driver location
    // 5. ETA updated
    async publishDriverLocation(driverId, location, journeyId = null) {
        const event = {
            eventType: 'DRIVER_LOCATION_UPDATE',
            timestamp: new Date().toISOString(),
            driverId: driverId.toString(),
            journeyId: journeyId ? journeyId.toString() : null,
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy || null,
                heading: location.heading || null,
                speed: location.speed || null,
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_LOCATION,
            event,
            driverId.toString()
        );
    }

    // ============================================
    // DRIVER STATUS CHANGE EVENT
    // ============================================
    // Published when driver goes online/offline
    //
    // Event Flow:
    // 1. Driver toggles availability
    // 2. Status updated in database
    // 3. Event published to Kafka
    // 4. Matching service updated
    // 5. Available drivers list refreshed
    async publishDriverStatus(driver, isOnline) {
        const event = {
            eventType: 'DRIVER_STATUS_CHANGE',
            timestamp: new Date().toISOString(),
            driverId: driver.userId._id.toString(),
            isOnline,
            vehicleType: driver.vehicleInfo.vehicleType,
            city: driver.personalInfo.city,
            rating: driver.stats.rating,
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_STATUS,
            event,
            driver.userId._id.toString()
        );
    }

    // ============================================
    // RIDER NOTIFICATION EVENT
    // ============================================
    // Sends notification to rider
    async publishRiderNotification(riderId, notification) {
        const event = {
            eventType: 'RIDER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            riderId: riderId.toString(),
            notification: {
                title: notification.title,
                message: notification.message,
                type: notification.type, // INFO, WARNING, SUCCESS, ERROR
                data: notification.data || {},
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.RIDER_NOTIFICATION,
            event,
            riderId.toString()
        );
    }

    // ============================================
    // DRIVER NOTIFICATION EVENT
    // ============================================
    // Sends notification to driver
    async publishDriverNotification(driverId, notification) {
        const event = {
            eventType: 'DRIVER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            driverId: driverId.toString(),
            notification: {
                title: notification.title,
                message: notification.message,
                type: notification.type, // INFO, WARNING, SUCCESS, ERROR
                data: notification.data || {},
            },
        };

        return await publishMessage(
            KAFKA_TOPICS.DRIVER_NOTIFICATION,
            event,
            driverId.toString()
        );
    }
}

export const kafkaService = new KafkaService();
