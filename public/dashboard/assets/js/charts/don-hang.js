import { API_BASE_URL } from "../config.js";

const API_BASE = `${API_BASE_URL}/orders`;

async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/all`, {
            method: "GET",
            credentials: "include",
        });
        return await res.json();
    } catch (error) {
        console.error(`Lỗi trang Đơn Hàng, loadProducts: ${error}`);
    }
}

async function renderOrders(orders) {
    // const orderCounts = document.querySelectorAll(".card .order-counts");
    // orderCounts.forEach(
    //     (element, index) => (element.innerText = orders[index])
    // );
    console.log(orders);
}
loadOrders()
    .then((orders) => renderOrders(orders))
    .catch((error) =>
        console.log(`Lỗi trang Đơn Hàng, renderOrders: ${error}`)
    );

const glowPlugin = {
    id: "glow",
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                ctx.save();
                ctx.shadowColor = dataset.borderColor;
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = dataset.borderWidth;
                ctx.strokeStyle = dataset.borderColor;
                ctx.beginPath();
                meta.dataset.draw(ctx);
                ctx.stroke();
                ctx.restore();
            }
        });
    },
};
const crosshairPlugin = {
    id: "crosshair",
    beforeDatasetsDraw: (chart) => {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#aaa";
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    },
};
async function renderOrderCharts(data) {
    // Biểu đồ trạng thái đơn hàng
    new Chart(document.getElementById("chart-order-status"), {
        type: "pie",
        data: {
            // labels: [
            //     "Chờ xác nhận",
            //     "Đang giao",
            //     "Hoàn thành",
            //     "Đã hủy",
            //     "Hoàn trả",
            // ],
            labels: data.orderStats.statuses,
            datasets: [
                {
                    // data: [150, 200, 820, 60, 20],
                    data: data.orderStats.data,
                    backgroundColor: [
                        "#6c757d",
                        "#17a2b8",
                        "#28a745",
                        "#dc3545",
                        "#ffc107",
                    ],
                    borderWidth: 3,
                    borderColor: "#FFF",
                    hoverBorderColor: "#FFF",
                    hoverOffset: 7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "1%",
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "rectRounded",
                        padding: 20,
                        font: { size: 14 },
                    },
                },
                tooltip: {
                    backgroundColor: (context) => {
                        const dataset = context.tooltip.dataPoints[0].dataset;
                        const index = context.tooltip.dataPoints[0].dataIndex;
                        return dataset.backgroundColor[index];
                    },
                    displayColors: false,
                    callbacks: {
                        title: () => null,
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            const total =
                                context.chart._metasets[context.datasetIndex]
                                    .total;
                            const percentage = ((value / total) * 100).toFixed(
                                1
                            );
                            return ` ${label}: ${value} đơn (${percentage}%) `;
                        },
                    },
                    bodyFont: { size: 14 },
                    padding: 10,
                },
            },
        },
    });

    // Biểu đồ đơn hàng theo tháng (Line chart)
    new Chart(document.getElementById("chart-order-trend"), {
        type: "line",
        data: {
            // labels: [
            //     "Th1",
            //     "Th2",
            //     "Th3",
            //     "Th4",
            //     "Th5",
            //     "Th6",
            //     "Th7",
            //     "Th8",
            //     "Th9",
            //     "Th10",
            //     "Th11",
            //     "Th12",
            // ],
            labels: data.orderTrends.labels,
            datasets: [
                {
                    label: "Số đơn hàng",
                    // data: [
                    //     100, 120, 150, 180, 200, 250, 300, 280, 270, 320, 310, 350,
                    // ],
                    data: data.orderTrends.data,
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0,123,255,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: "#007bff",
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: "#FFF",
                    pointHoverRadius: 5,
                    pointHoverBorderColor: "#007bff",
                    pointHoverBorderWidth: 3,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { display: false },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        title: function (context) {
                            const months = [
                                "Tháng 1",
                                "Tháng 2",
                                "Tháng 3",
                                "Tháng 4",
                                "Tháng 5",
                                "Tháng 6",
                                "Tháng 7",
                                "Tháng 8",
                                "Tháng 9",
                                "Tháng 10",
                                "Tháng 11",
                                "Tháng 12",
                            ];
                            return ` ${months[context[0].dataIndex]}`;
                        },
                        labelPointStyle: () => ({
                            pointStyle: "rectRounded",
                            rotation: 0,
                        }),
                        labelColor: (context) => ({
                            borderColor: context.dataset.borderColor,
                            backgroundColor: context.dataset.borderColor,
                            borderWidth: 2,
                            borderRadius: 2,
                        }),
                        label: (ctx) =>
                            ` ${ctx.dataset.label}: ${ctx.formattedValue} đơn`,
                    },
                    titleMarginBottom: 10,
                    bodySpacing: 15,
                    bodyFont: { size: 14 },
                },
            },
            scales: {
                y: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { color: "#eee", borderDash: [5, 5] },
                },
                x: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { display: false },
                },
            },
        },
        plugins: [crosshairPlugin, glowPlugin],
    });
}

function formatCurrency(value) {
    return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
}
function getStatusClass(status) {
    switch (status) {
        case "Đang chờ xử lý":
        case "Chờ xử lý":
            return "bg-warning";
        case "Đang giao":
            return "bg-info";
        case "Đã giao":
        case "Hoàn thành":
            return "bg-success";
        case "Đã hủy":
            return "bg-danger";
        default:
            return "bg-secondary";
    }
}
async function tableOrder(orders, currentPage = 1, itemsPerPage = 10) {
    const tbody = document.querySelector("#table-orders");
    const pagination = document.querySelector("#pagination");

    // Tính số trang
    const totalPages = Math.ceil(orders.length / itemsPerPage);

    // Cắt danh sách sản phẩm cho trang hiện tại
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageOrders = orders.slice(start, end);

    tbody.innerHTML = pageOrders
        .map((order) => {
            return `
                <tr>
                    <td class="text-center pe-3">${order._id}</td>
                    <td class="ps-5">${order.user.username}</td>
                    <td class="text-center">${new Date(
                        order.ngayDat
                    ).toLocaleDateString("vi-VN")}</td>
                    <td class="text-center">${formatCurrency(
                        order.tongTienThanhToan
                    )}</td>
                    <td class="text-center">
                        <span class="badge p-2 ${getStatusClass(
                            order.orderStatus
                        )}">
                            ${order.orderStatus}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary my-1 btn-detail"
                            data-id="${order._id}">
                                Chi tiết
                        </button>
                    </td>
                </tr>
            `;
        })
        .join("");

    // Gắn sự kiện cho nút "Chi tiết"
    tbody.querySelectorAll(".btn-detail").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            try {
                const res = await fetch(`${API_BASE}/all/${id}`, {
                    method: "GET",
                    credentials: "include",
                });
                if (!res.ok)
                    throw new Error("Không lấy được dữ liệu đơn hàng!");
                const order = await res.json();
                showOrderDetail(order);
            } catch (err) {
                alert("Lỗi tải chi tiết đơn hàng: " + err.message);
            }
        });
    });

    // Render nút phân trang ngay sau khi render bảng
    pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        return `
        <li class="page-item px-1 ${pageNum === currentPage ? "active" : ""}">
            <a class="page-link ${
                pageNum === currentPage
                    ? "bg-secondary text-white border-secondary"
                    : ""
            }" 
                style="border-radius:0.45rem !important;" 
                href="#">
                ${pageNum}
            </a>
        </li>
    `;
    }).join("");
    // Gắn sự kiện click để đổi trang
    pagination.querySelectorAll(".page-link").forEach((btn, index) => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            tableProduct(orders, index + 1, itemsPerPage);
        });
    });
}
loadOrders()
    .then((orders) => tableOrder(orders))
    .catch((error) => console.log(`Lỗi trang Đơn Hàng, tableOrder: ${error}`));

function showOrderDetail(order) {
    const modalEl = document.getElementById("orderDetailModal");
    modalEl.dataset.orderId = order._id;

    document.getElementById("order-customer").textContent = order.user.username;
    document.getElementById("order-email").textContent = order.user.email;
    document.getElementById("order-address").textContent = order.diaChiNhanHang;
    document.getElementById("order-date").textContent = new Date(
        order.ngayDat
    ).toLocaleString("vi-VN");
    document.getElementById("order-payment-method").textContent =
        order.paymentMethod;
    document.getElementById("order-payment-status").textContent =
        order.paymentStatus;
    document.getElementById("order-status").textContent = order.orderStatus;
    document.getElementById("order-total").textContent = formatCurrency(
        order.tongTienThanhToan
    );

    const tbody = document.getElementById("order-products");
    tbody.innerHTML = order.products
        .map(
            (p) => `
        <tr>
            <td class="text-center border"><img src="${p.product.img}" alt="${
                p.ten
            }" width="50"></td>
            <td class="border pt-4">${p.ten}</td>
            <td class="text-center border pt-4">${formatCurrency(p.gia)}</td>
            <td class="text-center border pt-4">${p.soLuong}</td>
        </tr>
    `
        )
        .join("");

    // Đặt lại giá trị select theo trạng thái hiện tại
    const statusSelect = document.querySelector("#order-status-select");
    statusSelect.value = order.orderStatus || "Chờ xử lý";

    // Hiển thị modal
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Gắn sự kiện cập nhật trạng thái (chạy 1 lần khi load trang)
function initUpdateOrderStatus() {
    const updateBtn = document.querySelector("#btn-update-status");
    const statusSelect = document.querySelector("#order-status-select");
    const modalEl = document.getElementById("orderDetailModal");

    updateBtn.addEventListener("click", async () => {
        const newStatus = statusSelect.value;
        const orderId = modalEl.dataset.orderId; // lấy id đã lưu

        if (!orderId) return alert("Không xác định được đơn hàng!");

        try {
            const res = await fetch(`${API_BASE}/all/${orderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Cập nhật thất bại!");
            const data = await res.json();

            alert("✅ " + data.message);

            // Cập nhật giao diện trong modal
            document.getElementById("order-status").textContent = newStatus;

            loadOrders()
                .then((orders) => tableOrder(orders))
                .catch((error) =>
                    console.log(`Lỗi trang Đơn Hàng, tableOrder: ${error}`)
                );

            // Có thể reload lại danh sách đơn hàng nếu muốn
            // await loadOrders();
        } catch (err) {
            console.error(err);
            alert("❌ Lỗi khi cập nhật trạng thái đơn hàng!");
        }
    });
}
initUpdateOrderStatus();
