const schemaKeywords = new Set([
  '$schema',
  '$id',
  '$defs',
  '$ref',
  'title',
  'description',
  'type',
  'const',
  'enum',
  'required',
  'properties',
  'items',
  'additionalProperties',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'minItems',
  'maxItems',
  'uniqueItems',
  'allOf',
  'anyOf',
  'oneOf',
  'if',
  'then',
  'else'
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function decodePointerToken(token) {
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
}

function resolveRef(rootSchema, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    throw new Error(`unsupported schema reference: ${String(ref)}`);
  }
  let value = rootSchema;
  for (const token of ref.slice(2).split('/').map(decodePointerToken)) {
    if (!isObject(value) || !Object.hasOwn(value, token)) {
      throw new Error(`unresolved schema reference: ${ref}`);
    }
    value = value[token];
  }
  return value;
}

function validateSchemaNode(schema, rootSchema, path, activeRefs = new Set()) {
  if (typeof schema === 'boolean') return;
  if (!isObject(schema)) throw new Error(`${path}: schema node must be an object or boolean`);

  for (const key of Object.keys(schema)) {
    if (!schemaKeywords.has(key)) throw new Error(`${path}: unsupported schema keyword ${key}`);
  }
  if (schema.$ref !== undefined) {
    const ref = schema.$ref;
    if (activeRefs.has(ref)) return;
    const nextRefs = new Set(activeRefs);
    nextRefs.add(ref);
    validateSchemaNode(resolveRef(rootSchema, ref), rootSchema, `${path}/${ref}`, nextRefs);
  }
  if (schema.$defs !== undefined) {
    if (!isObject(schema.$defs)) throw new Error(`${path}/$defs: must be an object`);
    for (const [key, child] of Object.entries(schema.$defs)) {
      validateSchemaNode(child, rootSchema, `${path}/$defs/${key}`, activeRefs);
    }
  }
  if (schema.properties !== undefined) {
    if (!isObject(schema.properties)) throw new Error(`${path}/properties: must be an object`);
    for (const [key, child] of Object.entries(schema.properties)) {
      validateSchemaNode(child, rootSchema, `${path}/properties/${key}`, activeRefs);
    }
  }
  if (schema.items !== undefined) validateSchemaNode(schema.items, rootSchema, `${path}/items`, activeRefs);
  if (isObject(schema.additionalProperties)) {
    validateSchemaNode(schema.additionalProperties, rootSchema, `${path}/additionalProperties`, activeRefs);
  }
  for (const key of ['allOf', 'anyOf', 'oneOf']) {
    if (schema[key] === undefined) continue;
    if (!Array.isArray(schema[key]) || schema[key].length === 0) throw new Error(`${path}/${key}: must be a non-empty array`);
    schema[key].forEach((child, index) => validateSchemaNode(child, rootSchema, `${path}/${key}/${index}`, activeRefs));
  }
  for (const key of ['if', 'then', 'else']) {
    if (schema[key] !== undefined) validateSchemaNode(schema[key], rootSchema, `${path}/${key}`, activeRefs);
  }
  if (schema.pattern !== undefined) {
    try {
      new RegExp(schema.pattern);
    } catch (error) {
      throw new Error(`${path}/pattern: invalid regular expression: ${error.message}`);
    }
  }
}

export function compileSchema(schema) {
  validateSchemaNode(schema, schema, '#');
  return (instance) => validateJsonInstance(schema, instance);
}

function displayPath(path) {
  return path || '/';
}

function typeMatches(type, value) {
  if (type === 'null') return value === null;
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return isObject(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  return false;
}

function collectErrors(schema, instance, rootSchema, path, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push(`${displayPath(path)}: value is rejected by schema`);
    return;
  }
  if (schema.$ref) collectErrors(resolveRef(rootSchema, schema.$ref), instance, rootSchema, path, errors);

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => typeMatches(type, instance))) {
      errors.push(`${displayPath(path)}: expected type ${types.join('|')}`);
      return;
    }
  }
  if (schema.const !== undefined && stableValue(instance) !== stableValue(schema.const)) {
    errors.push(`${displayPath(path)}: must equal const ${stableValue(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((value) => stableValue(value) === stableValue(instance))) {
    errors.push(`${displayPath(path)}: must be one of ${schema.enum.map(stableValue).join(', ')}`);
  }

  if (typeof instance === 'string') {
    if (schema.minLength !== undefined && instance.length < schema.minLength) {
      errors.push(`${displayPath(path)}: must have minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && instance.length > schema.maxLength) {
      errors.push(`${displayPath(path)}: must have maxLength ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(instance)) {
      errors.push(`${displayPath(path)}: must match pattern ${schema.pattern}`);
    }
  }
  if (typeof instance === 'number') {
    if (schema.minimum !== undefined && instance < schema.minimum) {
      errors.push(`${displayPath(path)}: must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && instance > schema.maximum) {
      errors.push(`${displayPath(path)}: must be <= ${schema.maximum}`);
    }
  }
  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      errors.push(`${displayPath(path)}: must contain at least ${schema.minItems} items`);
    }
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
      errors.push(`${displayPath(path)}: must contain at most ${schema.maxItems} items`);
    }
    if (schema.uniqueItems && new Set(instance.map(stableValue)).size !== instance.length) {
      errors.push(`${displayPath(path)}: items must be unique`);
    }
    if (schema.items !== undefined) {
      instance.forEach((item, index) => collectErrors(schema.items, item, rootSchema, `${path}/${index}`, errors));
    }
  }
  if (isObject(instance)) {
    for (const key of schema.required || []) {
      if (!Object.hasOwn(instance, key)) errors.push(`${displayPath(path)}: required property ${key} is missing`);
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.hasOwn(instance, key)) collectErrors(child, instance[key], rootSchema, `${path}/${key}`, errors);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(instance)) {
        if (!Object.hasOwn(schema.properties, key)) errors.push(`${displayPath(path)}: additional property ${key} is not allowed`);
      }
    } else if (isObject(schema.additionalProperties)) {
      for (const [key, value] of Object.entries(instance)) {
        if (!Object.hasOwn(schema.properties || {}, key)) {
          collectErrors(schema.additionalProperties, value, rootSchema, `${path}/${key}`, errors);
        }
      }
    }
  }

  for (const child of schema.allOf || []) collectErrors(child, instance, rootSchema, path, errors);
  if (schema.anyOf) {
    const matches = schema.anyOf.filter((child) => {
      const branchErrors = [];
      collectErrors(child, instance, rootSchema, path, branchErrors);
      return branchErrors.length === 0;
    }).length;
    if (matches === 0) errors.push(`${displayPath(path)}: must match at least one anyOf branch`);
  }
  if (schema.oneOf) {
    const matches = schema.oneOf.filter((child) => {
      const branchErrors = [];
      collectErrors(child, instance, rootSchema, path, branchErrors);
      return branchErrors.length === 0;
    }).length;
    if (matches !== 1) errors.push(`${displayPath(path)}: must match exactly one oneOf branch`);
  }
  if (schema.if) {
    const conditionErrors = [];
    collectErrors(schema.if, instance, rootSchema, path, conditionErrors);
    const branch = conditionErrors.length === 0 ? schema.then : schema.else;
    if (branch) collectErrors(branch, instance, rootSchema, path, errors);
  }
}

export function validateJsonInstance(schema, instance) {
  try {
    compileSchema(schema);
    const errors = [];
    collectErrors(schema, instance, schema, '', errors);
    return errors;
  } catch (error) {
    return [`schema compilation failed: ${error.message}`];
  }
}
