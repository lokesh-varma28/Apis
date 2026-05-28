var express = require("express")

var authMiddleware = require("../MiddleWare/authMiddleware")
var { checkout } = require("../Controller/paymentController")
var { verifyPayment } = require("../Controller/verifyPaymentController")

var router = express.Router()

router.post("/checkout", authMiddleware, checkout)
router.post("/verifypayment", authMiddleware, verifyPayment)

module.exports = router