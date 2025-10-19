
var tongTienTatCaDonHang = 0;
var tongSanPhamTatCaDonHang = 0;


window.onload = async function () {
    console.log('donmua.js loaded');
    khoiTao();

    try {
    const res = await fetch("http://localhost:5000/api/products");
    const list_products = await res.json();
    } catch (err) {
    console.error("Lỗi tải sản phẩm:", err);
  }

    
        try{
             const res = await fetch('http://localhost:5000/api/users/me',{
                credentials: 'include'
             });
             const result = await res.json();
             if(result.success && result.user) {
             currentUser = result.user;
             console.log("User lấy từ session:", currentUser);
             }
             else if (result.user) {
               currentUser = result.user;
               console.log("User lấy từ session:", currentUser);
            } else {
               // chưa đăng nhập
               document.getElementsByClassName('infoUser')[0].innerHTML = `
              <h2 style="color: red; font-weight:bold; text-align:center; font-size: 2em; padding: 50px;">
                Bạn chưa đăng nhập !!
              </h2>`;
               }     
        } catch (err) {
             console.error("Lỗi lấy user từ server:", err);
            }
            
        //lay đơn hàng từ server
        try {
    const orderRes = await fetch('http://localhost:5000/api/orders',{
        credentials: 'include'
    });
    const orders = await orderRes.json();
         // hàm này cần chạy trước để tính được tổng tiền tất cả đơn hàng 
    addTatCaDonHang(orders); // truyền vào danh sách đơn hàng
  } catch (err) {
    console.error("Lỗi lấy đơn hàng:", err);
  }

 
 
}
// Phần thông tin đơn hàng
function addTatCaDonHang(orders) {
    if (!orders.length) {
        document.getElementsByClassName('listDonHang')[0].innerHTML = `
            <h3 style="width=100%; padding: 50px; color: green; font-size: 2em; text-align: center"> 
                Xin chào ` + currentUser.username + `. Bạn chưa có đơn hàng nào.
            </h3>`;
        return;
    }
    for (var dh of orders) {
        addDonHang(dh);
    }
}

function addDonHang(dh) {
    var div = document.getElementsByClassName('listDonHang')[0];

    var s = `
            <table class="listSanPham">
                <tr> 
                    <th colspan="8">
                        <h3 style="text-align:center;"> Đơn hàng ngày: ` + new Date(dh.ngayDat).toLocaleString() + `</h3> 
                        ` + (dh.diaChiNhanHang ? '<p style="text-align:center; color: #666; margin: 5px 0;"><i class="fa fa-map-marker"></i> Địa chỉ nhận hàng: ' + dh.diaChiNhanHang + '</p>' : '') + `
                    </th>
                </tr>
                <tr>
                    <th>STT</th>
                    <th>Sản phẩm</th>
                    <th>Giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                    <th>Thời gian thêm vào giỏ</th>
                    <th>Phương thức thanh toán</th>
                    <th>Địa chỉ nhận hàng</th>
                </tr>`;

    var totalPrice = 0;
    for (var i = 0; i < dh.products.length; i++) {
        var masp = dh.products[i].masp;
        var soluongSp = dh.products[i].soLuong;
        var p=dh.products[i];
        var price =p.gia;
        var thoigian = new Date(dh.ngayDat).toLocaleString();
        var thanhtien = price * soluongSp;

        var phuongThucThanhToan = dh.paymentMethod || 'Chưa xác định';
        var trangThaiThanhToan = dh.paymentStatus || 'Chưa thanh toán';
        var paymentInfo = phuongThucThanhToan;
        if (phuongThucThanhToan !== 'Chưa xác định') {
            paymentInfo += '<br><small style="color: ' + (trangThaiThanhToan === 'Đã thanh toán' ? 'green' : 'orange') + ';">' + trangThaiThanhToan + '</small>';
        }

        s += `
                <tr>
                    <td>` + (i + 1) + `</td>
                    <td class="noPadding imgHide">
                        <a target="_blank" href="chitietsanpham.html?` + p.ten.split(' ').join('-') + `" title="Xem chi tiết">
                            ` + p.ten + `
                            <img src="` + p.product.img + `">
                        </a>
                    </td>
                    <td class="alignRight">` + numToString(price) + ` ₫</td>
                    <td class="soluong" >
                         ` + soluongSp + `
                    </td>
                    <td class="alignRight">` + numToString(thanhtien) + ` ₫</td>
                    <td style="text-align: center" >` + thoigian + `</td>
                    <td style="text-align: center; font-size: 12px;">` + paymentInfo + `</td>
                    <td style="text-align: center; font-size: 11px; color: #666;">` + (dh.diaChiNhanHang || 'Chưa xác định') + `</td>
                </tr>
            `;
        totalPrice += thanhtien;
        tongSanPhamTatCaDonHang += soluongSp;
    }
    tongTienTatCaDonHang += totalPrice;

    s += `
                <tr style="font-weight:bold; text-align:center; height: 4em;">
                    <td colspan="4">TỔNG TIỀN: </td>
                    <td class="alignRight">` + numToString(totalPrice) + ` ₫</td>
                    <td style="color: ` + (dh.orderStatus === 'Đang xử lý' ? 'orange' : dh.orderStatus === 'Hoàn tất' ? 'blue' : 'green') + `;">` + dh.orderStatus + `</td>
                    <td style="text-align: center; font-size: 12px;">` + (dh.phuongThucThanhToan || 'Chưa xác định') + `</td>
                    <td style="text-align: center; font-size: 11px; color: #666;">` + (dh.diaChiNhanHang || 'Chưa xác định') + `</td>
                </tr>
            </table>
            <hr>
        `;
    div.innerHTML += s;
}
