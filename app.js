// ─────────────────────────────────────────
// 기기 / 브라우저 감지
// ─────────────────────────────────────────
const UA = navigator.userAgent || "";
const isKakao = /KAKAOTALK/i.test(UA);
const isIOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(UA);
const isMobile = isIOS || isAndroid;
const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

let deferredPrompt = null;

const COUPANG_URL = "https://link.coupang.com/a/cpO0Kv";
const ALI_URL = "https://s.click.aliexpress.com/e/_DkmHcWJ";

function $(id) {
  return document.getElementById(id);
}

function addOrUpdateParam(url, key, value) {
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const glue = url.includes("?") ? "&" : "?";
    return url + glue + encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }
}

function getParam(name) {
  try {
    return new URL(location.href).searchParams.get(name);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// 카카오톡 인앱 → 외부 브라우저 열기 유도
// ─────────────────────────────────────────
function openExternalBrowser(url) {
  const taggedUrl = addOrUpdateParam(url, "openExternal", "1");
  const encoded = encodeURIComponent(taggedUrl);

  if (isIOS) {
    // 카카오톡 iOS에서 Safari로 여는 공식적인 우회 시도
    location.href = `kakaotalk://web/openExternal?url=${encoded}`;
    return;
  }

  if (isAndroid) {
    // Android는 Chrome으로 우선 열기. Chrome이 없으면 기본 브라우저/스토어 fallback.
    const noProto = taggedUrl.replace(/^https?:\/\//, "");
    const chromeMarket = encodeURIComponent("market://details?id=com.android.chrome");
    const intentUrl =
      `intent://${noProto}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `package=com.android.chrome;` +
      `S.browser_fallback_url=${chromeMarket};` +
      `end;`;
    location.href = intentUrl;
    return;
  }

  window.open(taggedUrl, "_blank", "noopener");
}

function showKakaoGuide() {
  const guide = $("kakaotalk-guide");
  const desc = $("kakao-desc");
  const btn = $("open-ext-btn");
  const note = $("kakao-subnote");
  if (!guide || !desc || !btn || !note) return;

  if (isIOS) {
    desc.innerHTML = "카카오톡 안에서는 홈 화면 설치가 제한될 수 있어요.<br><b>Safari</b>에서 열면 아이폰 바탕화면에 추가할 수 있습니다.";
    btn.textContent = "Safari로 열기";
    note.textContent = "안 열리면 카카오톡 오른쪽 아래/위 메뉴에서 Safari로 열기를 선택하세요.";
  } else if (isAndroid) {
    desc.innerHTML = "카카오톡 안에서는 설치 버튼이 안 뜰 수 있어요.<br><b>Chrome</b>에서 열면 홈 화면 설치가 가능합니다.";
    btn.textContent = "Chrome으로 열기";
    note.textContent = "Chrome에서 열린 뒤 ‘홈 화면에 설치’ 버튼을 눌러주세요.";
  } else {
    desc.innerHTML = "현재 브라우저에서는 설치 기능이 제한될 수 있어요.<br>Chrome 또는 Edge에서 열어주세요.";
    btn.textContent = "새 창으로 열기";
    note.textContent = "PC에서도 설치 가능한 브라우저라면 앱처럼 사용할 수 있습니다.";
  }

  btn.onclick = () => openExternalBrowser(location.href);
  guide.classList.add("is-open");
  guide.setAttribute("aria-hidden", "false");
}

function closeKakaoGuide() {
  const guide = $("kakaotalk-guide");
  if (!guide) return;
  guide.classList.remove("is-open");
  guide.setAttribute("aria-hidden", "true");
}

// ─────────────────────────────────────────
// iPhone 설치 안내창
// ─────────────────────────────────────────
function showIosInstallSheet() {
  const sheet = $("ios-install-sheet");
  if (!sheet) return;
  sheet.classList.add("is-open");
  sheet.setAttribute("aria-hidden", "false");
}

function closeIosInstallSheet() {
  const sheet = $("ios-install-sheet");
  if (!sheet) return;
  sheet.classList.remove("is-open");
  sheet.setAttribute("aria-hidden", "true");
}

// ─────────────────────────────────────────
// Android 네이버앱 addshortcut fallback
// ─────────────────────────────────────────
function buildNaverShortcutIntent({ title, url, icon }) {
  const params = new URLSearchParams({
    url,
    icon,
    title,
    serviceCode: "whois",
    version: "11"
  });

  return `intent://addshortcut?${params.toString()}#Intent;scheme=naversearchapp;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.search;end`;
}

function addAndroidNaverShortcut() {
  // 대표 아이콘은 현재 쇼핑홈을 추가. 쇼핑몰 직접 아이콘을 원하면 아래 url/title을 쿠팡/알리로 바꾸면 됨.
  const appUrl = "https://azit4376-blip.github.io/app/?openExternal=1";
  const iconUrl = "https://azit4376-blip.github.io/app/icon-192.png";
  location.href = buildNaverShortcutIntent({ title: "쇼핑홈", url: appUrl, icon: iconUrl });
}

// ─────────────────────────────────────────
// PWA 설치
// ─────────────────────────────────────────
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  updateInstallUI();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  markInstalled();
});

async function installPwa() {
  if (isStandalone) {
    markInstalled();
    return;
  }

  if (isIOS) {
    showIosInstallSheet();
    return;
  }

  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    updateInstallUI();
    return;
  }

  // Android Chrome에서 아직 prompt가 안 뜬 경우 / 삼성인터넷 등
  if (isAndroid) {
    showManualAndroidHelp();
    return;
  }

  showPcHelp();
}

function showManualAndroidHelp() {
  const title = $("install-title");
  const desc = $("install-desc");
  if (title) title.textContent = "브라우저 메뉴에서 홈 화면에 추가";
  if (desc) desc.innerHTML = "설치창이 바로 안 뜨면 Chrome 오른쪽 위 <b>⋮</b> → <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러주세요.";
}

function showPcHelp() {
  const title = $("install-title");
  const desc = $("install-desc");
  if (title) title.textContent = "PC 브라우저 설치 안내";
  if (desc) desc.innerHTML = "Chrome/Edge 주소창 오른쪽의 <b>설치 아이콘</b> 또는 메뉴의 <b>앱 설치</b>를 눌러주세요.";
}

function markInstalled() {
  const btn = $("install-btn");
  const title = $("install-title");
  const desc = $("install-desc");
  if (btn) {
    btn.textContent = "설치 완료됨";
    btn.disabled = true;
  }
  if (title) title.textContent = "이미 홈 화면에서 실행 중";
  if (desc) desc.textContent = "현재 쇼핑홈이 앱처럼 실행되고 있습니다.";
}

function updateDeviceChip() {
  const chip = $("device-chip");
  if (!chip) return;
  if (isStandalone) chip.textContent = "설치된 앱 모드";
  else if (isKakao && isIOS) chip.textContent = "iPhone · 카카오톡";
  else if (isKakao && isAndroid) chip.textContent = "Android · 카카오톡";
  else if (isIOS) chip.textContent = "iPhone";
  else if (isAndroid) chip.textContent = "Android";
  else chip.textContent = "PC / 기타";
}

function updateInstallUI() {
  const eyebrow = $("install-eyebrow");
  const title = $("install-title");
  const desc = $("install-desc");
  const btn = $("install-btn");
  const androidShortcutBtn = $("android-shortcut-btn");

  if (isStandalone) {
    markInstalled();
    if (androidShortcutBtn) androidShortcutBtn.style.display = "none";
    return;
  }

  if (eyebrow) eyebrow.textContent = isMobile ? "폰 바탕화면 설치" : "PC 앱 설치";

  if (isIOS) {
    if (title) title.textContent = "아이폰 홈 화면에 추가";
    if (desc) desc.textContent = "버튼을 누르면 Safari 공유 메뉴로 추가하는 순서를 보여드립니다.";
    if (btn) btn.textContent = "아이폰 설치 방법 보기";
    if (androidShortcutBtn) androidShortcutBtn.style.display = "none";
    return;
  }

  if (isAndroid) {
    if (title) title.textContent = deferredPrompt ? "Android 홈 화면에 설치 가능" : "Android 홈 화면에 설치";
    if (desc) desc.textContent = deferredPrompt
      ? "버튼을 누르면 Chrome 설치창이 열립니다."
      : "Chrome 설치창이 안 뜨면 브라우저 메뉴 또는 네이버 바로가기를 사용하세요.";
    if (btn) btn.textContent = "Android 홈 화면에 설치";
    if (androidShortcutBtn) androidShortcutBtn.style.display = "inline-flex";
    return;
  }

  if (title) title.textContent = deferredPrompt ? "PC에 앱처럼 설치 가능" : "PC 바로가기 설치 안내";
  if (desc) desc.textContent = deferredPrompt
    ? "버튼을 누르면 Chrome/Edge 설치창이 열립니다."
    : "설치 아이콘이 보이지 않으면 브라우저 메뉴에서 앱 설치를 찾아주세요.";
  if (btn) btn.textContent = "PC에 설치";
  if (androidShortcutBtn) androidShortcutBtn.style.display = "none";
}

// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  updateDeviceChip();
  updateInstallUI();

  const installBtn = $("install-btn");
  if (installBtn) installBtn.addEventListener("click", installPwa);

  const androidShortcutBtn = $("android-shortcut-btn");
  if (androidShortcutBtn) androidShortcutBtn.addEventListener("click", addAndroidNaverShortcut);

  document.querySelectorAll("[data-close-overlay]").forEach((el) => {
    el.addEventListener("click", closeKakaoGuide);
  });
  document.querySelectorAll("[data-close-ios]").forEach((el) => {
    el.addEventListener("click", closeIosInstallSheet);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => null);
  }

  const openedExternal = getParam("openExternal") === "1";
  if (isKakao && !openedExternal) showKakaoGuide();
});
