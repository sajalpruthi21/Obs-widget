const settingsContainer = document.getElementById('settings-container');

function getSettingsDirectoryUrl() {
    const url = new URL(window.location.href);
    if (!url.pathname.endsWith('/')) {
        if (url.pathname.endsWith('.html') || url.pathname.endsWith('.htm')) {
            url.pathname = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
        } else {
            url.pathname += '/';
        }
    }
    return url.href;
}

const dirUrl = getSettingsDirectoryUrl();
const settingsJsonUrl = new URL('settings.json', dirUrl).href;

// Load our clean, self-hosted customizer without any external dependencies
const customizerUrl = new URL(`customizer.html?settingsJson=${encodeURIComponent(settingsJsonUrl)}`, dirUrl).href;
settingsContainer.src = customizerUrl;
console.log("Customizer iframe src:", settingsContainer.src);

function reloadWidget(data) {
    const parentUrl = getParentUrl();
    const widget = document.getElementById("widget");
    if (widget) {
        widget.src = `${parentUrl}?${data}`;
    }
}

function getParentUrl() {
    return new URL('../', dirUrl).href;
}

// Support cross-origin or local postMessage events from customizer
window.addEventListener("message", function (event) {
    if (event.data === "test" || (event.data && event.data.type === "test")) {
        const widget = document.getElementById("widget");
        if (widget && widget.contentWindow) {
            widget.contentWindow.postMessage("test", "*");
        }
        return;
    }
    if (typeof event.data === "string" && event.data.length > 0) {
        reloadWidget(event.data);
    } else if (event.data && typeof event.data === "object" && event.data.query) {
        reloadWidget(event.data.query);
    }
});
