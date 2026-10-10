#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadPlaywrightRuntime } from './lib/playwright-runtime.mjs';

const viewportMap = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
  'small-phone': { width: 320, height: 700 }
};
const textCollisionThreshold = 0.15;
const posterGeometryTolerance = 0.015;

function parseArgs(argv) {
  const target = argv.find((arg) => !arg.startsWith('--'));
  if (!target) {
    throw new Error(
      'Usage: node scripts/audit-human-factors.mjs <index.html> '
      + '[--viewports=desktop,mobile,small-phone] [--out=<audit.json>]'
    );
  }
  const viewportArg = argv.find((arg) => arg.startsWith('--viewports='));
  const viewports = (viewportArg?.slice('--viewports='.length)
    || 'desktop,mobile,small-phone').split(',').filter(Boolean);
  for (const viewport of viewports) {
    if (!viewportMap[viewport]) throw new Error(`unknown viewport: ${viewport}`);
  }
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  return {
    htmlPath: isAbsolute(target) ? target : resolve(target),
    outPath: outArg ? resolve(outArg.slice('--out='.length)) : null,
    viewports
  };
}

function record(checks, id, passed, evidence) {
  checks.push({ id, passed, evidence });
}

async function inspectSurfaceCollisions(page) {
  return page.evaluate((collisionThreshold) => {
    const root = document.querySelector('main[data-design-id]') || document.body;
    const tolerance = 2;
    const issues = [];
    const allowedPairs = new Set();
    const selectorFor = (element) => {
      if (element.id) return `#${element.id}`;
      for (const attribute of ['data-design-id', 'data-chart-id', 'data-image-slot']) {
        const value = element.getAttribute(attribute);
        if (value) return `[${attribute}="${value}"]`;
      }
      const classes = String(element.className || '').trim().split(/\s+/)
        .filter(Boolean).slice(0, 2).join('.');
      return classes
        ? `${element.tagName.toLowerCase()}.${classes}`
        : element.tagName.toLowerCase();
    };
    const intersects = (first, second) => (
      Math.min(first.right, second.right) - Math.max(first.left, second.left) > tolerance
      && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > tolerance
    );
    const overlapRatio = (first, second) => {
      const width = Math.max(
        0,
        Math.min(first.right, second.right) - Math.max(first.left, second.left)
      );
      const height = Math.max(
        0,
        Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
      );
      const smallerArea = Math.min(first.width * first.height, second.width * second.height);
      return smallerArea > 0 ? (width * height) / smallerArea : 0;
    };
    const isRendered = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0 && element.getClientRects().length > 0
        && rect.width > 1 && rect.height > 1;
    };

    const allowanceElements = [...root.querySelectorAll('[data-overlay-allow]')];
    const scopeElements = [...root.querySelectorAll('[data-overlay-scope]')];
    const validAllowance = new Map();
    for (const allowance of allowanceElements) {
      const token = allowance.getAttribute('data-overlay-allow')?.trim() || '';
      const scope = allowance.closest('[data-overlay-scope]');
      const matchingScopes = scopeElements.filter(
        (candidate) => candidate.getAttribute('data-overlay-scope') === token
      );
      const media = scope?.querySelector(
        'img,svg,canvas,video,picture,[data-chart-id],[data-image-slot]'
      );
      const valid = /^[a-z0-9][a-z0-9-]*$/.test(token)
        && scope?.getAttribute('data-overlay-scope') === token
        && matchingScopes.length === 1
        && Boolean(media);
      validAllowance.set(allowance, valid ? { token, scope } : null);
      if (!valid) {
        issues.push({
          kind: 'invalid-overlay-allowance',
          allowance: selectorFor(allowance),
          token
        });
      }
    }

    const textRects = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      if (text && parent && !parent.closest(
        '.summary-block,[hidden],script,style,noscript,template'
      )) {
        const style = getComputedStyle(parent);
        if (style.display !== 'none' && style.visibility !== 'hidden'
            && Number(style.opacity) !== 0) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width > 1 && rect.height > 1) {
              textRects.push({ node, parent, rect, text: text.slice(0, 48) });
            }
          }
        }
      }
      node = walker.nextNode();
    }

    const seenTextPairs = new Set();
    for (let first = 0; first < textRects.length; first += 1) {
      for (let second = first + 1; second < textRects.length; second += 1) {
        const a = textRects[first];
        const b = textRects[second];
        const positioned = [a.parent, b.parent].some((element) => (
          ['absolute', 'fixed'].includes(getComputedStyle(element).position)
        ));
        const threshold = positioned ? collisionThreshold : 0.35;
        if (a.node === b.node || !intersects(a.rect, b.rect)
            || overlapRatio(a.rect, b.rect) <= threshold) continue;
        const pair = [
          `${selectorFor(a.parent)}:${a.text}`,
          `${selectorFor(b.parent)}:${b.text}`
        ].sort().join('|');
        if (seenTextPairs.has(pair)) continue;
        seenTextPairs.add(pair);
        issues.push({
          kind: 'text-text',
          first: { selector: selectorFor(a.parent), text: a.text },
          second: { selector: selectorFor(b.parent), text: b.text }
        });
      }
    }

    const mediaElements = [...root.querySelectorAll(
      'img,svg,canvas,video,[data-chart-id],[data-image-slot]'
    )].filter(isRendered);
    const seenMediaPairs = new Set();
    for (const textRecord of textRects) {
      for (const media of mediaElements) {
        if (media.contains(textRecord.parent)
            || !intersects(textRecord.rect, media.getBoundingClientRect())) continue;
        const allowance = textRecord.parent.closest('[data-overlay-allow]');
        const allowanceState = allowance ? validAllowance.get(allowance) : null;
        if (allowanceState?.scope.contains(media)) {
          allowedPairs.add(`${allowanceState.token}:${selectorFor(media)}`);
          continue;
        }
        const pair = `${selectorFor(textRecord.parent)}:${selectorFor(media)}`;
        if (seenMediaPairs.has(pair)) continue;
        seenMediaPairs.add(pair);
        issues.push({
          kind: 'text-media',
          text: { selector: selectorFor(textRecord.parent), value: textRecord.text },
          media: selectorFor(media)
        });
      }
    }
    return { issues: issues.slice(0, 30), allowed_overlays: allowedPairs.size };
  }, textCollisionThreshold);
}

