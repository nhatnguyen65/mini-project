const mongoose = require('mongoose');
const Order = require('../models/Order'); // đường dẫn đến file Order.js của bạn

mongoose.connect('mongodb://localhost:27017/myshop')
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error(err));

const sampleOrder = new Order({
  user: '670f00e2c3a7c99f8d9b45f1', // _id thật của User trong DB
  products: [
    {
      product: '670f01a7c3a7c99f8d9b4602', // _id thật trong bảng Product
      ten: 'Áo thun trắng',
      gia: 200000,
      soLuong: 2
    },
    {
      product: '670f02b5c3a7c99f8d9b46b9',
      ten: 'Quần jeans xanh',
      gia: 350000,
      soLuong: 1
    }
  ],
  tongTienHang: 200000 * 2 + 350000 * 1, // = 750000
  giamGia: 50000,
  tongTienThanhToan: 700000,
  shippingAddress: {
    hoTenNguoiNhan: 'Nguyễn Văn A',
    soDienThoai: '0987654321',
    diaChi: '123 Đường Lê Lợi',
    tinhThanh: 'TP. Hồ Chí Minh',
    quanHuyen: 'Quận 1',
    ghiChu: 'Giao giờ hành chính'
  },
  paymentMethod: 'COD',
  paymentStatus: 'Chưa thanh toán',
  orderStatus: 'Đang xử lý',
  ngayDat: new Date(),
  history: [
    { status: 'Đang xử lý', note: 'Đơn hàng mới tạo' }
  ]
});

// Lưu vào database
sampleOrder.save()
  .then(() => console.log('✅ Order saved successfully!'))
  .catch(err => console.error(err))
  .finally(() => mongoose.connection.close());
