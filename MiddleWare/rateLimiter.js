// const rateLimit = require("express-rate-limit");
// const RedisStore = require("rate-limit-redis").default;
// const {   redisClient } = require("../config/redisClient");

// // ✅ wrap inside function
// const createLimiters = () => {

//   const productLimiter = rateLimit({
//     store: new RedisStore({
//       sendCommand: (...args) => client.sendCommand(args),
//     }),
//     windowMs: 1 * 60 * 1000,
//     max:20,
//     message: {
//       success: false,
//       message: "Too many requests, please try again later",
//     },
//   });

//   const adminLimiter = rateLimit({
//     store: new RedisStore({
//       sendCommand: (...args) => client.sendCommand(args),
//     }),
//     windowMs: 1 * 60 * 1000,
//     max: 20,
//     message: {
//       success: false,
//       message: "Too many admin actions, slow down",
//     },
//   });

//   return { productLimiter, adminLimiter };
// };

// module.exports = { createLimiters };



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