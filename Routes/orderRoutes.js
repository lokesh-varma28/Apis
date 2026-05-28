var express = require("express")
const { getAllOrders, getSingleOrder } = require("../Controller/orderController")
const authMiddleware = require("../MiddleWare/authMiddleware")


var router =  express.Router()


router.get("/orders",authMiddleware,getAllOrders)

router.get("/orders/:id",authMiddleware,getSingleOrder)


module.exports = router 


