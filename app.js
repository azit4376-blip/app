// ─────────────────────────────────────────
// UA / Params
// ─────────────────────────────────────────
function isKakaotalk() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}
function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
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
//  - iOS: kakaotalk openExternal로 Safari 열기 "시도"
//  - Android: intent:// 패키지 미지정 → 네이버/크롬 등 "선택창" 유도
// ─────────────────────────────────────────
function openExternalBrowser(url) {
  const taggedUrl = addOrUpdateParam(url, "openExternal", "1");
  const encoded = encodeURIComponent(taggedUrl);

  // iOS: Safari로 열기 시도 (환경에 따라 막힐 수 있음: 확실하지 않음)
  if (isIos()) {
    const schemeUrl = `kakaotalk://web/openExternal?url=${encoded}`;
    location.href = schemeUrl;

    // 보조 시도(일부 환경에서 도움이 되는 케이스가 있음)
    setTimeout(() => {
      try { window.open(schemeUrl, "_self"); } catch {}
    }, 50);

    return;
  }

  // Android: 패키지 지정 없이 chooser 뜨게 하기
  // (카톡 인앱에서 네이버/크롬 선택이 뜨는 경우가 많음)
  const noProto = taggedUrl.replace(/^https?:\/\//, "");
  const chooserIntent =
    `intent://${noProto}` +
    `#Intent;scheme=https;action=android.intent.action.VIEW;` +
    `category=android.intent.category.BROWSABLE;end;`;

  location.href = chooserIntent;
}

// ─────────────────────────────────────────
// UI patch
// ─────────────────────────────────────────
function hideStep1ForKakao() {
  const step1 = document.getElementById("step1-android");
  if (step1) step1.style.display = "none";

  const step3Text = document.getElementById("step3-title-text");
  if (step3Text) step3Text.textContent = "바로 쇼핑하기 (외부 브라우저 권장)";
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

  // 화살표 OS별 표시
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
      "아래 버튼을 누르면 <b>네이버/크롬 등 앱 선택</b> 후 외부에서 열 수 있어요.";
    btn.textContent = "외부 브라우저로 열기 🚀";
    subnote.textContent = "✅ 선택창이 안 뜨면 오른쪽 하단 [⋮] → '다른 브라우저로 열기'를 선택하세요.";
  }

  btn.onclick = () => openExternalBrowser(location.href);

  guide.style.display = "flex";
  guide.setAttribute("aria-hidden", "false");

  // 배경 클릭 닫기(내용 클릭은 제외)
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

  // 외부 브라우저로 다시 열린 경우: 오버레이 표시 안 함
  if (openedExternal) {
    closeOverlay();
    return;
  }

  // 카톡 인앱일 때만 패치 적용
  if (isKakaotalk()) {
    hideStep1ForKakao();
    showOverlay();
  }
});
