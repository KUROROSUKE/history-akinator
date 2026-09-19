const API_BASE =
  "https://history-akinator-api.sirorosuke.workers.dev";

const MAX_TURNS = 20;

const JEV_PRICE_PER_MILLION_INPUT_TOKENS =
  0.042;


let gameToken = null;
let gameActive = false;

let selectedCategory = null;

let totalTokens = 0;
let turnsLeft = MAX_TURNS;


// ============================================================
// ELEMENTS
// ============================================================

const startScreen =
  document.getElementById("startScreen");

const gameScreen =
  document.getElementById("gameScreen");

const resultScreen =
  document.getElementById("resultScreen");


const categoryGrid =
  document.getElementById("categoryGrid");

const startButton =
  document.getElementById("startButton");


const currentCategory =
  document.getElementById("currentCategory");

const turnsElement =
  document.getElementById("turns");


const chatMessages =
  document.getElementById("chatMessages");


const questionInput =
  document.getElementById("questionInput");

const questionButton =
  document.getElementById("questionButton");

const questionLength =
  document.getElementById("questionLength");


const newGameButton =
  document.getElementById("newGameButton");


const openGuessButton =
  document.getElementById("openGuessButton");

const closeGuessButton =
  document.getElementById("closeGuessButton");

const guessPanel =
  document.getElementById("guessPanel");

const guessInput =
  document.getElementById("guessInput");

const guessButton =
  document.getElementById("guessButton");


const tokensElement =
  document.getElementById("tokens");

const costElement =
  document.getElementById("cost");


const toast =
  document.getElementById("toast");


const resultEmoji =
  document.getElementById("resultEmoji");

const resultLabel =
  document.getElementById("resultLabel");

const resultTitle =
  document.getElementById("resultTitle");

const resultDescription =
  document.getElementById("resultDescription");

const resultTurns =
  document.getElementById("resultTurns");

const resultTokens =
  document.getElementById("resultTokens");

const resultCost =
  document.getElementById("resultCost");

const resultNewGameButton =
  document.getElementById(
    "resultNewGameButton"
  );


// ============================================================
// UTIL
// ============================================================

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function calculateCost(tokens) {
  return (
    tokens /
    1_000_000 *
    JEV_PRICE_PER_MILLION_INPUT_TOKENS
  );
}


function formatCost(tokens) {
  return `$${calculateCost(tokens).toFixed(6)}`;
}


function updateUsage(tokens) {
  totalTokens =
    Number(tokens ?? 0);

  tokensElement.textContent =
    totalTokens.toLocaleString();

  costElement.textContent =
    formatCost(totalTokens);
}


function updateTurns(value) {
  turnsLeft = value;

  turnsElement.textContent =
    value;
}


function showToast(message) {
  toast.textContent =
    message;

  toast.classList.remove(
    "hidden"
  );

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(() => {
      toast.classList.add(
        "hidden"
      );
    }, 3000);
}


function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop =
      chatMessages.scrollHeight;
  });
}


function setGameActive(active) {
  gameActive = active;

  questionButton.disabled =
    !active;

  guessButton.disabled =
    !active;
}


// ============================================================
// CHAT MESSAGES
// ============================================================

function addUserMessage(text) {

  const element =
    document.createElement("div");

  element.className =
    "message user";

  element.innerHTML = `
    <div class="bubble">
      ${escapeHtml(text)}
    </div>
  `;

  chatMessages.appendChild(
    element
  );

  scrollToBottom();
}


function addSystemMessage(text) {

  const element =
    document.createElement("div");

  element.className =
    "message";

  element.innerHTML = `
    <div class="avatar">J</div>

    <div class="bubble">
      ${escapeHtml(text)}
    </div>
  `;

  chatMessages.appendChild(
    element
  );

  scrollToBottom();
}


function addThinkingMessage() {

  const element =
    document.createElement("div");

  element.className =
    "message";

  element.id =
    "thinkingMessage";

  element.innerHTML = `
    <div class="avatar">J</div>

    <div class="bubble">
      判定中...
    </div>
  `;

  chatMessages.appendChild(
    element
  );

  scrollToBottom();
}


function removeThinkingMessage() {

  document
    .getElementById(
      "thinkingMessage"
    )
    ?.remove();
}


