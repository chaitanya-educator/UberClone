import { initKafka, publishMessage, KAFKA_TOPICS, disconnectKafka } from './src/config/kafka.js';
import { env } from './src/config/env.js';

// ============================================
// KAFKA INTEGRATION TEST
// ============================================
// This script tests the Kafka integration
// Run with: node test-kafka.js

console.log('\n========================================');
console.log('KAFKA INTEGRATION TEST');
console.log('========================================\n');

async function testKafka() {
    try {
        // Check if Kafka is enabled
        if (!env.KAFKA_ENABLED) {
            console.log('❌ Kafka is disabled');
            console.log('   Set KAFKA_ENABLED=true in .env to enable');
            return;
        }

        console.log('✓ Kafka is enabled');
        console.log(`  Broker: ${env.KAFKA_BROKER}`);
        console.log(`  Client ID: ${env.KAFKA_CLIENT_ID}\n`);

        // Initialize Kafka
        console.log('1. Initializing Kafka...');
        initKafka();
        console.log('   ✓ Kafka initialized\n');

        // Test publishing a message
        console.log('2. Testing message publishing...');
        
        const testJourney = {
            eventType: 'JOURNEY_REQUESTED',
            timestamp: new Date().toISOString(),
            journeyId: 'test-journey-123',
            riderId: 'test-rider-456',
            riderName: 'Test Rider',
            pickup: {
                address: 'Test Pickup Location',
                coordinates: [72.8777, 19.0760],
            },
            dropoff: {
                address: 'Test Dropoff Location',
                coordinates: [72.8258, 19.0596],
            },
            vehicleType: 'CAR',
            estimatedFare: 150,
            paymentMethod: 'CASH',
            status: 'REQUESTED',
        };

        const result = await publishMessage(
            KAFKA_TOPICS.JOURNEY_REQUESTED,
            testJourney,
            'test-journey-123'
        );

        if (result.success) {
            console.log('   ✓ Message published successfully');
            console.log(`   Topic: ${KAFKA_TOPICS.JOURNEY_REQUESTED}`);
            console.log(`   Journey ID: ${testJourney.journeyId}\n`);
        } else {
            console.log('   ❌ Failed to publish message');
            console.log(`   Error: ${result.error}\n`);
        }

        // Test notification
        console.log('3. Testing notification publishing...');
        
        const testNotification = {
            eventType: 'DRIVER_NOTIFICATION',
            timestamp: new Date().toISOString(),
            driverId: 'test-driver-789',
            notification: {
                title: 'Test Notification',
                message: 'This is a test notification from Kafka integration test',
                type: 'INFO',
                data: { test: true },
            },
        };

        const notifResult = await publishMessage(
            KAFKA_TOPICS.DRIVER_NOTIFICATION,
            testNotification,
            'test-driver-789'
        );

        if (notifResult.success) {
            console.log('   ✓ Notification published successfully');
            console.log(`   Topic: ${KAFKA_TOPICS.DRIVER_NOTIFICATION}`);
            console.log(`   Driver ID: ${testNotification.driverId}\n`);
        } else {
            console.log('   ❌ Failed to publish notification');
            console.log(`   Error: ${notifResult.error}\n`);
        }

        // Summary
        console.log('========================================');
        console.log('TEST SUMMARY');
        console.log('========================================');
        console.log('✓ Kafka initialization: PASSED');
        console.log(`${result.success ? '✓' : '❌'} Message publishing: ${result.success ? 'PASSED' : 'FAILED'}`);
        console.log(`${notifResult.success ? '✓' : '❌'} Notification publishing: ${notifResult.success ? 'PASSED' : 'FAILED'}`);
        console.log('========================================\n');

        // Disconnect
        console.log('4. Disconnecting Kafka...');
        await disconnectKafka();
        console.log('   ✓ Kafka disconnected\n');

        console.log('✅ All tests completed!\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        process.exit(0);
    }
}

// Run the test
testKafka();
