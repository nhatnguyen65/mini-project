import { API_BASE_URL } from "../config.js";

async function loadRevenue() {
    try {
        const res = await fetch(`${API_BASE_URL}/orders/all`, {
            method: "GET",
            credentials: "include",
        });
        return await res.json();
    } catch (error) {
        console.error(`Lỗi trang Doanh Thu, loadRevenue: ${error}`);
    }
}

function formatCurrency(value) {
    return `₫ ${value.toLocaleString("vi-VN")}`;
}

async function renderRevenues(revenueSummary) {
    document.querySelector("#total-revenue").innerText = formatCurrency(
        revenueSummary.revenue
    );
    document.querySelector("#total-profit").innerText = formatCurrency(
        revenueSummary.profit
    );
    document.querySelector("#avg-order-value").innerText = formatCurrency(
        revenueSummary.averageOrderValue
    );
    document.querySelector(
        "#conversion-rate"
    ).innerText = `${revenueSummary.conversionRate}%`;
}
function calculateMonthlyRevenueSummary(orders) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 🔹 Lọc đơn trong tháng hiện tại
    const ordersThisMonth = orders.filter((order) => {
        const orderDate = new Date(order.ngayDat);
        return (
            orderDate.getMonth() === currentMonth &&
            orderDate.getFullYear() === currentYear
        );
    });

    const completedOrders = ordersThisMonth.filter(
        (o) => o.orderStatus === "Hoàn thành"
    );

    // 🔹 Tổng doanh thu
    const revenue = completedOrders.reduce(
        (sum, o) => sum + (o.tongTienThanhToan || 0),
        0
    );

    // 🔹 Tạm tính lợi nhuận (nếu chưa có giá nhập)
    const profit = revenue * 0.1; // giả sử biên lợi nhuận 20%

    // 🔹 Giá trị trung bình mỗi đơn hoàn thành
    const averageOrderValue =
        completedOrders.length > 0 ? revenue / completedOrders.length : 0;

    // 🔹 Tỷ lệ chuyển đổi
    const conversionRate =
        ordersThisMonth.length > 0
            ? ((completedOrders.length / ordersThisMonth.length) * 100).toFixed(
                  2
              )
            : 0;

    return {
        revenue,
        profit,
        averageOrderValue,
        conversionRate,
    };
}
loadRevenue()
    .then((orders) => {
        const revenueSummary = calculateMonthlyRevenueSummary(orders);
        renderRevenues(revenueSummary);
    })
    .catch((error) =>
        console.log(`Lỗi trang Doanh Thu, renderRevenues: ${error}`)
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
        // đổi từ afterDraw sang beforeDatasetsDraw
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
async function renderRevenueCharts(data) {
    // Biểu đồ Doanh thu & Lợi nhuận theo tháng
    new Chart(document.getElementById("chart-revenue-trend"), {
        type: "line",
        data: {
            // labels: [
            //     "Tháng 1",
            //     "Tháng 2",
            //     "Tháng 3",
            //     "Tháng 4",
            //     "Tháng 5",
            //     "Tháng 6",
            //     "Tháng 7",
            //     "Tháng 8",
            //     "Tháng 9",
            // ],
            labels: data.revenueTrend.labels,
            datasets: [
                {
                    label: " Doanh thu",
                    // data: [120, 150, 180, 160, 200, 220, 200, 150, 180],
                    data: data.revenueTrend.dataRevenue,
                    borderColor: "#43A047",
                    backgroundColor: "rgba(67,160,71,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: "#43A047",
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: "#FFF",
                    pointHoverRadius: 5,
                    pointHoverBorderColor: "#43a",
                    pointHoverBorderWidth: 3,
                },
                {
                    label: " Lợi nhuận",
                    // data: [45, 60, 70, 65, 90, 100, 150, 80, 100],
                    data: data.revenueTrend.dataProfit,
                    borderColor: "#1E88E5",
                    backgroundColor: "rgba(30,136,229,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: "#1E88E5",
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: "#FFF",
                    pointHoverRadius: 5,
                    pointHoverBorderColor: "#43a",
                    pointHoverBorderWidth: 3,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                // legend: {
                //     position: "top",
                //     labels: {
                //         usePointStyle: true,
                //         pointStyle: "circle",
                //         padding: 20,
                //         font: { size: 14 }
                //     }
                // },
                tooltip: {
                    usePointStyle: true, // 🔹 bắt buộc để thay style
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
                        labelPointStyle: function (context) {
                            return {
                                pointStyle: "rectRounded", // có thể là 'circle', 'rectRounded', 'rectRot', 'triangle', ...
                                rotation: 0,
                            };
                        },
                        labelColor: function (context) {
                            return {
                                borderColor: context.dataset.borderColor,
                                backgroundColor: context.dataset.borderColor,
                                borderWidth: 2,
                                borderRadius: 2,
                            };
                        },
                        label: (ctx) =>
                            `${ctx.dataset.label}: ${ctx.formattedValue} triệu ₫`,
                    },
                    titleMarginBottom: 10,
                    titleMarginLeft: 10,
                    titleFont: {
                        size: 14,
                    },
                    bodySpacing: 20, // tăng khoảng cách giữa các dòng
                    bodyFont: {
                        size: 14, // chỉnh chữ to hơn
                    },
                },
                legend: {
                    display: false,
                },
            },
            interaction: {
                intersect: false,
                mode: "index",
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

    // Biểu đồ Cơ cấu doanh thu theo thương hiệu
    new Chart(document.getElementById("chart-revenue-pie"), {
        type: "doughnut",
        data: {
            // labels: ["iPhone", "Samsung", "Xiaomi", "Oppo", "Khác"],
            labels: data.revenuePie.labels,
            datasets: [
                {
                    // data: [320000, 280000, 190000, 150000, 100000],
                    data: data.revenuePie.data,
                    backgroundColor: [
                        "#FF6384",
                        "#36A2EB",
                        "#FFBE56",
                        "#4CAF50",
                        "#9C27B0",
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
            cutout: "60%",
            plugins: {
                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "rectRounded", // có thể là 'circle', 'rectRounded', 'rectRot', 'triangle', ...
                        padding: 20,
                        font: { size: 14 },
                    },
                },
                tooltip: {
                    backgroundColor: (context) => {
                        // lấy đúng màu slice hiện tại
                        const dataset = context.tooltip.dataPoints[0].dataset;
                        const index = context.tooltip.dataPoints[0].dataIndex;
                        return dataset.backgroundColor[index];
                    },
                    displayColors: false, // bỏ ô vuông mặc định
                    callbacks: {
                        title: function (context) {
                            // không cần title riêng, trả về rỗng
                            return null;
                        },
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.raw || 0;
                            const total =
                                context.chart._metasets[context.datasetIndex]
                                    .total;
                            const percentage = ((value / total) * 100).toFixed(
                                1
                            ); // làm tròn 1 số thập phân
                            return ` ${label}: ${value}₫ (${percentage}%) `;
                        },
                    },
                    bodyFont: {
                        size: 14,
                    },
                    padding: 8,
                },
            },
        },
    });

    // Biểu đồ Tăng trưởng doanh thu theo tuần (Bar chart)
    new Chart(document.getElementById("chart-revenue-growth"), {
        type: "bar",
        data: {
            labels: data.revenueGrowth.labels,
            datasets: [
                {
                    label: "Tăng trưởng doanh thu (%)",
                    data: data.revenueGrowth.data,
                    backgroundColor: "#FF9800",
                    borderRadius: { topLeft: 10, topRight: 10 },
                    maxBarThickness: 60,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.formattedValue}%`, // ✅ đổi từ "triệu ₫" sang "%"
                    },
                    displayColors: false,
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    padding: 10,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: "#555",
                        font: { size: 13 },
                        callback: (val) => `${val}%`, // ✅ trục Y cũng hiển thị %
                    },
                    grid: { color: "#eee", borderDash: [5, 5] },
                    title: {
                        display: true,
                        font: { size: 14, weight: "bold" },
                    },
                },
                x: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { display: false },
                },
            },
        },
    });
}
function generateRevenueChartsData(orders) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Lấy 6 tháng gần nhất (theo dạng [ {month, year}, ... ])
    const recentMonths = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        recentMonths.push({ month: d.getMonth(), year: d.getFullYear() });
    }

    // Hàm tạo nhãn tháng
    const labels = recentMonths.map((m) => `Tháng ${m.month + 1}`);

    // ===== 1️⃣ Biểu đồ Doanh thu & Lợi nhuận (revenueTrend) =====
    const dataRevenue = [];
    const dataProfit = [];

    recentMonths.forEach(({ month, year }) => {
        const monthlyOrders = orders.filter((o) => {
            const d = new Date(o.ngayDat);
            return (
                d.getMonth() === month &&
                d.getFullYear() === year &&
                o.orderStatus === "Hoàn thành"
            );
        });

        const revenue = monthlyOrders.reduce(
            (sum, o) => sum + (o.tongTienThanhToan || 0),
            0
        );

        const profit = revenue * 0.2; // tạm giả định lợi nhuận = 20% doanh thu

        dataRevenue.push((revenue / 1_000_000).toFixed(1)); // triệu ₫
        dataProfit.push((profit / 1_000_000).toFixed(1));
    });

    // ===== 2️⃣ Biểu đồ tròn doanh thu theo thương hiệu (revenuePie) =====
    const brandMap = {};

    // Chỉ lấy đơn hoàn thành
    orders
        .filter((o) => o.orderStatus === "Hoàn thành")
        .forEach((o) => {
            o.products.forEach((p) => {
                const brand = p.product?.company?.trim() || "Khác";
                const revenue = p.gia * p.soLuong;
                brandMap[brand] = (brandMap[brand] || 0) + revenue;
            });
        });

    // Sắp xếp giảm dần theo doanh thu
    const sorted = Object.entries(brandMap).sort((a, b) => b[1] - a[1]);

    // Lấy 5 thương hiệu top
    const top5 = sorted.slice(0, 4);
    const otherTotal = sorted.slice(4).reduce((sum, [, val]) => sum + val, 0);

    const labelsPie = top5.map(([brand]) => brand);
    const dataPie = top5.map(([, val]) => val);

    // Gom nhóm "Khác" nếu có
    if (otherTotal > 0) {
        labelsPie.push("Khác");
        dataPie.push(otherTotal);
    }

    // ===== 3️⃣ Biểu đồ tăng trưởng doanh thu theo tháng (revenueGrowth) =====
    // 🔹 Gom doanh thu theo từng tháng
    const revenueByMonth = recentMonths.map((m) => {
        let total = 0;
        orders
            .filter((o) => o.orderStatus === "Hoàn thành")
            .forEach((o) => {
                const date = new Date(o.ngayDat);
                if (
                    date.getMonth() === m.month &&
                    date.getFullYear() === m.year
                ) {
                    total += o.tongTienThanhToan || 0;
                }
            });
        return total;
    });

    // 🔹 Tính phần trăm tăng trưởng so với tháng trước
    const dataGrowth = revenueByMonth.map((val, i) => {
        if (i === 0) return 0;
        const prev = revenueByMonth[i - 1];
        if (prev === 0 && val === 0) return 0; // không có gì thay đổi
        if (prev === 0 && val > 0) return 100; // tăng từ 0 → có doanh thu
        if (prev > 0 && val === 0) return -100; // từ có → mất doanh thu
        return (((val - prev) / prev) * 100).toFixed(1);
    });

    return {
        revenueTrend: { labels, dataRevenue, dataProfit },
        revenuePie: { labels: labelsPie, data: dataPie },
        revenueGrowth: { labels, data: dataGrowth },
    };
}
loadRevenue()
    .then((orders) => {
        const chartData = generateRevenueChartsData(orders);
        renderRevenueCharts(chartData);
    })
    .catch((error) =>
        console.log(`Lỗi trang Doanh Thu, renderRevenueCharts: ${error}`)
    );

async function tableTopRevenue(tableRevenues) {
    const tbody = document.querySelector("#table-revenue");
    tbody.innerHTML = tableRevenues
        .map(
            (revenue) => `
            <tr>
                <td class="ps-5">${revenue.name}</td>
                <td class="text-center">${revenue.quantitySold}</td>
                <td class="text-center">${formatCurrency(revenue.revenue)}</td>
                <td class="text-center ps-3">${revenue.share}%</td>
            </tr>
        `
        )
        .join("");
}
function getTop10ProductsByRevenue(orders) {
    const productMap = {};

    // 🔹 Chỉ tính đơn hàng đã hoàn thành
    orders
        .filter((o) => o.orderStatus === "Hoàn thành")
        .forEach((o) => {
            o.products.forEach((p) => {
                const name = p.product?.name || "Sản phẩm không xác định";
                const revenue = p.gia * p.soLuong;
                const quantity = p.soLuong;

                if (!productMap[name]) {
                    productMap[name] = {
                        name,
                        quantitySold: 0,
                        revenue: 0,
                    };
                }

                productMap[name].quantitySold += quantity;
                productMap[name].revenue += revenue;
            });
        });

    // 🔹 Chuyển sang mảng và sắp xếp giảm dần theo doanh thu
    const sortedProducts = Object.values(productMap).sort(
        (a, b) => b.revenue - a.revenue
    );

    // 🔹 Lấy top 10 sản phẩm
    const top10 = sortedProducts.slice(0, 10);

    // 🔹 Tính tổng doanh thu của tất cả sản phẩm để tính phần trăm đóng góp
    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);

    // 🔹 Tính tỷ lệ phần trăm từng sản phẩm
    top10.forEach((p) => {
        p.share =
            totalRevenue > 0
                ? ((p.revenue / totalRevenue) * 100).toFixed(1)
                : 0;
    });

    return top10;
}
loadRevenue()
    .then((orders) => {
        const top10Products = getTop10ProductsByRevenue(orders);
        tableTopRevenue(top10Products);
    })
    .catch((error) =>
        console.log(`Lỗi trang Doanh Thu, tableTopRevenue: ${error}`)
    );
