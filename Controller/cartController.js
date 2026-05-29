
var Cart = require("../Model/cartModel")
var Product = require("../Model/ProductModel")
var mongoose = require("mongoose")

// 1. Get user cart
var getCart = async (req, res) => {
    try {
        var userId = req.user.userId
        var cart = await Cart.findOne({ user: userId })

        res.status(200).json({ cart })

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ error: "server error" })
    }
}

// 2. Add product / Increase quantity by 1
var addToCart = async (req, res) => {
    try {
        var userId = req.user.userId
        var { productId } = req.body || {}
        if (!productId) {
            return res.status(400).json({
                message: "productId is required",
                example: { productId: "PRODUCT_ID_HERE" }
            })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "invalid productId",
                example: { productId: "69d73d815a0cd29f92e8d575" }
            })
        }

        var exists = await Product.findById(productId).select("_id")
        if (!exists) {
            return res.status(404).json({ message: "product not found" })
        }

        var cart = await Cart.findOne({ user: userId })

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [
                    {
                        product: productId,
                        quantity: 1
                    }
                ]
            })

            return res.status(201).json({
                message: "cart created",
                data: cart
            })
        }

        // FIX: Convert both to String to avoid object vs string mismatch errors
        var existingItem = cart.items.find(
            item => item.product.toString() === productId.toString()
        )

        if (existingItem) {
            existingItem.quantity += 1
        } else {
            cart.items.push({
                product: productId,
                quantity: 1
            })
        }

        await cart.save()

        return res.status(200).json({
            message: "cart updated",
            data: cart
        })

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ error: "server error", details: error.message })
    }
}

// 3. Decrease product quantity (Removes item if quantity hits 0)
var decreaseCartQuantity = async (req, res) => {
    try {
        var userId = req.user.userId
        var { productId } = req.body || {}

        if (!productId) {
            return res.status(400).json({ message: "productId is required" })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "invalid productId" })
        }

        var cart = await Cart.findOne({ user: userId })
        if (!cart) {
            return res.status(404).json({ message: "cart not found" })
        }

        // FIX: Convert both to String here as well
        var itemIndex = cart.items.findIndex(
            item => item.product.toString() === productId.toString()
        )

        if (itemIndex === -1) {
            return res.status(404).json({ message: "product not found in cart" })
        }

        // Decrease the quantity
        cart.items[itemIndex].quantity -= 1

        // If quantity reaches 0 or less, remove the product from the items array
        if (cart.items[itemIndex].quantity <= 0) {
            cart.items.splice(itemIndex, 1)
        }

        await cart.save()

        return res.status(200).json({
            message: "cart quantity decreased",
            data: cart
        })

    } catch (error) {
        console.log("error", error)
        return res.status(500).json({ error: "server error", details: error.message })
    }
}

module.exports = {
    getCart,
    addToCart,
    decreaseCartQuantity
}