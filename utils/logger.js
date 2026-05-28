const winston =
require("winston")

const logger =
winston.createLogger({

   transports:[

      new winston.transports.File({

         filename:"error.log",

         level:"error"
      }),
      console.log(error),
      logger.error(error),

      new winston.transports.File({

         filename:"combined.log"
      })
   ]
})

module.exports = logger