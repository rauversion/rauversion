import type { RauVizBlock } from "./blocks/types"

function publicUrl(value: string): string {
  const url = new URL(value.trim())
  if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid URL")
  return url.href
}

// Each document owns its viewer. Only load the fixed, trusted SDK: its nested
// iframe needs allow-same-origin for origin-checked messaging. Escape '<' so
// saved values cannot terminate the inline script.
export function rauVizDocument(props: RauVizBlock["props"]): string {
  const config = JSON.stringify({
    scriptUrl: "https://viz.rauversion.com/embed.js",
    src: publicUrl(props.src),
    controls: props.controls,
    sensitivity: Number.isFinite(props.sensitivity) && props.sensitivity >= 0 ? props.sensitivity : 2,
  }).replace(/</g, "\\u003c")

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body,#rau-viz{margin:0;width:100%;height:100%;overflow:hidden;background:#09090b;color:#fafafa}
body{font:14px system-ui,sans-serif}
#status{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;text-align:center;background:#09090b}
#status[hidden],button[hidden]{display:none}
button{font:inherit;color:inherit;background:#27272a;border:1px solid #52525b;border-radius:6px;padding:8px 16px;cursor:pointer}
</style></head>
<body><div id="rau-viz"></div>
<div id="status" role="status"><span id="message">Cargando RauViz…</span><button id="retry" hidden>Reintentar</button></div>
<script>
const config = ${config};
let viewer;
let script;
let timeout;
let attempt = 0;
const status = document.getElementById("status");
const message = document.getElementById("message");
const retry = document.getElementById("retry");

function dispose() {
  clearTimeout(timeout);
  if (viewer) {
    try { viewer.destroy(); } catch (_) {}
    viewer = null;
  }
  if (script) { script.remove(); script = null; }
  document.getElementById("rau-viz").replaceChildren();
}

function fail() {
  attempt++;
  dispose();
  message.textContent = "No se pudo cargar RauViz. Comprueba la URL del patch y tu conexión e inténtalo de nuevo.";
  status.hidden = false;
  retry.hidden = false;
}

function start() {
  const currentAttempt = ++attempt;
  dispose();
  status.hidden = false;
  retry.hidden = true;
  message.textContent = "Cargando RauViz…";
  timeout = setTimeout(() => { if (currentAttempt === attempt) fail(); }, 30000);
  script = document.createElement("script");
  script.src = config.scriptUrl;
  script.onerror = () => { if (currentAttempt === attempt) fail(); };
  script.onload = () => {
    if (currentAttempt !== attempt) return;
    try {
      viewer = RauViz.embed({ target: "#rau-viz", src: config.src, controls: config.controls, sensitivity: config.sensitivity });
      viewer.on("loaded", () => {
        if (currentAttempt !== attempt) return;
        clearTimeout(timeout);
        status.hidden = true;
      });
    } catch (_) { fail(); }
  };
  document.head.appendChild(script);
}

window.addEventListener("error", fail);
window.addEventListener("unhandledrejection", fail);
window.addEventListener("pagehide", () => { attempt++; dispose(); });
retry.addEventListener("click", start);
start();
</script></body></html>`
}
