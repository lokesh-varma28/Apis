
// var User = require("../Model/UserModel")
// var bcrypt = require("bcrypt")
// const jwt = require("jsonwebtoken") // <-- Added this so jwt.verify works!

// const transporter = require("../config/Mail")
// const { generateAccessToken, generateRefreshToken } = require("../helper/token")

// //  REGISTER 
// var registerUser = async (req, res) => {
//     try {
//         var { name, email, password } = req.body

//         if (!name || !email || !password) {
//             return res.status(400).json({
//                 message: "All fields required"
//             })
//         }

//         var userExists = await User.findOne({ email })

//         if (userExists) {
//             return res.status(400).json({
//                 message: "User already exists"
//             })
//         }

//         // HASH PASSWORD
//         var hashPassword = await bcrypt.hash(password, 10)

//         // GENERATE OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString()

//         // HASH OTP
//         const hashedOtp = await bcrypt.hash(otp, 10)

//         // OTP EXPIRY
//         const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

//         // CREATE USER
//         var newUser = await User.create({
//             name,
//             email,
//             password: hashPassword,
//             otp: hashedOtp,
//             otpExpires,
//             otpLastSent: new Date()
//         })

//         // SEND EMAIL
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: "Email Verification OTP",
//             html: `
//                 <h1>Verify Email</h1>
//                 <h2>Your OTP: ${otp}</h2>
//                 <p>OTP valid for 5 minutes</p>
//             `
//         })

//         res.status(201).json({
//             message: "OTP sent to email"
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Registration failed"
//         })
//     }
// }

// //  VERIFY OTP 
// var verifyOtp = async (req, res) => {
//     try {
//         const { email, otp } = req.body
//         const user = await User.findOne({ email })

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             })
//         }

//         if (user.isVerified) {
//             return res.status(400).json({
//                 message: "Already verified"
//             })
//         }

//         // MAX ATTEMPTS
//         if (user.otpAttempts >= 3) {
//             return res.status(429).json({
//                 message: "Too many attempts"
//             })
//         }

//         // OTP EXPIRY
//         if (user.otpExpires < new Date()) {
//             return res.status(400).json({
//                 message: "OTP expired"
//             })
//         }

//         // VERIFY HASHED OTP
//         const validOtp = await bcrypt.compare(otp, user.otp)

//         if (!validOtp) {
//             user.otpAttempts += 1
//             await user.save()
//             return res.status(400).json({
//                 message: "Invalid OTP"
//             })
//         }

//         // SUCCESS
//         user.isVerified = true
//         user.otp = undefined
//         user.otpExpires = undefined
//         user.otpAttempts = 0
//         await user.save()

//         res.status(200).json({
//             message: "Email verified successfully"
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Verification failed"
//         })
//     }
// }

// // RESEND OTP 
// var resendOtp = async (req, res) => {
//     try {
//         const { email } = req.body
//         const user = await User.findOne({ email })

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             })
//         }

//         if (user.isVerified) {
//             return res.status(400).json({
//                 message: "Already verified"
//             })
//         }

//         // COOLDOWN
//         const now = new Date()
//         if (user.otpLastSent && now - user.otpLastSent < 60000) {
//             return res.status(429).json({
//                 message: "Wait 60 seconds"
//             })
//         }

//         // GENERATE OTP
//         const otp = Math.floor(100000 + Math.random() * 900000).toString()

//         // HASH OTP
//         const hashedOtp = await bcrypt.hash(otp, 10)

//         // OTP EXPIRY
//         const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

//         // SAVE
//         user.otp = hashedOtp
//         user.otpExpires = otpExpires
//         user.otpLastSent = now
//         user.otpAttempts = 0
//         await user.save()

//         // SEND MAIL
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: "Resend OTP",
//             html: `
//                 <h2>Your New OTP: ${otp}</h2>
//                 <p>OTP valid for 5 minutes</p>
//             `
//         })

//         res.status(200).json({
//             message: "New OTP sent"
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Resend OTP failed"
//         })
//     }
// }

// //  LOGIN 
// var login = async (req, res) => {
//     try {
//         var { email, password } = req.body

//         // CHECK FIELDS
//         if (!email || !password) {
//             return res.status(400).json({
//                 message: "All fields required"
//             })
//         }

//         // FIND USER
//         var userExists = await User.findOne({ email })

//         if (!userExists) {
//             return res.status(401).json({
//                 message: "Invalid credentials"
//             })
//         }

