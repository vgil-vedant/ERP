(function () {
  if (document.getElementById('uidai-chatbot-launcher')) return;

  const config = globalThis.ChatBotConfig ?? {};
  const baseUrl = config.baseUrl;

  if (!baseUrl) return;

  const botId = config.botId ?? 'default';
  const position = config.position ?? 'bottom-right';
  const baseOrigin = new URL(baseUrl).origin;
  const imageUrl = baseUrl.replace(/\/$/, '') + '/aadhaar-bot.png';

  const ENGLISH_ONLY = 'true' === 'true';

  function safeParseJSON(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function trackEvent(eventName, params) {
    globalThis.dataLayer = globalThis.dataLayer || [];
    globalThis.dataLayer.push({ event: eventName, ...params });
  }

  const CHAT_WIDTH = '31vw';
  const CHAT_HEIGHT = '72vh';
  const IMG_WIDTH = '68px';
  const IMG_HEIGHT = '78px';
  const MOBILE_BREAKPOINT = 768;
  const GRADIENT_BORDER = 'linear-gradient(92.44deg, #453D95 -2.31%, #82B1F9 49.15%, #FF00FF 104.98%)';
  const IFRAME_BACKGROUND = 'linear-gradient(#ffffff, #ffffff) padding-box, ' + GRADIENT_BORDER + ' border-box';
  const IFRAME_SHADOW = '0px 1.68px 10.89px 0px #0000001A, 0 0 0 8px #B2A6ED17';

  function isMobile() {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  const isRight = position !== 'bottom-left';
  let currentIsMobile = isMobile();
  let isMaximized = false;
  let hOffset = currentIsMobile ? '0px' : '40px';

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'fixed',
    bottom: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: isRight ? 'flex-end' : 'flex-start',
    zIndex: '1199',
  }, isRight ? { right: hOffset } : { left: hOffset });

  function updateClosedWrapperPosition() {
    hOffset = currentIsMobile ? '0px' : '40px';
    if (isRight) {
      wrapper.style.right = hOffset;
      wrapper.style.left = '';
    } else {
      wrapper.style.left = hOffset;
      wrapper.style.right = '';
    }
  }

  function shouldBeFullscreen() {
    return currentIsMobile || isMaximized;
  }

  const btn = document.createElement('button');
  btn.id = 'uidai-chatbot-launcher';
  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-label', 'Open Aadhaar Chatbot');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-haspopup', 'dialog');
  if (ENGLISH_ONLY) {
    btn.classList.add('notranslate', 'bhashini-skip-translation');
    btn.setAttribute('translate', 'no');
  }

  const img = document.createElement('img');
  img.src = imageUrl;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.classList.add('keep-visible');
  Object.assign(img.style, {
    width: '120px',
    height: IMG_HEIGHT,
    objectFit: 'contain',
    display: 'block',
    alignSelf: 'flex-end',
  });

  const btnLabel = document.createElement('span');
  btnLabel.textContent = 'Ask Me Anything!';
  if (ENGLISH_ONLY) {
    btnLabel.classList.add('notranslate', 'bhashini-skip-translation');
    btnLabel.setAttribute('translate', 'no');
  }
  Object.assign(btnLabel.style, {
    fontFamily: "'Noto Serif', serif",
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: '1.125rem',
    lineHeight: '2rem',
    letterSpacing: '0',
    verticalAlign: 'middle',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    paddingLeft: '20px',
    alignSelf: 'center',
  });

  const imgBg = document.createElement('div');
  Object.assign(imgBg.style, {
    background: '#2F2B69',
    width: '284px',
    paddingLeft : "12px",
    paddingRight : "12px",
    height: '52px',
    marginTop: '20px',
    borderRadius: '32px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  });
  imgBg.appendChild(btnLabel);
  imgBg.appendChild(img);
  btn.appendChild(imgBg);

  Object.assign(btn.style, {
    background: 'none',
    border: 'none',
    padding: '12px',
    paddingBottom: '16px',
    cursor: 'pointer',
    display: 'block',
    transition: 'transform 0.2s ease-in-out',
  });

  function applyLauncherVisual(state) {
    if (state === 'fullscreen') {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = 'block';
    img.src = imageUrl;
    img.style.width = IMG_WIDTH;
    img.style.height = IMG_HEIGHT;
    imgBg.style.justifyContent = 'center';
    if (state === 'floating') {
      imgBg.style.width = '112px';
      btnLabel.style.display = 'none';
    } else {
      imgBg.style.width = '284px';
      btnLabel.style.display = 'block';
    }
  }

  let iframe = null;
  let iframeContainer = null;

  function getOrCreateIframe() {
    if (iframe) return iframe;

    iframeContainer = document.createElement('div');
    Object.assign(iframeContainer.style, {
      zIndex: '1199',
      display: 'none',
      flexShrink: '0',
    });

    iframe = document.createElement('iframe');
    iframe.id = 'uidai-chatbot-iframe';
    const widgetToken = config.widgetToken ? encodeURIComponent(config.widgetToken) : '';
    const a11yQuery = encodeURIComponent(JSON.stringify({
      ...getCurrentA11yState(),
      lang: document.documentElement.lang || 'en',
    }));
    iframe.src = baseUrl.replace(/\/$/, '') + '/?botId=' + encodeURIComponent(botId) + (widgetToken ? '&widgetToken=' + widgetToken : '') + '&isMobile=' + currentIsMobile + '&a11y=' + a11yQuery;
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('title', 'Aadhaar Chatbot');

    btn.setAttribute('aria-controls', 'uidai-chatbot-iframe');

    Object.assign(iframe.style, {
      width: CHAT_WIDTH,
      height: CHAT_HEIGHT,
      border: '0.42px solid transparent',
      borderRadius: '10.05px',
      background: IFRAME_BACKGROUND,
      boxShadow: IFRAME_SHADOW,
      display: 'block',
    });

    iframeContainer.appendChild(iframe);
    btn.before(iframeContainer);
    return iframe;
  }

  let savedOverflow = null;
  function lockHostScroll() {
    if (savedOverflow !== null) return;
    savedOverflow = {
      html: document.documentElement.style.overflow,
      body: document.body.style.overflow,
    };
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }
  function unlockHostScroll() {
    if (savedOverflow === null) return;
    document.documentElement.style.overflow = savedOverflow.html;
    document.body.style.overflow = savedOverflow.body;
    savedOverflow = null;
  }

  function applyOpenLayout(fullscreen) {
    if (fullscreen) lockHostScroll();
    else unlockHostScroll();

    if (fullscreen) {
      Object.assign(wrapper.style, {
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        width: '100%',
        height: '100%',
        alignItems: 'stretch',
      });
      Object.assign(iframeContainer.style, {
        width: '100%',
        height: '100%',
      });
      Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '0',
        background: '#ffffff',
        boxShadow: 'none',
      });
    } else {
      Object.assign(wrapper.style, {
        top: '',
        left: isRight ? '' : hOffset,
        right: isRight ? hOffset : '',
        bottom: '0',
        width: '',
        height: '',
        alignItems: isRight ? 'flex-end' : 'flex-start',
      });
      Object.assign(iframeContainer.style, {
        width: '',
        height: '',
      });
      Object.assign(iframe.style, {
        width: CHAT_WIDTH,
        height: CHAT_HEIGHT,
        border: '0.42px solid transparent',
        borderRadius: '10.05px',
        background: IFRAME_BACKGROUND,
        boxShadow: IFRAME_SHADOW,
      });
    }
  }

  let childReady = false;
  let pendingA11yState = null;
  let a11yRetryTimer = null;

  function getCurrentA11yState() {
    const raw = localStorage.getItem('a11y-state');
    return raw ? (safeParseJSON(raw) ?? {}) : {};
  }

  function postA11yState(state) {
    if (!iframe) return;
    iframe.contentWindow.postMessage({
      type: 'A11Y_STATE',
      payload: { ...state, lang: document.documentElement.lang || 'en' },
    }, baseOrigin);
  }

  function scheduleA11yRetry() {
    if (a11yRetryTimer !== null) return;
    let attempts = 0;
    a11yRetryTimer = setInterval(function () {
      attempts++;
      if (childReady || attempts >= 5) {
        clearInterval(a11yRetryTimer);
        a11yRetryTimer = null;
        return;
      }
      if (pendingA11yState) postA11yState(pendingA11yState);
    }, 200);
  }

  function sendA11yState(state) {
    pendingA11yState = state;
    postA11yState(state);
    if (!childReady) scheduleA11yRetry();
  }

  function readAndPostA11yState() {
    sendA11yState(getCurrentA11yState());
  }

  function postViewportState() {
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'VIEWPORT_STATE',
      payload: { isMobile: currentIsMobile },
    }, baseOrigin);
  }

  globalThis.addEventListener('a11y-state-changed', function (e) {
    if (e.detail) sendA11yState(e.detail);
  });

  globalThis.addEventListener('storage', function (e) {
    if (e.key === 'a11y-state' && e.newValue) {
      const parsed = safeParseJSON(e.newValue);
      if (parsed) sendA11yState(parsed);
    }
  });

  function openChat() {
    trackEvent('chatbot_icon_click', { chatbot_version: 'v2' });
    const el = getOrCreateIframe();
    iframeContainer.style.display = 'block';
    document.documentElement.style.pointerEvents = 'none';
    wrapper.style.pointerEvents = 'auto';
    let blockStyle = document.getElementById('uidai-chatbot-block-footer');
    if (!blockStyle) {
      blockStyle = document.createElement('style');
      blockStyle.id = 'uidai-chatbot-block-footer';
      blockStyle.textContent = 'footer, footer * { pointer-events: none !important; }';
      document.head.appendChild(blockStyle);
    }
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Close Aadhaar Chatbot');

    currentIsMobile = isMobile();
    const fullscreen = shouldBeFullscreen();
    applyOpenLayout(fullscreen);
    applyLauncherVisual(fullscreen ? 'fullscreen' : 'floating');

    el.focus();
  }

  function maximizeChat() {
    if (isMobile() || !iframe || isMaximized) return;
    isMaximized = true;
    applyOpenLayout(true);
    applyLauncherVisual('fullscreen');
  }

  function minimizeChat() {
    if (isMobile() || !iframe || !isMaximized) return;
    isMaximized = false;
    applyOpenLayout(false);
    applyLauncherVisual('floating');
  }

  function closeChat() {
    if (!iframe) return;
    trackEvent('chatbot_close', { chatbot_version: 'v2' });
    isMaximized = false;
    iframeContainer.style.display = 'none';
    document.documentElement.style.pointerEvents = '';
    wrapper.style.pointerEvents = '';
    const blockStyle = document.getElementById('uidai-chatbot-block-footer');
    if (blockStyle) blockStyle.remove();
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open Aadhaar Chatbot');

    currentIsMobile = isMobile();
    updateClosedWrapperPosition();
    applyOpenLayout(false);
    applyLauncherVisual('closed');

    btn.focus();
  }

  btn.addEventListener('click', function () {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && iframeContainer && iframeContainer.style.display !== 'none') {
      closeChat();
    }
  });

  let resizeTimer = null;
  function handleResize() {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      const mobileNow = isMobile();
      if (mobileNow === currentIsMobile) return;
      currentIsMobile = mobileNow;

      const isOpen = iframeContainer && iframeContainer.style.display !== 'none';
      if (isOpen) {
        const fullscreen = shouldBeFullscreen();
        applyOpenLayout(fullscreen);
        applyLauncherVisual(fullscreen ? 'fullscreen' : 'floating');
      } else {
        updateClosedWrapperPosition();
      }

      postViewportState();
    }, 150);
  }
  globalThis.addEventListener('resize', handleResize);

  globalThis.addEventListener('message', function (event) {
    if (event.origin !== baseOrigin) return;
    // Firefox can't read our origin via location.ancestorOrigins, so the iframe asks.
    if (event.data === 'CHATBOT_HELLO' && iframe && event.source === iframe.contentWindow) {
      iframe.contentWindow.postMessage('CHATBOT_PARENT_HELLO', baseOrigin);
      return;
    }
    if (event.data === 'CHATBOT_CLOSE') {
      closeChat();
    }
    if (event.data === 'CHATBOT_READY') {
      childReady = true;
      readAndPostA11yState();
      postViewportState();
    }
    if (event.data === 'CHATBOT_MAXIMIZE') {
      maximizeChat();
    }
    if (event.data === 'CHATBOT_MINIMIZE') {
      minimizeChat();
    }
    if (event.data && event.data.type === 'CHATBOT_TRACK_EVENT' && typeof event.data.name === 'string') {
      trackEvent(event.data.name, event.data.params);
    }
  });

  wrapper.appendChild(btn);
  document.body.appendChild(wrapper);
})();
