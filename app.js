/* Easy Shortcut - GPT Enhanced
 * 목적: 카카오톡 인앱, iOS 홈화면, Android 네이버앱 바로가기 흐름 보완
 */
(() => {
  "use strict";

  const SHOPS = {
    coupang: {
      id: "coupang",
      name: "쿠팡",
      shortName: "쿠팡",
      targetUrl: "https://link.coupang.com/a/cpO0Kv",
      icon: "coupang-icon.png",
      theme: "coupang"
    },
    ali: {
      id: "ali",
      name: "알리익스프레스",
      shortName: "알리",
      targetUrl: "https://s.click.aliexpress.com/e/_DkmHcWJ",
      icon: "ali-icon.png",
      theme: "ali"
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

  function getParam(name) {
    try {
      return new URL(location.href).searchParams.get(name);
    } catch {
      return null;
    }
  }

  function addParams(rawUrl, params) {
    try {
      const url = new URL(rawUrl, location.href);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
      });
      return url.toString();
    } catch {
      return rawUrl;
    }
  }

  function absoluteUrl(path) {
    try {
      return new URL(path, location.href).toString();
    } catch {
      return path;
    }
  }

  function getShop(shopId) {
    return SHOPS[shopId] || null;
  }

  function pageShop() {
    const body = document.body;

    // 단일 설치 페이지(coupang.html / ali.html)는 data-shop-id가 있으면 가장 정확합니다.
    // 혹시 기존 파일처럼 data-shop-id가 빠져 있어도 파일명과 data-target-url로 한 번 더 추정합니다.
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

    // 최후 보정: data-target-url만 있어도 홈화면 자동 이동이 가능하게 처리
    if (body.dataset.targetUrl) {
      return {
        id: shopId || "custom",
        name: body.dataset.targetName || "쇼핑몰",
        shortName: body.dataset.targetName || "쇼핑몰",
        targetUrl: body.dataset.targetUrl,
        icon: "",
        theme: ""
      };
    }

    return null;
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
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

  function androidBrowserIntent(url, fallbackUrl = url) {
    const finalUrl = absoluteUrl(url);
    const noProtocol = finalUrl.replace(/^https?:\/\//i, "");
    return (
      `intent://${noProtocol}` +
      `#Intent;scheme=https;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};` +
      `end;`
    );
  }

  function kakaoExternalUrl(url) {
    return `kakaotalk://web/openExternal?url=${encodeURIComponent(absoluteUrl(url))}`;
  }

  function openExternal(url) {
    const finalUrl = absoluteUrl(url);

    if (IS.ios) {
      location.href = kakaoExternalUrl(finalUrl);
      setTimeout(() => showToast("안 열리면 카카오톡 메뉴에서 Safari로 열기를 선택하세요."), 600);
      return;
    }

    if (IS.android) {
      location.href = androidBrowserIntent(finalUrl, finalUrl);
      setTimeout(() => showToast("안 열리면 오른쪽 위 메뉴에서 외부 브라우저로 열어주세요."), 600);
      return;
    }

    window.open(finalUrl, "_blank", "noopener,noreferrer");
  }

  function openShop(shopId) {
    const shop = getShop(shopId) || pageShop();
    if (!shop) return;
    const target = shop.targetUrl;

    if (IS.kakao) {
      openExternal(target);
      return;
    }

    if (IS.standalone || IS.ios) {
      location.href = target;
      return;
    }

    window.open(target, "_blank", "noopener,noreferrer");
  }

  function makeNaverShortcutIntent(shopId) {
    const shop = getShop(shopId);
    if (!shop) return "#";

    const shortcutUrl = shop.targetUrl;
    const iconUrl = absoluteUrl(shop.icon);
    const title = shop.shortName;
    const naverStore = "https://play.google.com/store/apps/details?id=com.nhn.android.search&hl=ko";

    return (
      `intent://addshortcut?` +
      `url=${encodeURIComponent(shortcutUrl)}` +
      `&icon=${encodeURIComponent(iconUrl)}` +
      `&title=${encodeURIComponent(title)}` +
      `&serviceCode=whois&version=11` +
      `#Intent;scheme=naversearchapp;action=android.intent.action.VIEW;` +
      `category=android.intent.category.BROWSABLE;` +
      `package=com.nhn.android.search;` +
      `S.browser_fallback_url=${encodeURIComponent(naverStore)};` +
      `end;`
    );
  }

  function addAndroidShortcut(shopId) {
    if (!IS.android) {
      showToast("Android에서 네이버앱 바로가기 추가 기능을 사용할 수 있어요.");
      return;
    }
    location.href = makeNaverShortcutIntent(shopId);
    setTimeout(() => showToast("네이버앱이 없다면 설치 화면으로 이동합니다."), 800);
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

  function ensureOverlay() {
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

  function closeOverlay() {
    const guide = $("#kakaotalk-guide");
    if (!guide) return;
    guide.classList.remove("show");
    guide.setAttribute("aria-hidden", "true");
  }

  function showKakaoOverlay() {
    ensureOverlay();
    const guide = $("#kakaotalk-guide");
    const desc = $("#kakao-desc");
    const btn = $("#open-ext-btn");
    const note = $("#kakao-subnote");

    if (!guide || !desc || !btn || !note) return;

    if (IS.ios) {
      desc.innerHTML = "카카오톡 내부에서는 <b>홈 화면 추가</b>가 잘 안 보일 수 있어요.<br>Safari에서 열면 설치가 가장 안정적입니다.";
      btn.textContent = "Safari로 열기";
      note.textContent = "안 열리면 카카오톡 메뉴에서 ‘Safari로 열기’를 선택하세요.";
    } else {
      desc.innerHTML = "카카오톡 내부에서는 <b>바로가기 추가</b>가 제한될 수 있어요.<br>기본 브라우저나 네이버앱에서 다시 열어주세요.";
      btn.textContent = "외부 브라우저로 열기";
      note.textContent = "안 열리면 오른쪽 위 메뉴에서 외부 브라우저 열기를 선택하세요.";
    }

    btn.onclick = () => openExternal(addParams(location.href, { openExternal: "1" }));
    guide.classList.add("show");
    guide.setAttribute("aria-hidden", "false");
  }

  function bindEvents() {
    $$('[data-open-shop]').forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        openShop(el.dataset.openShop);
      });
    });

    $$('[data-shortcut-shop]').forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        addAndroidShortcut(el.dataset.shortcutShop);
      });
    });

    $$('[data-copy-shop]').forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        copyShopLink(el.dataset.copyShop);
      });
    });

    $$('[data-open-external-current]').forEach((el) => {
      el.addEventListener("click", (event) => {
        event.preventDefault();
        openExternal(addParams(location.href, { openExternal: "1" }));
      });
    });

    $$('[data-close-overlay]').forEach((el) => el.addEventListener("click", closeOverlay));
    const guide = $("#kakaotalk-guide");
    if (guide) {
      guide.addEventListener("click", (event) => {
        if (event.target === guide) closeOverlay();
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeOverlay();
    });
  }

  function autoRedirectFromHomeIcon() {
    const shop = pageShop();
    if (!shop) return;

    const openedExternal = getParam("openExternal") === "1";

    // 핵심 iPhone 동작:
    // Safari에서 설치 페이지를 볼 때는 안내만 보여주고,
    // 홈 화면 아이콘으로 실행되어 standalone 상태가 되면 쿠팡/알리 링크로 자동 이동합니다.
    const shouldAuto = !openedExternal && IS.standalone;

    if (!shouldAuto || IS.kakao) return;

    const autoCard = $('[data-auto-card]');
    if (autoCard) autoCard.hidden = false;

    setTimeout(() => {
      location.replace(shop.targetUrl);
    }, 350);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch(() => null);
  }

  function init() {
    setPlatformClass();
    bindEvents();

    if (IS.kakao && getParam("openExternal") !== "1") {
      showKakaoOverlay();
    }

    autoRedirectFromHomeIcon();
    registerServiceWorker();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
