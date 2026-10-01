const { test } = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { runInNewContext } = require("node:vm")
const { buildSync, transformSync } = require("esbuild")

const loaderCode = transformSync(readFileSync("app/javascript/lib/rauviz-embed.ts", "utf8"), { loader: "ts", format: "cjs" }).code
const audioCode = buildSync({
  stdin: {
    contents: 'export * from "./app/javascript/lib/rauviz-audio"; export * from "./app/javascript/lib/player-audio";',
    resolveDir: process.cwd(),
  },
  bundle: true, platform: "node", format: "cjs", write: false,
}).outputFiles[0].text
const flush = () => new Promise(resolve => setImmediate(resolve))
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function loader() {
  const scripts = [], timers = new Map()
  const window = {
    setTimeout(fn) { const id = Symbol(); timers.set(id, fn); return id },
    clearTimeout(id) { timers.delete(id) },
  }
  const runtime = { module: { exports: {} }, URL, window, document: {
    createElement: () => ({ remove() { this.removed = true } }),
    head: { appendChild: script => scripts.push(script) },
  } }
  runInNewContext(loaderCode, runtime)
  return { ...runtime.module.exports, scripts, timers, window }
}

function audioRuntime({ suspended = false } = {}) {
  const contexts = []
  class AudioContext {
    constructor() {
      this.state = suspended ? "suspended" : "running"
      this.destination = {}
      this.sources = []
      this.resumeCalls = 0
      this.activation = deferred()
      contexts.push(this)
    }
    async resume() {
      this.resumeCalls++
      if (this.state === "suspended") await this.activation.promise
      this.state = "running"
    }
    createMediaElementSource(audio) {
      if (this.sources.some(source => source.audio === audio)) throw new Error("Duplicate media source")
      const source = { audio, context: this, connections: [], connect(node) { this.connections.push(node) } }
      this.sources.push(source)
      return source
    }
  }
  const runtime = { module: { exports: {} }, window: { AudioContext }, Event }
  runInNewContext(audioCode, runtime)
  const audio = new EventTarget()
  audio.paused = true
  audio.ended = false
  return { ...runtime.module.exports, contexts, audio }
}

function viewer({ pending } = {}) {
  return {
    connections: [], disconnects: 0, signals: [], active: false,
    async connectAudio(source, options) {
      this.connections.push({ source, options })
      if (pending) await pending.promise
      this.active = true
    },
    disconnectAudio() { this.disconnects++; this.active = false },
    setAudioSignals(value) { this.signals.push(value) },
  }
}

function emit(audio, type) {
  if (type === "play") audio.paused = false
  if (type === "pause" || type === "ended" || type === "emptied") audio.paused = true
  audio.dispatchEvent(new Event(type))
}

test("loads one trusted SDK for concurrent blocks and later remounts", async () => {
  const runtime = loader()
  const first = runtime.loadRauViz(), second = runtime.loadRauViz()
  assert.equal(first, second)
  assert.equal(runtime.scripts.length, 1)
  assert.equal(runtime.scripts[0].src, "https://viz.rauversion.com/embed.js")
  const sdk = { embed() {} }
  runtime.window.RauViz = sdk
  runtime.scripts[0].onload()
  assert.equal(await first, sdk)
  assert.equal(await runtime.loadRauViz(), sdk)
  assert.equal(runtime.timers.size, 0)
  assert.equal(runtime.scripts.length, 1)
})

test("failed and timed-out SDK downloads can be retried", async () => {
  for (const failure of ["error", "timeout", "missing SDK"]) {
    const runtime = loader()
    const first = runtime.loadRauViz()
    if (failure === "error") runtime.scripts[0].onerror()
    else if (failure === "timeout") [...runtime.timers.values()][0]()
    else runtime.scripts[0].onload()
    await assert.rejects(first, /No se pudo cargar/)
    assert.equal(runtime.scripts[0].removed, true)
    assert.equal(runtime.scripts[0].onload, null)
    const retry = runtime.loadRauViz()
    const sdk = { embed() {} }
    runtime.window.RauViz = sdk
    runtime.scripts[1].onload()
    assert.equal(await retry, sdk)
  }
})

