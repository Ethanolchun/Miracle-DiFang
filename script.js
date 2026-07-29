const exclusiveGroups = document.querySelectorAll('[data-exclusive-group]');
const accessoryToggles = document.querySelectorAll('[data-toggle-target]');
const resetBtn = document.getElementById('resetBtn');

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
