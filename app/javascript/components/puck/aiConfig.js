const hasOwn = (object, key) =>
  Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function inferSchemaFromValue(value) {
  if (typeof value === "string") {
    return { type: "string" };
  }

  if (typeof value === "number") {
    return { type: Number.isInteger(value) ? "integer" : "number" };
  }

  if (typeof value === "boolean") {
    return { type: "boolean" };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }

    const itemSchema = inferSchemaFromValue(value[0]);

    return itemSchema
      ? { type: "array", items: itemSchema }
      : null;
  }

  if (isPlainObject(value)) {
    const properties = {};

    Object.entries(value).forEach(([key, nestedValue]) => {
      const nestedSchema = inferSchemaFromValue(nestedValue);

      if (nestedSchema) {
        properties[key] = nestedSchema;
      }
    });

    return Object.keys(properties).length > 0
      ? { type: "object", properties }
      : { type: "object" };
  }

  return null;
}

function resolveFieldDefaultValue(field, fieldName, defaultProps) {
  if (hasOwn(field, "defaultValue")) {
    return field.defaultValue;
  }

  if (hasOwn(defaultProps, fieldName)) {
    return defaultProps[fieldName];
  }

  return undefined;
}

function prepareFieldForAi(field, defaultValue) {
  if (!field || typeof field !== "object") {
    return field;
  }

  let nextField = field;
  let changed = false;

  if (field.type === "custom") {
    const ai = field.ai || {};

    if (!ai.schema && ai.exclude !== true) {
      const inferredSchema = inferSchemaFromValue(defaultValue);
      const nextAi = inferredSchema
        ? { ...ai, schema: inferredSchema }
        : { ...ai, exclude: true };

      nextField = { ...nextField, ai: nextAi };
      changed = true;
    }
  }

  if (field.type === "object" && isPlainObject(field.fields)) {
    const nestedDefaults = isPlainObject(defaultValue) ? defaultValue : {};
    const nextNestedFields = prepareFieldsForAi(field.fields, nestedDefaults);

    if (nextNestedFields !== field.fields) {
      nextField = { ...nextField, fields: nextNestedFields };
      changed = true;
    }
  }

  if (field.type === "array" && isPlainObject(field.arrayFields)) {
    const nestedDefaults =
      Array.isArray(defaultValue) && isPlainObject(defaultValue[0])
        ? defaultValue[0]
        : {};
    const nextNestedFields = prepareFieldsForAi(field.arrayFields, nestedDefaults);

    if (nextNestedFields !== field.arrayFields) {
      nextField = { ...nextField, arrayFields: nextNestedFields };
      changed = true;
    }
  }

  return changed ? nextField : field;
}

function prepareFieldsForAi(fields, defaultProps = {}) {
  if (!isPlainObject(fields)) {
    return fields;
  }

  let changed = false;
  const nextFields = {};

  Object.entries(fields).forEach(([fieldName, field]) => {
    const defaultValue = resolveFieldDefaultValue(field, fieldName, defaultProps);
    const nextField = prepareFieldForAi(field, defaultValue);

    nextFields[fieldName] = nextField;

    if (nextField !== field) {
      changed = true;
    }
  });

  return changed ? nextFields : fields;
}

export function prepareConfigForAi(config) {
  if (!config || typeof config !== "object") {
    return config;
  }

  let changed = false;
  let nextRoot = config.root;
  let nextComponents = config.components;

  if (config.root?.fields) {
    const nextRootFields = prepareFieldsForAi(
      config.root.fields,
      config.root.defaultProps || {}
    );

    if (nextRootFields !== config.root.fields) {
      nextRoot = { ...config.root, fields: nextRootFields };
      changed = true;
    }
  }

  if (isPlainObject(config.components)) {
    let componentsChanged = false;
    const components = {};

    Object.entries(config.components).forEach(([componentName, component]) => {
      if (!component || typeof component !== "object" || !component.fields) {
        components[componentName] = component;
        return;
      }

      const nextFields = prepareFieldsForAi(
        component.fields,
        component.defaultProps || {}
      );

      if (nextFields !== component.fields) {
        componentsChanged = true;
        components[componentName] = { ...component, fields: nextFields };
        return;
      }

      components[componentName] = component;
    });

    if (componentsChanged) {
      nextComponents = components;
      changed = true;
    }
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    root: nextRoot,
    components: nextComponents,
  };
}
