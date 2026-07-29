const exclusiveGroups = document.querySelectorAll('[data-exclusive-group]');
const accessoryToggles = document.querySelectorAll('[data-toggle-target]');
const resetBtn = document.getElementById('resetBtn');
const app = document.getElementById('app');
const loadingScreen = document.getElementById('loadingScreen');
const loadingBar = document.getElementById('loadingBar');
const loadingText = document.getElementById('loadingText');
const layers = [...document.querySelectorAll('.layer')];

function updateLoadingProgress(done, total) {
  const percentage = Math.round((done / total) * 100);
  loadingBar.style.width = `${percentage}%`;
  loadingText.textContent = `${percentage}%`;
}

async function waitForImage(image) {
  if (!image.complete) {
    await new Promise(resolve => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  }

  if (image.naturalWidth > 0 && typeof image.decode === 'function') {
    try {
      await image.decode();
    } catch (_) {
      // 图片已经加载但浏览器拒绝重复 decode 时，仍可正常显示。
    }
  }
}

async function revealWhenReady() {
  let done = 0;
  updateLoadingProgress(done, layers.length);

  await Promise.all(layers.map(async image => {
    await waitForImage(image);
    done += 1;
    updateLoadingProgress(done, layers.length);
  }));

  // 给浏览器一帧时间完成所有图层合成，避免揭幕瞬间闪烁。
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
  app.setAttribute('aria-busy', 'false');
  loadingScreen.setAttribute('aria-hidden', 'true');
}

function hideGroup(groupName) {
  document.querySelectorAll(`.${groupName}`).forEach(layer => {
    layer.hidden = true;
  });
}

function chooseExclusive(group, button) {
  const groupName = group.dataset.exclusiveGroup;
  hideGroup(groupName);
  group.querySelectorAll('.choice').forEach(item => item.classList.remove('active'));
  button.classList.add('active');

  const targetId = button.dataset.target;
  if (targetId !== 'none') {
    const target = document.getElementById(targetId);
    if (target) target.hidden = false;
  }
}

exclusiveGroups.forEach(group => {
  group.addEventListener('click', event => {
    const button = event.target.closest('.choice');
    if (!button) return;
    chooseExclusive(group, button);
  });
});

accessoryToggles.forEach(toggle => {
  toggle.addEventListener('change', () => {
    if (toggle.checked) {
      accessoryToggles.forEach(otherToggle => {
        if (otherToggle === toggle) return;
        otherToggle.checked = false;
        const otherTarget = document.getElementById(otherToggle.dataset.toggleTarget);
        if (otherTarget) otherTarget.hidden = true;
      });
    }

    const target = document.getElementById(toggle.dataset.toggleTarget);
    if (target) target.hidden = !toggle.checked;
  });
});

function resetAll() {
  exclusiveGroups.forEach(group => {
    const noneButton = group.querySelector('[data-target="none"]');
    if (noneButton) chooseExclusive(group, noneButton);
  });

  accessoryToggles.forEach(toggle => {
    toggle.checked = false;
    const target = document.getElementById(toggle.dataset.toggleTarget);
    if (target) target.hidden = true;
  });
}

resetBtn.addEventListener('click', resetAll);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

revealWhenReady();
