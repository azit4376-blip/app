// ─────────────────────────────────────────
// UA / Params
// ─────────────────────────────────────────
function isKakaotalk() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}
function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function getParam(name) {
  try {
    return new URL(location.href).searchParams.get(name);
  } catch {
    return null;
  }
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

// ─────────────────────────────────────────
// External open
//  - iOS: Safari 열기 "시도" (카톡 openExternal)
//  - Android: Naver app으로 "고정" (com.nhn.android.search)
// ─────────────────────────────────────────
function openExternalBrowser(url) {
  const taggedUrl = addOrUpdateParam(url, "openExternal", "1");
  const encoded = encodeURIComponent(taggedUrl);

  // iOS: Safari 열기 시도 (환경에 따라 막힐 수 있음: 확실하지 않음)
  if (isIos()) {
    const schemeUrl = `kakaotalk://web/openExternal?url=${encoded}`;
    location.href = schemeUrl;

    // 보조 시도
    setTimeout(() => {
      try { window.open(schemeUrl, "_self"); } catch {}
    }, 50);
    return;
  }

  // Android: 네이버앱으로 고정
  if (isAndroid()) {
    const noProto = taggedUrl.replace(/^https?:\/\//, "");

    // 네이버앱 패키지 고정
    const naverIntent =
      `intent://${noProto}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `package=com.nhn.android.search;end;`;

    // 네이버앱 없을 때 대비: Play Store로 유도
    const playStoreNaver =
      "https://play.google.com/store/apps/details?id=com.nhn.android.search&hl=ko";

    // 네이버앱 먼저 시도
    location.href = naverIntent;

    // 만약 네이버앱이 없어서 아무 반응 없을 때, 일정 시간 후 스토어 이동 (실전형 타임아웃)
    setTimeout(() => {
      // 사용자가 이미 이동했으면 여기까지 안 올 가능성이 크지만,
      // 안 됐을 때는 설치 유도라도 해주기
      location.href = playStoreNaver;
    }, 900);

    return;
  }

  // 그 외(데스크탑 등): 그냥 새 탭
  window.open(taggedUrl, "_blank", "noopener");
}

// ─────────────────────────────────────────
// UI patch
// ─────────────────────────────────────────
function hideStep1ForKakao() {
  const step1 = document.getElementById("step1-android");
  if (step1) step1.style.display = "none";

  const step3Text = document.getElementById("step3-title-text");
  if (step3Text) {
    step3Text.textContent = isIos()
      ? "바로 쇼핑하기 (Safari 권장)"
      : "바로 쇼핑하기 (네이버앱 권장)";
  }
}

function closeOverlay() {
  const guide = document.getElementById("kakaotalk-guide");
  if (!guide) return;
  guide.style.display = "none";
  guide.setAttribute("aria-hidden", "true");
}

function showOverlay() {
  const guide = document.getElementById("kakaotalk-guide");
  const title = document.getElementById("kakao-title");
  const desc = document.getElementById("kakao-desc");
  const btn = document.getElementById("open-ext-btn");
  const subnote = document.getElementById("kakao-subnote");
  const up = document.getElementById("kakao-arrow-up");
  const down = document.getElementById("kakao-arrow-down");

  if (!guide || !title || !desc || !btn || !subnote) return;

  if (up) up.style.display = isIos() ? "none" : "block";
  if (down) down.style.display = isIos() ? "block" : "none";

  if (isIos()) {
    title.textContent = "🍎 iPhone 카카오톡 안내";
    desc.innerHTML =
      "카카오톡 내부에서는 <b>바로가기 설치</b>가 제한될 수 있어요.<br><br>" +
      "아래 버튼으로 <b>Safari</b>에서 열면 설치가 쉬워집니다.";
    btn.textContent = "Safari로 열기 🚀";
    subnote.textContent = "✅ 안 열리면 오른쪽 하단 [⋯] → 'Safari로 열기'를 선택하세요.";
  } else {
    title.textContent = "📱 Android 카카오톡 안내";
    desc.innerHTML =
      "카카오톡 내부에서는 <b>바로가기 설치</b>가 제한될 수 있어요.<br><br>" +
      "아래 버튼을 누르면 <b>네이버앱</b>으로 열려 설치가 가능합니다.";
    btn.textContent = "네이버앱으로 열기 🚀";
    subnote.textContent = "✅ 네이버앱이 없다면 설치 화면으로 안내됩니다.";
  }

  btn.onclick = () => openExternalBrowser(location.href);

  guide.style.display = "flex";
  guide.setAttribute("aria-hidden", "false");

  guide.addEventListener("click", (e) => {
    const content = e.target.closest(".kakao-content");
    if (content) return;
    closeOverlay();
  }, { once: true });
}

// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
window.addEventListener("load", () => {
  const openedExternal = getParam("openExternal") === "1";

  // 외부로 열린 흔적이면 오버레이 표시 안 함
  if (openedExternal) {
    closeOverlay();
    return;
  }

  // 카톡 인앱일 때만
  if (isKakaotalk()) {
    hideStep1ForKakao();
    showOverlay();
  }
});
