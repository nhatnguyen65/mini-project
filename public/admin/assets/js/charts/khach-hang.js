import { API_BASE_URL } from "../config.js";

const API_USER = `${API_BASE_URL}/users`;

async function loadUsers(id = "") {
    try {
        const res = await fetch(`${API_USER}/${id}`, {
            credentials: "include",
        });
        return await res.json();
    } catch (error) {
        console.error(`Lỗi trang Khách Hàng, loadUsers: ${error}`);
    }
}

function renderTable(users) {
    const tbody = document.querySelector("#tbody-users");
    tbody.innerHTML = users
        .map(
            (u) => `
            <tr>
                <td class="ps-3">${u.ho} ${u.ten}</td>
                <td class="">${u.email}</td>
                <td class="text-center">${u.username}</td>
                <td class="text-center">
                    <span class="badge bg-${
                        u.role === "admin" ? "danger" : "secondary"
                    }">
                        ${u.role}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary my-1 btn-detail" data-id="${
                        u._id
                    }">Chi tiết</button>
                </td>
            </tr>`
        )
        .join("");
}
function fetchUsers() {
    loadUsers()
        .then((users) => renderTable(users))
        .catch((error) =>
            console.log(`Lỗi trang Khách Hàng, renderTable: ${error}`)
        );
}
fetchUsers();

