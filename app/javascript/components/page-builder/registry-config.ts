import { pageBlock } from "./blocks/page"
import { headingBlock } from "./blocks/heading"
import { paragraphBlock } from "./blocks/paragraph"
import { imageBlock } from "./blocks/image"
import { buttonBlock } from "./blocks/button"
import { spacerBlock } from "./blocks/spacer"
import { containerBlock } from "./blocks/container"
import { gridBlock } from "./blocks/grid"
import { tabsBlock } from "./blocks/tabs"
import { carouselBlock } from "./blocks/carousel"
import { cardBlock } from "./blocks/card"
import { flexBlock } from "./blocks/flex"
import { playlistBlock } from "./blocks/playlist"
import { productCardBlock } from "./blocks/product-card"
import type { BlockDefinition, BlockType } from "./blocks/types"
import { sectionBlock } from "./blocks/section"
import { oembedBlock } from "./blocks/oembed"
import { heroBlock } from "./blocks/hero"
import { multiInputBlock } from "./blocks/multi-input"

// Create a registry of all available blocks
const blockRegistry: Record<BlockType, BlockDefinition> = {
  hero: heroBlock,
  page: pageBlock,
  heading: headingBlock,
  paragraph: paragraphBlock,
  image: imageBlock,
  button: buttonBlock,
  spacer: spacerBlock,
  container: containerBlock,
  grid: gridBlock,
  tabs: tabsBlock,
  carousel: carouselBlock,
  card: cardBlock,
  flex: flexBlock,
  playlist: playlistBlock,
  productCard: productCardBlock,
  section: sectionBlock,
  oembed: oembedBlock,
  "multi-input": multiInputBlock

}

export default blockRegistry
