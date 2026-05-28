// var express = require("express")
// const { registerUser, login , verifyOtp, resendOtp, forgotPassword,  resetPassword} = require("../Controller/UserController")

// const validate =require("../MiddleWare/validateMiddleware")

// const { registerSchema } = require("../validation/authValidation")

// const { registerUser,verifyOtp,resendOtp,login,forgotPassword, resetPassword } = require("../Controller/UserController")



// var router = express.Router()


// // router.post("/register",registerUser)

// router.post("/register", validate(registerSchema), registerUser)


// router.post("/login",login)

// router.post("/verify-otp", verifyOtp)

// router.post("/resend-otp", resendOtp)

//  router.post("/forgot-password", forgotPassword)

//  router.post("/reset-password", resetPassword)


// // router.post("/refresh-token", refreshToken)



// module.exports = router 

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