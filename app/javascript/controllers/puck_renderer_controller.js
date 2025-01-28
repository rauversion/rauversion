import { Controller } from "@hotwired/stimulus";
import { createRoot } from "react-dom/client";
import React from "react";
import { Render } from "@measured/puck";
import { get } from '@rails/request.js';

import {
  ButtonBlock,
  ButtonBlockConfig,
  Slider,
  SliderConfig,
  Flex,
  FlexConfig,
  CardBlock,
  CardBlockConfig,
  Section,
  SectionConfig,
  ImageBlock,
  ImageBlockConfig,
  Title,
  TitleConfig,
  Text,
  TextConfig,
  MultiList,
  MultiListConfig,
  ProductCard,
  ProductCardConfig,
  Container,
  ContainerConfig,
  OembedBlock,
  OembedBlockConfig,
} from '../components/puck';

const config = {
  components: {
    Flex: {
      fields: FlexConfig.fields,
      defaultProps: FlexConfig.defaultProps,
      render: Flex,
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
    Slider: {
      fields: SliderConfig.fields,
      defaultProps: SliderConfig.defaultProps,
      render: Slider,
    },
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
  root: {
    render: ({ background, textColor, alignment, children, classes }) => {
      return <div
      style={{ backgroundColor: background, color: textColor, textAlign: alignment }} 
      className="flex flex-col min-h-screen pb-40">
        <div className={`flex flex-col min-h-screen ${classes}`}>
          {children}
        </div>
       
      </div>;
    },
  },
};

function Page({ data }) {
  return <Render config={config} data={data} />;
}

export default class extends Controller {
  static values = {
    releaseId: String
  }

  async connect() {
    const releaseId = this.releaseIdValue;
    
    if (!releaseId) {
      console.error('No release ID found');
      return;
    }

    try {
      const response = await get(`/releases/${releaseId}.json`);
      if (response.ok) {
        const releaseData = await response.json;
        if (releaseData.editor_data) {
          const root = createRoot(this.element);
          root.render(<Page data={releaseData.editor_data} />);
        }
      }
    } catch (error) {
      console.error('Error loading editor data:', error);
    }
  }
}
