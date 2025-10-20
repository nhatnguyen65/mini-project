import { API_BASE_URL } from "../config.js";

const params = new URLSearchParams(location.search);
const id = params.get("id");

const API_BASE = `${API_BASE_URL}/products`;

async function loadProduct() {
    try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error("Không thể tải dữ liệu sản phẩm!");
        const product = await res.json();
        renderProduct(product);
    } catch (err) {
        alert(err.message);
        history.back();
    }
}

document.querySelector("#out-page").addEventListener("click", (e) => {
    history.back();
});

function renderProduct(p) {
    document.getElementById("masp").value = p.masp;
    document.getElementById("productName").value = p.name;
    document.getElementById("company").value = p.company;
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productStock").value = p.stock;
    document.getElementById("promoName").value = p.promo?.name || "";
    document.getElementById("promoValue").value = p.promo?.value || 0;

    const d = p.detail || {};
    document.getElementById("screen").value = d.screen || "";
    document.getElementById("os").value = d.os || "";
    document.getElementById("camara").value = d.camara || "";
    document.getElementById("camaraFront").value = d.camaraFront || "";
    document.getElementById("cpu").value = d.cpu || "";
    document.getElementById("ram").value = d.ram || "";
    document.getElementById("rom").value = d.rom || "";
    document.getElementById("microUSB").value = d.microUSB || "";
    document.getElementById("battery").value = d.battery || "";

    document.getElementById("productImage").value = p.img;
    document.getElementById("previewImage").src = p.img;
}

// Preview hình ảnh khi nhập URL
document.getElementById("productImage").addEventListener("input", (e) => {
    document.getElementById("previewImage").src = e.target.value;
});

// Submit form để lưu thay đổi
document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const product = {
        masp: document.getElementById("masp").value,
        name: document.getElementById("productName").value,
        company: document.getElementById("company").value,
        price: +document.getElementById("productPrice").value,
        stock: +document.getElementById("productStock").value,
        promo: {
            name: document.getElementById("promoName").value,
            value: +document.getElementById("promoValue").value,
        },
        img: document.getElementById("productImage").value,
        detail: {
            screen: document.getElementById("screen").value,
            os: document.getElementById("os").value,
            camara: document.getElementById("camara").value,
            camaraFront: document.getElementById("camaraFront").value,
            cpu: document.getElementById("cpu").value,
            ram: document.getElementById("ram").value,
            rom: document.getElementById("rom").value,
            microUSB: document.getElementById("microUSB").value,
            battery: document.getElementById("battery").value,
        },
    };

    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
        });

        if (!res.ok) throw new Error("Cập nhật sản phẩm thất bại!");

        sessionStorage.setItem("shouldReload", "true");
        sessionStorage.setItem("ProductID", id);
        alert("Đã cập nhật thành công!");
        history.back();
    } catch (err) {
        alert(err.message);
    }
});

// Nút hủy
document.getElementById("cancelBtn").addEventListener("click", () => {
    history.back();
});

// Tải dữ liệu khi trang mở
loadProduct();
