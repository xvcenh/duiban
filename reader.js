"use strict";
const all = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const one = (selector, parent = document) => parent.querySelector(selector);
const chapters = all(".chapter");
const root = document.documentElement;
const toc = one(".toc");
const chapterLinks = all(".toc nav a");
const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const pictures = all(".backwash, .lift");
const twoDigits = value => String(value).padStart(2, "0");
const rail = one(".rail-inner");
const cover = one(".cover");
const endOfExchange = one("#beyond");
const oppositeView = one(".switch-view");
const fromChen = document.body.dataset.side === "chen";
const oppositeName = fromChen ? "沈一鸣" : "陈雾";
const slips = one(".slips");
const slipRows = all(".sliprow", slips).map(row => all("span",row));
const droplets = [];
const wetPicture = one(".backwash .picture");
for (let i = 0; wetPicture && i < 7; i++) {
  const drop = document.createElement("i");
  drop.className = "drop";
  drop.setAttribute("aria-hidden", "true");
  wetPicture.appendChild(drop);
  droplets.push(drop);
}
root.classList.add("enhanced");
let lastChapter = -2;
let lastTarget = null;
let ticking = false;

function draw() {
  ticking = false;
  const height = window.innerHeight;
  const eye = Math.min(height * 0.3, 190);
  let current = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].getBoundingClientRect().top > eye) break;
    current = i;
  }
  const endTop = endOfExchange.getBoundingClientRect().top;
  const atBottom = Math.ceil(scrollY + height) >= root.scrollHeight - 1;
  const atEnd = endTop < eye || (atBottom && endTop < height);
  const pairedDay = current < 0 || atEnd ? 0 : Number(chapters[current].dataset.pair);
  if (oppositeView && pairedDay !== lastTarget) {
    lastTarget = pairedDay;
    oppositeView.href = oppositeView.dataset.page + (pairedDay ? "#c" + pairedDay : "");
    const destination = pairedDay ? "六月" + pairedDay + "日，同一次换带" : "从第一天读起";
    oppositeView.title = "切换到" + oppositeName + "视角：" + destination;
    oppositeView.setAttribute("aria-label", oppositeView.title);
  }
  one(".railsheet").hidden = atEnd;
  one(".axis").hidden = atEnd;
  one(".rail-end").hidden = !atEnd;
  if (current !== lastChapter) {
    lastChapter = current;
    const localDay = Math.max(1, current + 1);
    const day = fromChen ? 14 - localDay : localDay;
    one("#day-a").textContent = "06." + twoDigits(day);
    one("#day-b").textContent = "06." + twoDigits(14 - day);
    rail.style.setProperty("--a", ((day - 1) / 12) * 100 + "%");
    rail.style.setProperty("--b", ((13 - day) / 12) * 100 + "%");
    one(".now").textContent = current < 0 ? "" : one(".chap-index", chapters[current]).textContent + " · " + chapters[current].dataset.title;
    chapterLinks.forEach((link,i) => {
      if (i === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
  root.style.setProperty("--progress", clamp(scrollY / Math.max(1, root.scrollHeight - height)));
  if (reduce.matches) return;
  cover.style.setProperty("--cover-shift", clamp(scrollY / cover.offsetHeight) * 2.5 + "%");
  const receipt = slips.getBoundingClientRect();
  if (receipt.top < height && receipt.bottom > 0) {
    const step = Math.round(12 * clamp((height - receipt.top) / (height + receipt.height)));
    slipRows.forEach(row => row.forEach((slip,i) => slip.classList.toggle("under-finger", i === step)));
  }
  for (const figure of pictures) {
    const rect = figure.getBoundingClientRect();
    if (rect.top > height || rect.bottom < 0) continue;
    const position = clamp((height - rect.top) / (height + rect.height));
    figure.style.setProperty("--wash", (1 - 2 * position) * 1.6 + "%");
    figure.style.setProperty("--lift", -4 * Math.pow(Math.sin(position * Math.PI * 2), 2) + "%");
    if (figure.classList.contains("backwash")) {
      droplets.forEach((drop,i) => {
        const spread = 1 - position;
        const angle = Math.PI * (1.05 + i / 7);
        drop.style.left = (49 + Math.cos(angle) * spread * 49) + "%";
        drop.style.top = (48 + Math.sin(angle) * spread * 49) + "%";
        drop.style.opacity = Math.sin(Math.PI * position) * .85;
      });
    }
  }
}
function schedule() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(draw);
}
window.addEventListener("scroll", schedule, {passive:true});
window.addEventListener("resize", schedule);
window.addEventListener("pageshow", schedule);
reduce.addEventListener("change",schedule);
document.addEventListener("click", event => {
  if (toc.open && (!toc.contains(event.target) || event.target.closest("nav a"))) toc.open = false;
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && toc.open) {
    toc.open = false;
    one("summary", toc).focus();
  }
});
draw();

const player = one(".player");
const audio = one("audio", player);
const buttons = all("[data-sound]", player);
const wave = one(".wave");
const levels = [4,9,15,27,54,73,50,32,27,62,87,73,52,18,5,9,28,45,78,55,39,30,56,81,65,42,23,10,4,12,39,50,74,58,29,51,83,70,47,24,13,6,12,28,53,68,48,35,69,83,49,21,14,27,45,37,16,9,5,3];
levels.forEach(level => {
  const bar = document.createElement("i");
  bar.style.setProperty("--h", level + "%");
  wave.appendChild(bar);
});
let mode = "";
function syncAudio() {
  buttons.forEach(button => {
    const selected = button.dataset.sound === mode && !audio.paused;
    button.setAttribute("aria-pressed", String(selected));
    const label = button.dataset.sound === "reverse" ? "收到的倒音" : "翻正的录音";
    button.textContent = selected ? "Ⅱ 暂停" + label : "▷ 听" + label;
  });
  const played = audio.duration ? audio.currentTime / audio.duration : 0;
  [...wave.children].forEach((bar,i) => {
    const order = mode === "reverse" ? levels.length - 1 - i : i;
    bar.classList.toggle("lit", order < played * levels.length);
  });
}
buttons.forEach(button => button.addEventListener("click", async () => {
  const next = button.dataset.sound;
  if (mode === next && !audio.paused) { audio.pause(); return; }
  if (mode !== next) {
    audio.pause();
    mode = next;
    audio.src = "assets/fish-" + next + ".mp3";
  }
  try {
    await audio.play();
    one(".sound-state").textContent = next === "reverse" ? "正在播放收到的倒音" : "正在播放本地翻正的录音";
  } catch (error) {
    if (error.name !== "AbortError") {
      one(".sound-state").classList.remove("sr");
      one(".sound-state").textContent = "音频未能播放，请重试。";
    }
  }
}));
["play","pause","ended","timeupdate"].forEach(event => audio.addEventListener(event,syncAudio));
syncAudio();
