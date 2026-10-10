(function () {
  'use strict';

  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function parseSlideIndex(total) {
    const match = /^#\/(\d+)$/.exec(window.location.hash || '');
    if (!match) return 0;
    return Math.max(0, Math.min(total - 1, Number(match[1]) - 1));
  }

  function createButton(direction, label, shortcut, symbol) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'deck-human-control';
    button.dataset.humanControl = direction;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-keyshortcuts', shortcut);
    button.title = label;
    button.textContent = symbol;
    return button;
  }

  ready(function () {
    const pptHandoff = document.querySelector(
      'main[data-artifact-type="ppt-handoff"][data-navigation-mode="external-player"]'
    );
    if (pptHandoff) {
      document.body.classList.add('ppt-handoff-static');
      return;
    }
    const deck = document.querySelector(
      '[data-artifact-type="html-deck"][data-interaction-intent="navigate"]'
    );
    if (!deck || [...deck.attributes].some((attribute) => attribute.value.includes('{{'))) {
      return;
    }
    const slides = [...deck.querySelectorAll('.slide')];
    if (!slides.length || document.querySelector('.deck-human-controls')) return;

    const chinese = (document.documentElement.lang || '').toLowerCase().startsWith('zh');
    const labels = chinese
      ? { region: '演示文稿', slide: '幻灯片', previous: '上一页', next: '下一页', status: '当前页' }
      : { region: 'Presentation', slide: 'Slide', previous: 'Previous slide', next: 'Next slide', status: 'Current slide' };
    const title = document.querySelector('title')?.textContent?.trim();
    deck.setAttribute('role', 'region');
    deck.setAttribute('aria-roledescription', labels.region);
    deck.setAttribute('aria-label', title || labels.region);

    slides.forEach((slide, index) => {
      const heading = slide.querySelector('h1,h2,h3');
      const headingText = heading?.textContent?.replace(/\s+/g, ' ').trim();
      if (!slide.id) slide.id = `slide-${index + 1}`;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', labels.slide);
      slide.setAttribute(
        'aria-label',
        `${index + 1} / ${slides.length}${headingText ? `: ${headingText}` : ''}`
      );
    });

    const controls = document.createElement('nav');
    controls.className = 'deck-human-controls';
    controls.setAttribute('aria-label', labels.region);
    const previous = createButton('previous', labels.previous, 'ArrowLeft', '\u2190');
    const status = document.createElement('output');
    status.className = 'deck-human-status';
    status.dataset.humanStatus = '';
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-label', labels.status);
    const next = createButton('next', labels.next, 'ArrowRight', '\u2192');
    controls.append(previous, status, next);
    document.body.appendChild(controls);
    document.body.classList.add('human-controls-ready');

    function scrubOverviewIdentities() {
      document.querySelectorAll('.overview .slide [id], .overview .slide[id]')
        .forEach((element) => element.removeAttribute('id'));
      document.querySelectorAll('.overview .slide').forEach((slide) => {
        slide.removeAttribute('aria-current');
        slide.removeAttribute('aria-hidden');
        slide.removeAttribute('inert');
        slide.removeAttribute('role');
        slide.removeAttribute('aria-roledescription');
        slide.removeAttribute('aria-label');
      });
    }

    function update() {
      const index = parseSlideIndex(slides.length);
      const canonicalHash = `#/${index + 1}`;
      if (window.location.hash !== canonicalHash) {
        window.history.replaceState(null, '', canonicalHash);
      }
      scrubOverviewIdentities();
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.toggleAttribute('inert', !active);
        slide.setAttribute('aria-hidden', String(!active));
        if (active) slide.setAttribute('aria-current', 'step');
        else slide.removeAttribute('aria-current');
      });
      previous.disabled = index === 0;
      next.disabled = index === slides.length - 1;
      status.value = `${index + 1} / ${slides.length}`;
      status.textContent = status.value;
      const heading = slides[index].querySelector('h1,h2,h3');
      const headingText = heading?.textContent?.replace(/\s+/g, ' ').trim();
      status.setAttribute(
        'aria-label',
        `${labels.status} ${status.value}${headingText ? `: ${headingText}` : ''}`
      );
      deck.dataset.currentSlide = String(index + 1);
      deck.dataset.totalSlides = String(slides.length);
    }

    function navigate(offset) {
      const current = parseSlideIndex(slides.length);
      const target = Math.max(0, Math.min(slides.length - 1, current + offset));
      const nextHash = `#/${target + 1}`;
      if (window.location.hash === nextHash) update();
      else window.location.hash = nextHash;
    }

    previous.addEventListener('click', function () { navigate(-1); });
    next.addEventListener('click', function () { navigate(1); });
    deck.addEventListener('keydown', function (event) {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(
        'a[href],button,input,select,textarea,[contenteditable="true"],'
        + '[role="button"],[role="checkbox"],[role="radio"],[role="switch"]'
      )) return;
      event.stopPropagation();
    });
    controls.addEventListener('keydown', function (event) {
      if (!['Enter', ' '].includes(event.key)) return;
      if (!(event.target instanceof HTMLButtonElement)) return;
      event.preventDefault();
      event.stopPropagation();
      event.target.click();
    });
    window.addEventListener('hashchange', function () {
      window.requestAnimationFrame(update);
    });
    const slideStateObserver = new MutationObserver(function () {
      window.requestAnimationFrame(update);
    });
    slides.forEach((slide) => {
      slideStateObserver.observe(slide, {
        attributes: true,
        attributeFilter: ['class']
      });
    });
    const overviewObserver = new MutationObserver(scrubOverviewIdentities);
    overviewObserver.observe(document.body, { childList: true, subtree: true });
    scrubOverviewIdentities();
    window.requestAnimationFrame(update);
  });
})();
