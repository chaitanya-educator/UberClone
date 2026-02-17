import { z } from 'zod';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================
// Validates incoming request data before processing
// Zod is a TypeScript-first schema validation library
// Provides type-safe validation with detailed error messages
//
// Why validation?
// - Prevent invalid data from reaching database
// - Provide clear error messages to users
// - Ensure data consistency
// - Security (prevent injection attacks)

// ============================================
// CREATE DRIVER PROFILE VALIDATION
// ============================================
// Validates data when driver creates profile for first time
// All required fields must be present
// Used in: POST /api/driver/profile
export const createDriverProfileSchema = z.object({
    // Validate request body
    body: z.object({
        // ============================================
        // LANGUAGE PREFERENCE
        // ============================================
        // Must be one of the supported languages
        languagePreference: z.enum(
            ['HINDI', 'ENGLISH', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI', 'GUJARATI'],
            {
                required_error: 'Language preference is required',  // Error if missing
                invalid_type_error: 'Invalid language preference'   // Error if not in enum
            }
        ),

        // ============================================
        // CITY
        // ============================================
        // Must be one of the supported cities
        city: z.enum(
            ['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE', 'AHMEDABAD'],
            {
                required_error: 'City is required',      // Error if missing
                invalid_type_error: 'Invalid city'       // Error if not in enum
            }
        ),

        // ============================================
        // AADHAR NUMBER
        // ============================================
        // Must be exactly 12 digits
        // Example: "123456789012"
        aadharNumber: z
            .string({
                required_error: 'Aadhar number is required'  // Error if missing
            })
            .regex(/^[0-9]{12}$/, 'Aadhar number must be exactly 12 digits')  // Must match pattern
            .trim(),  // Remove leading/trailing spaces

        // ============================================
        // LICENSE NUMBER
        // ============================================
        // Must be 8-20 characters
        // Example: "MH1234567890"
        licenseNumber: z
            .string({
                required_error: 'License number is required'  // Error if missing
            })
            .min(8, 'License number must be at least 8 characters')      // Minimum length
            .max(20, 'License number cannot exceed 20 characters')       // Maximum length
            .trim(),  // Remove leading/trailing spaces

        // ============================================
        // LICENSE EXPIRY (OPTIONAL)
        // ============================================
        // Must be a future date if provided
        // Example: "2026-12-31"
        licenseExpiry: z
            .string()
            .optional()  // Field is optional
            .refine((date) => {
                if (!date) return true;  // Skip validation if not provided
                return new Date(date) > new Date();  // Must be future date
            }, 'License expiry date must be in the future'),

        // ============================================
        // RC NUMBER
        // ============================================
        // Vehicle Registration Certificate number
        // Must be 8-15 characters
        // Example: "MH01AB1234"
        rcNumber: z
            .string({
                required_error: 'RC number is required'  // Error if missing
            })
            .min(8, 'RC number must be at least 8 characters')      // Minimum length
            .max(15, 'RC number cannot exceed 15 characters')       // Maximum length
            .trim(),  // Remove leading/trailing spaces

        // ============================================
        // RC EXPIRY (OPTIONAL)
        // ============================================
        // Must be a future date if provided
        // Example: "2027-06-30"
        rcExpiry: z
            .string()
            .optional()  // Field is optional
            .refine((date) => {
                if (!date) return true;  // Skip validation if not provided
                return new Date(date) > new Date();  // Must be future date
            }, 'RC expiry date must be in the future'),

        // ============================================
        // VEHICLE TYPE
        // ============================================
        // Must be one of the supported vehicle types
        vehicleType: z.enum(
            ['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'],
            {
                required_error: 'Vehicle type is required',    // Error if missing
                invalid_type_error: 'Invalid vehicle type'     // Error if not in enum
            }
        ),

        // ============================================
        // VEHICLE NUMBER (OPTIONAL)
        // ============================================
        // Must match Indian vehicle number format if provided
        // Format: XX00XX0000 (e.g., MH01AB1234)
        // XX = State code (2 letters)
        // 00 = District code (2 digits)
        // XX = Series (1-2 letters)
        // 0000 = Number (4 digits)
        vehicleNumber: z
            .string()
            .optional()  // Field is optional
            .refine((val) => {
                if (!val) return true;  // Skip validation if not provided
                // Regex: 2 letters + 2 digits + 1-2 letters + 4 digits
                return /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(val);
            }, 'Invalid vehicle number format (e.g., MH01AB1234)'),

        // ============================================
        // VEHICLE MODEL (OPTIONAL)
        // ============================================
        // Example: "Honda City", "Royal Enfield Classic 350"
        vehicleModel: z
            .string()
            .max(50, 'Vehicle model cannot exceed 50 characters')  // Maximum length
            .optional(),  // Field is optional

        // ============================================
        // VEHICLE COLOR (OPTIONAL)
        // ============================================
        // Example: "White", "Black", "Silver"
        vehicleColor: z
            .string()
            .max(20, 'Vehicle color cannot exceed 20 characters')  // Maximum length
            .optional(),  // Field is optional

        // ============================================
        // PROFILE PICTURE (OPTIONAL)
        // ============================================
        // Must be a valid URL if provided
        // Example: "https://cloudinary.com/image.jpg"
        profilePicture: z
            .string()
            .url('Profile picture must be a valid URL')  // Must be valid URL
            .optional()  // Field is optional
    })
});

// ============================================
// UPDATE DRIVER PROFILE VALIDATION
// ============================================
// Validates data when driver updates profile
// All fields are optional (partial update)
// Used in: PATCH /api/driver/me
export const updateDriverProfileSchema = z.object({
    // Validate request body
    body: z.object({
        // ============================================
        // ALL FIELDS ARE OPTIONAL
        // ============================================
        // Driver can update any combination of fields

        // Language preference (optional)
        languagePreference: z.enum(
            ['HINDI', 'ENGLISH', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI', 'GUJARATI']
        ).optional(),

        // City (optional)
        city: z.enum(
            ['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE', 'AHMEDABAD']
        ).optional(),

        // License expiry (optional)
        // Must be future date if provided
        licenseExpiry: z
            .string()
            .optional()
            .refine((date) => {
                if (!date) return true;  // Skip if not provided
                return new Date(date) > new Date();  // Must be future
            }, 'License expiry date must be in the future'),

        // RC expiry (optional)
        // Must be future date if provided
        rcExpiry: z
            .string()
            .optional()
            .refine((date) => {
                if (!date) return true;  // Skip if not provided
                return new Date(date) > new Date();  // Must be future
            }, 'RC expiry date must be in the future'),

        // Vehicle number (optional)
        // Must match format if provided
        vehicleNumber: z
            .string()
            .optional()
            .refine((val) => {
                if (!val) return true;  // Skip if not provided
                return /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(val);
            }, 'Invalid vehicle number format (e.g., MH01AB1234)'),

        // Vehicle model (optional)
        vehicleModel: z
            .string()
            .max(50, 'Vehicle model cannot exceed 50 characters')
            .optional(),

        // Vehicle color (optional)
        vehicleColor: z
            .string()
            .max(20, 'Vehicle color cannot exceed 20 characters')
            .optional(),

        // Profile picture (optional)
        // Must be valid URL if provided
        profilePicture: z
            .string()
            .url('Profile picture must be a valid URL')
            .optional()
    })
});

// ============================================
// UPDATE STATUS VALIDATION
// ============================================
// Validates when driver toggles ONLINE/OFFLINE
// Used in: PATCH /api/driver/me/status
export const updateStatusSchema = z.object({
    // Validate request body
    body: z.object({
        // ============================================
        // IS ONLINE
        // ============================================
        // Must be boolean (true or false)
        // true = Go online (available for rides)
        // false = Go offline (not available)
        isOnline: z.boolean({
            required_error: 'Status is required',              // Error if missing
            invalid_type_error: 'Status must be true or false' // Error if not boolean
        })
    })
});
