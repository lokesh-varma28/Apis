
var User = require("../Model/UserModel")
var bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken") // <-- Added this so jwt.verify works!

const transporter = require("../config/Mail")
const { generateAccessToken, generateRefreshToken } = require("../helper/token")

//  REGISTER 
var registerUser = async (req, res) => {
    try {
        var { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        var userExists = await User.findOne({ email })

        if (userExists) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        // HASH PASSWORD
        var hashPassword = await bcrypt.hash(password, 10)

        // GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // HASH OTP
        const hashedOtp = await bcrypt.hash(otp, 10)

        // OTP EXPIRY
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        // CREATE USER
        var newUser = await User.create({
            name,
            email,
            password: hashPassword,
            otp: hashedOtp,
            otpExpires,
            otpLastSent: new Date()
        })

        // SEND EMAIL
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Email Verification OTP",
            html: `
                <h1>Verify Email</h1>
                <h2>Your OTP: ${otp}</h2>
                <p>OTP valid for 5 minutes</p>
            `
        })

        res.status(201).json({
            message: "OTP sent to email"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Registration failed"
        })
    }
}

//  VERIFY OTP 
var verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Already verified"
            })
        }

        // MAX ATTEMPTS
        if (user.otpAttempts >= 3) {
            return res.status(429).json({
                message: "Too many attempts"
            })
        }

        // OTP EXPIRY
        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired"
            })
        }

        // VERIFY HASHED OTP
        const validOtp = await bcrypt.compare(otp, user.otp)

        if (!validOtp) {
            user.otpAttempts += 1
            await user.save()
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        // SUCCESS
        user.isVerified = true
        user.otp = undefined
        user.otpExpires = undefined
        user.otpAttempts = 0
        await user.save()

        res.status(200).json({
            message: "Email verified successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Verification failed"
        })
    }
}

// RESEND OTP 
var resendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (user.isVerified) {
            return res.status(400).json({
                message: "Already verified"
            })
        }

        // COOLDOWN
        const now = new Date()
        if (user.otpLastSent && now - user.otpLastSent < 60000) {
            return res.status(429).json({
                message: "Wait 60 seconds"
            })
        }

        // GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // HASH OTP
        const hashedOtp = await bcrypt.hash(otp, 10)

        // OTP EXPIRY
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        // SAVE
        user.otp = hashedOtp
        user.otpExpires = otpExpires
        user.otpLastSent = now
        user.otpAttempts = 0
        await user.save()

        // SEND MAIL
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Resend OTP",
            html: `
                <h2>Your New OTP: ${otp}</h2>
                <p>OTP valid for 5 minutes</p>
            `
        })

        res.status(200).json({
            message: "New OTP sent"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Resend OTP failed"
        })
    }
}

//  LOGIN 
var login = async (req, res) => {
    try {
        var { email, password } = req.body

        // CHECK FIELDS
        if (!email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        // FIND USER
        var userExists = await User.findOne({ email })

        if (!userExists) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        // VERIFY EMAIL
        if (!userExists.isVerified) {
            return res.status(401).json({
                message: "Please verify email first"
            })
        }

        // ACCOUNT LOCK CHECK
        if (userExists.lockUntil && userExists.lockUntil > new Date()) {
            return res.status(403).json({
                message: "Account temporarily locked"
            })
        }

        // CHECK PASSWORD
        var checkPassword = await bcrypt.compare(password, userExists.password)

        if (!checkPassword) {
            userExists.loginAttempts += 1

            // LOCK ACCOUNT AFTER 5 FAILS
            if (userExists.loginAttempts >= 5) {
                userExists.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
            }

            await userExists.save()

            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        // RESET LOGIN ATTEMPTS
        userExists.loginAttempts = 0
        userExists.lockUntil = undefined
        await userExists.save()

        // GENERATE TOKENS
        const accessToken = generateAccessToken(userExists)
        const refreshToken = generateRefreshToken(userExists)

        // RESPONSE
        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Login failed"
        })
    }
}

//  REFRESH TOKEN 
var refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required"
            })
        }

        // VERIFY REFRESH TOKEN
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (error, decoded) => {
                if (error) {
                    return res.status(403).json({
                        message: "Invalid refresh token"
                    })
                }

                // FIND USER
                const user = await User.findById(decoded.userId)

                if (!user) {
                    return res.status(404).json({
                        message: "User not found"
                    })
                }

                // GENERATE NEW ACCESS TOKEN
                const newAccessToken = generateAccessToken(user)

                res.status(200).json({
                    accessToken: newAccessToken
                })
            }
        )

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Refresh failed"
        })
    }
}

//  FORGOT PASSWORD 
var forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // GENERATE RESET OTP
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()

        // HASH RESET OTP
        const hashedResetOtp = await bcrypt.hash(resetOtp, 10)

        // OTP EXPIRY
        const resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000)

        // SAVE
        user.resetOtp = hashedResetOtp
        user.resetOtpExpires = resetOtpExpires
        await user.save()

        // SEND EMAIL
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset OTP",
            html: `
                <h1>Password Reset</h1>
                <h2>Reset OTP: ${resetOtp}</h2>
                <p>OTP valid for 5 minutes</p>
            `
        })

        res.status(200).json({
            message: "Reset OTP sent"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Forgot password failed"
        })
    }
}

//  RESET PASSWORD 
var resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // OTP EXPIRY
        if (user.resetOtpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired"
            })
        }

        // VERIFY OTP
        const validOtp = await bcrypt.compare(otp, user.resetOtp)

        if (!validOtp) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // SAVE PASSWORD
        user.password = hashedPassword

        // CLEAR RESET OTP
        user.resetOtp = undefined
        user.resetOtpExpires = undefined
        await user.save()

        res.status(200).json({
            message: "Password reset successful"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Reset password failed"
        })
    }
}

module.exports = {
    registerUser,
    verifyOtp,
    resendOtp,
    refreshTokenController, 
    login,
    forgotPassword,
    resetPassword
}