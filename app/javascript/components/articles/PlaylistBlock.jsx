import React, { useState } from "react";

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
import { Plus } from "lucide-react";
import PlaylistSelectorSingle from "../puck/PlaylistSelectorSingle";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PlaylistComponent from "../puck/playlist";

export default function PlaylistBlock(props) {
  // Dante block props: node, updateAttributes, extension, selected, showDialog, setShowDialog
  const playlistId = props.node?.attrs?.playlistId;
  // Dialog open state is now controlled by props.showDialog (from config), fallback to local state for safety
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const dialogOpen = props.showDialog || localDialogOpen;

  const handleSelect = (id) => {
    if (id) {
      props.updateAttributes({ playlistId: id });
      if (props.setShowDialog) {
        props.setShowDialog(false);
      } else {
        setLocalDialogOpen(false);
      }
    }
  };

  // If dialog should be open, show it
  if (dialogOpen) {
    return (
      <Dialog open={dialogOpen} onOpenChange={props.setShowDialog || setLocalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Playlist</DialogTitle>
          </DialogHeader>
          <PlaylistSelectorSingle onChange={handleSelect} />
        </DialogContent>
      </Dialog>
    );
  }

  // If no playlist selected, show placeholder with button to open dialog
  if (!playlistId) {
    return (
      <div className="rounded-lg bg-zinc-900 p-4 flex items-center gap-4 border border-dashed border-zinc-700">
        <Plus className="w-6 h-6 text-zinc-400" />
        <span className="text-zinc-400">No playlist selected.</span>
        <Button
          size="sm"
          variant="secondary"
          className="ml-2"
          onClick={() => {
            if (props.setShowDialog) {
              props.setShowDialog(true);
            } else {
              setLocalDialogOpen(true);
            }
          }}
        >
          Select Playlist
        </Button>
      </div>
    );
  }

  // Render the main PlaylistComponent
  return (
    <figure
      data-drag-handle="true"
      className={`text-sm graf--figure graf--playlist-block ${props.selected ? "is-selected is-mediaFocused" : ""}`}
      tabIndex={0}
    >
      <ErrorBoundary>
        <PlaylistComponent playlistId={playlistId} />
      </ErrorBoundary>
    </figure>
  );
}
