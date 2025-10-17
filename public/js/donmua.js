window.onload = function () {
    loadDonMua();
};

async function loadDonMua() {
    try {
    const orderRes = await fetch(`http://localhost:5000/api/orders?userId=${currentUser._id}`);
    const orders = await orderRes.json();
  } catch (err) {
    console.error("Lỗi lấy đơn hàng:", err);
  }
    let container = document.getElementById("donmua-list");

    if (orders.length === 0) {
        container.innerHTML = "<p>Bạn chưa có đơn hàng nào.</p>";
        return;
    }

    container.innerHTML = "";
    orders.forEach(order => {
        let orderDiv = document.createElement("div");
        orderDiv.className = "order-item";
        orderDiv.innerHTML = `
            <div class="order-header">
                <strong>Mã đơn:</strong> ${order._id} | 
                <strong>Trạng thái:</strong> ${order.orderStatus}
            </div>
            <div class="order-products">
                ${order.products.map(item => `
                    <div class="order-product">
                        <img src="${item.img}" alt="${item.name}">
                        <span>${item.ten}</span>
                        <span>${item.gia}₫ x ${item.soLuong}</span>
                    </div>
                `).join("")}
            </div>
            <div class="order-footer">
                <strong>Tổng tiền:</strong> ${order.tongTienHang}₫
            </div>
        `;
        container.appendChild(orderDiv);
    });
}
