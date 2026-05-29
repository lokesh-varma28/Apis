var express = require("express")
const { getCart, addToCart, decreaseCartQuantity} = require("../Controller/cartController")
const authMiddleware = require("../MiddleWare/authMiddleware")


var router = express.Router()


router.get("/cart",authMiddleware,getCart)

router.post("/addcart",authMiddleware,addToCart)

router.patch("/decreasecart", authMiddleware, decreaseCartQuantity)


module.exports = router 