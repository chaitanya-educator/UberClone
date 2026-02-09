import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
const startServer = async () => {
    try {
        await connectDB();
        app.listen(env.PORT, () => {
            console.log(`Server is running on port ${env.PORT} by ${env.AUTHOR_NAME}`);
        });

    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1)
    
    }
};
startServer();