// Xem chi tiết người dùng
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-detail")) {
        const id = e.target.dataset.id;
        loadUsers(id)
            .then(({ user }) => showUserModal(user))
            .catch((error) =>
                console.log(`Lỗi trang Khách Hàng, showUserModal: ${error}`)
            );
    }
});
async function showUserModal(user) {
    // Điền dữ liệu vào form
    document.getElementById("user-ho").value = user.ho || "";
    document.getElementById("user-ten").value = user.ten || "";
    document.getElementById("user-email").value = user.email || "";
    document.getElementById("user-username").value = user.username || "";
    document.getElementById("user-role").value = user.role || "user";
    document.getElementById("user-status").value = user.off ? "true" : "false";

    const ul = document.getElementById("user-addresses");
    ul.innerHTML = user.diaChi?.length
        ? user.diaChi
              .map((addr) => `<li class="list-group-item">${addr}</li>`)
              .join("")
        : `<li class="list-group-item text-muted">Chưa có địa chỉ</li>`;

    // Hiển thị modal
    const modal = new bootstrap.Modal(
        document.getElementById("userDetailModal")
    );
    modal.show();

    // Gán lại event (tránh lặp)
    document.getElementById("btn-save-user").onclick = async (e) => {
        e.preventDefault();
        const updatedData = {
            ho: document.getElementById("user-ho").value.trim(),
            ten: document.getElementById("user-ten").value.trim(),
            email: document.getElementById("user-email").value.trim(),
            role: document.getElementById("user-role").value,
            off: document.getElementById("user-status").value === "true",
        };

        const res = await fetch(`${API_USER}/${user._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updatedData),
        });
        const data = await res.json();
        if (data.success) {
            alert("Cập nhật người dùng thành công!");
            modal.hide();
            fetchUsers(); // gọi lại render bảng
        } else alert(data.error);
    };

    document.getElementById("btn-delete-user").onclick = async (e) => {
        e.preventDefault();
        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;

        const res = await fetch(`${API_USER}/${user._id}`, {
            method: "DELETE",
            credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
            alert("Đã xóa người dùng!");
            modal.hide();
            fetchUsers();
        } else alert(data.error);
    };
}

// Gán sự kiện mở modal (Thêm người dùng)
document.getElementById("btn-create").addEventListener("click", () => {
    const modal = new bootstrap.Modal(
        document.getElementById("createUserModal")
    );
    document.getElementById("create-user-form").reset(); // reset form mỗi khi mở
    modal.show();
});

// Gửi request tạo user
document
    .getElementById("create-user-form")
    .addEventListener("submit", async (e) => {
        e.preventDefault();
        const userData = {
            ho: document.getElementById("create-ho").value.trim(),
            ten: document.getElementById("create-ten").value.trim(),
            email: document.getElementById("create-email").value.trim(),
            username: document.getElementById("create-username").value.trim(),
            password: document.getElementById("create-password").value.trim(),
            role: document.getElementById("create-role").value,
        };

        try {
            const res = await fetch(API_USER, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // nếu có xác thực cookie
                body: JSON.stringify(userData),
            });

            const data = await res.json();

            if (!res.ok)
                throw new Error(data.error || "Tạo người dùng thất bại!");

            // ✅ Thành công
            alert("Tạo người dùng thành công!");
            bootstrap.Modal.getInstance(
                document.getElementById("createUserModal")
            ).hide();
            fetchUsers(); // gọi lại render bảng
        } catch (err) {
            alert(err.message);
        }
    });

/*
async function dataCustomer() {
    const res = await fetch("http://localhost:7000/customers");
    return await res.json();
}

async function renderCustomers(customerSummary) {
    document.querySelector("#total-customers").innerText =
        customerSummary.totalCustomers.toLocaleString();
    document.querySelector("#new-customers").innerText =
        customerSummary.newCustomers.toLocaleString();
    document.querySelector("#monthly-active").innerText =
        customerSummary.monthlyActive.toLocaleString();
    document.querySelector(
        "#churn-rate"
    ).innerText = `${customerSummary.churnRate}%`;
    document.querySelector("#median-clv").innerText = `₫ ${(
        customerSummary.medianCLV / 1_000_000
    ).toFixed(1)}M`;
}
dataCustomer()
    .then(({ customerSummary }) => renderCustomers(customerSummary))
    .catch((error) =>
        console.log(`Lỗi trang Khách Hàng, renderCustomers: ${error}`)
    );

const glowPlugin = {
    id: "glow",
    beforeDatasetsDraw(chart) {
        const ctx = chart.ctx;
        chart.data.datasets.forEach((dataset, i) => {
            const meta = chart.getDatasetMeta(i);
            if (!meta.hidden) {
                ctx.save();
                ctx.shadowColor = dataset.borderColor || "rgba(0,0,0,0.15)";
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = dataset.borderWidth || 2;
                ctx.strokeStyle = dataset.borderColor || "#888";
                if (meta.dataset && meta.dataset.draw) {
                    ctx.beginPath();
                    meta.dataset.draw(ctx);
                    ctx.stroke();
                }
                ctx.restore();
            }
        });
    },
};
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
async function renderCustomerCharts(data) {
    // Phân loại khách hàng (Pie)
    new Chart(document.getElementById("chart-cust-segmentation"), {
        type: "pie",
        data: {
            // labels: ["New", "Active", "Churn", "VIP"],
            labels: data.customerSegmentation.labels,
            datasets: [
                {
                    // data: [22, 58, 12, 8],
                    data: data.customerSegmentation.data,
                    backgroundColor: [
                        "#6c757d",
                        "#28a745",
                        "#dc3545",
                        "#17a2b8",
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
                            return ` ${label}: ${value}% (${percentage}%) `;
                        },
                    },
                    bodyFont: { size: 14 },
                    padding: 10,
                },
            },
        },
    });

    const { series } = data.behaviorTrend;
    // Xu hướng hành vi (Line - nhiều series)
    new Chart(document.getElementById("chart-behavior-trend"), {
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
            labels: data.behaviorTrend.labels,
            datasets: [
                {
                    label: "Lượt truy cập",
                    // data: [
                    //     120, 150, 180, 210, 260, 300, 330, 320, 300, 360, 390,
                    //     420,
                    // ],
                    data: series.visit,
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0,123,255,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                },
                {
                    label: "Thêm giỏ",
                    // data: [
                    //     40, 55, 60, 70, 90, 100, 115, 110, 100, 130, 145, 160,
                    // ],
                    data: series.addToCart,
                    borderColor: "#ffc107",
                    backgroundColor: "rgba(255,193,7,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                },
                {
                    label: "Mua hàng",
                    // data: [20, 28, 30, 38, 50, 58, 65, 62, 60, 72, 80, 90],
                    data: series.purchase,
                    borderColor: "#28a745",
                    backgroundColor: "rgba(40,167,69,0.15)",
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "index" },
            plugins: {
                legend: { display: true },
                tooltip: {
                    usePointStyle: true,
                    callbacks: {
                        title: (ctx) => ` ${ctx[0].label}`,
                        labelPointStyle: () => ({
                            pointStyle: "rectRounded",
                            rotation: 0,
                        }),
                    },
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

    // Tần suất mua hàng (Bar)
    new Chart(document.getElementById("chart-purchase-frequency"), {
        type: "bar",
        data: {
            // labels: ["1-2 đơn", "3-5 đơn", "6-10 đơn", ">10 đơn"],
            labels: data.purchaseFrequency.labels,
            datasets: [
                {
                    label: "Số khách",
                    // data: [18000, 12000, 6000, 2000],
                    data: data.purchaseFrequency.data,
                    backgroundColor: ["#17a2b8"],
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 40,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
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
    });

    // Phân vị CLV (Doughnut)
    new Chart(document.getElementById("chart-clv-buckets"), {
        type: "doughnut",
        data: {
            // labels: ["P0-25", "P25-50", "P50-75", "P75-90", "P90-100"],
            labels: data.clvBuckets.labels,
            datasets: [
                {
                    // data: [15, 25, 30, 20, 10],
                    data: data.clvBuckets.data,
                    backgroundColor: [
                        "#4e73df",
                        "#1cc88a",
                        "#36b9cc",
                        "#f6c23e",
                        "#e74a3b",
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
            cutout: "55%",
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
                            return ` ${ctx.label}: ${value}% (${percent}%)`;
                        },
                    },
                    bodyFont: { size: 14 },
                    padding: 8,
                },
            },
        },
    });
}
dataCustomer()
    .then((data) => renderCustomerCharts(data))
    .catch((error) =>
        console.log(`Lỗi trang Khách Hàng, renderCustomerCharts: ${error}`)
    );

function formatCurrency(value) {
    return `₫ ${value.toLocaleString("vi-VN")}`;
}
function getStatusClass(status) {
    switch (status) {
        case "Active":
            return "bg-success";
        case "New":
            return "bg-secondary";
        case "Churn":
            return "bg-danger";
        case "VIP":
            return "bg-info";
        default:
            return "bg-light text-dark";
    }
}
async function tableCustomer(tableCustomers) {
    const tbody = document.querySelector("#table-customers");
    tbody.innerHTML = tableCustomers
        .map(
            (customer) => `
            <tr>
                <td class="ps-4">${customer.name}</td>
                <td class="">${customer.email}</td>
                <td class="text-center">${customer.joinDate}</td>
                <td class="text-center">${formatCurrency(
                    customer.totalSpent
                )}</td>
                <td class="text-center">
                    <span class="badge p-2 ${getStatusClass(customer.status)}">
                        ${customer.status}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary my-1">Xem</button>
                </td>
            </tr>
        `
        )
        .join("");
}
dataCustomer()
    .then(({ tableCustomers }) => tableCustomer(tableCustomers))
    .catch((error) =>
        console.log(`Lỗi trang Khách Hàng, tableCustomers: ${error}`)
    );
*/