async function inspectPagedSurface(page) {
  return page.evaluate(() => {
    const root = document.querySelector('main[data-artifact-type="html-deck"]');
    const slides = [...root.querySelectorAll(':scope > .slide')];
    const current = slides.find((slide) => slide.getAttribute('aria-current') === 'step');
    const isVisible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1;
    };
    const intersects = (first, second) => (
      Math.min(first.right, second.right) - Math.max(first.left, second.left) > 1
      && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 1
    );
    const controlSelector = [
      '.deck-human-controls',
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      '[role="button"]'
    ].join(',');
    const floatingControls = [...document.querySelectorAll(controlSelector)]
      .filter((element) => !element.closest('.deck-human-controls')
        || element.classList.contains('deck-human-controls'))
      .filter((element) => ['fixed', 'sticky'].includes(getComputedStyle(element).position))
      .filter(isVisible);
    const textRects = [];
    if (current) {
      const currentRect = current.getBoundingClientRect();
      const walker = document.createTreeWalker(current, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.textContent.trim() && !node.parentElement?.closest(controlSelector)) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            const clippedRect = {
              left: Math.max(rect.left, currentRect.left, 0),
              right: Math.min(rect.right, currentRect.right, innerWidth),
              top: Math.max(rect.top, currentRect.top, 0),
              bottom: Math.min(rect.bottom, currentRect.bottom, innerHeight)
            };
            if (clippedRect.right - clippedRect.left > 1
                && clippedRect.bottom - clippedRect.top > 1) {
              textRects.push({
                rect: clippedRect,
                text: node.textContent.replace(/\s+/g, ' ').trim().slice(0, 48)
              });
            }
          }
        }
        node = walker.nextNode();
      }
    }
    const contentCollisions = [];
    for (const control of floatingControls) {
      const controlRect = control.getBoundingClientRect();
      for (const item of textRects) {
        if (intersects(controlRect, item.rect)) {
          contentCollisions.push({
            control: control.className || control.tagName.toLowerCase(),
            text: item.text
          });
        }
      }
    }
    const controlCollisions = [];
    for (let first = 0; first < floatingControls.length; first += 1) {
      for (let second = first + 1; second < floatingControls.length; second += 1) {
        if (intersects(
          floatingControls[first].getBoundingClientRect(),
          floatingControls[second].getBoundingClientRect()
        )) {
          controlCollisions.push([
            floatingControls[first].className || floatingControls[first].tagName.toLowerCase(),
            floatingControls[second].className || floatingControls[second].tagName.toLowerCase()
          ]);
        }
      }
    }
    return {
      current: Number(root.dataset.currentSlide),
      scroll_top: current?.scrollTop || 0,
      scroll_max: current ? Math.max(0, current.scrollHeight - current.clientHeight) : 0,
      visually_visible_slides: slides.filter(isVisible).length,
      content_collisions: contentCollisions,
      control_collisions: controlCollisions
    };
  });
}

