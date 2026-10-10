(function () {
  'use strict';

  const loader = document.currentScript;
  const deck = document.querySelector(
    'main[data-artifact-type="html-deck"][data-navigation-mode="paged"]'
  );
  if (!loader || !deck || [...deck.attributes].some(
    (attribute) => attribute.value.includes('{{')
  )) return;

  const runtimeSource = loader.dataset.deckRuntime;
  if (!runtimeSource) return;
  const runtime = document.createElement('script');
  runtime.src = runtimeSource;
  runtime.dataset.designDeckRuntime = '';
  document.body.appendChild(runtime);
})();
