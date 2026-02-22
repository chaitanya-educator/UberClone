import { publishMessage, subscribeToTopic, KAFKA_TOPICS, initKafka } from './src/config/kafka.js';
import { env } from './src/config/env.js';

// ============================================
// KAFKA MESSAGE PASSING DEMONSTRATION
// ============================================
// This script demonstrates the complete Kafka message flow:
// 1. Rider books journey → Message sent
// 2. Driver receives notification → Message received
// 3. Driver accepts → Message sent
// 4. Rider receives confirmation → Message received

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         KAFKA MESSAGE PASSING DEMONSTRATION               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Simulated data
const mockRider = {
    id: 'rider-123',
    name: 'John Doe',
    phone: '1234567890'
};

const mockDriver = {
    id: 'driver-456',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    vehicle: {
        type: 'CAR',
        model: 'Honda City',
        color: 'White',
        number: 'MH01AB1234'
    }
};

const mockJourney = {
    id: 'journey-789',
    pickup: {
        address: 'Mumbai Central Station',
        coordinates: [72.8777, 19.0760]
    },
    dropoff: {
        address: 'Bandra West',
        coordinates: [72.8258, 19.0596]
    },
    vehicleType: 'CAR',
    estimatedFare: 150
};

async function demonstrateMessagePassing() {
    try {
        console.log('📊 Kafka Status:', env.KAFKA_ENABLED ? 'ENABLED ✓' : 'DISABLED');
        console.log('🔗 Broker:', env.KAFKA_BROKER);
        console.log('');

        if (!env.KAFKA_ENABLED) {
            console.log('⚠️  Kafka is disabled. Messages will be logged only.');
            console.log('   Set KAFKA_ENABLED=true in .env to enable real Kafka.\n');
        }

        // Initialize Kafka
        initKafka();

        console.log('═══════════════════════════════════════════════════════════');
        console.log('SCENARIO: Complete Journey Flow with Kafka Messages');
        console.log('═══════════════════════════════════════════════════════════\n');

        // ============================================
        // STEP 1: RIDER BOOKS JOURNEY
        // ============================================
        console.log('📱 STEP 1: Rider Books Journey');
        console.log('─────────────────────────────────────────────────────────');
        console.log(`Rider: ${mockRider.name}`);
        console.log(`Pickup: ${mockJourney.pickup.address}`);
        console.log(`Dropoff: ${mockJourney.dropoff.address}`);
        console.log(`Vehicle Type: ${mockJourney.vehicleType}`);
        console.log('');

        const journeyRequestedEvent = {
            eventType: 'JOURNEY_REQUESTED',
            timestamp: new Date().toISOString(),
            journeyId: mockJourney.id,
            riderId: mockRider.id,
            riderName: mockRider.name,
            riderPhone: mockRider.phone,
            pickup: mockJourney.pickup,
            dropoff: mockJourney.dropoff,
            vehicleType: mockJourney.vehicleType,
            estimatedFare: mockJourney.estimatedFare,
            paymentMethod: 'CASH',
            status: 'REQUESTED'
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.JOURNEY_REQUESTED}`);
        const result1 = await publishMessage(
            KAFKA_TOPICS.JOURNEY_REQUESTED,
            journeyRequestedEvent,
            mockJourney.id
        );
        console.log(`   Status: ${result1.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');

        await sleep(1000);

        // ============================================
        // STEP 2: NOTIFY NEARBY DRIVERS
        // ============================================
        console.log('🚗 STEP 2: Notify Nearby Drivers');
        console.log('─────────────────────────────────────────────────────────');
        
        const driverNotification = {
            eventType: 'DRIVER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            driverId: 'broadcast', // Broadcast to all nearby drivers
            notification: {
                title: 'New Journey Request',
                message: `New ${mockJourney.vehicleType} ride from ${mockJourney.pickup.address}`,
                type: 'INFO',
                data: {
                    journeyId: mockJourney.id,
                    estimatedFare: mockJourney.estimatedFare,
                    distance: '5.2 km'
                }
            }
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.DRIVER_NOTIFICATION}`);
        const result2 = await publishMessage(
            KAFKA_TOPICS.DRIVER_NOTIFICATION,
            driverNotification,
            'broadcast'
        );
        console.log(`   Status: ${result2.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');
        console.log('📥 DRIVERS RECEIVE: "New CAR ride from Mumbai Central Station"');
        console.log('');

        await sleep(1000);

        // ============================================
        // STEP 3: DRIVER ACCEPTS JOURNEY
        // ============================================
        console.log('✋ STEP 3: Driver Accepts Journey');
        console.log('─────────────────────────────────────────────────────────');
        console.log(`Driver: ${mockDriver.name}`);
        console.log(`Vehicle: ${mockDriver.vehicle.model} (${mockDriver.vehicle.color})`);
        console.log(`Number: ${mockDriver.vehicle.number}`);
        console.log('');

        const journeyAcceptedEvent = {
            eventType: 'JOURNEY_ACCEPTED',
            timestamp: new Date().toISOString(),
            journeyId: mockJourney.id,
            riderId: mockRider.id,
            driverId: mockDriver.id,
            driverName: mockDriver.name,
            driverPhone: mockDriver.phone,
            vehicleInfo: mockDriver.vehicle,
            driverRating: 4.8,
            status: 'ACCEPTED',
            acceptedAt: new Date().toISOString()
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.JOURNEY_ACCEPTED}`);
        const result3 = await publishMessage(
            KAFKA_TOPICS.JOURNEY_ACCEPTED,
            journeyAcceptedEvent,
            mockJourney.id
        );
        console.log(`   Status: ${result3.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');

        await sleep(1000);

        // ============================================
        // STEP 4: NOTIFY RIDER
        // ============================================
        console.log('📲 STEP 4: Notify Rider About Driver');
        console.log('─────────────────────────────────────────────────────────');

        const riderNotification = {
            eventType: 'RIDER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            riderId: mockRider.id,
            notification: {
                title: 'Driver Assigned',
                message: `${mockDriver.name} is on the way!`,
                type: 'SUCCESS',
                data: {
                    journeyId: mockJourney.id,
                    driverId: mockDriver.id,
                    driverName: mockDriver.name,
                    vehicleNumber: mockDriver.vehicle.number,
                    eta: '5 minutes'
                }
            }
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.RIDER_NOTIFICATION}`);
        const result4 = await publishMessage(
            KAFKA_TOPICS.RIDER_NOTIFICATION,
            riderNotification,
            mockRider.id
        );
        console.log(`   Status: ${result4.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');
        console.log(`📥 RIDER RECEIVES: "${mockDriver.name} is on the way!"`);
        console.log('');

        await sleep(1000);

        // ============================================
        // STEP 5: JOURNEY STARTED
        // ============================================
        console.log('🚀 STEP 5: Journey Started');
        console.log('─────────────────────────────────────────────────────────');

        const journeyStartedEvent = {
            eventType: 'JOURNEY_STARTED',
            timestamp: new Date().toISOString(),
            journeyId: mockJourney.id,
            riderId: mockRider.id,
            driverId: mockDriver.id,
            status: 'STARTED',
            startedAt: new Date().toISOString()
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.JOURNEY_STARTED}`);
        const result5 = await publishMessage(
            KAFKA_TOPICS.JOURNEY_STARTED,
            journeyStartedEvent,
            mockJourney.id
        );
        console.log(`   Status: ${result5.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');
        console.log('📥 RIDER RECEIVES: "Your ride has started. Enjoy your journey!"');
        console.log('');

        await sleep(1000);

        // ============================================
        // STEP 6: JOURNEY COMPLETED
        // ============================================
        console.log('🏁 STEP 6: Journey Completed');
        console.log('─────────────────────────────────────────────────────────');

        const journeyCompletedEvent = {
            eventType: 'JOURNEY_COMPLETED',
            timestamp: new Date().toISOString(),
            journeyId: mockJourney.id,
            riderId: mockRider.id,
            driverId: mockDriver.id,
            status: 'COMPLETED',
            completedAt: new Date().toISOString(),
            actualFare: 165,
            distance: 5.2,
            duration: 15,
            paymentMethod: 'CASH',
            paymentStatus: 'PENDING'
        };

        console.log('📤 SENDING MESSAGE TO KAFKA:');
        console.log(`   Topic: ${KAFKA_TOPICS.JOURNEY_COMPLETED}`);
        const result6 = await publishMessage(
            KAFKA_TOPICS.JOURNEY_COMPLETED,
            journeyCompletedEvent,
            mockJourney.id
        );
        console.log(`   Status: ${result6.success ? '✓ SENT' : '✗ FAILED'}`);
        console.log('');
        console.log('📥 RIDER RECEIVES: "Your journey is complete. Fare: ₹165"');
        console.log('');

        // ============================================
        // SUMMARY
        // ============================================
        console.log('═══════════════════════════════════════════════════════════');
        console.log('MESSAGE PASSING SUMMARY');
        console.log('═══════════════════════════════════════════════════════════\n');

        const allSuccess = result1.success && result2.success && result3.success && 
                          result4.success && result5.success && result6.success;

        console.log('Messages Sent:');
        console.log(`  1. Journey Requested      → ${result1.success ? '✓' : '✗'}`);
        console.log(`  2. Driver Notification    → ${result2.success ? '✓' : '✗'}`);
        console.log(`  3. Journey Accepted       → ${result3.success ? '✓' : '✗'}`);
        console.log(`  4. Rider Notification     → ${result4.success ? '✓' : '✗'}`);
        console.log(`  5. Journey Started        → ${result5.success ? '✓' : '✗'}`);
        console.log(`  6. Journey Completed      → ${result6.success ? '✓' : '✗'}`);
        console.log('');

        if (allSuccess) {
            console.log('✅ ALL MESSAGES SENT SUCCESSFULLY!');
        } else {
            console.log('⚠️  Some messages failed (Kafka might not be connected)');
        }

        console.log('');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('KAFKA MESSAGE FLOW:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log('Rider App → Backend → Kafka → Backend → Driver App');
        console.log('                        ↓');
        console.log('                   Kafka Topics');
        console.log('                   (Message Queue)');
        console.log('                        ↓');
        console.log('Driver App → Backend → Kafka → Backend → Rider App');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (!env.KAFKA_ENABLED) {
            console.log('💡 TIP: To enable real Kafka message passing:');
            console.log('   1. Start Kafka: docker-compose up -d');
            console.log('   2. Or use Confluent Cloud');
            console.log('   3. Update .env with credentials');
            console.log('   4. Run this script again\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        process.exit(0);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demonstration
demonstrateMessagePassing();
