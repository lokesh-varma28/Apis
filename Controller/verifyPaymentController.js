var crypto = require("crypto")

var verifyPayment = async (req, res) => {
    try {
        var { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                message: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required"
            })
        }

        var body = razorpay_order_id + "|" + razorpay_payment_id

        var expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex")

        if (expectedSignature === razorpay_signature) {
            return res.status(200).json({
                message: "payment verified successfully"
            })
        } else {
            return res.status(400).json({
                message: "payment verification failed"
            })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "server error" })
    }
}

module.exports = {
    verifyPayment
}