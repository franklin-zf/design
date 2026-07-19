(() => {
  const durationGroup = document.querySelector('[data-duration-group]');
  const durationButtons = [...durationGroup.querySelectorAll('[data-duration]')];
  const readout = document.querySelector('[data-main-readout]');
  const actionButtons = [...document.querySelectorAll('[data-session-action]')];
  const actionLabels = [...document.querySelectorAll('[data-session-button-label]')];
  const pauseButton = document.querySelector('[data-pause-action]');
  const status = document.querySelector('[data-session-status]');
  const heroArc = document.querySelector('[data-hero-arc]');
  const progressDescription = document.querySelector('[data-hero-progress-desc]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let selectedDuration = 25;
  let elapsedSeconds = 0;
  let sessionState = 'ready';
  let ticker = null;
  let actionLocked = false;

  const animateText = (element) => {
    element.classList.remove('readout-change', 'status-change');
    void element.offsetWidth;
    element.classList.add(element === status ? 'status-change' : 'readout-change');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const setStatus = (symbol, label) => {
    const symbolNode = document.createElement('span');
    symbolNode.className = 'status-symbol';
    symbolNode.setAttribute('aria-hidden', 'true');
    symbolNode.textContent = symbol;
    status.replaceChildren(symbolNode, document.createTextNode(` ${label}`));
    animateText(status);
  };

  const updateProgress = () => {
    const totalSeconds = selectedDuration * 60;
    const progress = Math.min(100, (elapsedSeconds / totalSeconds) * 100);
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
    heroArc.style.setProperty('--progress', progress.toFixed(2));
    readout.textContent = formatTime(remaining);
    progressDescription.textContent = `${Math.round(progress)} percent complete`;

    if (remaining === 0 && sessionState !== 'complete') {
      window.clearInterval(ticker);
      ticker = null;
      sessionState = 'complete';
      setStatus('✓', 'Complete');
      actionButtons.forEach((button) => {
        button.querySelector('span').textContent = 'Begin again';
      });
      pauseButton.disabled = true;
    }
  };

  const startTicker = () => {
    window.clearInterval(ticker);
    ticker = window.setInterval(() => {
      elapsedSeconds += 1;
      updateProgress();
    }, 1000);
  };

  const updateActionLabels = (label) => {
    actionButtons.forEach((button) => {
      const labelNode = button.querySelector('span');
      labelNode.textContent = label;
      animateText(labelNode);
    });
    actionLabels.forEach((labelNode) => {
      if (!labelNode.closest('[data-session-action]')) labelNode.textContent = label;
    });
  };

  const commitSessionAction = () => {
    if (sessionState === 'ready' || sessionState === 'complete') {
      if (sessionState === 'complete') elapsedSeconds = 0;
      sessionState = 'focusing';
      setStatus('◒', 'Focusing');
      updateActionLabels('Pause');
      pauseButton.textContent = 'Pause';
      pauseButton.disabled = false;
      startTicker();
    } else if (sessionState === 'focusing') {
      sessionState = 'paused';
      window.clearInterval(ticker);
      ticker = null;
      setStatus('Ⅱ', 'Paused');
      updateActionLabels('Resume');
      pauseButton.textContent = 'Resume';
    } else {
      sessionState = 'focusing';
      setStatus('◒', 'Focusing');
      updateActionLabels('Pause');
      pauseButton.textContent = 'Pause';
      startTicker();
    }
    updateProgress();
  };

  const requestSessionAction = (source) => {
    if (actionLocked) return;
    actionLocked = true;
    source.classList.add('is-compressing');
    const delay = reduceMotion.matches ? 0 : 90;
    window.setTimeout(() => {
      source.classList.remove('is-compressing');
      commitSessionAction();
      actionLocked = false;
    }, delay);
  };

  const selectDuration = (index, shouldFocus = false) => {
    const button = durationButtons[index];
    selectedDuration = Number(button.dataset.duration);
    durationGroup.dataset.index = String(index);

    durationButtons.forEach((item, itemIndex) => {
      const selected = itemIndex === index;
      item.setAttribute('aria-checked', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    elapsedSeconds = 0;
    updateProgress();
    animateText(readout);
    if (sessionState === 'ready') updateActionLabels(`Begin ${selectedDuration} min`);
    if (shouldFocus) button.focus();
  };

  durationButtons.forEach((button, index) => {
    button.addEventListener('click', () => selectDuration(index));
  });

  durationGroup.addEventListener('keydown', (event) => {
    const currentIndex = durationButtons.findIndex((button) => button.getAttribute('aria-checked') === 'true');
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % durationButtons.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + durationButtons.length) % durationButtons.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = durationButtons.length - 1;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      selectDuration(nextIndex, true);
    }
  });

  actionButtons.forEach((button) => {
    button.addEventListener('click', () => requestSessionAction(button));
  });
  pauseButton.addEventListener('click', () => requestSessionAction(pauseButton));
})();
