import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['PORT', 'AUTHOR_NAME',"MONGODB_URL" ];
requiredEnvVars.forEach((envVar)=>{
    if(!process.env[envVar]){
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
})

export const env = {
    PORT: process.env.PORT,
    AUTHOR_NAME: process.env.AUTHOR_NAME,
    MONGODB_URL: process.env.MONGODB_URL,
   
};