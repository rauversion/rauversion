export function createImageDropHandler() {
  return function handleDrop(view, event, _slice, moved) {
    if (moved) return false

    const file = event?.dataTransfer?.files?.[0]

    if (!file || !file.type?.startsWith("image/")) {
      return false
    }

    const imageBlock = view.state.schema.nodes.ImageBlock

    if (!imageBlock) {
      return false
    }

    const objectUrlApi = window.URL || window.webkitURL

    if (!objectUrlApi?.createObjectURL) {
      return false
    }

    const coordinates = view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    })

    const position = coordinates?.pos ?? view.state.selection.from
    const node = imageBlock.create({
      file,
      url: objectUrlApi.createObjectURL(file),
      forceUpload: true,
    })

    event.preventDefault()

    const transaction = view.state.tr.insert(position, node).scrollIntoView()
    view.dispatch(transaction)

    return true
  }
}

export function createDanteEditorProps(className = "flex flex-col") {
  return {
    attributes: {
      class: className,
    },
    handleDrop: createImageDropHandler(),
  }
}
