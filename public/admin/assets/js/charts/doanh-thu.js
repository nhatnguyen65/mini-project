async function dataRevenue() {
    const res = await fetch("http://localhost:7000/revenue");
    return await res.json();
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

dataRevenue()
    .then(({ revenueSummary }) => renderRevenues(revenueSummary))
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
            // labels: [
            //     "Tháng 4",
            //     "Tháng 5",
            //     "Tháng 6",
            //     "Tháng 7",
            //     "Tháng 8",
            //     "Tháng 9",
            // ],
            labels: data.revenueGrowth.labels,
            datasets: [
                {
                    label: "Doanh thu",
                    // data: [12, 15, 18, 20, 23, 25, 26],
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
                        label: (ctx) => `${ctx.formattedValue} triệu ₫`,
                    },
                    displayColors: false, // tắt ô màu ở tooltip
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 }, // chữ to hơn
                    padding: 10,
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { color: "#eee", borderDash: [5, 5] },
                },
                x: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { display: false },
                },
            },
        },
    });
}
dataRevenue()
    .then((data) => renderRevenueCharts(data))
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
                <td class="text-center">${revenue.share}%</td>
            </tr>
        `
        )
        .join("");
}
dataRevenue()
    .then(({ tableRevenues }) => tableTopRevenue(tableRevenues))
    .catch((error) =>
        console.log(`Lỗi trang Doanh Thu, tableTopProducts: ${error}`)
    );
