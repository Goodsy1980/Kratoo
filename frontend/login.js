const loginForm = document.getElementById("login-form");

// 🌐 เช็กว่าถ้ารันในเครื่องให้ใช้ localhost แต่ถ้ารันบน Vercel ให้ยิงไปหา Render
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://schoolconnect-api.onrender.com";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชข้อมูลเองอัตโนมัติ

  // ดึงค่าจากหน้าฟอร์มที่กรอก
  const usernameInput = document.getElementById("input-username").value;
  const passwordInput = document.getElementById("input-password").value;

  console.log("พยายามเข้าสู่ระบบด้วยชื่อ:", usernameInput);

  try {
    // ยิงข้อมูลไปหา API หลังบ้านตามโดเมนที่สลับให้อัตโนมัติ
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: usernameInput,
        password: passwordInput,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message || "เข้าสู่ระบบสำเร็จ!");

      // เซฟ Token และชื่อผู้ใช้เก็บไว้ในเบราว์เซอร์
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);

      // วาร์ปไปหน้าหลักกระทู้
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Error:", error);
    alert(
      "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ กรุณาตรวจสอบการเชื่อมต่อ",
    );
  }
});
