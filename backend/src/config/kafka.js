import { Kafka } from 'kafkajs';
import { env } from './env.js';

// ============================================
// KAFKA CONFIGURATION
// ============================================
// Kafka is used for real-time event-driven communication
// between riders and drivers in the Uber clone system
//
// Use Cases:
// 1. Rider books a journey → Publish to 'journey-requested' topic
// 2. Driver accepts journey → Publish to 'journey-accepted' topic
// 3. Driver updates location → Publish to 'driver-location' topic
// 4. Journey status changes → Publish to 'journey-status' topic
//
// Benefits:
// - Decoupled architecture
// - Real-time updates
// - Scalable message processing
// - Event sourcing capability

// ============================================
// KAFKA TOPICS
// ============================================
export const KAFKA_TOPICS = {
    // Journey lifecycle events
    JOURNEY_REQUESTED: 'journey-requested',      // Rider creates journey
    JOURNEY_ACCEPTED: 'journey-accepted',        // Driver accepts journey
    JOURNEY_STARTED: 'journey-started',          // Driver starts journey
    JOURNEY_COMPLETED: 'journey-completed',      // Journey completed
    JOURNEY_CANCELLED: 'journey-cancelled',      // Journey cancelled
    
    // Driver events
    DRIVER_LOCATION: 'driver-location',          // Driver location updates
    DRIVER_STATUS: 'driver-status',              // Driver online/offline
    
    // Notifications
    RIDER_NOTIFICATION: 'rider-notification',    // Notifications to riders
    DRIVER_NOTIFICATION: 'driver-notification',  // Notifications to drivers
};

// ============================================
// KAFKA CLIENT CONFIGURATION
// ============================================
let kafka = null;
let producer = null;
let consumer = null;

// Initialize Kafka client
export const initKafka = () => {
    if (!env.KAFKA_ENABLED) {
        console.log('Kafka is disabled. Set KAFKA_ENABLED=true to enable.');
        return null;
    }

    try {
        // Configure Kafka client
        const kafkaConfig = {
            clientId: env.KAFKA_CLIENT_ID,
            brokers: [env.KAFKA_BROKER],
        };

        // Add SASL authentication for Confluent Cloud
        if (env.KAFKA_USERNAME && env.KAFKA_PASSWORD) {
            kafkaConfig.ssl = true;
            kafkaConfig.sasl = {
                mechanism: 'plain',
                username: env.KAFKA_USERNAME,
                password: env.KAFKA_PASSWORD,
            };
        }

        kafka = new Kafka(kafkaConfig);
        
        console.log('✓ Kafka client initialized');
        return kafka;
    } catch (error) {
        console.error('Failed to initialize Kafka:', error.message);
        return null;
    }
};

// ============================================
// KAFKA PRODUCER
// ============================================
// Producer sends messages to Kafka topics
export const getProducer = async () => {
    if (!env.KAFKA_ENABLED) {
        return null;
    }

    if (producer) {
        return producer;
    }

    try {
        if (!kafka) {
            initKafka();
        }

        producer = kafka.producer({
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
        });

        await producer.connect();
        console.log('✓ Kafka producer connected');
        
        return producer;
    } catch (error) {
        console.error('Failed to connect Kafka producer:', error.message);
        return null;
    }
};

// ============================================
// KAFKA CONSUMER
// ============================================
// Consumer reads messages from Kafka topics
export const getConsumer = async (groupId) => {
    if (!env.KAFKA_ENABLED) {
        return null;
    }

    try {
        if (!kafka) {
            initKafka();
        }

        const newConsumer = kafka.consumer({
            groupId: groupId || 'uber-clone-consumer-group',
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
        });

        await newConsumer.connect();
        console.log(`✓ Kafka consumer connected (group: ${groupId})`);
        
        return newConsumer;
    } catch (error) {
        console.error('Failed to connect Kafka consumer:', error.message);
        return null;
    }
};

