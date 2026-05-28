const redis =
require("../config/redisClient")

const blacklistToken =
async(token)=>{

   await redis.set(

      token,

      "blocked",

      "EX",

      60*60*24
   )
}

module.exports =
blacklistToken