async function baseChecks(page, checks) {
  const state = await page.evaluate(() => {
    const root = document.querySelector('main[data-design-id][data-reading-pattern]');
    if (!root) return { root: null };
    const style = getComputedStyle(root);
    const rect = root.getBoundingClientRect();
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    return {
      root: {
        artifact_type: root.getAttribute('data-artifact-type'),
        attention_context: root.getAttribute('data-attention-context'),
        navigation_mode: root.getAttribute('data-navigation-mode'),
        primary_preset: root.getAttribute('data-primary-preset'),
        style_preset: root.getAttribute('data-style-preset'),
        design_profile_digest: root.getAttribute('data-design-profile-digest'),
        human_factors_digest: root.getAttribute('data-human-factors-digest'),
        visible: style.display !== 'none' && style.visibility !== 'hidden'
          && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1
      },
      duplicate_ids: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
      horizontal_overflow: document.documentElement.scrollWidth > innerWidth + 2
    };
  });
  record(checks, 'bound-visible-root', Boolean(state.root?.visible), state.root);
  record(
    checks,
    'design-profile-binding',
    Boolean(state.root?.primary_preset && state.root?.style_preset)
      && /^[a-f0-9]{64}$/.test(state.root?.design_profile_digest || ''),
    {
      primary_preset: state.root?.primary_preset || null,
      style_preset: state.root?.style_preset || null,
      digest: state.root?.design_profile_digest || null
    }
  );
  record(
    checks,
    'human-factors-digest',
    /^[a-f0-9]{64}$/.test(state.root?.human_factors_digest || ''),
    state.root?.human_factors_digest || null
  );
  record(checks, 'unique-dom-identity', state.duplicate_ids?.length === 0, state.duplicate_ids);
  record(checks, 'horizontal-reflow', state.horizontal_overflow === false, state.horizontal_overflow);
  return state.root;
}

