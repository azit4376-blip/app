/* Easy Shortcut - stable20260606c
 * 정리 버전
 * - index.html: 쇼핑홈 메인
 * - coupang.html: 쿠팡 아이콘 설치 + 홈화면 실행 시 쿠팡 자동 이동
 * - ali.html: 알리 아이콘 설치 + 홈화면 실행 시 알리 자동 이동
 */
(() => {
  "use strict";

  const SHOPS = {
    coupang: {
      id: "coupang",
      shortName: "쿠팡",
      targetUrl: "https://link.coupang.com/a/cpO0Kv",
      icon: "coupang-icon.png"
    },
    ali: {
      id: "ali",
      shortName: "알리",
      targetUrl: "https://s.click.aliexpress.com/e/_DkmHcWJ",
      icon: "ali-icon.png"
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const UA = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const IS = {
    kakao: /KAKAOTALK/i.test(UA),
    naver: /NAVER/i.test(UA),
    ios: /iPhone|iPad|iPod/i.test(UA) || (platform === "MacIntel" && navigator.maxTouchPoints > 1),
    android: /Android/i.test(UA),
    standalone: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
  };

  function absoluteUrl(path) {
    try { return new URL(path, location.href).toString(); }
    catch { return path; }
  }

  function getParam(name) {
    try { return new URL(location.href).searchParams.get(name); }
    catch { return null; }
  }

  function addParam(url, key, value) {
    try {
      const u = new URL(url, location.href);
      u.searchParams.set(key, value);
      return u.toString();
    } catch {
      return url;
    }
  }

  function getShop(shopId) {
    return SHOPS[shopId] || null;
  }

  function pageShop() {
    const body = document.body;
    let shopId = body.dataset.shopId || "";
    const path = location.pathname.toLowerCase();

    if (!shopId) {
      if (path.includes("coupang")) shopId = "coupang";
      else if (path.includes("ali")) shopId = "ali";
    }

    const base = getShop(shopId);
    if (base) {
      return {
        ...base,
        targetUrl: body.dataset.targetUrl || base.targetUrl,
        shortName: body.dataset.targetName || base.shortName
      };
    }

    if (body.dataset.targetUrl) {
      return {
        id: shopId || "custom",
        shortName: body.dataset.targetName || "쇼핑몰",
        targetUrl: body.dataset.targetUrl,
        icon: ""
      };
    }
    return null;
  }

  function ensureToast() {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message) {
    const toast = ensureToast();
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function setPlatformClass() {
    document.body.classList.toggle("is-kakao", IS.kakao);
    document.body.classList.toggle("is-ios", IS.ios);
    document.body.classList.toggle("is-android", IS.android);
    document.body.classList.toggle("is-standalone", IS.standalone);

    const chip = $("#platform-chip");
    if (!chip) return;
    if (IS.kakao && IS.ios) chip.textContent = "현재 환경: iPhone 카카오톡";
    else if (IS.kakao && IS.android) chip.textContent = "현재 환경: Android 카카오톡";
    else if (IS.ios) chip.textContent = "현재 환경: iPhone / iPad";
    else if (IS.android) chip.textContent = IS.naver ? "현재 환경: Android 네이버앱" : "현재 환경: Android";
    else chip.textContent = "현재 환경: PC 또는 기타 브라우저";
  }

  function openShopById(shopId) {
    const shop = getShop(shopId) || pageShop();
    if (!shop) return;
    location.href = shop.targetUrl;
  }

  function openCurrentTarget() {
    const shop = pageShop();
    if (!shop) return;
    location.href = shop.targetUrl;
  }

  function makeNaverShortcutUrl(shopId) {
    const shop = getShop(shopId);
    if (!shop) return "#";
    return (
      "naversearchapp://addshortcut?" +
      "url=" + encodeURIComponent(shop.targetUrl) +
      "&icon=" + encodeURIComponent(absoluteUrl(shop.icon + "?v=stable20260606c")) +
      "&title=" + encodeURIComponent(shop.shortName) +
      "&serviceCode=whois&version=11"
    );
  }

  function addAndroidShortcut(shopId) {
    if (!IS.android) {
      showToast("Android에서 네이버앱 바로가기 추가 기능을 사용할 수 있어요.");
      return;
    }
    location.href = makeNaverShortcutUrl(shopId);
  }

  async function copyShopLink(shopId) {
    const shop = getShop(shopId) || pageShop();
    if (!shop) return;
    try {
      await navigator.clipboard.writeText(shop.targetUrl);
      showToast(`${shop.shortName} 링크를 복사했습니다.`);
    } catch {
      showToast("복사 권한이 없어 직접 길게 눌러 복사해주세요.");
    }
  }

  function kakaoExternalUrl(url) {
    return "kakaotalk://web/openExternal?url=" + encodeURIComponent(absoluteUrl(url));
  }

  function openExternalCurrent() {
    const url = addParam(absoluteUrl(location.href), "openExternal", "1");
    if (IS.kakao && IS.ios) {
      location.href = kakaoExternalUrl(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function ensureKakaoOverlay() {
    if ($("#kakaotalk-guide")) return;
    document.body.insertAdjacentHTML("afterbegin", `
      <div id="kakaotalk-guide" class="overlay" aria-hidden="true">
        <div class="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="kakao-title">
          <button class="overlay-close" type="button" data-close-overlay aria-label="닫기">×</button>
          <div class="overlay-badge">💬</div>
          <p class="overlay-eyebrow">카카오톡 인앱 브라우저 감지</p>
          <h2 id="kakao-title">외부 브라우저에서 열어주세요</h2>
          <p id="kakao-desc" class="overlay-desc"></p>
          <button id="open-ext-btn" class="primary-btn overlay-btn" type="button">외부 브라우저로 열기</button>
          <p id="kakao-subnote" class="overlay-note"></p>
        </div>
      </div>
    `);
  }

  function showKakaoOverlay() {
    ensureKakaoOverlay();
    const guide = $("#kakaotalk-guide");
    const desc = $("#kakao-desc");
    const btn = $("#open-ext-btn");
    const note = $("#kakao-subnote");
    if (!guide) return;

    if (desc) desc.innerHTML = IS.ios
      ? "카카오톡 내부에서는 <b>홈 화면 추가</b>가 잘 안 보일 수 있어요.<br>Safari에서 열면 설치가 가장 안정적입니다."
      : "카카오톡 내부에서는 <b>바로가기 추가</b>가 제한될 수 있어요.<br>기본 브라우저나 네이버앱에서 다시 열어주세요.";
    if (btn) {
      btn.textContent = IS.ios ? "Safari로 열기" : "외부 브라우저로 열기";
      btn.onclick = openExternalCurrent;
    }
    if (note) note.textContent = IS.ios ? "안 열리면 카카오톡 메뉴에서 Safari로 열기를 선택하세요." : "안 열리면 메뉴에서 외부 브라우저 열기를 선택하세요.";
    guide.classList.add("show");
    guide.setAttribute("aria-hidden", "false");
  }

  function closeOverlay() {
    const guide = $("#kakaotalk-guide");
    if (!guide) return;
    guide.classList.remove("show");
    guide.setAttribute("aria-hidden", "true");
  }

  let autoTimer = null;
  function autoRedirectFromHomeIcon() {
    const shop = pageShop();
    const isSinglePage = document.body.classList.contains("single-page");
    if (!shop || !isSinglePage) return;
    if (getParam("debug") === "1") return;
    if (IS.kakao) return;

    // iPhone 홈 화면 아이콘 또는 standalone 실행일 때만 자동 이동합니다.
    // Safari에서 설치 안내를 보는 중에는 이동하지 않습니다.
    if (!IS.standalone) return;

    const card = $("[data-auto-card]");
    if (card) card.hidden = false;

    autoTimer = setTimeout(() => {
      location.replace(shop.targetUrl);
    }, 350);
  }

  function bindEvents() {
    $$('[data-open-shop]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openShopById(el.dataset.openShop);
      });
    });

    // 예전 단일 페이지 버튼 호환용
    $$('[data-open-target]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openCurrentTarget();
      });
    });

    // 현재 index.html의 data-naver-shortcut과 이전 data-shortcut-shop 둘 다 지원
    $$('[data-naver-shortcut], [data-shortcut-shop]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        addAndroidShortcut(el.dataset.naverShortcut || el.dataset.shortcutShop);
      });
    });

    $$('[data-copy-shop]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        copyShopLink(el.dataset.copyShop);
      });
    });

    $$('[data-open-external-current]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openExternalCurrent();
      });
    });

    $$('[data-cancel-auto]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        if (autoTimer) clearTimeout(autoTimer);
        const card = $("[data-auto-card]");
        if (card) card.hidden = true;
        showToast("자동 이동을 취소했습니다.");
      });
    });

    $$('[data-close-overlay]').forEach((el) => el.addEventListener("click", closeOverlay));
    const guide = $("#kakaotalk-guide");
    if (guide) guide.addEventListener("click", (e) => { if (e.target === guide) closeOverlay(); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeOverlay(); });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js?v=stable20260606c").catch(() => null);
  }

  function init() {
    setPlatformClass();
    bindEvents();
    if (IS.kakao && getParam("openExternal") !== "1") showKakaoOverlay();
    autoRedirectFromHomeIcon();
    registerServiceWorker();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
