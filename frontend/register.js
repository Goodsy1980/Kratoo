const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // ป้องกันหน้าเว็บรีเฟรช

  // ดึงค่าที่ผู้ใช้กรอก
  const usernameInput = document.getElementById("reg-username").value;
  const passwordInput = document.getElementById("reg-password").value;

  console.log("กำลังส่งข้อมูลสมัครสมาชิก:", usernameInput);

  try {
    // ยิงข้อมูลไปหา API สมัครสมาชิกของหลังบ้าน (Port 5000)
    const response = await fetch("http://localhost:5000/api/auth/register", {
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
    alert("เชื่อมต่อหลังบ้านไม่ได้! ตรวจดูว่ายังรัน Node server.js อยู่ไหมนะครับ");
  }
});