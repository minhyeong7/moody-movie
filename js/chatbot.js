const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 버튼 클릭 이벤트
sendBtn.addEventListener("click", () => {
  const emotion = userInput.value.trim();
  if (!emotion) return;

  addMessage(emotion, "user");
  userInput.value = "";

  sendEmotionToServer(emotion); // ✅ Python 서버로 전송
});

// 엔터키 전송
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

// 메시지 UI
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add(sender === "bot" ? "bot-message" : "user-message");
  msg.innerHTML = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ✅ Python 서버에 감정 데이터 전송
async function sendEmotionToServer(emotion) {
  addMessage("감정을 분석 중이에요 🎬", "bot");

  try {
    const response = await fetch("http://127.0.0.1:5000/emotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emotion }),
    });

    const data = await response.json();
    if (data.reply) {
      addMessage(data.reply, "bot");
    } else {
      addMessage("서버에서 응답이 없어요 😢", "bot");
    }
  } catch (error) {
    console.error(error);
    addMessage("서버 연결에 문제가 생겼어요 😢", "bot");
  }
}
