function isKakaotalk() {
  return /KAKAOTALK/i.test(navigator.userAgent);
}
function isIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}
function isDesktop() {
  return !isIos() && !isAndroid();
}
function getParam(name) {
  try { return new URL(location.href).searchParams.get(name); } catch { return null; }
}
function addOrUpdateParam(url, key, value) {
  try {
    const u = new URL(url, location.href);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    const glue = url.includes("?") ? "&" : "?";
    return url + glue + encodeURIComponent(key) + "=" + encodeURIComponent(value);
  }
}
function openExternalBrowser(url) {
  const taggedUrl = addOrUpdateParam(url, "openExternal", "1");
  const encoded = encodeURIComponent(taggedUrl);

  if (isIos()) {
    location.href = `kakaotalk://web/openExternal?url=${encoded}`;
    return;
  }

  if (isAndroid()) {
    const noProto = taggedUrl.replace(/^https?:\/\//, "");
    const fallback = encodeURIComponent(taggedUrl);
    const intentUrl =
      `intent://${noProto}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${fallback};` +
      `end;`;
    location.href = intentUrl;
    return;
  }

  window.open(taggedUrl, "_blank", "noopener");
}
function setDeviceView() {
  const pill = document.getElementById("device-pill");
  if (pill) {
    if (isAndroid()) pill.textContent = "현재 기기: Android";
    else if (isIos()) pill.textContent = "현재 기기: iPhone / iPad";
    else pill.textContent = "현재 기기: PC / 기타";
  }
  document.documentElement.classList.toggle("is-android", isAndroid());
  document.documentElement.classList.toggle("is-ios", isIos());
  document.documentElement.classList.toggle("is-desktop", isDesktop());
}
function closeOverlay() {
  const guide = document.getElementById("kakaotalk-guide");
  if (!guide) return;
  guide.style.display = "none";
  guide.setAttribute("aria-hidden", "true");
}
function showKakaoOverlay() {
  const guide = document.getElementById("kakaotalk-guide");
  const title = document.getElementById("kakao-title");
  const desc = document.getElementById("kakao-desc");
  const btn = document.getElementById("open-ext-btn");
  const subnote = document.getElementById("kakao-subnote");
  if (!guide || !title || !desc || !btn || !subnote) return;

  if (isIos()) {
    title.textContent = "iPhone은 Safari에서 추가하세요";
    desc.innerHTML = "카카오톡 안에서는 홈 화면 추가가 잘 안 보일 수 있어요.<br>Safari로 연 뒤 쿠팡/알리 아이콘 만들기를 진행하세요.";
    btn.textContent = "Safari로 열기";
    subnote.textContent = "안 열리면 카카오톡 오른쪽 하단 [⋯] → Safari로 열기를 선택하세요.";
  } else if (isAndroid()) {
    title.textContent = "Android는 외부 브라우저 권장";
    desc.innerHTML = "카카오톡 안에서는 바로가기 추가가 제한될 수 있어요.<br>외부 브라우저에서 열고 쿠팡/알리 버튼을 눌러주세요.";
    btn.textContent = "외부 브라우저로 열기";
    subnote.textContent = "네이버앱 바로가기 기능을 사용하면 홈 화면에 아이콘을 만들 수 있습니다.";
  } else {
    title.textContent = "외부 브라우저로 열기";
    desc.textContent = "브라우저에서 열어 바로가기를 만들어주세요.";
    btn.textContent = "열기";
    subnote.textContent = "";
  }

  btn.onclick = () => openExternalBrowser(location.href);
  guide.style.display = "flex";
  guide.setAttribute("aria-hidden", "false");
  guide.addEventListener("click", (e) => {
    if (e.target.closest(".kakao-content")) return;
    closeOverlay();
  }, { once: true });
}
function bindTargetPage() {
  const body = document.body;
  const targetUrl = body.dataset.targetUrl;
  const targetName = body.dataset.targetName || "쇼핑몰";
  if (!targetUrl) return;

  const openBtn = document.querySelector("[data-open-target]");
  if (openBtn) openBtn.addEventListener("click", () => location.href = targetUrl);

  const fromHome = window.navigator.standalone === true || getParam("from") === "home";
  const shouldAutoOpen = fromHome && !isKakaotalk();
  if (shouldAutoOpen) {
    const msg = document.createElement("div");
    msg.className = "auto-open-msg";
    msg.textContent = `${targetName}으로 이동 중입니다...`;
    document.body.appendChild(msg);
    setTimeout(() => { location.href = targetUrl; }, 450);
  }
}
window.addEventListener("load", () => {
  setDeviceView();
  bindTargetPage();

  if (getParam("openExternal") === "1") {
    closeOverlay();
    return;
  }
  if (isKakaotalk()) showKakaoOverlay();
});
