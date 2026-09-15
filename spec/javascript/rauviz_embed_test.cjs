const { test } = require("node:test")
const assert = require("node:assert/strict")
const { readFileSync } = require("node:fs")
const { runInNewContext } = require("node:vm")
const { transformSync } = require("esbuild")

const source = readFileSync("app/javascript/lib/rauviz-embed.ts", "utf8")
const moduleContext = { module: { exports: {} }, URL }
runInNewContext(transformSync(source, { loader: "ts", format: "cjs" }).code, moduleContext)
const { rauVizDocument } = moduleContext.module.exports
const props = {
  src: "https://example.com/my-patch.rauviz",
  controls: true,
  sensitivity: 2,
}

function mount(options = props) {
  const nodes = Object.fromEntries(["status", "message", "retry", "rau-viz"].map(id => [id, {
    hidden: false,
    replaceChildren() {},
    addEventListener(name, fn) { this[name] = fn },
  }]))
  const scripts = []
  const events = {}
  const instances = []
  const timers = new Map()
  const context = {
    document: {
      getElementById: id => nodes[id],
      createElement: () => ({ remove() { this.removed = true } }),
      head: { appendChild: script => scripts.push(script) },
    },
    window: { addEventListener: (name, fn) => { events[name] = fn } },
    setTimeout: fn => { const id = Symbol(); timers.set(id, fn); return id },
    clearTimeout: id => timers.delete(id),
    RauViz: {
      embed(config) {
        const instance = { config, events: {}, destroyed: false,
          on(name, fn) { this.events[name] = fn },
          destroy() { this.destroyed = true },
        }
        instances.push(instance)
        return instance
      },
    },
  }
  const html = rauVizDocument(options)
  runInNewContext(html.match(/<script>([\s\S]*)<\/script>/)[1], context)
  return { nodes, scripts, events, instances, timers, context }
}

test("passes saved patch, controls and sensitivity to the viewer and handles loaded", () => {
  const runtime = mount({ ...props, controls: false, sensitivity: 2.5 })
  assert.equal(runtime.scripts[0].src, "https://viz.rauversion.com/embed.js")
  runtime.scripts[0].onload()
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.instances[0].config)), {
    target: "#rau-viz", src: props.src, controls: false, sensitivity: 2.5,
  })
  runtime.instances[0].events.loaded({ patch: {} })
  assert.equal(runtime.nodes.status.hidden, true)
  assert.equal(runtime.timers.size, 0)
})

test("rejects executable URLs and prevents breaking out of the inline script", () => {
  const runtime = mount({ ...props, scriptUrl: "https://obsolete.example.com/embed.js" })
  assert.equal(runtime.scripts[0].src, "https://viz.rauversion.com/embed.js")
  assert.throws(() => rauVizDocument({ ...props, src: "data:text/html,test" }))
  const html = rauVizDocument({ ...props, src: 'https://example.com/?patch=</script><script>alert(1)</script>' })
  assert.equal((html.match(/<\/script>/g) || []).length, 1)
  assert.equal(html.includes("<script>alert"), false)
})

test("script failure offers retry and ignores stale load callbacks", () => {
  const runtime = mount()
  const firstScript = runtime.scripts[0]
  firstScript.onerror()
  assert.equal(runtime.nodes.retry.hidden, false)
  assert.equal(firstScript.removed, true)
  runtime.nodes.retry.click()
  firstScript.onload()
  assert.equal(runtime.instances.length, 0)
  runtime.scripts[1].onload()
  assert.equal(runtime.instances.length, 1)
})

test("timeout destroys a stalled viewer and ignores a late loaded event", () => {
  const runtime = mount()
  runtime.scripts[0].onload()
  Array.from(runtime.timers.values())[0]()
  assert.equal(runtime.instances[0].destroyed, true)
  runtime.instances[0].events.loaded()
  assert.equal(runtime.nodes.status.hidden, false)
  assert.equal(runtime.nodes.retry.hidden, false)
})

test("runtime errors and patch rejection show a recoverable error", () => {
  for (const event of ["error", "unhandledrejection"]) {
    const runtime = mount()
    runtime.scripts[0].onload()
    runtime.events[event]()
    assert.equal(runtime.instances[0].destroyed, true)
    assert.equal(runtime.nodes.retry.hidden, false)
    assert.match(runtime.nodes.message.textContent, /No se pudo cargar/)
  }
})

test("destroying one embed leaves other embed instances running", () => {
  const first = mount()
  const second = mount()
  first.scripts[0].onload()
  second.scripts[0].onload()
  first.events.pagehide()
  assert.equal(first.instances[0].destroyed, true)
  assert.equal(first.timers.size, 0)
  assert.equal(second.instances[0].destroyed, false)
})
