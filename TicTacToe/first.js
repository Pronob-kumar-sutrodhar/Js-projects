const boxes = Array.from(document.querySelectorAll(".box"));
const resetBtn = document.querySelector("#reset-btn");
const resetScoreBtn = document.querySelector("#reset-score-btn");
const newGameBtn = document.querySelector("#new-btn");
const msgContainer = document.querySelector(".msg-container");
const msg = document.querySelector("#msg");
const statusText = document.querySelector("#status");
const scoreOText = document.querySelector("#score-o");
const scoreXText = document.querySelector("#score-x");
const scoreDrawText = document.querySelector("#score-draw");

let turnO = true;
let moveCount = 0;
let gameOver = false;

const score = {
  O: 0,
  X: 0,
  Draw: 0,
};

const winPatterns = [
  [0, 1, 2],
  [0, 3, 6],
  [0, 4, 8],
  [1, 4, 7],
  [2, 5, 8],
  [2, 4, 6],
  [3, 4, 5],
  [6, 7, 8],
];

const updateStatus = (text) => {
  statusText.textContent = text;
};

const updateScoreboard = () => {
  scoreOText.textContent = score.O;
  scoreXText.textContent = score.X;
  scoreDrawText.textContent = score.Draw;
};

const showMessage = (text) => {
  msg.textContent = text;
  msgContainer.classList.remove("hide");
};

const hideMessage = () => {
  msgContainer.classList.add("hide");
};

const clearBoard = () => {
  boxes.forEach((box) => {
    box.disabled = false;
    box.textContent = "";
    box.classList.remove("symbol-o", "symbol-x", "win");
  });
  moveCount = 0;
  gameOver = false;
  updateStatus(`Turn: ${turnO ? "O" : "X"}`);
};

const resetBoard = () => {
  turnO = true;
  hideMessage();
  clearBoard();
};

const disableBoard = () => {
  boxes.forEach((box) => {
    box.disabled = true;
  });
};

const getWinner = () => {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    const first = boxes[a].textContent;

    if (first && first === boxes[b].textContent && first === boxes[c].textContent) {
      return { winner: first, pattern };
    }
  }

  return null;
};

const endRound = (result) => {
  gameOver = true;
  disableBoard();

  if (result.type === "win") {
    result.pattern.forEach((index) => boxes[index].classList.add("win"));
    score[result.winner] += 1;
    updateScoreboard();
    updateStatus(`Winner: ${result.winner}`);
    showMessage(`Winner: ${result.winner}`);
    return;
  }

  score.Draw += 1;
  updateScoreboard();
  updateStatus("Round ended in a draw");
  showMessage("Game was a draw.");
};

const handleMove = (box) => {
  if (gameOver || box.textContent) {
    return;
  }

  const symbol = turnO ? "O" : "X";
  box.textContent = symbol;
  box.classList.add(symbol === "O" ? "symbol-o" : "symbol-x");
  box.disabled = true;
  moveCount += 1;

  const winnerResult = getWinner();
  if (winnerResult) {
    endRound({ type: "win", ...winnerResult });
    return;
  }

  if (moveCount === boxes.length) {
    endRound({ type: "draw" });
    return;
  }

  turnO = !turnO;
  updateStatus(`Turn: ${turnO ? "O" : "X"}`);
};

boxes.forEach((box) => {
  box.addEventListener("click", () => handleMove(box));
});

newGameBtn.addEventListener("click", resetBoard);
resetBtn.addEventListener("click", resetBoard);
resetScoreBtn.addEventListener("click", () => {
  score.O = 0;
  score.X = 0;
  score.Draw = 0;
  updateScoreboard();
  resetBoard();
});

updateScoreboard();
clearBoard();
