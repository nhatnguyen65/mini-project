const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session"); //dùng để mã hóa cookie session
const MongoStore = require("connect-mongo"); //

const app = express();
const path = require("path");
app.use(
    cors({
        origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
        credentials: true,
    })
); // frontend trên 5500
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ⚠️ session middleware
app.use(
    session({
        secret: "secret-key",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: "mongodb://localhost:27017/myshop",
        }),
        cookie: {
            httpOnly: true,
            secure: false, // nếu chạy localhost, để false
            maxAge: 1000 * 60 * 60 * 24,
        },
    })
);
const authMiddleware = require("./middleware/authMiddleware");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoute = require("./routes/addressRoutes");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/users/address", addressRoute);

// route cho trang chủ
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
