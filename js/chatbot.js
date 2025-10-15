const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 버튼 클릭 이벤트
sendBtn.addEventListener("click", () => {
  const emotion = msgInput.value.trim();
  if (!emotion) return;

  appendMsg(emotion, "user");
  msgInput.value = "";

  sendEmotionToServer(emotion); // ✅ Python 서버로 전송
});

// 엔터키 전송
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

// // 메시지 UI
// function addMessage(text, sender) {
//   const msg = document.createElement("div");
//   msg.classList.add(sender === "bot" ? "bot-message" : "user-message");
//   msg.innerHTML = text;
//   chatBox.appendChild(msg);
//   chatBox.scrollTop = chatBox.scrollHeight;
// }

// 봇 아이콘 표시, 디자인 확장하려고 adddptj append로 바꿈.
function appendMsg(text, who) {

  const row = document.createElement("div");
  row.className = "row";

  const bubble = document.createElement("div");
  bubble.className = `msg ${who}`;
  bubble.innerText = text;

  if (who === "bot") {
    const t = document.createElement("div");
    t.className = "thumb";
    t.innerHTML = `<img src="../assets/img/chatbot-logo.png" alt="bot">`;
    row.appendChild(t);
    row.appendChild(bubble);
  } else {
    row.appendChild(bubble);
  }

  chatBox.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}



// ✅ Python 서버에 감정 데이터 전송
async function sendEmotionToServer(emotion) {
  appendMsg("감정을 분석 중이에요 🎬", "bot");

  try {
    const response = await fetch("http://192.168.100.69:5000/emotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ emotion }),
    });

    const data = await response.json();
    if (data.reply) {
      appendMsg(data.reply, "bot");
    } else {
      appendMsg("서버에서 응답이 없어요 😢", "bot");
    }
  } catch (error) {
    console.error(error);
    appendMsg("서버 연결에 문제가 생겼어요 😢", "bot");
  }
}

// 초기 인사(페이지 로드 시 1회)
appendMsg("안녕하세요 😊\n지금 기분이 어떤가요? (예: 행복해, 우울해, 답답해 등)", "bot");
