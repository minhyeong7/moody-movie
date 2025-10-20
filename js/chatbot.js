// 요소 선택
const chatBox = document.getElementById("chat");
const msgInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// 메시지 UI 함수
function appendMsg(text, who) {
  const row = document.createElement("div");
  row.className = "row";

  const bubble = document.createElement("div");
  bubble.className = `msg ${who}`;
  bubble.innerText = text;

  if (who === "bot") {
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.innerHTML = `<img src="../assets/img/chatbot-logo.png" alt="bot">`;
    row.appendChild(thumb);
    row.appendChild(bubble);
  } else {
    row.appendChild(bubble);
  }

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 서버에 감정 데이터 전송
async function sendEmotionToServer(emotion) {
  appendMsg("감정을 분석 중이에요 🎬", "bot");

  try {
    const response = await fetch("http://192.168.100.69:5000/emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion }),
    });

    const data = await response.json();

    // ✅ 응답 처리 부분 수정
    if (data.emotion && data.movies) {
      // 영화 목록을 한 줄 문자열로 합치기
      const movieList = data.movies.map(m => `🎬 ${m.title}`).join("\n");
      const fullMsg = `감정 분석 결과: ${data.emotion}\n\n추천 영화 목록 🎥\n${movieList}`;
      appendMsg(fullMsg, "bot");
    } else if (data.reply) {
      appendMsg(data.reply, "bot");
    } else {
      appendMsg("서버에서 응답이 없어요 😢", "bot");
    }

  } catch (error) {
    console.error(error);
    appendMsg("서버 연결에 문제가 생겼어요 😢", "bot");
  }
}


// 버튼 클릭 이벤트
sendBtn.addEventListener("click", () => {
  const emotion = msgInput.value.trim();
  if (!emotion) return;

  appendMsg(emotion, "user");
  msgInput.value = "";
  sendEmotionToServer(emotion);
});

// 엔터키 입력 이벤트
msgInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendBtn.click();
});

// 초기 인사
appendMsg(
  "안녕하세요 😊\n지금 기분이 어떤가요? (예: 행복해, 우울해, 답답해 등)",
  "bot"
);
