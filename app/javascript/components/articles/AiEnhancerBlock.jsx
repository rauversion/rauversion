import React, { useState } from "react";
import { NodeViewWrapper } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AiEnhancerBlock(props) {
  // Dante block props: node, updateAttributes, extension, selected, editor
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState(null);

  const value = props.node?.attrs?.value || "";

  const handleEnhanceWithAI = async (e) => {
    e.preventDefault();
    setIsEnhancing(true);
    setError(null);

    try {
      const editor = props.editor;
      let selectedText = null;
      if (editor && editor.state && !editor.state.selection.empty) {
        selectedText = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );
      }
      const textToEnhance = selectedText || value;

      const response = await fetch('/ai_enhancements/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        body: JSON.stringify({
          text: textToEnhance,
          prompt: aiPrompt,
          scope: "block"
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Set current node to paragraph with empty text, then insert ai-enhancer-block after
        if (editor) {
          const pos = props.getPos ? props.getPos() : null;
          if (pos !== null && pos !== undefined) {
            editor
              .chain()
              .focus()
              .setNode("paragraph", {})
              .deleteSelection()
              .insertContentAt(pos + props.node.nodeSize, {
                type: "ai-enhancer-block",
                attrs: { value: data.enhanced_text }
              })
              .run();
          } else {
            // fallback: just append at the end
            editor
              .chain()
              .focus()
              .insertContent({
                type: "ai-enhancer-block",
                attrs: { value: data.enhanced_text }
              })
              .run();
          }
        }
        setDialogOpen(false);
        setAiPrompt("");
      } else {
        setError(data.error || "Enhancement failed");
      }
    } catch (err) {
      setError(err.message || "Enhancement request failed");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <NodeViewWrapper
      as="figure"
      data-drag-handle="true"
      className={`graf--figure graf--ai-enhancer-block ${props.selected ? "is-selected is-mediaFocused" : ""}`}
      tabIndex={0}
    >
      {value ? (
        <div className="rounded-lg bg-zinc-900 p-4 shadow border border-zinc-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <span className="font-semibold text-pink-400">AI Enhanced Text</span>
          </div>
          <div className="text-foreground whitespace-pre-line">{value}</div>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => setDialogOpen(true)}
          >
            Enhance Again
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enhance Text with AI</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEnhanceWithAI} className="space-y-4">
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  placeholder="Enter your prompt (e.g. 'Make this more concise')"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  required
                />
                {error && <div className="text-destructive">{error}</div>}
                <Button type="submit" disabled={isEnhancing} className="w-full">
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setDialogOpen(true)}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Enhance with AI
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enhance Text with AI</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEnhanceWithAI} className="space-y-4">
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  placeholder="Enter your prompt (e.g. 'Make this more concise')"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  required
                />
                {error && <div className="text-destructive">{error}</div>}
                <Button type="submit" disabled={isEnhancing} className="w-full">
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </NodeViewWrapper>
  );
}
