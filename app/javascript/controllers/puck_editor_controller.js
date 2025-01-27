import { Controller } from '@hotwired/stimulus';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Puck, DropZone } from "@measured/puck";
import "@measured/puck/puck.css";
import PlaylistComponent from '../components/playlist';

import {
  ImageUploadField,
  ColorPicker,
  MultiList,
  MultiListConfig,
  HeroSection,
  HeroSectionConfig,
  Title,
  TitleConfig,
  Subtitle,
  SubtitleConfig,
  Carousel,
  CarouselConfig,
  HeadingBlock,
  HeadingBlockConfig,
  Grid,
  GridConfig,
  Flex,
  FlexConfig
} from '../components/puck';

// Create Puck component config
const config = {
  components: {
    MultiList: {
      ...MultiListConfig,
      render: MultiList,
    },
    Example: {
      render: () => {
        return (
          <div>
            <DropZone zone="my-content" />
          </div>
        );
      },
    },
    Grid: {
      ...GridConfig,
      render: Grid,
    },
    Flex: {
      ...FlexConfig,
      render: Flex,
    },
    Playlist: {
      fields: {
        playlistId: {
          type: "text",
          label: "Playlist ID",
        },
        theme: {
          type: "text",
          label: "Theme",
          defaultValue: "dark",
        },
      },
      render: ({ playlistId, theme }) => {
        return <PlaylistComponent playlistId={playlistId} theme={theme} />;
      },
    },
    HeroSection: {
      ...HeroSectionConfig,
      render: HeroSection,
    },
    Title: {
      ...TitleConfig,
      render: Title,
    },
    Subtitle: {
      ...SubtitleConfig,
      render: Subtitle,
    },
    Carousel: {
      ...CarouselConfig,
      render: Carousel,
    },
    HeadingBlock: {
      ...HeadingBlockConfig,
      render: HeadingBlock,
    },
  },

  categories: {
    player: {
      components: ["Playlist"],
    },
    layout: {
      components: ["Grid", "Flex", "Space"],
    },
    typography: {
      components: ["Heading", "Title", "Subtitle", "Text"],
    },
    interactive: {
      title: "Actions",
      components: ["Button"],
    },
    other: {
      title: "Other",
      components: ["Card", "Hero", "Logos", "Stats"],
    },
  },
  root: {
    fields: {
      background: {
        type: "custom",
        label: "Background Color",
        defaultValue: "#ffffff",
        render: ColorPicker,
      },
      textColor: {
        type: "custom",
        label: "Text Color",
        defaultValue: "#000000",
        render: ColorPicker,
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "text-left" },
          { label: "Center", value: "text-center" },
          { label: "Right", value: "text-right" },
        ],
        defaultValue: "text-left",
      },
    },
    render: ({ children }) => {
      return <div className="flex flex-col min-h-screen">{children}</div>;
    },
  },
};
 
// Describe the initial data
const initialData = {};

// Save the data to your database
function save(data) {
  console.log("Saving data:", data);
  // Implement your save logic here
}

// Render Puck editor
function Editor() {
  return (
    <Puck config={config} data={initialData} onPublish={save} />
  );
}

export default class extends Controller {
  static targets = []

  initialize() {
    const root = createRoot(this.element);
    root.render(<Editor />);
  }

  disconnect() {
    // Cleanup
  }
}