async function auditHtmlDeck(page, checks) {
  await page.waitForFunction(() => {
    const root = document.querySelector('main[data-artifact-type="html-deck"]');
    return root?.dataset.currentSlide && root?.dataset.totalSlides;
  });
  const initial = await page.evaluate(() => {
    const root = document.querySelector('main[data-artifact-type="html-deck"]');
    return {
      current: Number(root.dataset.currentSlide),
      total: Number(root.dataset.totalSlides),
      hash: location.hash,
      controls: document.querySelectorAll('.deck-human-controls').length,
      current_slides: root.querySelectorAll(':scope > .slide[aria-current="step"]').length,
      untitled_slides: [...root.querySelectorAll(':scope > .slide')]
        .filter((slide) => !slide.querySelector('h1,h2,h3')?.textContent?.trim()).length
    };
  });
  record(checks, 'html-stable-controls', initial.controls === 1, initial.controls);
  record(checks, 'html-single-current-slide', initial.current_slides === 1, initial.current_slides);
  record(checks, 'html-slide-orientation', initial.untitled_slides === 0, initial.untitled_slides);
  record(
    checks,
    'html-canonical-route',
    initial.hash === `#/${initial.current}`,
    initial.hash
  );

  const pageStates = [];
  const collisionStates = [];
  for (let index = 1; index <= initial.total; index += 1) {
    await page.evaluate((target) => {
      window.location.hash = `#/${target}`;
    }, index);
    await page.waitForFunction((target) => (
      document.querySelector('main[data-artifact-type="html-deck"]')?.dataset.currentSlide
        === String(target)
    ), index);
    await page.evaluate(() => new Promise((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
    }));
    collisionStates.push({ route: index, ...await inspectSurfaceCollisions(page) });
    pageStates.push({ position: 'top', ...await inspectPagedSurface(page) });
    await page.evaluate(() => {
      const current = document.querySelector(
        'main[data-artifact-type="html-deck"] > .slide[aria-current="step"]'
      );
      if (current) current.scrollTop = current.scrollHeight;
    });
    await page.evaluate(() => new Promise((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
    }));
    pageStates.push({ position: 'bottom', ...await inspectPagedSurface(page) });
    await page.evaluate(() => {
      const current = document.querySelector(
        'main[data-artifact-type="html-deck"] > .slide[aria-current="step"]'
      );
      if (current) current.scrollTop = 0;
    });
  }
  record(
    checks,
    'html-one-visible-page',
    pageStates.every((state) => state.visually_visible_slides === 1),
    pageStates.filter((state) => state.visually_visible_slides !== 1)
  );
  record(
    checks,
    'surface-collisions',
    collisionStates.every((state) => state.issues.length === 0),
    {
      issues: collisionStates.flatMap((state) => state.issues.map(
        (issue) => ({ route: state.route, ...issue })
      )),
      allowed_overlays: collisionStates.reduce(
        (total, state) => total + state.allowed_overlays,
        0
      )
    }
  );
  record(
    checks,
    'html-floating-control-occlusion',
    pageStates.every((state) => !state.content_collisions.length
      && !state.control_collisions.length),
    pageStates.filter((state) => state.content_collisions.length
      || state.control_collisions.length)
  );
  record(
    checks,
    'html-scroll-reaches-end',
    pageStates.filter((state) => state.position === 'bottom').every(
      (state) => Math.abs(state.scroll_top - state.scroll_max) <= 2
    ),
    pageStates.filter((state) => state.position === 'bottom'
      && Math.abs(state.scroll_top - state.scroll_max) > 2)
  );

  if (initial.total > 1) {
    const currentAfterTraversal = initial.total;
    const target = currentAfterTraversal > 1 ? currentAfterTraversal - 1 : 1;
    const direction = target > currentAfterTraversal ? 'next' : 'previous';
    await page.locator(`[data-human-control="${direction}"]`).click();
    await page.waitForFunction((expected) => (
      document.querySelector('main[data-artifact-type="html-deck"]')?.dataset.currentSlide
        === String(expected)
    ), target);
    const recoveryHash = await page.evaluate(() => location.hash);
    await page.reload();
    await page.waitForFunction((expected) => (
      document.querySelector('main[data-artifact-type="html-deck"]')?.dataset.currentSlide
        === String(expected)
    ), target);
    const expectedHash = `#/${target}`;
    record(
      checks,
      'html-refresh-recovery',
      recoveryHash === expectedHash
        && await page.evaluate(() => location.hash) === expectedHash,
      recoveryHash
    );
    const secondaryControl = page.locator(
      'button:not(.deck-human-control),input:not([type="hidden"]),select,textarea'
    ).first();
    if (await secondaryControl.count()) {
      const before = await page.evaluate(() => location.hash);
      await secondaryControl.focus();
      await secondaryControl.press('Enter');
      await page.waitForTimeout(50);
      const after = await page.evaluate(() => location.hash);
      record(checks, 'html-embedded-control-isolation', before === after, { before, after });
    } else {
      record(checks, 'html-embedded-control-isolation', true, 'not_applicable');
    }
  }
}

