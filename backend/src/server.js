import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initKafka, disconnectKafka } from './config/kafka.js';
import { kafkaConsumerService } from './services/kafka.consumer.js';

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Initialize Kafka
        if (env.KAFKA_ENABLED) {
            console.log('Initializing Kafka...');
            initKafka();
            
            // Start Kafka consumers
            await kafkaConsumerService.startConsumers();
        }
        
        // Start Express server
        app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT} by ${env.AUTHOR_NAME}`);
            if (env.KAFKA_ENABLED) {
                console.log('✓ Kafka integration enabled');
            } else {
                console.log('ℹ Kafka integration disabled (set KAFKA_ENABLED=true to enable)');
            }
        });

    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1)
    
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await kafkaConsumerService.stopConsumers();
    await disconnectKafka();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await kafkaConsumerService.stopConsumers();
    await disconnectKafka();
    process.exit(0);
});

startServer();


