export type BlockType =
  | "page"
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "spacer"
  | "container"
  | "grid"
  | "tabs"
  | "carousel"
  | "card"
  | "flex"
  | "playlist"
  | "productCard"
  | "section";
  
  

// Other type exports (if needed for BlockDefinition, etc.)
export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  defaultProperties: Record<string, any>;
  render: (props: any) => React.ReactNode;
  propertyEditor?: (props: any) => React.ReactNode;
  canHaveChildren?: boolean;
  getContainers?: (block: any) => any[];
}

export interface BlockRendererProps {
  block: any;
  isSelected: boolean;
  onSelect: () => void;
  isChild?: boolean;
  parentId?: string;
  containerId?: string;
  containerType?: string;
}

export interface PropertyEditorProps {
  properties: Record<string, any>;
  onChange: (property: string, value: any) => void;
}
