import React from "react";
import { useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast";
import { Render } from "@puckeditor/core";
import { BlockRenderer } from "@/components/blocks/block-renderer"
import { cn } from "@/lib/utils"
import {
  fetchContentPage,
  normalizeContentPageBody,
  hasLegacyContentPageBody,
} from "@/lib/content-pages"
import {
  Playlist,
  PlaylistConfig,
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
  ButtonBlock,
  ButtonBlockConfig,
  Slider,
  SliderConfig,
  CardBlock,
  CardBlockConfig,
  Section,
  SectionConfig,
  ImageBlock,
  ImageBlockConfig,
  ProductCard,
  ProductCardConfig,
  Container,
  ContainerConfig,
  OembedBlock,
  OembedBlockConfig,
} from "../puck";
import { migratePuckData } from "../puck/migrateData";

// Same config as AlbumShow
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
      fields: PlaylistConfig.fields,
      defaultProps: PlaylistConfig.defaultProps,
      render: Playlist,
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
    Container: {
      fields: ContainerConfig.fields,
      defaultProps: ContainerConfig.defaultProps,
      render: Container,
    },
    OembedBlock: {
      fields: OembedBlockConfig.fields,
      defaultProps: OembedBlockConfig.defaultProps,
      render: OembedBlock,
    },
  },
  categories: {
    layout: { components: ["Container", "Grid", "Flex", "Section"] },
    content: { components: ["Title", "Text", "HeadingBlock", "MultiList"] },
    media: { components: ["ImageBlock", "OembedBlock", "Carousel", "Slider", "Playlist"] },
    interactive: { components: ["Button", "ButtonBlock"] },
    cards: { components: ["ProductCard", "CardBlock"] },
    featured: { components: ["HeroSection"] },
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
        ],
      },
      classes: {
        type: "text",
        label: "Root Classes",
        defaultValue: "",
        description: "Add custom classes to the root element",
      },
    },
    defaultProps: {
      background: "#ffffff",
      textColor: "#000000",
      alignment: "text-left",
      classes: "",
    },
    render: ({ background, textColor, alignment, classes, children }) => {
      return (
        <div
          style={{ backgroundColor: background, color: textColor }}
          className={`flex flex-col min-h-screen ${classes}`}
        >
          {children}
        </div>
      )
    },
  },
};

export default function PagesShow() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchContentPage(slug)
        setPage(data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not load page",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="min-h-screen">
        loading....
      </div>
    );
  }

  if (!page) return <p className="text-center text-muted-foreground">Page not found</p>;

  const editorPages = normalizeContentPageBody(page.body)
  const firstEditorPage = editorPages[0]

  if (firstEditorPage) {
    const { style, blocks } = firstEditorPage

    const fontClass = {
      sans: "font-sans",
      serif: "font-serif",
      mono: "font-mono",
    }[style.fontFamily]

    return (
      <div
        data-template={style.template}
        className={cn(
          "min-h-screen transition-all",
          fontClass,
          style.darkMode ? "bg-[#0a0a0a] text-white" : "bg-white text-black"
        )}
        style={
          {
            "--color-primary": style.primaryColor,
            "--primary": style.primaryColor,
          } as React.CSSProperties
        }
      >
        <div className="max-w-2xl mx-auto px-4 py-12">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
              <p>Esta pagina no tiene contenido.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {blocks.map((block) => (
                <BlockRenderer key={block.id} block={block} isEditing={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (hasLegacyContentPageBody(page.body)) {
    return (
      <div className="min-h-screen">
        <Render
          config={config}
          data={migratePuckData(page.body, config)}
          renderMode="view"
        />
      </div>
    )
  }

  return null;
}
