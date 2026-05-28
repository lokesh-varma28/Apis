require("dotenv").config();

const express = require("express");
const cors = require("cors");


const cookieParser =require("cookie-parser")
const helmet =require("helmet")


 const connectToDatabase = require("./DataBase/db.js");
 const { connectRedis } = require("./config/redisClient.js");
 const { createLimiters } = require("./MiddleWare/rateLimiter.js");
 const authLimiter =require("./MiddleWare/authLimiter")

 // routes
 const useRoutes = require("./Routes/UserRoutes.js");
 const productRoutes = require("./Routes/ProductRoutes.js");
 const profileRoutes = require("./Routes/profileRoutes.js");
 const cartRoutes = require("./Routes/cartRoutes.js");
 const paymentRoutes = require("./Routes/paymentRoutes.js");
 const orderRoutes = require("./Routes/orderRoutes.js");
 const wishlistRoutes = require("./Routes/wishlistRoutes.js");

const app = express();
app.use(cookieParser())



 app.set('trust proxy', 1); //  important for rate limit

 app.use(helmet())

app.use(cors());
app.use(express.json());



const startServer = async () => {
  await connectRedis();

  const { productLimiter, adminLimiter } = createLimiters();

 //  FIXED: scoped limiters
  app.use("/products", productLimiter, productRoutes);
  app.use("/admin", adminLimiter);

   // routes
 // app.use("/", useRoutes);
  app.use("/", authLimiter, useRoutes)
  app.use("/", profileRoutes);
  app.use("/", cartRoutes);
  app.use("/", paymentRoutes);
  app.use("/", orderRoutes);
  app.use("/", wishlistRoutes);
  app.use("/",productRoutes)

  await connectToDatabase();

  app.listen(process.env.PORT, () => {
    console.log("The server is running");
  });
};

startServer();