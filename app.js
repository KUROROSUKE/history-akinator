const API_BASE = "https://history-akinator-api.sirorosuke.workers.dev";

// 現在のJev料金
const JEV_PRICE_PER_MILLION_INPUT_TOKENS = 0.042;

let gameToken = null;
let gameActive = false;


// -------------------------
// Elements
// -------------------------

const startButton =
  document.getElementById("startButton");

const categorySelect =
  document.getElementById("categorySelect");

const questionInput =
  document.getElementById("questionInput");

const questionButton =
  document.getElementById("questionButton");

const guessInput =
  document.getElementById("guessInput");

const guessButton =
  document.getElementById("guessButton");

const statusElement =
  document.getElementById("status");

const turnsElement =
  document.getElementById("turns");

const judgeResultElement =
  document.getElementById("judgeResult");

const guessResultElement =
  document.getElementById("guessResult");

const tokensElement =
  document.getElementById("tokens");

const costElement =
  document.getElementById("cost");


// -------------------------
// Utility
// -------------------------

function setGameActive(active) {
  gameActive = active;

  questionButton.disabled = !active;
  guessButton.disabled = !active;
  categorySelect.disabled = active;
}


function updateUsage(tokens) {
  const safeTokens =
    Number(tokens ?? 0);

  tokensElement.textContent =
    safeTokens.toLocaleString();

  const cost =
    (
      safeTokens /
      1_000_000
    ) *
    JEV_PRICE_PER_MILLION_INPUT_TOKENS;

  costElement.textContent =
    `$${cost.toFixed(6)}`;
}


function endGame(message) {
  gameToken = null;

  setGameActive(false);

  statusElement.textContent = message;
}


function setBusy(button, busy) {
  button.disabled =
    busy || !gameActive;
}


// -------------------------
// 新規ゲーム
// -------------------------

async function startGame() {
  startButton.disabled = true;

  statusElement.textContent =
    "ゲームを開始しています...";

  judgeResultElement.textContent = "";
  guessResultElement.textContent = "";

  try {
    const response = await fetch(
      `${API_BASE}/new`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          category: categorySelect.value,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "ゲーム開始に失敗しました。"
      );
    }

    gameToken = data.gameToken;

    turnsElement.textContent =
      data.maxTurns;

    questionInput.value = "";
    guessInput.value = "";

    updateUsage(0);

    statusElement.textContent =
      `${data.category}モード：ゲーム開始`;

    setGameActive(true);

    questionInput.focus();

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      `エラー: ${error.message}`;

    setGameActive(false);
  }

  startButton.disabled = false;
}


// -------------------------
// 質問
// -------------------------

async function askQuestion() {
  if (!gameActive) {
    return;
  }

  const question =
    questionInput.value.trim();

  if (!question) {
    return;
  }

  if (question.length > 100) {
    judgeResultElement.textContent =
      "質問は100文字以内にしてください。";

    return;
  }

  setBusy(questionButton, true);

  judgeResultElement.textContent =
    "判定中...";

  try {
    const response = await fetch(
      `${API_BASE}/judge`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          gameToken,
          question,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "判定に失敗しました。"
      );
    }

    gameToken = data.gameToken;

    turnsElement.textContent =
      data.turnsLeft;

    updateUsage(
      data.usage?.totalInputTokens
    );

    // Jevの確率も確認したい場合は
    // Consoleから見られる
    console.log(
      "Jev probability:",
      data.probability
    );

    if (data.answer === "YES") {
      judgeResultElement.textContent =
        "YES";
    }

    else if (data.answer === "NO") {
      judgeResultElement.textContent =
        "NO";
    }

    else {
      judgeResultElement.textContent =
        "UNCERTAIN";
    }

    questionInput.value = "";

    if (data.turnsLeft <= 0) {
      endGame(
        "20ターン使い切りました。"
      );

      return;
    }

    questionInput.focus();

  } catch (error) {
    console.error(error);

    judgeResultElement.textContent =
      `エラー: ${error.message}`;
  }

  if (gameActive) {
    setBusy(questionButton, false);
  }
}


// -------------------------
// 回答
// -------------------------

async function makeGuess() {
  if (!gameActive) {
    return;
  }

  const guess =
    guessInput.value.trim();

  if (!guess) {
    return;
  }

  if (guess.length > 100) {
    guessResultElement.textContent =
      "回答は100文字以内にしてください。";

    return;
  }

  setBusy(guessButton, true);

  guessResultElement.textContent =
    "判定中...";

  try {
    const response = await fetch(
      `${API_BASE}/guess`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          gameToken,
          guess,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
        "回答判定に失敗しました。"
      );
    }

    turnsElement.textContent =
      data.turnsLeft;

    updateUsage(
      data.totalInputTokens
    );

    if (data.correct) {
      guessResultElement.textContent =
        `正解！ 答えは「${data.answer}」でした。`;

      endGame(
        `${data.turnsUsed}ターンで正解！`
      );

      return;
    }

    gameToken = data.gameToken;

    guessResultElement.textContent =
      "不正解";

    guessInput.value = "";

    if (data.turnsLeft <= 0) {
      endGame(
        "20ターン使い切りました。"
      );

      return;
    }

    guessInput.focus();

  } catch (error) {
    console.error(error);

    guessResultElement.textContent =
      `エラー: ${error.message}`;
  }

  if (gameActive) {
    setBusy(guessButton, false);
  }
}


// -------------------------
// Events
// -------------------------

startButton.addEventListener(
  "click",
  startGame
);

questionButton.addEventListener(
  "click",
  askQuestion
);

guessButton.addEventListener(
  "click",
  makeGuess
);

questionInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      !event.repeat
    ) {
      askQuestion();
    }
  }
);

guessInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" &&
      !event.repeat
    ) {
      makeGuess();
    }
  }
);


// 初期状態
setGameActive(false);
updateUsage(0);