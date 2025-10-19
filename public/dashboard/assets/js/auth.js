import { API_BASE_URL } from "./config.js";
import { loginModalHTML } from "../components/login-modal.js";

const API_URL = `${API_BASE_URL}/users`; // API thật
const app = document.querySelector("main");

// Kiểm tra quyền đăng nhập (admin)
function isLoggedIn() {
    return sessionStorage.getItem("userRole") === "admin";
}

// Hiển thị modal login
async function showLoginModal() {
    if (!document.querySelector("#loginModal")) {
        document.body.insertAdjacentHTML("beforeend", loginModalHTML);
        bindLoginEvents();
    }

    const modalEl = document.getElementById("loginModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

// Gắn sự kiện login
function bindLoginEvents() {
    const form = document.querySelector("#login-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = form.username.value.trim();
        const password = form.password.value.trim();

        if (!username || !password) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // để backend set cookie HttpOnly
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Đăng nhập thất bại");
            }

            const result = await res.json();
            if (!result.success) {
                alert(result.error || "Sai tên đăng nhập hoặc mật khẩu!");
                return;
            }

            // ✅ Lưu thông tin cơ bản
            sessionStorage.setItem("userRole", result.user.role);
            sessionStorage.setItem("username", result.user.username);

            // Ẩn modal
            const modalEl = document.getElementById("loginModal");
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            app.style.visibility = "visible";
            app.style.overflow = "auto";
            form.reset();

            if (result.user.role === "admin") {
                // Thông báo login thành công
                document.dispatchEvent(new CustomEvent("admin-logged-in"));
                alert(`Xin chào Admin ${result.user.username}!`);
            } else {
                alert("Tài khoản của bạn không có quyền truy cập!");
                logout(); // tự động logout nếu không phải admin
            }
        } catch (err) {
            console.error("Lỗi đăng nhập:", err);
            alert("Đăng nhập thất bại\nSai tên đăng nhập hoặc mật khẩu!");
            form.reset();
        }
    });
}

// Tự khởi động kiểm tra login
(async function initAuth() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", checkAuth);
    } else {
        checkAuth();
    }
})();

// Kiểm tra quyền mỗi lần vào dashboard
async function checkAuth() {
    if (!isLoggedIn()) {
        app.style.visibility = "hidden";
        app.style.overflow = "hidden";
        await showLoginModal();
    } else {
        document.dispatchEvent(new CustomEvent("admin-logged-in"));
    }
}

// Xử lý logout
async function logout() {
    try {
        await fetch(`${API_URL}/logout`, {
            method: "POST",
            credentials: "include",
        });
    } catch (err) {
        console.warn("Lỗi khi logout:", err);
    }

    // Xóa session
    sessionStorage.clear();

    // Ẩn nội dung
    app.style.visibility = "hidden";
    app.style.overflow = "hidden";

    // Gọi lại modal login
    await showLoginModal();
}

// Gắn sự kiện logout khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    }
});
