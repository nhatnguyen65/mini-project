const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    ho: String,
    ten: String,
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    password: String,
    diaChi: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }], // danh sách địa chỉ của user
    role: { type: String, enum: ["user", "admin"], default: "user" },
    off: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
