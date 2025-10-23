import { API_BASE_URL } from "./config.js";
async function logOut() {
    try {
        const res = await fetch(`${API_BASE_URL}/users/logout`, {
            method: "POST",
            credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
            alert("Đăng xuất thành công!");
            var currentUser = null;
            // Redirect về trang client
            location.href = "/index.html";
        } else {
            alert("Đăng xuất thất bại!");
        }
    } catch (err) {
        console.error("Lỗi khi đăng xuất:", err);
        alert("Không thể kết nối server");
    }
}

// Sử dụng event delegation để bắt mọi click sau khi DOM đã render
document.addEventListener("click", async (e) => {
    const target = e.target.closest("#logoutBtn"); // nếu nút nằm trong dropdown
    if (target) {
        e.preventDefault();
        console.log("Clicked logout");
        await logOut();
    }
});