//         // VERIFY EMAIL
//         if (!userExists.isVerified) {
//             return res.status(401).json({
//                 message: "Please verify email first"
//             })
//         }

//         // ACCOUNT LOCK CHECK
//         if (userExists.lockUntil && userExists.lockUntil > new Date()) {
//             return res.status(403).json({
//                 message: "Account temporarily locked"
//             })
//         }

//         // CHECK PASSWORD
//         var checkPassword = await bcrypt.compare(password, userExists.password)

//         if (!checkPassword) {
//             userExists.loginAttempts += 1

//             // LOCK ACCOUNT AFTER 5 FAILS
//             if (userExists.loginAttempts >= 5) {
//                 userExists.lockUntil = new Date(Date.now() + 15 * 60 * 1000)
//             }

//             await userExists.save()

//             return res.status(401).json({
//                 message: "Invalid credentials"
//             })
//         }

//         // RESET LOGIN ATTEMPTS
//         userExists.loginAttempts = 0
//         userExists.lockUntil = undefined
//         await userExists.save()

//         // GENERATE TOKENS
//         const accessToken = generateAccessToken(userExists)
//         const refreshToken = generateRefreshToken(userExists)

//         // RESPONSE
//         res.status(200).json({
//             message: "Login successful",
//             accessToken,
//             refreshToken
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Login failed"
//         })
//     }
// }

// //  REFRESH TOKEN 
// var refreshTokenController = async (req, res) => {
//     try {
//         const { refreshToken } = req.body

//         if (!refreshToken) {
//             return res.status(401).json({
//                 message: "Refresh token required"
//             })
//         }

//         // VERIFY REFRESH TOKEN
//         jwt.verify(
//             refreshToken,
//             process.env.REFRESH_TOKEN_SECRET,
//             async (error, decoded) => {
//                 if (error) {
//                     return res.status(403).json({
//                         message: "Invalid refresh token"
//                     })
//                 }

//                 // FIND USER
//                 const user = await User.findById(decoded.userId)

//                 if (!user) {
//                     return res.status(404).json({
//                         message: "User not found"
//                     })
//                 }

//                 // GENERATE NEW ACCESS TOKEN
//                 const newAccessToken = generateAccessToken(user)

//                 res.status(200).json({
//                     accessToken: newAccessToken
//                 })
//             }
//         )

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Refresh failed"
//         })
//     }
// }

// //  FORGOT PASSWORD 
// var forgotPassword = async (req, res) => {
//     try {
//         const { email } = req.body
//         const user = await User.findOne({ email })

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             })
//         }

//         // GENERATE RESET OTP
//         const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()

//         // HASH RESET OTP
//         const hashedResetOtp = await bcrypt.hash(resetOtp, 10)

//         // OTP EXPIRY
//         const resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000)

//         // SAVE
//         user.resetOtp = hashedResetOtp
//         user.resetOtpExpires = resetOtpExpires
//         await user.save()

//         // SEND EMAIL
//         await transporter.sendMail({
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: "Password Reset OTP",
//             html: `
//                 <h1>Password Reset</h1>
//                 <h2>Reset OTP: ${resetOtp}</h2>
//                 <p>OTP valid for 5 minutes</p>
//             `
//         })

//         res.status(200).json({
//             message: "Reset OTP sent"
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Forgot password failed"
//         })
//     }
// }

// //  RESET PASSWORD 
// var resetPassword = async (req, res) => {
//     try {
//         const { email, otp, newPassword } = req.body
//         const user = await User.findOne({ email })

//         if (!user) {
//             return res.status(404).json({
//                 message: "User not found"
//             })
//         }

//         // OTP EXPIRY
//         if (user.resetOtpExpires < new Date()) {
//             return res.status(400).json({
//                 message: "OTP expired"
//             })
//         }

//         // VERIFY OTP
//         const validOtp = await bcrypt.compare(otp, user.resetOtp)

//         if (!validOtp) {
//             return res.status(400).json({
//                 message: "Invalid OTP"
//             })
//         }

//         // HASH PASSWORD
//         const hashedPassword = await bcrypt.hash(newPassword, 10)

//         // SAVE PASSWORD
//         user.password = hashedPassword

//         // CLEAR RESET OTP
//         user.resetOtp = undefined
//         user.resetOtpExpires = undefined
//         await user.save()

