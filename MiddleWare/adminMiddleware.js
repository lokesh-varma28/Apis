

var adminMiddleware = async(req,res,next)=>{
    try{
        if(req.user.role !=="admin"){
            return res.status(403).json({message : "cannot access admin routes"})
        }
        
        next()
    }catch(error){
        console.log("error",error);
        return res.status(500).json({ message: "admin middleware failed", error: error.message })
    }
}

module.exports = adminMiddleware