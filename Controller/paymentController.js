var Cart = require("../Model/cartModel")
var Product = require("../Model/ProductModel")
var razorpay = require("../config/razorpay")
var mongoose = require("mongoose")


var checkout = async (req, res) => {
    console.log("RAZORPAY INSTANCE:", razorpay);
    try {
        var userId = req.user.userId

        var cart = await Cart.findOne({ user: userId })

        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(400).json({ message: "cart empty" })
        }

        console.log("CART FOUND:", cart)

        var productIds = cart.items
            .map(item => item.product)
            .filter(id => mongoose.Types.ObjectId.isValid(id))

        if (productIds.length === 0) {
            return res.status(400).json({
                message: "cart has invalid productId(s); please clear cart and add valid products"
            })
        }

        var products = await Product.find({
            _id: { $in: productIds }
        })

        
        var totalAmount = 0
        var productById = new Map(products.map(p => [p._id.toString(), p]))
        var missingProductIds = []

        for (let item of cart.items) {
            if (!mongoose.Types.ObjectId.isValid(item.product)) {
                continue
            }
            var product = productById.get(item.product.toString())
            if (!product) {
                missingProductIds.push(item.product.toString())
                continue
            }
            totalAmount += product.price * item.quantity
        }

        if (missingProductIds.length > 0) {
            return res.status(400).json({
                message: "some cart products no longer exist; remove them from cart",
                missingProductIds
            })
        }

        console.log("Total Amount:", totalAmount)

        
        if (totalAmount <= 0) {
            return res.status(400).json({ message: "invalid amount" })
        }

     
        var order = await razorpay.orders.create({
            amount: totalAmount * 100, // convert to paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: userId
            }
        })

        console.log("ORDER CREATED:", order)

        res.status(200).json({
            message: "checkout created",
            order,
            totalAmount
        })

    } catch (error) {
        console.log("FULL ERROR:", error)

        return res.status(500).json({
            error: error.message || "server error"
        })
    }
}

module.exports = {
    checkout
}