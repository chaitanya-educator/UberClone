import jwt from "jsonwebtoken";
import { env } from '../../config/env.js';
import { User } from "../../modules/model/user.model.js";

export const authenticate = async (req, res, next) => {


//     req = {
//   headers: { authorization: "Bearer eyJhb..." },
//   body: {},
//   params: {},
//   user: undefined   ❌ (not set yet)
// }
const authHeader = req.headers.authorization;

if (!authHeader || !authHeader.startsWith('Bearer ')) {
    
    return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
    });
}


    const token = authHeader.split(' ')[1];
    
    try {   
        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        const user = await User.findById(decoded._id);
        
        if (!user) {
            
            return res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
        }
        
        if (!user.isActive) {
            
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated.'
            });
        }
        
        req.user = user;
        next();
        
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};


export const authorizeRole = (...allRequiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!allRequiredRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Only ${allRequiredRoles.join(', ')} can access this resource`
            });
        }

        next();
    };
}