//         res.status(200).json({
//             message: "Password reset successful"
//         })

//     } catch (error) {
//         console.log(error)
//         res.status(500).json({
//             message: "Reset password failed"
//         })
//     }
// }

// module.exports = {
//     registerUser,
//     verifyOtp,
//     resendOtp,
//     refreshTokenController, 
//     login,
//     forgotPassword,
//     resetPassword
// }


var User = require("../Model/UserModel")
var bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken") 
const { redisClient } = require("../config/redisClient");

const transporter = require("../config/Mail")
const { generateAccessToken, generateRefreshToken } = require("../helper/token")

// ==========================================
// 1. REGISTER USER (With Unverified Account Cleanup)
// ==========================================
var registerUser = async (req, res) => {
    try {
        var { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        // 🌟 STRICT FRONTEND/BACKEND REAL EMAIL REGEX CHECK
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({
                message: "Please provide a valid, real email address"
            })
        }

        var userExists = await User.findOne({ email: email.trim() })

        if (userExists) {
            // 🚀 FIX: ఒకవేళ ఇమెయిల్ ఉండి, అది ఇంకా VERIFY అవ్వకపోతే...
            // పాత అన్-వెరిఫైడ్ రికార్డ్ ని తీసేసి కొత్తగా రిజిస్టర్ అవ్వనిద్దాం!
            if (!userExists.isVerified) {
                await User.deleteOne({ _id: userExists._id });
            } else {
                return res.status(400).json({
                    message: "User already exists with this email"
                })
            }
        }

        // HASH PASSWORD
        var hashPassword = await bcrypt.hash(password, 10)

        // GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // HASH OTP
        const hashedOtp = await bcrypt.hash(otp, 10)

        // OTP EXPIRY (5 Minutes)
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        // CREATE USER (isVerified default గా false ఉంటుంది నీ మోడల్ లో)
        await redisClient.setEx(
            `register:${email.trim()}`,
            300,
            JSON.stringify({
                name: name.trim(),
                email: email.trim(),
                password: hashPassword,
                otp: hashedOtp,
                otpAttempts: 0
            })
        )

        // SEND EMAIL VIA NODEMAILER
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email.trim(),
            subject: "MOBI-SHOP - Email Verification OTP",
            html: `
                <div style="font-family: sans-serif; padding: 20px; background-color: #09090b; color: #ffffff; border-radius: 12px; max-width: 400px; margin: auto; border: 1px solid #27272a;">
                    <h2 style="color: #6366f1; margin-bottom: 5px;">MOBI-SHOP</h2>
                    <p style="color: #a1a1aa; font-size: 14px;">Verify your premium store account identity credentials.</p>
                    <hr style="border-color: #27272a; margin: 20px 0;"/>
                    <span style="font-size: 12px; text-transform: uppercase; tracking: 0.1em; color: #71717a; display: block; margin-bottom: 8px;">Your Security OTP Code</span>
                    <div style="font-size: 32px; font-weight: bold; tracking: 4px; color: #ffffff; background-color: #18181b; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #3f3f46;">
                        ${otp}
                    </div>
                    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 15px;">This OTP token is valid strictly for 5 minutes.</p>
                </div>
            `
        })

        res.status(201).json({
            message: "OTP sent to email",
            email: email.trim() // Frontend redirect కోసం ఇమెయిల్ పంపిస్తున్నాం
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Registration failed"
        })
    }
}

// ==========================================
// 2. VERIFY OTP
// ==========================================
var verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        await redisClient.setEx(
            `register:${email.trim()}`,
            300,
            JSON.stringify({
                name: name.trim(),
                email: email.trim(),
                password: hashPassword,
                otp: hashedOtp,
                otpAttempts: 0
            })
        )

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

        // MAX ATTEMPTS CHECK
        if (user.otpAttempts >= 3) {
            return res.status(429).json({
                message: "Too many failed attempts. Please resend a new OTP."
            })
        }

        // OTP EXPIRY CHECK
        if (user.otpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired. Please request a new one."
            })
        }

        // VERIFY HASHED OTP
        const validOtp = await bcrypt.compare(otp, user.otp)

        if (!validOtp) {
            user.otpAttempts += 1
            await user.save()
            return res.status(400).json({
                message: `Invalid OTP. ${3 - user.otpAttempts} attempts remaining.`
            })
        }

        // 🚀 SUCCESS: ఇప్పుడు అకౌంట్ పూర్తి యాక్టివేట్ అయ్యింది!
        await User.create({
            name: user.name,
            email: user.email,
            password: user.password,
            isVerified: true
        })
        
        await redisClient.del(
            `register:${email.trim()}`
        )
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

