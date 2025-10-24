// seedWarehouse.js
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Warehouse = require("../models/Warehouse");

// 👉 Thay bằng URL của bạn
const MONGO_URI = "mongodb://localhost:27017/myshop";

const warehouseData = {
    name: "Main Warehouse",
    location: "Ho Chi Minh City",
    products: [
        { product: "Sam0", stock: 40 },
        { product: "Xia0", stock: 30 },
        { product: "Opp0", stock: 25 },
        { product: "Nok0", stock: 35 },
        { product: "Sam1", stock: 15 },
        { product: "App0", stock: 5 },
        { product: "Opp1", stock: 35 },
        { product: "Sam2", stock: 30 },
        { product: "App1", stock: 20 },
        { product: "App2", stock: 10 },
        { product: "Xia1", stock: 15 },
        { product: "Mob0", stock: 40 },
        { product: "Mob1", stock: 45 },
        { product: "Mob2", stock: 50 },
        { product: "Mob3", stock: 80 },
        { product: "Xia2", stock: 30 },
        { product: "Xia3", stock: 35 },
        { product: "Hua0", stock: 8 },
        { product: "Hua1", stock: 20 },
        { product: "Hua2", stock: 60 },
        { product: "Nok1", stock: 5 },
        { product: "Sam3", stock: 20 },
        { product: "Rea0", stock: 25 },
        { product: "Rea1", stock: 35 },
        { product: "Rea2", stock: 50 },
        { product: "Rea3", stock: 30 },
        { product: "Phi0", stock: 70 },
        { product: "Phi1", stock: 50 },
        { product: "Phi2", stock: 80 },
        { product: "Viv0", stock: 15 },
        { product: "Viv1", stock: 25 },
        { product: "Viv2", stock: 35 },
        { product: "Viv3", stock: 40 },
        { product: "Mobe0", stock: 75 },
        { product: "Mobe1", stock: 70 },
        { product: "Mobe2", stock: 55 },
        { product: "Ite0", stock: 60 },
        { product: "Ite1", stock: 65 },
        { product: "Ite2", stock: 85 },
        { product: "Ite3", stock: 85 },
        { product: "Coo0", stock: 50 },
        { product: "Coo1", stock: 60 },
        { product: "Coo2", stock: 65 },
        { product: "HTC0", stock: 25 },
        { product: "Mot0", stock: 65 },
        { product: "App3", stock: 8 },
        { product: "App4", stock: 10 },
        { product: "App5", stock: 8 },
        { product: "App6", stock: 10 },
        { product: "Hua3", stock: 35 },
    ],
};

async function seedWarehouse() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Xoá warehouse cũ nếu có
        await Warehouse.deleteMany({});
        console.log("🧹 Old warehouses cleared");

        // Lấy tất cả sản phẩm
        const products = await Product.find({});
        const productMap = {};
        products.forEach((p) => (productMap[p.masp] = p._id));

        // Gắn đúng ObjectId cho từng sản phẩm trong warehouse
        const warehouseProducts = warehouseData.products
            .map((item) => {
                const productId = productMap[item.product];
                if (!productId) {
                    console.warn(`⚠️ Không tìm thấy sản phẩm: ${item.product}`);
                    return null;
                }
                return { product: productId, stock: item.stock };
            })
            .filter(Boolean);

        // Tạo warehouse mới
        const newWarehouse = new Warehouse({
            name: warehouseData.name,
            location: warehouseData.location,
            products: warehouseProducts,
        });

        await newWarehouse.save();
        console.log("✅ Warehouse created successfully!");
        mongoose.connection.close();
    } catch (error) {
        console.error("❌ Error seeding warehouse:", error);
    }
}

seedWarehouse();
