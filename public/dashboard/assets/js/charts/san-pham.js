import { API_BASE_URL } from "../config.js";

async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        return await res.json();
    } catch (error) {
        console.error(`Lỗi trang Sản Phẩm, loadProducts: ${error}`);
    }
}

// async function dataProduct() {
//     const res = await fetch("http://localhost:7000/products");
//     return await res.json();
// }

// async function renderProducts(productSummary) {
//     document.querySelector("#total-products").innerText =
//         productSummary.totalProducts.toLocaleString();
//     document.querySelector("#best-seller").innerText =
//         productSummary.bestSeller;
//     document.querySelector(
//         "#low-stock"
//     ).innerText = `${productSummary.lowStock} sp`;
//     document.querySelector("#inventory-value").innerText = `₫ ${(
//         productSummary.inventoryValue / 1_000_000
//     ).toFixed()} Triệu`;
// }
// dataProduct()
//     .then(({ productSummary }) => renderProducts(productSummary))
//     .catch((error) => console.log(error));

async function renderProducts(products) {
    document.querySelector("#total-products").innerText = `${
        products.filter((p) => p.masp).length || 0
    }`;
    document.querySelector("#low-stock").innerText = `${
        products.filter((p) => p.stock && p.stock <= 10).length || 0
    } sp`;
    document.querySelector("#out-stock").innerText = `${
        products.filter((p) => p.stock && p.stock === 0).length || 0
    } sp`;
    document.querySelector("#inventory-value").innerText = formatCurrency(
        products.reduce((sum, p) => sum + (p.stock || 0) * p.price, 0)
    );
}
loadProducts()
    .then((products) => renderProducts(products))
    .catch((error) =>
        console.log(`Lỗi trang Sản Phẩm, renderProducts: ${error}`)
    );