function addAnswerMessage(
  answer,
  probability
) {

  const yesProbability =
    Math.round(
      Number(probability) * 100
    );

  let answerClass =
    "uncertain";

  if (answer === "YES") {
    answerClass = "yes";
  }

  if (answer === "NO") {
    answerClass = "no";
  }


  const element =
    document.createElement("div");

  element.className =
    "message";


  element.innerHTML = `
    <div class="avatar">J</div>

    <div class="answer-card">

      <div class="answer-main">

        <span
          class="
            answer-word
            ${answerClass}
          "
        >
          ${escapeHtml(answer)}
        </span>

        <span class="probability">
          Yes probability
          <strong>
            ${yesProbability}%
          </strong>
        </span>

      </div>

      <div class="probability-bar">
        <div
          class="probability-fill"
          style="
            width:
            ${yesProbability}%
          "
        ></div>
      </div>

    </div>
  `;


  chatMessages.appendChild(
    element
  );

  scrollToBottom();
}


// ============================================================
// CATEGORY
// ============================================================

function categoryDescription(category) {

  const descriptions = {
    "人物":
      "歴史上の人物",

    "出来事":
      "戦争・革命・社会変動",

    "条約":
      "国際的な条約",

    "制度・思想":
      "政治・経済・思想",
  };


  return (
    descriptions[category] ??
    "歴史総合"
  );
}


function renderCategories(
  categories
) {

  categoryGrid.innerHTML = "";


  for (
    const category
    of categories
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.className =
      "category-card";


    button.innerHTML = `
      <strong>
        ${escapeHtml(category)}
      </strong>

      <span>
        ${escapeHtml(
          categoryDescription(
            category
          )
        )}
      </span>
    `;


    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          category;


        document
          .querySelectorAll(
            ".category-card"
          )
          .forEach(card => {
            card.classList.remove(
              "selected"
            );
          });


        button.classList.add(
          "selected"
        );

        startButton.disabled =
          false;
      }
    );


    categoryGrid.appendChild(
      button
    );
  }
}


async function loadCategories() {

  try {

    const response =
      await fetch(
        `${API_BASE}/`
      );

    const data =
      await response.json();


    if (
      !response.ok ||
      !Array.isArray(
        data.categories
      )
    ) {

      throw new Error(
        "カテゴリ取得失敗"
      );
    }


    renderCategories(
      data.categories
    );

  } catch (error) {

    console.error(error);

    renderCategories([
      "人物",
      "出来事",
      "条約",
      "制度・思想",
    ]);
  }
}


// ============================================================
// START
// ============================================================

async function startGame() {

  if (!selectedCategory) {
    return;
  }


  startButton.disabled = true;

  startButton.textContent =
    "準備中...";


  try {

    const response =
      await fetch(
        `${API_BASE}/new`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              category:
                selectedCategory,
            }),
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ??
        "ゲーム開始失敗"
      );
    }


    gameToken =
      data.gameToken;


    updateTurns(
      data.maxTurns ??
      MAX_TURNS
    );


    updateUsage(0);


    currentCategory.textContent =
      data.category;


    chatMessages.innerHTML = "";


    startScreen.classList.add(
      "hidden"
    );

    resultScreen.classList.add(
      "hidden"
    );

    gameScreen.classList.remove(
      "hidden"
    );


    setGameActive(true);


    addSystemMessage(
      `${data.category}を1つ選びました。YES / NOで答えられる質問をしてください。`
    );


    questionInput.focus();

  } catch (error) {

    console.error(error);

    showToast(
      error.message
    );

  } finally {

    startButton.textContent =
      "スタート";

    startButton.disabled =
      !selectedCategory;
  }
}


// ============================================================
// QUESTION
// ============================================================

async function askQuestion() {

  if (!gameActive) {
    return;
  }


  const question =
    questionInput.value.trim();


  if (!question) {
    return;
  }


  addUserMessage(
    question
  );


  questionInput.value = "";

  questionLength.textContent =
    "0";


  questionButton.disabled =
    true;


  addThinkingMessage();


  try {

    const response =
      await fetch(
        `${API_BASE}/judge`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              gameToken,
              question,
            }),
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ??
        "判定失敗"
      );
    }


    removeThinkingMessage();


    gameToken =
      data.gameToken;


    updateTurns(
      data.turnsLeft
    );


    updateUsage(
      data.usage
        ?.totalInputTokens
    );


    addAnswerMessage(
      data.answer,
      data.probability
    );


    if (
      data.turnsLeft <= 0
    ) {

      finishOutOfTurns();

      return;
    }


    questionInput.focus();

  } catch (error) {

    removeThinkingMessage();

    console.error(error);

    showToast(
      error.message
    );
  }


  if (gameActive) {

    questionButton.disabled =
      false;
  }
}


