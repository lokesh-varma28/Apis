var express = require("express")
const { getCart, addToCart } = require("../Controller/cartController")
const authMiddleware = require("../MiddleWare/authMiddleware")


var router = express.Router()


router.get("/cart",authMiddleware,getCart)

router.post("/addcart",authMiddleware,addToCart)

module.exports = router 