async function auditPptHandoff(page, checks) {
  await page.waitForFunction(() => document.body.classList.contains('ppt-handoff-static'));
  const state = await page.evaluate(() => {
    const root = document.querySelector('main[data-artifact-type="ppt-handoff"]');
    const slides = [...root.querySelectorAll(':scope > .slide')];
    const tolerance = 2;
    const contentBoundsIssues = [];
    const intersects = (first, second) => (
      Math.min(first.right, second.right) - Math.max(first.left, second.left) > tolerance
      && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > tolerance
    );
    const readableTextRects = (slide) => {
      const records = [];
      const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const parent = node.parentElement;
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (text && parent && !parent.closest(
          '.summary-block,[hidden],[aria-hidden="true"],script,style'
        )) {
          const style = getComputedStyle(parent);
          if (style.display !== 'none' && style.visibility !== 'hidden'
              && Number(style.opacity) !== 0) {
            const range = document.createRange();
            range.selectNodeContents(node);
            for (const rect of range.getClientRects()) {
              if (rect.width > 1 && rect.height > 1) {
                records.push({ parent, rect, text: text.slice(0, 48) });
              }
            }
          }
        }
        node = walker.nextNode();
      }
      return records;
    };
    for (const [index, slide] of slides.entries()) {
      const slideRect = slide.getBoundingClientRect();
      const textRects = readableTextRects(slide);
      for (const item of textRects) {
        if (item.rect.left < slideRect.left - tolerance
            || item.rect.right > slideRect.right + tolerance
            || item.rect.top < slideRect.top - tolerance
            || item.rect.bottom > slideRect.bottom + tolerance) {
          contentBoundsIssues.push({
            slide: index + 1,
            kind: 'outside-slide',
            text: item.text
          });
        }
      }
      const footer = slide.querySelector('footer');
      if (footer) {
        const footerStyle = getComputedStyle(footer);
        const footerRect = footer.getBoundingClientRect();
        if (footerStyle.display !== 'none' && footerStyle.visibility !== 'hidden'
            && Number(footerStyle.opacity) !== 0) {
          for (const item of textRects) {
            if (!footer.contains(item.parent) && intersects(footerRect, item.rect)) {
              contentBoundsIssues.push({
                slide: index + 1,
                kind: 'footer-occlusion',
                text: item.text
              });
            }
          }
        }
      }
    }
    return {
      surface_mode: root.getAttribute('data-surface-mode'),
      slide_count: slides.length,
      visible_slides: slides.filter((slide) => {
        const style = getComputedStyle(slide);
        const rect = slide.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden'
          && Number(style.opacity) !== 0 && rect.width > 1 && rect.height > 1;
      }).length,
      untitled_slides: slides.filter(
        (slide) => !slide.querySelector('h1,h2,h3')?.textContent?.trim()
      ).length,
      controls: document.querySelectorAll(
        'button,input:not([type="hidden"]),select,textarea,[role="button"],[tabindex]'
      ).length,
      active_animations: document.getAnimations().filter(
        (animation) => !['finished', 'idle'].includes(animation.playState)
      ).length,
      hash: location.hash,
      content_bounds_issues: contentBoundsIssues.slice(0, 20),
      slide_geometry: slides.map((slide, index) => {
        const rect = slide.getBoundingClientRect();
        return {
          slide: index + 1,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          aspect_ratio: rect.height > 0
            ? Math.round((rect.width / rect.height) * 10000) / 10000
            : 0
        };
      })
    };
  });
  record(
    checks,
    'ppt-projection-surface',
    state.surface_mode === 'projection-fixed'
      && state.slide_geometry.every(
        (geometry) => Math.abs(geometry.aspect_ratio - (16 / 9)) <= 0.02
      ),
    { surface_mode: state.surface_mode, slide_geometry: state.slide_geometry }
  );
  record(
    checks,
    'ppt-static-completeness',
    state.slide_count > 0 && state.visible_slides === state.slide_count,
    state
  );
  record(checks, 'ppt-slide-orientation', state.untitled_slides === 0, state.untitled_slides);
  record(
    checks,
    'ppt-slide-content-bounds',
    state.content_bounds_issues.length === 0,
    state.content_bounds_issues
  );
  record(checks, 'ppt-no-web-controls', state.controls === 0, state.controls);
  record(checks, 'ppt-no-running-motion', state.active_animations === 0, state.active_animations);
  const collisionState = await inspectSurfaceCollisions(page);
  record(
    checks,
    'surface-collisions',
    collisionState.issues.length === 0,
    collisionState
  );
  await page.keyboard.press('ArrowRight');
  record(
    checks,
    'ppt-external-player-ownership',
    await page.evaluate(() => location.hash) === state.hash,
    state.hash
  );
}

