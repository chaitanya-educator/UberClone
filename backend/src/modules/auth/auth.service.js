import { User } from "../models/user.model.js";

class AuthService {
    
    signup(userData) {
        try {
            const existingUser = User.findOne({ 
                $or: [
                    { email: userData.email },
                    { phone: userData.phone }
                ]
            });
            if (existingUser) {
                if (existingUser.email === userData.email) {
                    throw new Error('Email already registered');
                }
                if (existingUser.phone === userData.phone) {
                    throw new Error('Phone number already registered');
                }
            }

            const user = User.create(userData);
            const token = user.generateAuthToken();

            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                },
                token
            };
        } catch (error) {
            throw error;
        }
    }

    login(email, password) {
        try {
            const user = User.findOne({ email }).select('+password');
            
            if (!user) {
                throw new Error('Invalid credentials email invalid');
            }
            
            const isPasswordValid = user.comparePassword(password);
            
            if (!isPasswordValid) {
                throw new Error('Invalid credentials password invalid');
            }
            
            if (!user.isActive) {
                throw new Error('Account is deactivated. Please contact support.');
            }
            
            const token = user.generateAuthToken();
            
            return {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                },
                token
            };
        } catch (error) {
            throw error;
        }
    }
}




export const authService = new AuthService();
