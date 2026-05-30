
var Product = require("../Model/ProductModel");
const { uploadToCloudinary } = require("../helper/cloudinaryhelper");
var { redisClient } = require("../config/redisClient");

var getAllProducts = async (req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        var skip = (page - 1) * limit;

        var cacheKey = `allproducts:${page}:${limit}`;

       console.log(redisClient)
        if(redisClient.isOpen) {
            var cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log("✅ Data from Redis");
                return res.status(200).json(JSON.parse(cachedData));
            }
        }

        
        var totalProducts = await Product.countDocuments();
        var products = await Product.find().skip(skip).limit(limit);

        var response = {
            total: totalProducts,
            page,
            limit,
            totalPages: Math.ceil(totalProducts / limit),
            products
        };

       
    if(redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
        }

        console.log("📦 Data from MongoDB");
        res.status(200).json(response);

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Failed to fetch products" });
    }
};


var getSingleProduct = async (req, res) => {
    try {
        var id = req.params.id;
        var cacheKey = `product:${id}`;

       
        if(redisClient.isOpen) {
           var cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return res.status(200).json({
                    singleProduct: JSON.parse(cachedData)
                });
            }
        }

        var product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

    
    if(redisClient.isOpen) {
            await redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
        }

        res.status(200).json({ singleProduct: product });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Failed to fetch product" });
    }
};


var addNewProduct = async (req, res) => {
    try {
        var { title, description, price } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: "File missing" });
        }

       
        var { url, publicId } = await uploadToCloudinary(req.file.path);

        var newProduct = await Product.create({
            title,
            description,
            price,
            image: { url, publicId }
        });

        if(redisClient.isOpen) {
            const keys = await redisClient.keys("allproducts:*");
            if (keys.length) await redisClient.del(keys);
        }

        res.status(201).json({
            message: "Product added",
            product: newProduct
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Failed to add product" });
    }
};


var updateProduct = async (req, res) => {
    try {
        var id = req.params.id;
        var { title, description, price } = req.body;

        var updatedProduct = await Product.findByIdAndUpdate(
            id,
            { title, description, price },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 🔹 Clear cache
        if(redisClient.isOpen) {
            await redisClient.del(`product:${id}`);

            const keys = await redisClient.keys("allproducts:*");
            if (keys.length) await redisClient.del(keys);
        }

        res.status(200).json({
            message: "Product updated",
            product: updatedProduct
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Failed to update product" });
    }
};


var deleteProduct = async (req, res) => {
    try {
        var id = req.params.id;

        var deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // 🔹 Clear cache
       if(redisClient.isOpen) {
            await redisClient.del(`product:${id}`);

            const keys = await redisClient.keys("allproducts:*");
            if (keys.length) await redisClient.del(keys);
        }

        res.status(200).json({
            message: "Product deleted"
        });

    } catch (error) {
        console.log("error", error);
        return res.status(500).json({ message: "Failed to delete product" });
    }
};


module.exports = {
    getAllProducts,
    getSingleProduct,
    addNewProduct,
    updateProduct,
    deleteProduct
};