async function auditPoster(page, checks) {
  const state = await page.evaluate(() => {
    const root = document.querySelector('main[data-artifact-type="poster"]');
    const headings = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')];
    const h1 = headings.filter((heading) => heading.tagName === 'H1');
    const primaryRect = h1[0]?.getBoundingClientRect();
    const claimSelector = root.getAttribute('data-primary-claim') || '';
    let primaryClaims = [];
    if (/^#[A-Za-z][\w:.-]*$/.test(claimSelector)) {
      try { primaryClaims = [...root.querySelectorAll(claimSelector)]; }
      catch { primaryClaims = []; }
    }
    const claim = primaryClaims.length === 1 ? primaryClaims[0] : null;
    const claimRect = claim?.getBoundingClientRect();
    const claimStyle = claim ? getComputedStyle(claim) : null;
    const frameRect = root.getBoundingClientRect();
    const declaredWidth = Number(root.getAttribute('data-poster-frame-width'));
    const declaredHeight = Number(root.getAttribute('data-poster-frame-height'));
    const declaredAspect = Number(root.getAttribute('data-poster-frame-aspect'));
    const expectedAspect = declaredHeight > 0 ? declaredWidth / declaredHeight : 0;
    const renderedAspect = frameRect.height > 0 ? frameRect.width / frameRect.height : 0;
    const normalize = (value, origin, size) => (
      size > 0 ? Math.round(((value - origin) / size) * 10000) / 10000 : 0
    );
    let fullyVisible = Boolean(claim && claimRect && claimStyle
      && claimStyle.display !== 'none' && claimStyle.visibility !== 'hidden'
      && Number(claimStyle.opacity) !== 0 && claim.textContent.trim().length > 0
      && claimRect.width > 1 && claimRect.height > 1
      && claimRect.left >= -2 && claimRect.top >= -2
      && claimRect.right <= innerWidth + 2 && claimRect.bottom <= innerHeight + 2);
    let ancestor = claim?.parentElement;
    while (fullyVisible && ancestor && ancestor !== document.body) {
      const ancestorStyle = getComputedStyle(ancestor);
      if (['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowX)
          || ['hidden', 'clip', 'auto', 'scroll'].includes(ancestorStyle.overflowY)) {
        const ancestorRect = ancestor.getBoundingClientRect();
        fullyVisible = claimRect.left >= ancestorRect.left - 2
          && claimRect.right <= ancestorRect.right + 2
          && claimRect.top >= ancestorRect.top - 2
          && claimRect.bottom <= ancestorRect.bottom + 2;
      }
      ancestor = ancestor.parentElement;
    }
    return {
      h1_count: h1.length,
      first_heading_is_h1: headings[0] === h1[0],
      primary_visible: Boolean(primaryRect && primaryRect.width > 1 && primaryRect.height > 1),
      claim_selector: claimSelector,
      claim_count: primaryClaims.length,
      fully_visible: fullyVisible,
      frame: {
        surface_mode: root.getAttribute('data-surface-mode'),
        declared_width: declaredWidth,
        declared_height: declaredHeight,
        declared_aspect: declaredAspect,
        rendered_aspect: Math.round(renderedAspect * 10000) / 10000,
        valid: root.getAttribute('data-surface-mode') === 'poster-fixed'
          && Number.isFinite(declaredWidth) && declaredWidth > 0
          && Number.isFinite(declaredHeight) && declaredHeight > 0
          && Number.isFinite(declaredAspect) && declaredAspect > 0
          && Math.abs(expectedAspect - declaredAspect) <= 0.001
          && Math.abs(renderedAspect - declaredAspect) <= 0.01,
        regions: [...root.querySelectorAll('[data-poster-region]')].map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            id: element.getAttribute('data-poster-region'),
            x: normalize(rect.left, frameRect.left, frameRect.width),
            y: normalize(rect.top, frameRect.top, frameRect.height),
            width: Math.round((rect.width / frameRect.width) * 10000) / 10000,
            height: Math.round((rect.height / frameRect.height) * 10000) / 10000
          };
        })
      },
      controls: document.querySelectorAll(
        'button,input:not([type="hidden"]),select,textarea,[role="button"],[tabindex]'
      ).length
    };
  });
  record(
    checks,
    'poster-single-entry',
    state.h1_count === 1 && state.first_heading_is_h1 && state.primary_visible,
    state
  );
  record(
    checks,
    'poster-primary-claim',
    state.claim_count === 1 && state.fully_visible,
    {
      selector: state.claim_selector,
      count: state.claim_count,
      fully_visible: state.fully_visible
    }
  );
  record(
    checks,
    'poster-fixed-frame',
    state.frame.valid && state.frame.regions.length >= 3,
    state.frame
  );
  record(checks, 'poster-static-surface', state.controls === 0, state.controls);
  const collisionState = await inspectSurfaceCollisions(page);
  record(
    checks,
    'surface-collisions',
    collisionState.issues.length === 0,
    collisionState
  );
}

