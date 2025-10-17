const mongoose = require("mongoose");
const Cart = require("../models/Cart");

// Kết nối MongoDB
mongoose
    .connect("mongodb://localhost:27017/myshop")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log(err));
const data = {
    user: "68e0073d5276bf839267b0bc",
    products: [
        {
            product: "68df3ec78a62117b40de976c", // _id thật trong Product
            ten: "Áo thun trắng",
            gia: 200000,
            soLuong: 2,
        },
    ],
};

cart = new Cart(data);
cart.save();
