import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, 
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true, 
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // not allow password to be returned in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['RIDER', 'DRIVER'],
            message: 'Role must be either RIDER or DRIVER'
        },
        default: 'RIDER' // Default role is RIDER
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true 
});

userSchema.index({ email: 1 });

userSchema.pre('save', async function() {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return;
    }
    // Hash password with bcrypt (10 salt rounds)
    this.password = await bcrypt.hash(this.password,10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            _id: this._id,      
            role: this.role     
        },
        env.JWT_SECRET,        
        { 
            expiresIn: env.JWT_EXPIRES_IN  
        }
    );
};

export const User = mongoose.model("User", userSchema);