async function auditViewport(browser, htmlPath, viewportName) {
  const remoteRequests = [];
  const context = await browser.newContext({ viewport: viewportMap[viewportName] });
  await context.route('**/*', async (route) => {
    if (/^https?:/i.test(route.request().url())) {
      remoteRequests.push(route.request().url());
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  const page = await context.newPage();
  const checks = [];
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => new Promise((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(resolveFrame));
    }));
    const root = await baseChecks(page, checks);
    if (root?.artifact_type === 'html-deck') await auditHtmlDeck(page, checks);
    else if (root?.artifact_type === 'ppt-handoff') await auditPptHandoff(page, checks);
    else if (root?.artifact_type === 'poster') await auditPoster(page, checks);
    else record(checks, 'supported-artifact-type', false, root?.artifact_type || null);
    record(checks, 'no-remote-request', remoteRequests.length === 0, remoteRequests);
  } finally {
    await context.close();
  }
  return {
    viewport: viewportName,
    dimensions: viewportMap[viewportName],
    status: checks.every((check) => check.passed) ? 'passed' : 'failed',
    checks
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const { chromium } = await loadPlaywrightRuntime();
  const browser = await chromium.launch({ headless: true });
  try {
    const observations = [];
    for (const viewport of args.viewports) {
      observations.push(await auditViewport(browser, args.htmlPath, viewport));
    }
    const posterObservations = observations.filter((observation) => (
      observation.checks.some((check) => check.id === 'poster-fixed-frame')
    ));
    if (posterObservations.length) {
      const reference = posterObservations[0];
      const referenceFrame = reference.checks.find(
        (check) => check.id === 'poster-fixed-frame'
      ).evidence;
      const referenceRegions = new Map(
        referenceFrame.regions.map((region) => [region.id, region])
      );
      for (const observation of posterObservations) {
        const frame = observation.checks.find(
          (check) => check.id === 'poster-fixed-frame'
        ).evidence;
        const regions = new Map(frame.regions.map((region) => [region.id, region]));
        const differences = [];
        if (referenceRegions.size < 3 || referenceRegions.size !== regions.size) {
          differences.push('poster must expose at least three stable regions');
        } else {
          for (const [id, region] of referenceRegions) {
            const other = regions.get(id);
            if (!other) {
              differences.push(`missing poster region ${id}`);
              continue;
            }
            for (const key of ['x', 'y', 'width', 'height']) {
              if (Math.abs(region[key] - other[key]) > posterGeometryTolerance) {
                differences.push(
                  `${id}.${key} changed from ${region[key]} to ${other[key]}`
                );
              }
            }
          }
        }
        record(
          observation.checks,
          'poster-fixed-composition',
          differences.length === 0,
          { reference_viewport: reference.viewport, differences }
        );
        observation.status = observation.checks.every((check) => check.passed)
          ? 'passed'
          : 'failed';
      }
    }
    const result = {
      schema_version: 'design-human-factors-audit/v1',
      artifact: args.htmlPath,
      status: observations.every((item) => item.status === 'passed')
        ? 'passed'
        : 'failed',
      observations
    };
    const output = `${JSON.stringify(result, null, 2)}\n`;
    if (args.outPath) {
      mkdirSync(dirname(args.outPath), { recursive: true });
      writeFileSync(args.outPath, output);
    }
    process.stdout.write(output);
    if (result.status !== 'passed') process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`Human-factor audit failed: ${error.message}`);
  process.exit(1);
});
