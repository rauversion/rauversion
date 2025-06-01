import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmbedTrack from "./embeds/EmbedTrack";
import EmbedPlaylist from "./embeds/EmbedPlaylist";
import AudioPlayer from './audio_player'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './providers/ThemeProvider'



export default function EmbedRouter() {
  const queryClient = new QueryClient()

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/tracks/:id/embed" element={<EmbedTrack />} />
              <Route path="/playlists/:id/embed" element={<EmbedPlaylist />} />
            </Routes>
            <div className="hidden">
              <AudioPlayer />
            </div>
          </BrowserRouter>

        </ThemeProvider>

      </QueryClientProvider>

    </>
  );
}
