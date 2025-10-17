const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  masp: String,
  name: String,
  company: String,
  img: String,
  price: Number,
  star: Number,
  rateCount: Number,
  promo: {
    name: String,
    value:Number
  },
  detail: Object
});

module.exports = mongoose.model('Product', productSchema);
