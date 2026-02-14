let userScore = 0;
let compScore = 0;
const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");
const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#comp-score");
const resetBtn = document.querySelector("#reset-btn");
const soundBtn = document.querySelector("#sound-btn");
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let soundEnabled = true;

const compGen = () => {
  const options = ["rock", "paper", "scissors"];
  const randIdx = Math.floor(Math.random() * 3);
  return options[randIdx];
};

const msgStates = ["status-idle", "status-draw", "status-win", "status-loss"];

const replayAnimation = (element, className) => {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
};

const animateRound = (choiceEl, outcome) => {
  replayAnimation(choiceEl, "choice-played");
  replayAnimation(msg, "msg-pop");
  if (outcome === "win") replayAnimation(userScorePara, "score-bump");
  if (outcome === "loss") replayAnimation(compScorePara, "score-bump");
};

const updateSoundButton = () => {
  if (!soundBtn) return;
  soundBtn.innerText = soundEnabled ? "Sound: On" : "Sound: Off";
  soundBtn.setAttribute("aria-pressed", String(soundEnabled));
};

const getAudioContext = () => {
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
};

const playTone = (frequency, duration, offset, type, volume) => {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const startAt = ctx.currentTime + offset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.01);
};

const playRoundSound = (outcome) => {
  if (outcome === "win") {
    playTone(494, 0.09, 0, "sine", 0.03);
    playTone(659, 0.11, 0.1, "sine", 0.035);
    return;
  }

  if (outcome === "loss") {
    playTone(392, 0.09, 0, "triangle", 0.028);
    playTone(262, 0.12, 0.1, "triangle", 0.03);
    return;
  }

  playTone(440, 0.1, 0, "sine", 0.02);
};

const setMessage = (text, state) => {
  msg.innerText = text;
  msg.classList.remove(...msgStates);
  msg.classList.add(`status-${state}`);
};

const drawGame = () => {
  setMessage("Game was a draw. Play again.", "draw");
  return "draw";
};

const showWinner = (userWin, userChoice, compChoice) => {
  if (userWin) {
    userScore++;
    userScorePara.innerText = userScore;
    setMessage(`You win! ${userChoice} beats ${compChoice}.`, "win");
    return "win";
  } else {
    compScore++;
    compScorePara.innerText = compScore;
    setMessage(`You lose. ${compChoice} beats ${userChoice}.`, "loss");
    return "loss";
  }
};

const playGame = (userChoice, choiceEl) => {
  const compChoice = compGen();
  let outcome;

  if (userChoice === compChoice) {
    outcome = drawGame();
  } else {
    let userWin = false;
    if (userChoice === "rock") userWin = compChoice === "scissors";
    else if (userChoice === "paper") userWin = compChoice === "rock";
    else userWin = compChoice === "paper";

    outcome = showWinner(userWin, userChoice, compChoice);
  }

  animateRound(choiceEl, outcome);
  playRoundSound(outcome);
};

const resetGame = () => {
  userScore = 0;
  compScore = 0;
  userScorePara.innerText = "0";
  compScorePara.innerText = "0";
  setMessage("Play your move", "idle");
};

choices.forEach((choice) => {
  choice.addEventListener("click", () => {
    const userChoice = choice.getAttribute("id");
    playGame(userChoice, choice);
  });
});

if (!AudioContextClass) {
  soundEnabled = false;
  if (soundBtn) {
    soundBtn.disabled = true;
    soundBtn.innerText = "Sound: Unsupported";
    soundBtn.setAttribute("aria-pressed", "false");
  }
} else {
  updateSoundButton();
}

if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    updateSoundButton();
  });
}

setMessage("Play your move", "idle");
resetBtn.addEventListener("click", resetGame);
