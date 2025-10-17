const mongoose = require('mongoose');
const Product = require('../models/Product');

console.log('🚀 Bắt đầu convert.js');

mongoose.connect('mongodb://localhost:27017/myshop', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Kết nối MongoDB thành công!');
    convertPriceToNumber();
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối MongoDB:', err);
  });

async function convertPriceToNumber() {
  const products = await Product.find();
  console.log(`📦 Tìm thấy ${products.length} sản phẩm`);

  for (const p of products) {
    if (typeof p.price === 'string') {
      const newPrice = Number(p.price.split('.').join(''));
      if (!isNaN(newPrice)) {
        p.price = newPrice;
        await p.save();
        console.log(`✅ Updated ${p.name}: ${newPrice}`);
      } else {
        console.log(`⚠️ Skip ${p.name} (invalid price: ${p.price})`);
      }
    }
  }

  console.log('🎉 Done updating prices!');
  process.exit();
}
