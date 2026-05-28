
var Order = require("../Model/orderModel")
var mongoose = require("mongoose")


var getAllOrders = async(req,res)=>{
    try{
        var userId = req.user.userId
        var orders = await Order.find({ userId }).sort({ createdAt: -1 })
        return res.status(200).json({
            message: "User orders fetched successfully",
            orders,
        })




    }catch(error){
        console.log("error",error);
        return res.status(500).json({ message: "failed to fetch orders", error: error.message })
    }
}


var getSingleOrder = async(req,res)=>{
    try{
        var userId = req.user.userId
        var orderId = req.params.id 
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "invalid order id" })
        }
        var order = await Order.findOne({
            _id: orderId,
            userId: userId, 
          });
          if (!order) {
            return res.status(404).json({
              message: "Order not found",
            });
            
          }

          res.status(200).json({
            message: "Order fetched successfully",
            order,
          });
      

    }catch(error){
        console.log("error",error);
        return res.status(500).json({ message: "failed to fetch order", error: error.message })
    }
}


module.exports = {
    getAllOrders,getSingleOrder
}