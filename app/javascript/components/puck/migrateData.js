import { migrate } from "@puckeditor/core";

const GRID_ZONE_PATTERN = /^grid-item-(\d+)$/;

const migrateFlexZones = (props, zones) => {
  return {
    ...props,
    content: zones["flex-content"] ?? zones.content ?? props.content ?? [],
  };
};

const migrateGridZones = (props, zones) => {
  const columns = Array.isArray(props.columns) ? [...props.columns] : [];

  Object.entries(zones).forEach(([zoneName, content]) => {
    const match = zoneName.match(GRID_ZONE_PATTERN);
    if (!match) return;

    const index = Number(match[1]);
    const existing = columns[index] ?? {};
    columns[index] = { ...existing, content };
  });

  return { ...props, columns };
};

const migrationOptions = {
  migrateDynamicZonesForComponent: {
    Flex: migrateFlexZones,
    Grid: migrateGridZones,
  },
};

export function migratePuckData(data, config) {
  if (!data || typeof data !== "object") return data;

  try {
    return migrate(data, config, migrationOptions);
  } catch (error) {
    console.error("Failed to migrate Puck DropZones to slots:", error);
    return data;
  }
}