// ============================================================
// GUESS
// ============================================================

function openGuessPanel() {

  if (!gameActive) {
    return;
  }

  guessPanel.classList.remove(
    "hidden"
  );

  guessInput.focus();
}


function closeGuessPanel() {

  guessPanel.classList.add(
    "hidden"
  );
}


async function makeGuess() {

  if (!gameActive) {
    return;
  }


  const guess =
    guessInput.value.trim();


  if (!guess) {
    return;
  }


  guessButton.disabled =
    true;


  try {

    const response =
      await fetch(
        `${API_BASE}/guess`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              gameToken,
              guess,
            }),
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ??
        "回答判定失敗"
      );
    }


    closeGuessPanel();


    addUserMessage(
      `答えは「${guess}」！`
    );


    updateTurns(
      data.turnsLeft
    );


    updateUsage(
      data.totalInputTokens
    );


    if (data.correct) {

      addSystemMessage(
        "正解！"
      );

      setTimeout(
        () => {
          showCorrectResult(
            data
          );
        },
        650
      );

      return;
    }


    addSystemMessage(
      "違います。まだ続けられます。"
    );


    gameToken =
      data.gameToken;


    guessInput.value = "";


    if (
      data.turnsLeft <= 0
    ) {

      finishOutOfTurns();

      return;
    }


    questionInput.focus();

  } catch (error) {

    console.error(error);

    showToast(
      error.message
    );
  }


  if (gameActive) {

    guessButton.disabled =
      false;
  }
}


// ============================================================
// RESULT
// ============================================================

function showCorrectResult(data) {

  setGameActive(false);


  gameScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.remove(
    "hidden"
  );


  resultEmoji.textContent =
    "✓";

  resultLabel.textContent =
    "CORRECT";

  resultTitle.textContent =
    data.answer;


  resultDescription.textContent =
    `${data.turnsUsed}ターンで正解しました。`;


  resultTurns.textContent =
    `${data.turnsUsed} / ${MAX_TURNS}`;

  resultTokens.textContent =
    totalTokens.toLocaleString();

  resultCost.textContent =
    formatCost(totalTokens);
}


function finishOutOfTurns() {

  setGameActive(false);


  gameScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.remove(
    "hidden"
  );


  resultEmoji.textContent =
    "×";

  resultLabel.textContent =
    "GAME OVER";

  resultTitle.textContent =
    "20ターン終了";

  resultDescription.textContent =
    "正解を特定できませんでした。";


  resultTurns.textContent =
    `${MAX_TURNS} / ${MAX_TURNS}`;

  resultTokens.textContent =
    totalTokens.toLocaleString();

  resultCost.textContent =
    formatCost(totalTokens);
}


// ============================================================
// RESET
// ============================================================

function returnToStart() {

  gameToken = null;

  gameActive = false;

  selectedCategory = null;


  document
    .querySelectorAll(
      ".category-card"
    )
    .forEach(
      card =>
        card.classList.remove(
          "selected"
        )
    );


  startButton.disabled =
    true;


  gameScreen.classList.add(
    "hidden"
  );

  resultScreen.classList.add(
    "hidden"
  );

  startScreen.classList.remove(
    "hidden"
  );
}


// ============================================================
// EVENTS
// ============================================================

startButton.addEventListener(
  "click",
  startGame
);


newGameButton.addEventListener(
  "click",
  returnToStart
);


resultNewGameButton.addEventListener(
  "click",
  returnToStart
);


questionButton.addEventListener(
  "click",
  askQuestion
);


questionInput.addEventListener(
  "input",
  () => {

    questionLength.textContent =
      questionInput.value.length;

    questionButton.disabled =
      !gameActive ||
      !questionInput.value.trim();
  }
);


questionInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.repeat
    ) {

      event.preventDefault();

      askQuestion();
    }
  }
);


openGuessButton.addEventListener(
  "click",
  openGuessPanel
);


closeGuessButton.addEventListener(
  "click",
  closeGuessPanel
);


guessInput.addEventListener(
  "input",
  () => {

    guessButton.disabled =
      !guessInput.value.trim();
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


guessButton.addEventListener(
  "click",
  makeGuess
);


guessPanel.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      guessPanel
    ) {

      closeGuessPanel();
    }
  }
);


// ============================================================
// INIT
// ============================================================

setGameActive(false);

updateUsage(0);

updateTurns(MAX_TURNS);

loadCategories();