// ============================================
// PUBLISH MESSAGE TO KAFKA
// ============================================
// Publishes an event to a Kafka topic
//
// Parameters:
//   - topic: Kafka topic name
//   - message: Message payload (will be JSON stringified)
//   - key: Optional message key for partitioning
//
// Example:
//   await publishMessage(KAFKA_TOPICS.JOURNEY_REQUESTED, {
//     journeyId: '123',
//     riderId: '456',
//     pickup: { lat: 19.0760, lng: 72.8777 }
//   });
export const publishMessage = async (topic, message, key = null) => {
    if (!env.KAFKA_ENABLED) {
        console.log(`[Kafka Disabled] Would publish to ${topic}:`, message);
        return { success: true, disabled: true };
    }

    try {
        const prod = await getProducer();
        if (!prod) {
            throw new Error('Producer not available');
        }

        const kafkaMessage = {
            topic,
            messages: [{
                key: key ? String(key) : null,
                value: JSON.stringify(message),
                timestamp: Date.now().toString(),
            }],
        };

        const result = await prod.send(kafkaMessage);
        console.log(`✓ Published to ${topic}:`, message);
        
        return { success: true, result };
    } catch (error) {
        console.error(`Failed to publish to ${topic}:`, error.message);
        return { success: false, error: error.message };
    }
};

// ============================================
// SUBSCRIBE TO KAFKA TOPIC
// ============================================
// Subscribes to a Kafka topic and processes messages
//
// Parameters:
//   - topics: Array of topic names to subscribe to
//   - handler: Async function to process each message
//   - groupId: Consumer group ID
//
// Example:
//   await subscribeToTopic(
//     [KAFKA_TOPICS.JOURNEY_REQUESTED],
//     async (message) => {
//       console.log('New journey:', message);
//       // Process journey request
//     }
//   );
export const subscribeToTopic = async (topics, handler, groupId = 'uber-clone-consumer') => {
    if (!env.KAFKA_ENABLED) {
        console.log(`[Kafka Disabled] Would subscribe to topics:`, topics);
        return null;
    }

    try {
        const cons = await getConsumer(groupId);
        if (!cons) {
            throw new Error('Consumer not available');
        }

        // Subscribe to topics
        await cons.subscribe({
            topics: Array.isArray(topics) ? topics : [topics],
            fromBeginning: false,
        });

        // Run consumer
        await cons.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    const value = JSON.parse(message.value.toString());
                    console.log(`✓ Received from ${topic}:`, value);
                    
                    // Call the handler function
                    await handler({
                        topic,
                        partition,
                        key: message.key?.toString(),
                        value,
                        timestamp: message.timestamp,
                    });
                } catch (error) {
                    console.error(`Error processing message from ${topic}:`, error.message);
                }
            },
        });

        console.log(`✓ Subscribed to topics:`, topics);
        return cons;
    } catch (error) {
        console.error('Failed to subscribe to topics:', error.message);
        return null;
    }
};

// ============================================
// DISCONNECT KAFKA
// ============================================
// Gracefully disconnect producer and consumer
export const disconnectKafka = async () => {
    try {
        if (producer) {
            await producer.disconnect();
            console.log('✓ Kafka producer disconnected');
        }
        if (consumer) {
            await consumer.disconnect();
            console.log('✓ Kafka consumer disconnected');
        }
    } catch (error) {
        console.error('Error disconnecting Kafka:', error.message);
    }
};

// ============================================
// CREATE TOPICS (FOR DEVELOPMENT)
// ============================================
// Creates Kafka topics if they don't exist
// Note: Confluent Cloud auto-creates topics by default
export const createTopics = async () => {
    if (!env.KAFKA_ENABLED) {
        return;
    }

    try {
        if (!kafka) {
            initKafka();
        }

        const admin = kafka.admin();
        await admin.connect();

        const topics = Object.values(KAFKA_TOPICS).map(topic => ({
            topic,
            numPartitions: 3,
            replicationFactor: 3, // For Confluent Cloud
        }));

        await admin.createTopics({
            topics,
            waitForLeaders: true,
        });

        console.log('✓ Kafka topics created');
        await admin.disconnect();
    } catch (error) {
        // Topics might already exist, which is fine
        console.log('Kafka topics status:', error.message);
    }
};

export default {
    initKafka,
    getProducer,
    getConsumer,
    publishMessage,
    subscribeToTopic,
    disconnectKafka,
    createTopics,
    KAFKA_TOPICS,
};
