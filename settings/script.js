let allSettings = [];
const widgetIframe = document.getElementById('widget');
const widgetUrlInput = document.getElementById('widget-url');
const settingsContent = document.getElementById('settings-content');
const copyBtn = document.getElementById('copy-btn');

function getBaseWidgetUrl() {
  const url = new URL(window.location.href);
  let pathname = url.pathname;
  if (pathname.endsWith('/')) {
    pathname = pathname.substring(0, pathname.length - 1);
  }
  if (pathname.endsWith('/settings')) {
    pathname = pathname.substring(0, pathname.lastIndexOf('/settings'));
  }
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }
  return `${url.origin}${pathname}`;
}

async function init() {
  try {
    const res = await fetch('settings.json');
    const data = await res.json();
    allSettings = data.settings || [];
    renderSettings(allSettings);
    updatePreviewAndUrl();
  } catch (err) {
    console.error('Failed to load settings.json:', err);
    settingsContent.innerHTML = `<p style="color: #f85149; padding: 20px;">Error loading settings.json</p>`;
  }
}

function renderSettings(settings) {
  settingsContent.innerHTML = '';

  // Group settings by their "group" field
  const groups = {};
  settings.forEach(setting => {
    const groupName = setting.group || 'General';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(setting);
  });

  for (const [groupName, groupSettings] of Object.entries(groups)) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'group-container';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'group-title';
    titleDiv.textContent = groupName;
    groupDiv.appendChild(titleDiv);

    groupSettings.forEach(setting => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'setting-item';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'setting-info';

      const labelDiv = document.createElement('div');
      labelDiv.className = 'setting-label';
      labelDiv.textContent = setting.label;
      infoDiv.appendChild(labelDiv);

      if (setting.description) {
        const descDiv = document.createElement('div');
        descDiv.className = 'setting-desc';
        descDiv.textContent = setting.description;
        infoDiv.appendChild(descDiv);
      }

      itemDiv.appendChild(infoDiv);

      const controlDiv = document.createElement('div');
      controlDiv.className = 'setting-control';

      if (setting.type === 'checkbox') {
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `input-${setting.id}`;
        checkbox.checked = Boolean(setting.defaultValue);
        checkbox.addEventListener('change', updatePreviewAndUrl);

        const sliderSpan = document.createElement('span');
        sliderSpan.className = 'slider';

        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(sliderSpan);
        controlDiv.appendChild(switchLabel);
      } else if (setting.type === 'select') {
        const select = document.createElement('select');
        select.id = `input-${setting.id}`;
        select.className = 'control-input';

        if (Array.isArray(setting.options)) {
          setting.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value == setting.defaultValue) {
              option.selected = true;
            }
            select.appendChild(option);
          });
        }
        select.addEventListener('change', updatePreviewAndUrl);
        controlDiv.appendChild(select);
      } else if (setting.type === 'color') {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = `input-${setting.id}`;
        colorInput.className = 'control-input';
        colorInput.value = setting.defaultValue || '#000000';
        colorInput.addEventListener('input', updatePreviewAndUrl);
        controlDiv.appendChild(colorInput);
      } else if (setting.type === 'number') {
        const numberInput = document.createElement('input');
        numberInput.type = 'number';
        numberInput.id = `input-${setting.id}`;
        numberInput.className = 'control-input';
        if (setting.min !== undefined) numberInput.min = setting.min;
        if (setting.max !== undefined) numberInput.max = setting.max;
        if (setting.step !== undefined) numberInput.step = setting.step;
        numberInput.value = setting.defaultValue;
        numberInput.addEventListener('input', updatePreviewAndUrl);
        controlDiv.appendChild(numberInput);
      } else {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.id = `input-${setting.id}`;
        textInput.className = 'control-input';
        textInput.value = setting.defaultValue || '';
        textInput.addEventListener('input', updatePreviewAndUrl);
        controlDiv.appendChild(textInput);
      }

      itemDiv.appendChild(controlDiv);
      groupDiv.appendChild(itemDiv);
    });

    settingsContent.appendChild(groupDiv);
  }
}

function buildQueryString() {
  const params = new URLSearchParams();

  allSettings.forEach(setting => {
    const el = document.getElementById(`input-${setting.id}`);
    if (!el) return;

    if (setting.type === 'checkbox') {
      params.set(setting.id, el.checked ? 'true' : 'false');
    } else {
      const val = el.value.trim();
      if (val !== '') {
        params.set(setting.id, val);
      }
    }
  });

  return params.toString();
}

function updatePreviewAndUrl() {
  const queryString = buildQueryString();
  const baseUrl = getBaseWidgetUrl();
  const fullUrl = `${baseUrl}?${queryString}`;

  widgetUrlInput.value = fullUrl;
  widgetIframe.src = `../?${queryString}`;
}

function copyWidgetUrl() {
  if (!widgetUrlInput.value) return;
  navigator.clipboard.writeText(widgetUrlInput.value).then(() => {
    copyBtn.textContent = 'Copied to clipboard!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Click to copy URL';
      copyBtn.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    widgetUrlInput.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Click to copy URL';
    }, 2000);
  });
}

function resetToDefaults() {
  allSettings.forEach(setting => {
    const el = document.getElementById(`input-${setting.id}`);
    if (!el) return;

    if (setting.type === 'checkbox') {
      el.checked = Boolean(setting.defaultValue);
    } else {
      el.value = setting.defaultValue !== undefined ? setting.defaultValue : '';
    }
  });
  updatePreviewAndUrl();
}

document.addEventListener('DOMContentLoaded', init);
