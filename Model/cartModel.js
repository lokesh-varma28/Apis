var mongoose = require("mongoose")


var cartSchema = new mongoose.Schema({
    user : {
        type : String 
    },
    items : [
        {
            product : {
                type : String 
            },
            quantity : {
                type : Number
            }
        }
    ]
})

var cart = mongoose.model("cart",cartSchema)


module.exports = cart 