// Plugin Glow
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
// Plugin Crosshair (line dọc khi hover)
const crosshairPlugin = {
    id: "crosshair",
    beforeDatasetsDraw(chart) {
        if (chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y?.top ?? chart.chartArea.top;
            const bottomY = chart.scales.y?.bottom ?? chart.chartArea.bottom;

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
async function renderProductCharts(data) {
    // 🔹 Biểu đồ Top 5 sản phẩm bán chạy
    new Chart(document.getElementById("chart-top-products"), {
        type: "bar",
        data: {
            // labels: [
            //     "iPhone 15 Pro",
            //     "Galaxy Z Flip 6",
            //     "AirPods Pro 2",
            //     "MacBook Air M3",
            //     "iPad Air M2",
            // ],
            labels: data.topProducts.labels,
            datasets: [
                {
                    label: "Số lượng bán",
                    // data: [1200, 950, 780, 650, 500],
                    data: data.topProducts.data,
                    backgroundColor: "#4e73df",
                    borderRadius: 8,
                    maxBarThickness: 40,
                    // barPercentage: 0.7,
                    categoryPercentage: 0.7,
                },
            ],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => ` ${ctx.formattedValue} sản phẩm`,
                    },
                    bodyFont: { size: 14 },
                    padding: 8,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { color: "#eee", borderDash: [5, 5] },
                },
                y: {
                    ticks: { color: "#555", font: { size: 13 } },
                    grid: { display: false },
                },
            },
        },
    });

    // 🔹 Biểu đồ Cơ cấu tồn kho theo danh mục
    new Chart(document.getElementById("chart-inventory-structure"), {
        type: "doughnut",
        data: {
            // labels: ["Điện thoại", "Laptop", "Tablet", "Phụ kiện"],
            labels: data.inventoryStructure.labels,
            datasets: [
                {
                    // data: [1200, 800, 500, 950],
                    data: data.inventoryStructure.data,
                    backgroundColor: [
                        "#4e73df",
                        "#1cc88a",
                        "#36b9cc",
                        "#f6c23e",
                    ],
                    borderWidth: 3,
                    borderColor: "#fff",
                    hoverBorderColor: "#fff",
                    hoverOffset: 8,
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
                        pointStyle: "rectRounded",
                        padding: 20,
                        font: { size: 14 },
                    },
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => {
                            const total =
                                ctx.chart._metasets[ctx.datasetIndex].total;
                            const value = ctx.raw;
                            const percent = ((value / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${value} (${percent}%)`;
                        },
                    },
                    bodyFont: { size: 14 },
                    padding: 8,
                },
            },
        },
    });

    // 🔹 Biểu đồ Xu hướng doanh số theo tháng
    new Chart(document.getElementById("chart-sales-trend"), {
        type: "line",
        data: {
            // labels: [
            //     "01",
            //     "02",
            //     "03",
            //     "04",
            //     "05",
            //     "06",
            //     "07",
            //     "08",
            //     "09",
            //     "10",
            //     "11",
            //     "12",
            // ],
            labels: data.salesTrend.labels,
            datasets: [
                {
                    label: " Doanh số",
                    // data: [
                    //     120, 150, 180, 200, 250, 270, 320, 300, 280, 350, 400,
                    //     420,
                    // ],
                    data: data.salesTrend.data,
                    borderColor: "#1cc88a",
                    backgroundColor: "rgba(28,200,138,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: "#1cc88a",
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: "#FFF",
                    pointHoverRadius: 5,
                    pointHoverBorderColor: "#1cc88a",
                    pointHoverBorderWidth: 3,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        title: (ctx) => `Tháng ${ctx[0].label}`,
                        label: (ctx) =>
                            ` ${ctx.dataset.label}: ${ctx.formattedValue} triệu ₫`,
                        labelPointStyle: () => ({
                            pointStyle: "rectRounded",
                            rotation: 0,
                        }),
                    },
                    bodyFont: { size: 14 },
                    padding: 10,
                },
            },
            interaction: { intersect: false, mode: "index" },
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
        plugins: [glowPlugin, crosshairPlugin],
    });
}
// dataProduct()
//     .then((data) => renderProductCharts(data))
//     .catch((error) => console.log(error));

// Định dạng tiền tệ VND
function formatCurrency(value) {
    return value.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    });
}
// Trả về class màu badge dựa theo tồn kho
function getStockClass(stock) {
    if (stock === 0) return "bg-danger"; // hết hàng
    if (stock <= 10) return "bg-warning text-dark"; // sắp hết
    return "bg-success"; // còn hàng
}
// Trả về nội dung badge
function getStockStatus(stock) {
    if (stock === 0) return "Hết hàng";
    if (stock <= 10) return "Sắp hết";
    return "Còn hàng";
}
// async function tableProduct(tableProducts) {
//     const tbody = document.querySelector("#table-products");
//     tbody.innerHTML = tableProducts
//         .map(
//             (product) => `
//                 <tr>
//                     <td class="text-center pe-3">${product.id}</td>
//                     <td>${product.name}</td>
//                     <td class="text-center">${product.category}</td>
//                     <td class="text-center">${formatCurrency(
//                         product.price
//                     )}</td>
//                     <td class="text-center">${product.stock}</td>
//                     <td class="text-center">
//                         <span class="badge p-2 ${getStockClass(product.stock)}">
//                             ${getStockStatus(product.stock)}
//                         </span>
//                     </td>
//                     <td class="text-center">
//                         <button class="btn btn-sm btn-outline-primary my-1">Chi tiết</button>
//                     </td>
//                 </tr>
//             `
//         )
//         .join("");
// }
// dataProduct()
//     .then(({ tableProducts }) => tableProduct(tableProducts))
//     .catch((error) => console.log(error));

async function tableProduct(products, currentPage = 1, itemsPerPage = 10) {
    const tbody = document.querySelector("#table-products");
    const pagination = document.querySelector("#pagination");

    // Tính số trang
    const totalPages = Math.ceil(products.length / itemsPerPage);

    // Cắt danh sách sản phẩm cho trang hiện tại
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = products.slice(start, end);

    // Render bảng
    tbody.innerHTML = pageProducts
        .map(
            (product) => `
                <tr>
                    <td class="text-center pe-2">${product.masp}</td>
                    <td class="text-center">${product.name}</td>
                    <td class="text-center">${product.company}</td>
                    <td class="text-center">${formatCurrency(
                        product.price
                    )}</td>
                    <td class="text-center">${product.stock}</td>
                    <td class="text-center">
                        <span class="badge p-2 ${getStockClass(product.stock)}">
                            ${getStockStatus(product.stock)}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary my-1 btn-detail"
                            data-id="${product._id}">
                                Chi tiết
                        </button>
                    </td>
                </tr>
            `
        )
        .join("");

    // Gắn sự kiện cho nút "Chi tiết"
    tbody.querySelectorAll(".btn-detail").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            try {
                const res = await fetch(`${API_BASE_URL}/products/${id}`);
                if (!res.ok)
                    throw new Error("Không lấy được dữ liệu sản phẩm!");
                const product = await res.json();
                showProductDetail(product);
            } catch (err) {
                alert("Lỗi tải chi tiết sản phẩm: " + err.message);
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
            tableProduct(products, index + 1, itemsPerPage);
        });
    });
}
loadProducts()
    .then((products) => tableProduct(products))
    .catch((error) =>
        console.log(`Lỗi trang Sản Phẩm, tableProduct: ${error}`)
    );
function showProductDetail(product) {
    document.getElementById("detail-img").src = `../../${product.img}`;
    document.getElementById("detail-name").textContent = product.name;
    document.getElementById("detail-company").textContent = product.company;
    document.getElementById("detail-masp").textContent = product.masp;
    document.getElementById("detail-price").textContent = formatCurrency(
        product.price
    );
    document.getElementById("detail-stock").textContent = product.stock;
    document.getElementById("detail-promo").textContent = product.promo?.name
        ? `${product.promo.name} (${product.promo.value}%)`
        : "Không có";

    const d = product.detail || {};
    document.getElementById("detail-screen").textContent = d.screen || "-";
    document.getElementById("detail-os").textContent = d.os || "-";
    document.getElementById("detail-camara").textContent = d.camara || "-";
    document.getElementById("detail-camaraFront").textContent =
        d.camaraFront || "-";
    document.getElementById("detail-cpu").textContent = d.cpu || "-";
    document.getElementById("detail-ram").textContent = d.ram || "-";
    document.getElementById("detail-rom").textContent = d.rom || "-";
    document.getElementById("detail-microUSB").textContent = d.microUSB || "-";
    document.getElementById("detail-battery").textContent = d.battery || "-";

    // Hiển thị modal
    const modal = new bootstrap.Modal(
        document.getElementById("productDetailModal")
    );
    modal.show();

    const editBtn = document.getElementById("editProductBtn");
    if (editBtn) {
        editBtn.onclick = () => {
            // chuyển hướng sang trang chỉnh sửa, kèm id sản phẩm
            location.href = `chinh-sua.html?id=${product._id}`;
        };
    }
}

async function renderCategories(productCategories) {
    const newArrivals = document.querySelector("#new-arrivals");
    const promotions = document.querySelector("#promotions");
    const discontinued = document.querySelector("#discontinued");

    newArrivals.innerHTML = productCategories.newArrivals
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
    promotions.innerHTML = productCategories.promotions
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
    discontinued.innerHTML = productCategories.discontinued
        .map((item) => `<li class="list-group-item">${item}</li>`)
        .join("");
}
// dataProduct()
//     .then(({ productCategories }) => {
//         renderCategories(productCategories);
//     })
//     .catch((error) => console.log(error));
