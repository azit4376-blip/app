/* Easy Shortcut - stable reset reset20260606a
 * 핵심: iPhone 홈 화면 아이콘 실행 시 coupang.html / ali.html에서 쇼핑 링크로 자동 이동
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
    try { return new URL(path, location.href).toString(); } catch { return path; }
  }

  function getParam(name) {
    try { return new URL(location.href).searchParams.get(name); } catch { return null; }
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
      "&icon=" + encodeURIComponent(absoluteUrl(shop.icon)) +
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

  function kakaoExternalUrl(url) {
    return "kakaotalk://web/openExternal?url=" + encodeURIComponent(absoluteUrl(url));
  }

  function openExternalCurrent() {
    const url = absoluteUrl(location.href);
    if (IS.kakao && IS.ios) {
      location.href = kakaoExternalUrl(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function showKakaoOverlay() {
    const guide = $("#kakaotalk-guide");
    if (!guide) return;
    const desc = $("#kakao-desc");
    const btn = $("#open-ext-btn");
    const note = $("#kakao-subnote");
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

  function autoRedirectFromHomeIcon() {
    const shop = pageShop();
    const isSinglePage = document.body.classList.contains("single-page");
    if (!shop || !isSinglePage) return;
    if (getParam("debug") === "1") return;
    if (IS.kakao) return;

    // iPhone 홈 화면 아이콘 또는 PWA/standalone 실행일 때만 자동 이동.
    if (!IS.standalone) return;

    const card = $("[data-auto-card]");
    if (card) card.hidden = false;

    setTimeout(() => {
      location.replace(shop.targetUrl);
    }, 250);
  }

  function bindEvents() {
    $$('[data-open-shop]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openShopById(el.dataset.openShop);
      });
    });

    $$('[data-open-target]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openCurrentTarget();
      });
    });

    // 현재 index.html의 버튼명과 이전 버전의 버튼명 둘 다 지원
    $$('[data-naver-shortcut], [data-shortcut-shop]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        addAndroidShortcut(el.dataset.naverShortcut || el.dataset.shortcutShop);
      });
    });

    $$('[data-open-external-current]').forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        openExternalCurrent();
      });
    });

    $$('[data-close-overlay]').forEach((el) => el.addEventListener("click", closeOverlay));
    const guide = $("#kakaotalk-guide");
    if (guide) guide.addEventListener("click", (e) => { if (e.target === guide) closeOverlay(); });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js?v=reset20260606a").catch(() => null);
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
