import React from "react";
import { useParams } from "react-router-dom";
import { get } from "@rails/request.js";
import { useToast } from "@/hooks/use-toast";
import { Render } from "@measured/puck";
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
      try {
        const response = await get(`/pages/${slug}.json`);
        if (response.ok) {
          const data = await response.json;
          setLoading(false);
          setPage(data);
        } else {
          toast({
            title: "Error",
            description: "Could not load page",
            variant: "destructive",
          });
        }
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

  if (!page) return <p className="text-center text-gray-500">Page not found</p>;

  debugger
  if (page.body) {
    return (
      <div className="min-h-screen">
        <Render
          config={config}
          data={page.body}
          renderMode="view"
        />
      </div>
    );
  }

  return null;
}
