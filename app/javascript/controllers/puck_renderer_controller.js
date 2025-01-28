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
  CardBlock,
  CardBlockConfig,
  Section,
  SectionConfig,
  ImageBlock,
  ImageBlockConfig,
  Title,
  TitleConfig,
  Text,
  TextConfig
} from '../components/puck';

const config = {
  components: {
    root: {
      render: ({ children }) => {
        return <div className="flex flex-col min-h-screen">
          {children}
        </div>;
      },
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
  }
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
