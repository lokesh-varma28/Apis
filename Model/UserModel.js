var mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },

    isVerified:{
        type:Boolean,
        default:false
    },

    otp:{
        type:String
    },

    otpExpires:{
        type:Date
    },
    resetOtp:{
    type:String
},
refreshToken:{
    type:String
},

    otpAttempts:{
        type:Number,
        default:0
    },

    otpLastSent:{
        type:Date
    },


resetOtpExpires:{
    type:Date
},

    lockUntil:{
        type:Date
    },

    loginAttempts:{
        type:Number,
        default:0
    },

    wishlist: [
        {
            type: String
        }
    ]
})

var User = mongoose.model("User", userSchema)

module.exports = User