const exclusiveGroups = document.querySelectorAll('[data-exclusive-group]');
const accessoryToggles = document.querySelectorAll('[data-toggle-target]');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const saveToast = document.getElementById('saveToast');
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


let toastTimer;

function showToast(message) {
  if (!saveToast) return;
  window.clearTimeout(toastTimer);
  saveToast.textContent = message;
  saveToast.classList.add('show');
  saveToast.setAttribute('aria-hidden', 'false');
  toastTimer = window.setTimeout(() => {
    saveToast.classList.remove('show');
    saveToast.setAttribute('aria-hidden', 'true');
  }, 2200);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('图片生成失败'));
    }, 'image/png');
  });
}

async function saveCurrentLook() {
  const baseLayer = document.querySelector('.layer.base');
  if (!baseLayer || !baseLayer.naturalWidth || !baseLayer.naturalHeight) {
    showToast('图片尚未准备完成，请稍后再试');
    return;
  }

  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = '正在保存…';

  try {
    const canvas = document.createElement('canvas');
    canvas.width = baseLayer.naturalWidth;
    canvas.height = baseLayer.naturalHeight;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('浏览器不支持图片合成');

    // 与展示区保持一致：导出纯白背景，再按页面图层顺序叠加当前可见图片。
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      if (layer.hidden) continue;
      await waitForImage(layer);
      if (layer.naturalWidth > 0) {
        context.drawImage(layer, 0, 0, canvas.width, canvas.height);
      }
    }

    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
      '-',
      String(date.getHours()).padStart(2, '0'),
      String(date.getMinutes()).padStart(2, '0')
    ].join('');

    link.href = url;
    link.download = `奇迹狄芳换装-${stamp}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('当前搭配已保存为 PNG');
  } catch (error) {
    console.error(error);
    showToast('保存失败，请刷新页面后重试');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

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
saveBtn.addEventListener('click', saveCurrentLook);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

revealWhenReady();
