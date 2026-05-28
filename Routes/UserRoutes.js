
var express = require("express")
var router = express.Router()

const validate = require("../MiddleWare/validateMiddleware")
const { registerSchema } = require("../validation/authValidation")

const {
    registerUser,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword,
    refreshTokenController
} = require("../Controller/UserController")

// REGISTER
router.post("/register", validate(registerSchema), registerUser)

// LOGIN
router.post("/login", login)

// VERIFY OTP
router.post("/verify-otp", verifyOtp)

// RESEND OTP
router.post("/resend-otp", resendOtp)

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword)

// RESET PASSWORD
router.post("/reset-password", resetPassword)

// REFRESH TOKEN
router.post("/refresh-token", refreshTokenController)

module.exports = router