test("patch URLs reject executable schemes and remain data rather than inline scripts", () => {
  const { rauVizUrl } = loader()
  for (const value of ["", undefined, "data:text/html,test", "javascript:alert(1)", "/relative"]) {
    assert.equal(rauVizUrl(value), null)
  }
  assert.equal(rauVizUrl(" https://example.com/patch.rauviz "), "https://example.com/patch.rauviz")
  assert.ok(rauVizUrl('https://example.com/?patch=</script><script>alert(1)</script>').startsWith("https://example.com/"))
})

test("multiple blocks share one source and one audible output across track changes", async () => {
  const runtime = audioRuntime()
  const first = viewer(), second = viewer()
  const dispose = runtime.bindRauVizAudio(first, runtime.audio, () => {})
  runtime.bindRauVizAudio(second, runtime.audio, () => {})
  runtime.resumePlayerAudio(runtime.audio)
  emit(runtime.audio, "play")
  await flush()
  assert.equal(runtime.contexts.length, 1)
  const context = runtime.contexts[0]
  assert.equal(context.sources.length, 1)
  assert.equal(context.sources[0].connections.length, 1)
  assert.equal(first.connections[0].source, second.connections[0].source)
  assert.equal(first.connections[0].options.monitor, false)
  assert.equal(first.connections.length, 1)
  emit(runtime.audio, "pause")
  assert.equal(first.active, false)
  assert.equal(first.signals.at(-1).level, 0)
  emit(runtime.audio, "emptied")
  runtime.audio.src = "/next-song.mp3"
  emit(runtime.audio, "play")
  await flush()
  assert.equal(context.sources.length, 1)
  assert.equal(first.connections.length, 2)
  dispose()
  assert.equal(second.active, true)
  assert.equal(context.sources[0].connections[0], context.destination)
  emit(runtime.audio, "pause")
  emit(runtime.audio, "play")
  await flush()
  assert.equal(first.connections.length, 2)
  assert.equal(second.connections.length, 3)
})

test("connects a block mounted while music is already playing", async () => {
  const runtime = audioRuntime()
  runtime.audio.paused = false
  const instance = viewer(), statuses = []
  runtime.bindRauVizAudio(instance, runtime.audio, status => statuses.push(status))
  await flush()
  assert.equal(instance.active, true)
  assert.deepEqual(statuses, ["connecting", "connected"])
})

test("waits for browser activation before rerouting already audible music", async () => {
  const runtime = audioRuntime({ suspended: true })
  runtime.audio.paused = false
  const instance = viewer()
  runtime.bindRauVizAudio(instance, runtime.audio, () => {})
  const context = runtime.contexts[0]
  assert.equal(context.sources.length, 0)
  runtime.resumePlayerAudio(runtime.audio)
  assert.equal(context.resumeCalls, 2)
  context.activation.resolve()
  await flush()
  assert.equal(context.sources.length, 1)
  assert.equal(instance.active, true)
})

test("cleans a connection that resolves after pause or removal", async () => {
  for (const action of ["pause", "remove"]) {
    const runtime = audioRuntime(), pending = deferred()
    const instance = viewer({ pending }), statuses = []
    const dispose = runtime.bindRauVizAudio(instance, runtime.audio, status => statuses.push(status))
    emit(runtime.audio, "play")
    await flush()
    if (action === "pause") emit(runtime.audio, "pause")
    else dispose()
    const count = statuses.length
    pending.resolve()
    await flush()
    assert.equal(instance.active, false)
    assert.equal(statuses.length, count)
  }
})

test("rapid pause and replay during connection leave only one analyser", async () => {
  const runtime = audioRuntime(), pending = deferred(), instance = viewer({ pending })
  runtime.bindRauVizAudio(instance, runtime.audio, () => {})
  emit(runtime.audio, "play")
  await flush()
  emit(runtime.audio, "pause")
  emit(runtime.audio, "play")
  pending.resolve()
  await flush()
  assert.equal(instance.active, true)
  assert.equal(instance.connections.length, 1)
})

test("audio failures can retry without creating another source", async () => {
  const runtime = audioRuntime(), pending = deferred(), instance = viewer({ pending }), statuses = []
  runtime.bindRauVizAudio(instance, runtime.audio, status => statuses.push(status))
  emit(runtime.audio, "play")
  pending.reject(new Error("Unavailable"))
  await flush()
  assert.equal(statuses.at(-1), "error")
  instance.connectAudio = async function (source) { this.connections.push({ source }); this.active = true }
  runtime.resumePlayerAudio(runtime.audio)
  await flush()
  assert.equal(statuses.at(-1), "connected")
  assert.equal(runtime.contexts[0].sources.length, 1)
})
