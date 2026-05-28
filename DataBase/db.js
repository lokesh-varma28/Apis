var express = require("express");

var mongoose = require("mongoose");

var app = express();
app.use(express.json());
async function connectToDataBase(){
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("data base connected")
    }catch(error){
        console.log("error",error)
    }
}
module.exports = connectToDataBase;