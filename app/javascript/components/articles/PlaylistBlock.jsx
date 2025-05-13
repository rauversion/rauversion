import React, { useState } from "react";
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
import PlaylistSelectorSingle from "../puck/PlaylistSelectorSingle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlaylistComponent from "../puck/Playlist";

export default function PlaylistBlock(props) {
  // Dante block props: node, updateAttributes, extension, selected
  const playlistId = props.node?.attrs?.playlistId;
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSelect = (id) => {
    if (id) {
      props.updateAttributes({ playlistId: id });
      setDialogOpen(false);
    }
  };

  return (
    <NodeViewWrapper
      as="figure"
      data-drag-handle="true"
      className={`bg-white/5 rounded-md relative text-sm graf--figure graf--playlist-block ${props.selected ? "is-selected is-mediaFocused" : ""}`}
      tabIndex={0}
    >
      <div className="flex justify-end absolute right-10 top-[40px]">
        <Button
          size="sm"
          variant="destructive"
          className="mb-2"
          onClick={() => {
            if (props.deleteNode) {
              props.deleteNode();
            } else if (props.editor && props.getPos) {
              // Remove node at current position
              const pos = props.getPos();
              if (typeof pos === "number") {
                props.editor.chain().focus().deleteRange({ from: pos, to: pos + props.node.nodeSize }).run();
              }
            }
          }}
        >
          Remove
        </Button>
      </div>
      <ErrorBoundary>
        {playlistId ? (
          <PlaylistComponent playlistId={playlistId} />
        ) : (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDialogOpen(true)}
            >
              Select Playlist
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select a Playlist</DialogTitle>
                </DialogHeader>
                <PlaylistSelectorSingle onChange={handleSelect} endpoint={props.endpoint} />
              </DialogContent>
            </Dialog>
          </>
        )}
      </ErrorBoundary>
    </NodeViewWrapper>
  );
}
