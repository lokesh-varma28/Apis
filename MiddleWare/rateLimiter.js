
const rateLimit =
require("express-rate-limit")

const RedisStore =
require("rate-limit-redis").default

const {

    redisClient

} = require("../config/redisClient")



const createLimiters = ()=>{

    // PRODUCT LIMITER

    const productLimiter = rateLimit({

        windowMs:15 * 60 * 1000,

        max:100,

        message:"Too many product requests",

        standardHeaders:true,

        legacyHeaders:false,

        store:new RedisStore({

            sendCommand:(...args)=>

                redisClient.sendCommand(args)
        })
    })



    // ADMIN LIMITER

    const adminLimiter = rateLimit({

        windowMs:15 * 60 * 1000,

        max:20,

        message:"Too many admin requests",

        standardHeaders:true,

        legacyHeaders:false,

        store:new RedisStore({

            sendCommand:(...args)=>

                redisClient.sendCommand(args)
        })
    })



    return {

        productLimiter,

        adminLimiter
    }
}



module.exports = {

    createLimiters
}