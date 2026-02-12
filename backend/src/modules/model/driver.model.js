import mongoose from "mongoose";
import { encrypt, decrypt, maskAadhar } from "../../common/utils/encryption.js";

// ============================================
// DRIVER MODEL
// ============================================
// Stores driver-specific information separate from User model
// User model has basic auth info, Driver model has professional details

const driverSchema = new mongoose.Schema({
    // Reference to User collection (who has role='DRIVER')
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One driver profile per user
    },
    
    // ============================================
    // PERSONAL INFORMATION
    // ============================================
    personalInfo: {
        // Language preference for app interface
        languagePreference: {
            type: String,
            enum: ['HINDI', 'ENGLISH', 'MARATHI', 'TAMIL', 'TELUGU', 'KANNADA', 'BENGALI', 'GUJARATI'],
            required: [true, 'Language preference is required']
        },
        
        // City where driver wants to work
        city: {
            type: String,
            enum: ['MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE', 'AHMEDABAD'],
            required: [true, 'City is required']
        },
        
        // Profile picture URL (optional - uploaded to cloud storage)
        profilePicture: {
            type: String,
            default: null
        },
        
        // Aadhar number (encrypted for security)
        // Stored encrypted, displayed masked (XXXX XXXX 9012)
        aadharNumber: {
            type: String,
            required: [true, 'Aadhar number is required'],
            unique:true
        }
    },
    
    // ============================================
    // DOCUMENTS
    // ============================================
    documents: {
        // Driving license number
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
            uppercase: true,
            trim: true
        },
        
        // License expiry date (optional but recommended)
        licenseExpiry: {
            type: Date,
            default: null
        },
        
        // Vehicle Registration Certificate number
        rcNumber: {
            type: String,
            required: [true, 'RC number is required'],
            uppercase: true,
            trim: true
        },
        
        // RC expiry date (optional but recommended)
        rcExpiry: {
            type: Date,
            default: null
        }
    },
    
    // ============================================
    // VEHICLE INFORMATION
    // ============================================
    vehicleInfo: {
        // Type of vehicle driver owns
        vehicleType: {
            type: String,
            enum: ['CAR', 'BIKE', 'AUTO', 'E_RICKSHAW', 'ELECTRIC_SCOOTER'],
            required: [true, 'Vehicle type is required']
        },
        
        // Vehicle registration number (optional)
        vehicleNumber: {
            type: String,
            uppercase: true,
            trim: true,
            default: null
        },
        
        // Vehicle model (optional - e.g., "Honda City", "Royal Enfield")
        vehicleModel: {
            type: String,
            trim: true,
            default: null
        },
        
        // Vehicle color (optional)
        vehicleColor: {
            type: String,
            trim: true,
            default: null
        }
    },
    
    // ============================================
    // STATUS & VERIFICATION
    // ============================================
    status: {
        // Is driver currently online and available for rides?
        isOnline: {
            type: Boolean,
            default: false
        },
        
        // Has admin verified driver's documents?
        // Only verified drivers can go online
        isVerified: {
            type: Boolean,
            default: false
        },
        
        // Profile completion percentage (0-100)
        // Auto-calculated based on filled fields
        profileCompletionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        }
    },
    
    // ============================================
    // STATISTICS
    // ============================================
    stats: {
        // Average rating from riders (1-5)
        rating: {
            type: Number,
            default: 5.0,
            min: 1,
            max: 5
        },
        
        // Total number of completed rides
        totalRides: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    
    // Current location (for future - ride matching)
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    }
    
}, {
    timestamps: true // createdAt, updatedAt
});

// Index for geospatial queries (future - find nearby drivers)
driverSchema.index({ location: '2dsphere' });

// Index for faster userId lookups
driverSchema.index({ userId: 1 });

// ============================================
// PRE-SAVE HOOK: Encrypt Aadhar Number
// ============================================
// Automatically encrypts aadhar before saving to database
// Result: Plain aadhar never stored in database
driverSchema.pre('save', function() {
    // Only encrypt if aadhar is modified and not already encrypted
    if (this.isModified('personalInfo.aadharNumber') && 
        this.personalInfo.aadharNumber && 
        !this.personalInfo.aadharNumber.includes(':')) {
        this.personalInfo.aadharNumber = encrypt(this.personalInfo.aadharNumber);
    }
});

// ============================================
// PRE-SAVE HOOK: Calculate Profile Completion
// ============================================
// Auto-calculates profile completion percentage on every save
// Result: Always up-to-date completion percentage
driverSchema.pre('save', function() {
    this.status.profileCompletionPercentage = this.calculateProfileCompletion();
});

// ============================================
// METHOD: Calculate Profile Completion Percentage
// ============================================
// Calculates how much of the profile is filled
// Required fields: 70%, Optional fields: 30%
driverSchema.methods.calculateProfileCompletion = function() {
    let percentage = 0;
    
    // Required fields (70% total)
    if (this.personalInfo.languagePreference) percentage += 10;
    if (this.personalInfo.city) percentage += 10;
    if (this.personalInfo.aadharNumber) percentage += 15;
    if (this.documents.licenseNumber) percentage += 15;
    if (this.documents.rcNumber) percentage += 10;
    if (this.vehicleInfo.vehicleType) percentage += 10;
    
    // Optional fields (30% total)
    if (this.personalInfo.profilePicture) percentage += 10;
    if (this.documents.licenseExpiry) percentage += 5;
    if (this.documents.rcExpiry) percentage += 5;
    if (this.vehicleInfo.vehicleModel) percentage += 5;
    if (this.vehicleInfo.vehicleColor) percentage += 5;
    
    return percentage;
};

// ============================================
// METHOD: Get Masked Aadhar
// ============================================
// Returns aadhar with only last 4 digits visible
// Example: "XXXX XXXX 9012"
driverSchema.methods.getMaskedAadhar = function() {
    if (!this.personalInfo.aadharNumber) return null;
    
    // Decrypt first, then mask
    const decrypted = decrypt(this.personalInfo.aadharNumber);
    return maskAadhar(decrypted);
};

// ============================================
// METHOD: Get Missing Fields
// ============================================
// Returns list of fields that are not filled
// Useful for showing driver what to complete
driverSchema.methods.getMissingFields = function() {
    const missing = [];
    
    // Check optional fields
    if (!this.personalInfo.profilePicture) {
        missing.push({ field: 'profilePicture', weight: 10, label: 'Profile Picture' });
    }
    if (!this.documents.licenseExpiry) {
        missing.push({ field: 'licenseExpiry', weight: 5, label: 'License Expiry Date' });
    }
    if (!this.documents.rcExpiry) {
        missing.push({ field: 'rcExpiry', weight: 5, label: 'RC Expiry Date' });
    }
    if (!this.vehicleInfo.vehicleModel) {
        missing.push({ field: 'vehicleModel', weight: 5, label: 'Vehicle Model' });
    }
    if (!this.vehicleInfo.vehicleColor) {
        missing.push({ field: 'vehicleColor', weight: 5, label: 'Vehicle Color' });
    }
    
    return missing;
};

// ============================================
// METHOD: Can Go Online
// ============================================
// Checks if driver can go online
// Requirements: Profile >= 70% complete AND verified by admin
driverSchema.methods.canGoOnline = function() {
    return this.status.profileCompletionPercentage >= 70 && this.status.isVerified;
};

export const Driver = mongoose.model('Driver', driverSchema);
