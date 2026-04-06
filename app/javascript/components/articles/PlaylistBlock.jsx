import React, { useCallback, useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
// Simple error boundary for playlist rendering
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Optionally log error
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded bg-destructive/10 border border-destructive text-destructive p-4">
          Error rendering playlist: {this.state.error?.message || "Unknown error"}
        </div>
      );
    }
    return this.props.children;
  }
}

import { Button } from "@/components/ui/button";
import PlaylistSelectorSingle from "../playlists/PlaylistSelectorSingle";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlaylistComponent from "../playlist";
import { cn } from "@/lib/utils";
import { GripVertical, ListMusic, PencilLine, Trash2, XCircle } from "lucide-react";

function stopEditorEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

export default function PlaylistBlock(props) {
  // Dante block props: node, updateAttributes, extension, selected
  const playlistId = props.node?.attrs?.playlistId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const isEditable = props.editor?.isEditable;

  const handleSelect = useCallback((id) => {
    props.updateAttributes({ playlistId: id || null });

    if (id) {
      setDialogOpen(false);
    }
  }, [props]);

  const removeBlock = useCallback((event) => {
    stopEditorEvent(event);

    if (props.deleteNode) {
      props.deleteNode();
      return;
    }

    if (props.editor && props.getPos) {
      const pos = props.getPos();
      if (typeof pos === "number") {
        props.editor.chain().focus().deleteRange({ from: pos, to: pos + props.node.nodeSize }).run();
      }
    }
  }, [props]);

  const openSelector = useCallback((event) => {
    stopEditorEvent(event);
    setDialogOpen(true);
  }, []);

  const clearPlaylist = useCallback((event) => {
    stopEditorEvent(event);
    props.updateAttributes({ playlistId: null });
  }, [props]);


  return (
    <NodeViewWrapper
      as="figure"
      className={cn(
        "graf--figure graf--playlist-block relative rounded-2xl border border-border/60 bg-card/40 p-4 text-sm shadow-sm",
        props.selected && "is-selected is-mediaFocused ring-1 ring-emerald-400/40"
      )}
      tabIndex={0}
    >
      {isEditable && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              data-drag-handle="true"
              className="inline-flex cursor-grab items-center justify-center rounded-md border border-border bg-muted/40 p-1 text-muted-foreground active:cursor-grabbing"
              title="Mover bloque"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">Playlist embed</span>
            <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5">
              {playlistId ? "Seleccionada" : "Vacío"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onMouseDown={stopEditorEvent}
              onClick={openSelector}
            >
              <PencilLine className="mr-2 h-4 w-4" />
              {playlistId ? "Cambiar playlist" : "Seleccionar playlist"}
            </Button>

            {playlistId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onMouseDown={stopEditorEvent}
                onClick={clearPlaylist}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Limpiar
              </Button>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="destructive"
              onMouseDown={stopEditorEvent}
              onClick={removeBlock}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar bloque
            </Button>
          </div>
        </div>
      )}

      <ErrorBoundary>
        {playlistId ? (
          <div className={cn(isEditable && "pointer-events-none select-none opacity-95")}>
            <PlaylistComponent playlistId={playlistId} />
          </div>
        ) : (
          <button
            type="button"
            onMouseDown={stopEditorEvent}
            onClick={openSelector}
            className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center transition hover:border-emerald-400/60 hover:bg-emerald-400/5"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-500">
              <ListMusic className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Inserta una playlist en el artículo</h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Busca por nombre y selecciona la playlist que quieres mostrar. Luego podrás cambiarla o quitarla desde este mismo bloque.
            </p>
            <span className="mt-4 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
              Seleccionar playlist
            </span>
          </button>
        )}
      </ErrorBoundary>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-background sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{playlistId ? "Cambiar playlist" : "Seleccionar playlist"}</DialogTitle>
            <DialogDescription>
              Busca la playlist que quieres incrustar en este bloque. La selección se guarda apenas la eliges.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-3">
            <PlaylistSelectorSingle
              value={playlistId}
              onChange={handleSelect}
              endpoint={props.endpoint}
              autoFocus
            />

            <p className="text-xs text-muted-foreground">
              Consejo: usa el nombre exacto o parte del título para encontrarla más rápido.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
}
