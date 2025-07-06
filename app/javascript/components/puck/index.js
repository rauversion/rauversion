import React from "react";
import { ActionBar } from "@measured/puck";
import { Puck } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";



import ImageUploadField from './ImageUploadField';
import CheckboxField from './CheckboxField';
import ColorPicker from './ColorPicker';

import MultiList, { config as MultiListConfig } from './MultiList';
import Container, { config as ContainerConfig } from './Container';
import OembedBlock, { config as OembedBlockConfig } from './OembedBlock';
import ButtonBlock, { config as ButtonBlockConfig } from './Button';
import HeroSection, { config as HeroSectionConfig } from './HeroSection';
import Title, { config as TitleConfig } from './Title';
import Text, { config as TextConfig } from './Text';
import Section, { config as SectionConfig } from './Section';
import CardBlock, { config as CardBlockConfig } from './CardBlock';
import ImageBlock, { config as ImageBlockConfig } from './ImageBlock';
import ProductCard, { config as ProductCardConfig } from './ProductCard';

import Carousel, { config as CarouselConfig } from './Carousel';
import HeadingBlock, { config as HeadingBlockConfig } from './HeadingBlock';
import Grid, { config as GridConfig } from './Grid';
import Flex, { config as FlexConfig } from './Flex';
import Slider, { config as SliderConfig } from './Slider';
import Playlist, { config as PlaylistConfig } from './Playlist';
// Create Puck component config


export { default as ImageUploadField } from './ImageUploadField';
export { default as CheckboxField } from './CheckboxField';
export { default as ColorPicker } from './ColorPicker';
export { default as MultiList, config as MultiListConfig } from './MultiList';
export { default as Container, config as ContainerConfig } from './Container';
export { default as OembedBlock, config as OembedBlockConfig } from './OembedBlock';
export { default as ButtonBlock, config as ButtonBlockConfig } from './Button';
export { default as HeroSection, config as HeroSectionConfig } from './HeroSection';
export { default as Title, config as TitleConfig } from './Title';
export { default as Text, config as TextConfig } from './Text';
export { default as Section, config as SectionConfig } from './Section';
export { default as CardBlock, config as CardBlockConfig } from './CardBlock';
export { default as ImageBlock, config as ImageBlockConfig } from './ImageBlock';
export { default as ProductCard, config as ProductCardConfig } from './ProductCard';

export { default as Carousel, config as CarouselConfig } from './Carousel';
export { default as HeadingBlock, config as HeadingBlockConfig } from './HeadingBlock';
export { default as Grid, config as GridConfig } from './Grid';
export { default as Flex, config as FlexConfig } from './Flex';
export { default as Slider, config as SliderConfig } from './Slider';
export { default as Playlist, config as PlaylistConfig } from './Playlist';




export const config = {
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
      /*render: ({ playlistId, theme }) => {
        return <Playlist playlistId={playlistId} theme={theme} />;
      },*/
      render: Playlist
    },
    /*HeroSection: {
      fields: HeroSectionConfig.fields,
      defaultProps: HeroSectionConfig.defaultProps,
      render: HeroSection,
    },*/
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
        ]
      },
      classes: {
        type: "text",
        label: "Root Classes",
        defaultValue: "",
        description: "Add custom classes to the root element"
      },
    },
    defaultProps: {
      background: "#ffffff",
      textColor: "#000000",
      alignment: "text-left",
      classes: "",
    },
    render: ({ background, textColor, alignment, classes, children }) => {
      return <div
        style={{ backgroundColor: background, color: textColor, textAlign: alignment }}
        className={`flex flex-col min-h-screen`}>
        <div className={`flex flex-col min-h-screen ${classes}`}>
          {children}
        </div>

      </div>;
    },
  },
  overrides: {
    // header: ({children}) => <div className="bg-default flex justify-between">{children}</div>,
    // sidebar: ({children}) => <div className="bg-default">{children}</div>,
    fields: ({ children }) => <div className="bg-default">{children}</div>,
    headerActions: ({ children }) => (
      <>
        {children}
        <button>preview</button>
      </>
    ),
    fieldTypes: {
      number: ({ name, onChange, value, field }) => (
        <>
          <Label>{field.label}</Label>
          <Input
            type="number"
            value={value}
            name={name}
            onChange={(e) => onChange(e.currentTarget.value)}
          />
        </>
      ),
      select: ({ onChange, name, value, options, field }) => {
        return (
          <>
            <Label>{field.label}</Label>
            <Select value={value} onValueChange={onChange} name={name}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        );
      },
      // Override all text fields with a custom input
      text: ({ name, onChange, value, field }) => (
        <>
          <Label>{field.label}</Label>
          <Input
            value={value}
            name={name}
            className="border border-red-300 rounded-md p-2"
            onChange={(e) => onChange(e.currentTarget.value)}
            style={{ border: "1px solid black", padding: 4 }}
          />
        </>
      ),
    },
    fieldLabel: ({ children, label }) => (
      <Label className="flex items-center gap-2">
        <div>{label}</div>
        {children}
      </Label>
    ),
    
    // components: ({ children }) => <div className="bg-default flex p-2">{children}</div>,
    componentItem: ({ name }) => {
      return <div className="bg-muted p4 rounded-sm p-2 border border-subtle">
        {name}
      </div>
    },
    actionBar: ({ children, label }) => (
      <ActionBar className="bg-default" label={label}>
        <ActionBar.Group className="bg-default">{children}</ActionBar.Group>
      </ActionBar>
    ),
  }
}

export const PuckEditor = ({ data, onPublish }) => {
  return (
    <Puck
      config={config}
      data={data}
      onPublish={onPublish}
      overrides={config.overrides}
    />
  );
};
