var mongoose = require("mongoose")

var orderSchema = new mongoose.Schema({
    userId: String,

    items: [
        {
            product: String,
            quantity: Number
        }
    ],

    totalAmount: Number,

    status: {
        type: String,
        default: "pending"
    },

    paymentId: String

}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)