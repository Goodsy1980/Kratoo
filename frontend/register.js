const registerForm = document.getElementById("register-form");

// 🌐 เช็กว่าถ้ารันในเครื่องให้ใช้ localhost แต่ถ้ารันบน Vercel ให้ยิงไปหา Render
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://schoolconnect-api.onrender.com";

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช

  // ดึงค่าที่ผู้ใช้กรอก
  const usernameInput = document.getElementById("reg-username").value;
  const passwordInput = document.getElementById("reg-password").value;

  console.log("กำลังส่งข้อมูลสมัครสมาชิก:", usernameInput);

  try {
    // ยิงข้อมูลไปหา API สมัครสมาชิกตาม URL ที่กำหนดให้อัตโนมัติ
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
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
      // ถ้าสมัครสำเร็จ ให้เด้งบอก แล้ววาร์ปกลับไปหน้า Login ทันที
      alert(data.message || "สมัครสมาชิกสำเร็จแล้วครับเพื่อน!");
      window.location.href = "index.html";
    } else {
      // ถ้าชื่อซ้ำ หรือเกิดปัญหา ให้แจ้งเตือนตามที่หลังบ้านส่งมา
      alert(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
  } catch (error) {
    console.error("Error:", error);
    alert(
      "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ กรุณาตรวจสอบการเชื่อมต่อ",
    );
  }
});
