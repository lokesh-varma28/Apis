var mongoose = require("mongoose")

var productSchema = new mongoose.Schema({
    title : {
        type : String
    },
    description : {
        type : String
    },
    price : {
        type : Number
    },
    image : {
        url : {
            type : String
        },
        publicId : {
            type : String
        }
    },
    reviews: [
        {
            user: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                default: ""
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    numReviews: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    }

})

var Product = mongoose.model("products",productSchema)


module.exports = Product