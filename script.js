// ==== GLOBAL VARIABLES ====
let timerInterval, remainingTime;
let correct = 0, wrong = 0, total = 0, skipped = 0, startTime;
let currentAnswer, currentMode, userEmail, userName;
let mistakes = [];
let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
let pointsMap = { easy: 10, medium: 20, hard: 100, pro: 500, legend: 1000 };

// ==== LOGIN ====
function loginUser() {
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("username").value.trim();

  if (!email || !name) {
    alert("Please enter both email and name!");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (!users[email]) {
    users[email] = { name: name, totalPoints: 0 };
  }

  localStorage.setItem("users", JSON.stringify(users));

  userEmail = email;
  userName = users[email].name;

  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("setupScreen").classList.remove("hidden");
  document.getElementById("leaderboardSection").classList.remove("hidden");
}

// ==== GAME START ====
function startGame(isDaily = false) {
  const diff = isDaily ? "daily" : document.getElementById("difficulty").value;
  const timeMin = isDaily ? 3 : document.getElementById("time").value;

  if (!timeMin && !isDaily) {
    alert("Please enter time!");
    return;
  }

  if (isDaily && localStorage.getItem("dailyPlayed_" + userEmail)) {
    alert("You have already played today’s puzzle!");
    return;
  }

  document.getElementById("setupScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  document.getElementById("leaderboardSection").classList.add("hidden");

  correct = wrong = total = skipped = 0;
  mistakes = [];
  currentMode = diff;
  remainingTime = parseInt(timeMin) * 60;
  startTime = new Date();

  startTimer();
  nextQuestion(diff);
}

// ==== TIMER ====
function startTimer() {
  const timerDisplay = document.getElementById("timer");
  timerDisplay.textContent = `Time: ${remainingTime}s`;

  timerInterval = setInterval(() => {
    remainingTime--;
    timerDisplay.textContent = `Time: ${remainingTime}s`;
    if (remainingTime <= 0) endGame();
  }, 1000);
}

// ==== QUESTION GENERATION ====
function nextQuestion(difficulty) {
  document.getElementById("answer").value = "";
  document.getElementById("feedback").textContent = "";

  let [min, max] = getRange(difficulty);
  let questionText, answer;
  const type = rand(0, 4);
  let n1 = rand(min, max), n2 = rand(min, max);

  switch (type) {
    case 0:
      questionText = `${n1} + ${n2}`;
      answer = n1 + n2;
      break;

    case 1:
      if (n2 > n1) [n1, n2] = [n2, n1];
      questionText = `${n1} - ${n2}`;
      answer = n1 - n2;
      break;

    case 2:
      questionText = `${n1} × ${n2}`;
      answer = n1 * n2;
      break;

    case 3:
      [n1, n2] = getCleanDivision(min, max);
      questionText = `${n1} ÷ ${n2}`;
      answer = n1 / n2;
      break;

    case 4:
      const sq = rand(min, max);
      questionText = `√${sq * sq}`;
      answer = sq;
      break;
  }

  currentAnswer = parseFloat(answer.toFixed(2));
  document.getElementById("question").textContent = questionText;
}

// ==== SUBMIT / SKIP ====
function submitAnswer() {
  const userAns = parseFloat(document.getElementById("answer").value);
  if (isNaN(userAns)) return;

  total++;
  if (Math.abs(userAns - currentAnswer) <= 0.01) {
    correct++;
    document.getElementById("feedback").textContent = "✅ Correct!";
  } else {
    wrong++;
    mistakes.push({
      question: document.getElementById("question").textContent,
      correct: currentAnswer,
      user: userAns
    });
    document.getElementById("feedback").textContent =
      `❌ Wrong! (Correct: ${currentAnswer})`;
  }

  const diff = currentMode;
  nextQuestion(diff);
}

function skipQuestion() {
  total++;
  skipped++;
  mistakes.push({
    question: document.getElementById("question").textContent,
    correct: currentAnswer,
    user: "Skipped"
  });
  document.getElementById("feedback").textContent =
    `⏩ Skipped! (Correct: ${currentAnswer})`;
  const diff = currentMode;
  nextQuestion(diff);
}

// ==== END GAME ====
function endGame() {
  clearInterval(timerInterval);

  if (currentMode === "daily") {
    localStorage.setItem("dailyPlayed_" + userEmail, new Date().toDateString());
  }

  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("resultScreen").classList.remove("hidden");

  const elapsedTime = (new Date() - startTime) / 1000;
  const answered = total - skipped;
  const avgTime = answered > 0 ? (elapsedTime / answered).toFixed(2) : 0;
  const accuracy = answered > 0 ? ((correct / answered) * 100).toFixed(2) : 0;

  const pointsEarned =
    correct * (pointsMap[currentMode] || 0);

  // Display results
  document.getElementById("modePlayed").textContent = `Mode: ${currentMode}`;
  document.getElementById("totalQ").textContent = `Total Questions: ${total}`;
  document.getElementById("correctQ").textContent = `Correct: ${correct}`;
  document.getElementById("wrongQ").textContent = `Wrong: ${wrong}`;
  document.getElementById("skippedQ").textContent = `Skipped: ${skipped}`;
  document.getElementById("accuracy").textContent = `Accuracy: ${accuracy}%`;
  document.getElementById("avgTime").textContent =
    `Avg Time/Answered Q: ${avgTime}s`;
  document.getElementById("points").textContent = `Points: ${pointsEarned}`;

  saveToLeaderboard(pointsEarned, accuracy, avgTime);
}

function restart() {
  location.reload();
}

// ==== UTILITIES ====
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRange(difficulty) {
  switch (difficulty) {
    case "easy": return [1, 10];
    case "medium": return [1, 100];
    case "hard": return [10, 1000];
    case "pro": return [100, 1000];
    case "legend": return [1000, 10000];
    default: return [1, 100];
  }
}

function getCleanDivision(min, max) {
  let a, b;
  for (let i = 0; i < 100; i++) {
    a = rand(min, max);
    b = rand(2, 9);
    if (a % b === 0 || Math.abs(a / b - Math.round(a / b)) <= 0.01) break;
  }
  return [a, b];
}

// ==== BACK TO SETUP ====
function backToSetup() {
  clearInterval(timerInterval);
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("setupScreen").classList.remove("hidden");
  document.getElementById("leaderboardSection").classList.remove("hidden");
}
