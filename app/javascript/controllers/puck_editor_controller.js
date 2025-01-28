import { Controller } from "@hotwired/stimulus";
import { createRoot } from "react-dom/client";
import React from "react";
import { Puck, DropZone } from "@measured/puck";
import "@measured/puck/puck.css";
import { put, get } from '@rails/request.js';
import PlaylistComponent from '../components/playlist';

import {
  ColorPicker,
  MultiList,
  MultiListConfig,
  HeroSection,
  HeroSectionConfig,
  Title,
  TitleConfig,
  Text,
  TextConfig,
  Carousel,
  CarouselConfig,
  HeadingBlock,
  HeadingBlockConfig,
  Grid,
  GridConfig,
  Flex,
  FlexConfig,
  ButtonBlock, ButtonBlockConfig,
  Slider, SliderConfig, 
  CardBlock, CardBlockConfig, 
  Section, SectionConfig,
  ImageBlock, ImageBlockConfig,
  ProductCard, ProductCardConfig
} from '../components/puck';

// Create Puck component config
const config = {
  components: {
    MultiList: {
      fields: MultiListConfig.fields,
      defaultProps: MultiListConfig.defaultProps,
      render: MultiList,
    },
    ProductCard: {
      fields: ProductCardConfig.fields,
      defaultProps: ProductCardConfig.defaultProps,
      render: ProductCard,
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
      fields: GridConfig.fields,
      defaultProps: GridConfig.defaultProps,
      render: Grid,
    },
    Flex: {
      fields: FlexConfig.fields,
      defaultProps: FlexConfig.defaultProps,
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
      defaultProps: {
        playlistId: "",
        theme: "dark"
      },
      render: ({ playlistId, theme }) => {
        return <PlaylistComponent playlistId={playlistId} theme={theme} />;
      },
    },
    HeroSection: {
      fields: HeroSectionConfig.fields,
      defaultProps: HeroSectionConfig.defaultProps,
      render: HeroSection,
    },
    Title: {
      fields: TitleConfig.fields,
      defaultProps: TitleConfig.defaultProps,
      render: Title,
    },
    Text: {
      fields: TextConfig.fields,
      defaultProps: TextConfig.defaultProps,
      render: Text,
    },
    /*Subtitle: {
      fields: SubtitleConfig.fields,
      defaultProps: SubtitleConfig.defaultProps,
      render: Subtitle,
    },*/
    Carousel: {
      fields: CarouselConfig.fields,
      defaultProps: CarouselConfig.defaultProps,
      render: Carousel,
    },
    HeadingBlock: {
      fields: HeadingBlockConfig.fields,
      defaultProps: HeadingBlockConfig.defaultProps,
      render: HeadingBlock,
    },
    ButtonBlock: {
      fields: ButtonBlockConfig.fields,
      defaultProps: ButtonBlockConfig.defaultProps,
      render: ButtonBlock,
    },
    Slider: {
      fields: SliderConfig.fields,
      defaultProps: SliderConfig.defaultProps,
      render: Slider,
    },
    CardBlock: {
      fields: CardBlockConfig.fields,
      defaultProps: CardBlockConfig.defaultProps,
      render: CardBlock,
    },
    Section: {
      fields: SectionConfig.fields,
      defaultProps: SectionConfig.defaultProps,
      render: Section,
    },
    ImageBlock: {
      fields: ImageBlockConfig.fields,
      defaultProps: ImageBlockConfig.defaultProps,
      render: ImageBlock,
    },
    Button: {
      fields: ButtonBlockConfig.fields,
      defaultProps: ButtonBlockConfig.defaultProps,
      render: ButtonBlock,
    },
  },

  categories_disabled_do_not_use: {
    player: {
      components: ["Playlist"],
    },
    layout: {
      components: ["Grid", "Flex", "Space"],
    },
    typography: {
      components: ["Heading", "Text"],
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
        render: ColorPicker,
      },
      textColor: {
        type: "custom",
        label: "Text Color",
        render: ColorPicker,
      },
      alignment: {
        type: "select",
        label: "Alignment",
        options: [
          { label: "Left", value: "text-left" },
          { label: "Center", value: "text-center" },
          { label: "Right", value: "text-right" },
        ]
      },
    },
    defaultProps: {
      background: "#ffffff",
      textColor: "#000000",
      alignment: "text-left",
    },
    render: ({ background, textColor, alignment, children }) => {
      return <div
      style={{ backgroundColor: background, color: textColor, textAlign: alignment }} 
      className="flex flex-col min-h-screen">
        {children}
      </div>;
    },
  },
};

// Describe the initial data
const initialData = {};

// Save the data to your database
async function save(data) {
  console.log("Saving data: ", data);
  const releaseId = document.querySelector('meta[name="current-release-id"]')?.content;

  try {
    const response = await put(`/releases/${releaseId}.json`, {
      body: JSON.stringify({
        release: {
          editor_data: data
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save release data');
    }

    const result = await response.json;
    console.log("Save successful:", result);
  } catch (error) {
    console.error("Error saving release data:", error);
    // You might want to show an error notification here
  }
}

// Render Puck editor
function Editor() {
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEditorData = async () => {
      try {
        const releaseId = document.querySelector('meta[name="current-release-id"]')?.content;
        if (!releaseId) {
          console.error('No release ID found');
          setLoading(false);
          return;
        }

        const response = await get(`/releases/${releaseId}.json`);
        if (response.ok) {
          const releaseData = await response.json;
          if (releaseData.editor_data) {
            setData(releaseData.editor_data);
          }
        }
      } catch (error) {
        console.error('Error loading editor data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEditorData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="text-lg text-gray-600">Loading editor...</div>
    </div>;
  }

  return (
    <Puck config={config} data={data} onPublish={save} />
  );
}

export default class extends Controller {
  connect() {
    const root = createRoot(this.element);
    root.render(<Editor />);
  }
}