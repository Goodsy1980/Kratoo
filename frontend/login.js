const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // ป้องกันไม่ให้หน้าเว็บรีเฟรชข้อมูลเองอัตโนมัติ

  // ดึงค่าจากหน้าฟอร์มที่กรอก
  const usernameInput = document.getElementById("input-username").value;
  const passwordInput = document.getElementById("input-password").value;

  console.log("พยายามเข้าสู่ระบบด้วยชื่อ:", usernameInput);

  try {
    // ยิงข้อมูลไปหา API หลังบ้านที่ Port 5000
    const response = await fetch("http://localhost:5000/api/auth/login", {
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
      
      // เซฟ Token และชื่อผู้ใช้เก็บไว้ในบราวเซอร์
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      
      // วาร์ปไปหน้าหลักกระทู้
      window.location.href = "dashboard.html";
    } else {
      alert(data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("เชื่อมต่อหลังบ้านไม่ได้! อย่าลืมเปิดรัน Node server.js ที่ Port 5000 นะครับ");
  }
});