// ==========================================
// 3. RESEND OTP
// ==========================================
var resendOtp = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email: email?.trim() })

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

        // COOLDOWN (60 Seconds)
        const now = new Date()
        if (user.otpLastSent && now - user.otpLastSent < 60000) {
            return res.status(429).json({
                message: "Please wait 60 seconds before requesting another OTP"
            })
        }

        // GENERATE OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()

        // HASH OTP
        const hashedOtp = await bcrypt.hash(otp, 10)

        // OTP EXPIRY
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000)

        // SAVE NEW OTP METADATA
        user.otp = hashedOtp
        user.otpExpires = otpExpires
        user.otpLastSent = now
        user.otpAttempts = 0
        await user.save()

        // SEND MAIL
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email.trim(),
            subject: "MOBI-SHOP - Resend OTP",
            html: `
                <div style="font-family: sans-serif; padding: 20px; background-color: #09090b; color: #ffffff; border-radius: 12px; max-width: 400px; margin: auto; border: 1px solid #27272a;">
                    <h2 style="color: #6366f1; margin-bottom: 5px;">MOBI-SHOP</h2>
                    <p style="color: #a1a1aa; font-size: 14px;">Your requested new authorization code.</p>
                    <hr style="border-color: #27272a; margin: 20px 0;"/>
                    <span style="font-size: 12px; text-transform: uppercase; tracking: 0.1em; color: #71717a; display: block; margin-bottom: 8px;">New Security OTP Code</span>
                    <div style="font-size: 32px; font-weight: bold; tracking: 4px; color: #ffffff; background-color: #18181b; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #3f3f46;">
                        ${otp}
                    </div>
                    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 15px;">This OTP token is valid strictly for 5 minutes.</p>
                </div>
            `
        })

        res.status(200).json({
            message: "New OTP sent successfully"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Resend OTP failed"
        })
    }
}

// ==========================================
// 4. LOGIN
// ==========================================
var login = async (req, res) => {
    try {
        var { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields required"
            })
        }

        var userExists = await User.findOne({ email: email.trim() })

        if (!userExists) {
            return res.status(401).json({
                message: "Invalid credentials"
            })
        }

        // 🚀 VERIFY EMAIL CHECK (ఇక్కడ ఆపుతుంది unverified యూజర్స్ ని!)
        if (!userExists.isVerified) {
            return res.status(401).json({
                message: "Please verify your email address first"
            })
        }

        // ACCOUNT LOCK CHECK
        if (userExists.lockUntil && userExists.lockUntil > new Date()) {
            return res.status(403).json({
                message: "Account temporarily locked. Try again later."
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

        // RESET LOGIN ATTEMPTS ON SUCCESS
        userExists.loginAttempts = 0
        userExists.lockUntil = undefined
        await userExists.save()

        // GENERATE TOKENS
        const accessToken = generateAccessToken(userExists)
        const refreshToken = generateRefreshToken(userExists)

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

// ==========================================
// 5. REFRESH TOKEN
// ==========================================
var refreshTokenController = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required"
            })
        }

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (error, decoded) => {
                if (error) {
                    return res.status(403).json({
                        message: "Invalid refresh token"
                    })
                }

                const user = await User.findById(decoded.userId)

                if (!user) {
                    return res.status(404).json({
                        message: "User not found"
                    })
                }

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

// ==========================================
// 6. FORGOT PASSWORD
// ==========================================
var forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const user = await User.findOne({ email: email?.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedResetOtp = await bcrypt.hash(resetOtp, 10)
        const resetOtpExpires = new Date(Date.now() + 5 * 60 * 1000)

        user.resetOtp = hashedResetOtp
        user.resetOtpExpires = resetOtpExpires
        await user.save()

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email.trim(),
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

// ==========================================
// 7. RESET PASSWORD
// ==========================================
var resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body
        const user = await User.findOne({ email: email?.trim() })

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (user.resetOtpExpires < new Date()) {
            return res.status(400).json({
                message: "OTP expired"
            })
        }

        const validOtp = await bcrypt.compare(otp, user.resetOtp)

        if (!validOtp) {
            return res.status(400).json({
                message: "Invalid OTP"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
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