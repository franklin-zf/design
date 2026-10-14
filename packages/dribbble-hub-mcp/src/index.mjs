import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);
const packageDir = path.resolve(path.dirname(modulePath), '..');
const defaultSkillRoot = path.resolve(packageDir, '..', '..');
const minimumPreviewWidth = 1200;
const minimumPreviewHeight = 900;
const digestPattern = /^[a-f0-9]{64}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const shotUrlPattern = /^https:\/\/dribbble\.com\/shots\/\d+-[^/?#]+$/;
const previewUrlPattern = /^https:\/\/cdn\.dribbble\.com\/userupload\//;
const maximumToolArgumentsBytes = 64 * 1024;
const maximumStdioLineBytes = 1024 * 1024;
const toolArgumentKeys = new Map([
  ['search_dribbble_references', new Set(['query', 'limit'])],
  ['get_dribbble_reference', new Set(['id'])],
  ['list_dribbble_references', new Set(['limit'])],
  ['get_dribbble_library_status', new Set()],
  ['create_inspiration_binding', new Set([
    'artifact_type',
    'status',
    'trigger_reason',
    'skip_reason',
    'execution_plan_digest',
    'selected_references'
  ])]
]);
const supportedArtifactTypes = new Set([
  'data-report',
  'dashboard',
  'chart-frame',
  'html-deck',
  'ppt-handoff',
  'poster',
  'screenshot-evidence',
  'tweakable-artifact',
  'design-system',
  'multi-artifact'
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function pngDimensions(bytes) {
  const signature = '89504e470d0a1a0a';
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== signature) {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

function isNonEmpty(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function libraryPaths(options = {}) {
  const skillRoot = path.resolve(
    options.skillRoot
      || process.env.DESIGN_SKILL_ROOT
      || defaultSkillRoot
  );
  const indexPath = path.resolve(
    options.indexPath
      || process.env.DESIGN_DRIBBBLE_INDEX
      || path.join(skillRoot, 'assets', 'dribbble-shots', 'index.json')
  );
  const cacheDir = path.resolve(
    options.cacheDir
      || process.env.DESIGN_DRIBBBLE_CACHE
      || path.join(homedir(), '.cache', 'design-skill', 'dribbble')
  );
  return { skillRoot, indexPath, cacheDir };
}

function searchTokens(query) {
  const normalized = String(query || '').trim().toLowerCase();
  const tokens = new Set(
    normalized.match(/[a-z0-9][a-z0-9-]*/g) || []
  );
  for (const run of normalized.match(/\p{Script=Han}+/gu) || []) {
    if (run.length <= 4) tokens.add(run);
    for (const size of [2, 3, 4]) {
      for (let index = 0; index <= run.length - size; index += 1) {
        tokens.add(run.slice(index, index + size));
      }
    }
  }
  return { normalized, tokens: [...tokens] };
}

function boundedLimit(value, fallback = 5, maximum = 50) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function validateShotsIndex(index, options = {}) {
  const errors = [];
  if (!index || typeof index !== 'object' || Array.isArray(index)) {
    return ['Dribbble index must be an object'];
  }
  if (index.version !== '2.0.0') {
    errors.push('Dribbble index version must be 2.0.0');
  }
  if (!Array.isArray(index.shots) || index.shots.length < 4) {
    errors.push('Dribbble index must contain at least four verified references');
    return errors;
  }
  if (index.shots.filter((shot) => shot?.status === 'active').length < 4) {
    errors.push('Dribbble index must contain at least four active references');
  }

  const ids = new Set();
  for (const [position, shot] of index.shots.entries()) {
    const label = shot?.id || `record-${position + 1}`;
    if (!isNonEmpty(shot?.id) || ids.has(shot.id)) {
      errors.push(`${label}: id must be present and unique`);
    } else {
      ids.add(shot.id);
    }
    for (const field of [
      'title',
      'author',
      'source_url',
      'preview_source_url'
    ]) {
      if (!isNonEmpty(shot?.[field])) errors.push(`${label}: ${field} is required`);
    }
    if (!shotUrlPattern.test(shot?.source_url || '')) {
      errors.push(`${label}: source_url must be an exact Dribbble shot URL`);
    }
    if (!previewUrlPattern.test(shot?.preview_source_url || '')) {
      errors.push(
        `${label}: preview_source_url must be a Dribbble CDN userupload URL`
      );
    }
    if (!['active', 'inactive'].includes(shot?.status)) {
      errors.push(`${label}: status must be active or inactive`);
    }
    if (!datePattern.test(shot?.last_verified_at || '')) {
      errors.push(`${label}: last_verified_at must be YYYY-MM-DD`);
    }
    if (shot?.status === 'inactive' && !isNonEmpty(shot?.inactive_reason)) {
      errors.push(`${label}: inactive references require inactive_reason`);
    }
    if (shot?.rights?.usage !== 'internal-visual-reference-only'
        || shot?.rights?.license_status !== 'unverified-internal-reference'
        || shot?.rights?.distribution !== 'metadata-only'
        || shot?.rights?.direct_reuse_allowed !== false
        || !isNonEmpty(shot?.rights?.attribution)) {
      errors.push(
        `${label}: rights must prohibit direct reuse and retain attribution`
      );
    }
    if (shot?.annotation?.basis !== 'manual-visual-review'
        || !isNonEmpty(shot?.annotation?.reviewed_at)) {
      errors.push(
        `${label}: visual annotation must identify manual review provenance`
      );
    }
    if (!digestPattern.test(shot?.preview_sha256 || '')) {
      errors.push(`${label}: preview_sha256 must be a SHA-256 digest`);
    }
    if (!Number.isInteger(shot?.preview_width)
        || !Number.isInteger(shot?.preview_height)
        || shot.preview_width < minimumPreviewWidth
        || shot.preview_height < minimumPreviewHeight) {
      errors.push(
        `${label}: preview dimensions must be at least `
        + `${minimumPreviewWidth}x${minimumPreviewHeight}`
      );
    }
  }
  return errors;
}

function cachedPreview(shot, options = {}) {
  const { cacheDir } = libraryPaths(options);
  const file = `${shot.id}.png`;
  const cachePath = path.join(cacheDir, file);
  if (!fs.existsSync(cachePath)) {
    return { status: 'missing', file };
  }
  const stat = fs.lstatSync(cachePath);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    return { status: 'invalid', file, reason: 'not-regular-file' };
  }
  const bytes = fs.readFileSync(cachePath);
  const dimensions = pngDimensions(bytes);
  if (!dimensions) {
    return { status: 'invalid', file, reason: 'invalid-png' };
  }
  if (dimensions.width !== shot.preview_width
      || dimensions.height !== shot.preview_height) {
    return {
      status: 'invalid',
      file,
      reason: `dimension-mismatch:${dimensions.width}x${dimensions.height}`
    };
  }
  if (sha256(bytes) !== shot.preview_sha256) {
    return { status: 'invalid', file, reason: 'sha256-mismatch' };
  }
  return {
    status: 'available',
    file,
    sha256: shot.preview_sha256,
    width: dimensions.width,
    height: dimensions.height
  };
}

function withCacheStatus(shot, options = {}) {
  return {
    ...shot,
    local_cache: cachedPreview(shot, options)
  };
}

function readRawIndex(options = {}) {
  const { indexPath } = libraryPaths(options);
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Dribbble index is missing: ${indexPath}`);
  }
  return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
}

export function loadShotsIndex(options = {}) {
  const index = readRawIndex(options);
  const errors = validateShotsIndex(index, options);
  if (errors.length) {
    throw new Error(
      `Dribbble library validation failed:\n- ${errors.join('\n- ')}`
    );
  }
  return index;
}

export function getLibraryStatus(options = {}) {
  try {
    const index = readRawIndex(options);
    const errors = validateShotsIndex(index, options);
    return {
      ready: errors.length === 0,
      version: index.version || null,
      verified_count: Array.isArray(index.shots) ? index.shots.length : 0,
      active_count: Array.isArray(index.shots)
        ? index.shots.filter((shot) => shot.status === 'active').length
        : 0,
      inactive_count: Array.isArray(index.shots)
        ? index.shots.filter((shot) => shot.status === 'inactive').length
        : 0,
      minimum_preview: {
        width: minimumPreviewWidth,
        height: minimumPreviewHeight
      },
      cache: {
        mode: 'private-user-cache',
        cached_count: Array.isArray(index.shots)
          ? index.shots.filter(
            (shot) => cachedPreview(shot, options).status === 'available'
          ).length
          : 0
      },
      tools: [
        'search_dribbble_references',
        'get_dribbble_reference',
        'list_dribbble_references',
        'get_dribbble_library_status',
        'create_inspiration_binding'
      ],
      errors
    };
  } catch (error) {
    return {
      ready: false,
      version: null,
      verified_count: 0,
      active_count: 0,
      inactive_count: 0,
      minimum_preview: {
        width: minimumPreviewWidth,
        height: minimumPreviewHeight
      },
      cache: {
        mode: 'private-user-cache',
        cached_count: 0
      },
      tools: [],
      errors: [error.message]
    };
  }
}

export function searchShots(query, options = {}) {
  const index = loadShotsIndex(options);
  const limit = boundedLimit(options.limit, 5, 10);
  const { normalized, tokens } = searchTokens(query);
  const candidates = index.shots.filter(
    (shot) => options.includeInactive || shot.status === 'active'
  );
  if (!normalized) {
    return candidates.slice(0, limit).map(
      (shot) => withCacheStatus(shot, options)
    );
  }

  return candidates
    .map((shot) => {
      let score = 0;
      const fields = [
        [shot.title, 10],
        [shot.author, 6],
        [shot.annotation?.layout_topology, 6],
        ...(shot.categories || []).map((value) => [value, 8]),
        ...(shot.applicable_scenes || []).map((value) => [value, 7]),
        ...(shot.search_keywords || []).map((value) => [value, 5])
      ];
      for (const [value, weight] of fields) {
        const candidate = String(value || '').toLowerCase();
        if (candidate.includes(normalized)) {
          score += weight * 2;
          continue;
        }
        const matches = tokens.filter((token) => candidate.includes(token));
        if (matches.length) score += weight * (matches.length / tokens.length);
      }
      return { shot, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => (
      b.score - a.score || a.shot.id.localeCompare(b.shot.id)
    ))
    .slice(0, limit)
    .map((item) => withCacheStatus(item.shot, options));
}

export function getShot(shotId, options = {}) {
  const shot = loadShotsIndex(options).shots.find(
    (item) => item.id === shotId
  );
  return shot ? withCacheStatus(shot, options) : null;
}

export function listShots(options = {}) {
  const limit = boundedLimit(options.limit, 20, 50);
  return loadShotsIndex(options).shots.filter(
    (shot) => options.includeInactive || shot.status === 'active'
  ).slice(0, limit).map(
    (shot) => withCacheStatus(shot, options)
  );
}

export function verifyLibrary(options = {}) {
  const status = getLibraryStatus(options);
  const count = boundedLimit(options.count, 4, 50);
  return {
    success: status.ready,
    mode: 'metadata-and-private-cache-check',
    verified_count: Math.min(count, status.verified_count),
    total_shots: status.verified_count,
    cached_count: status.cache.cached_count,
    message: 'Network ingestion is not implicit. Third-party preview bytes remain in a private user cache and are not distributed in the skill package.',
    errors: status.errors
  };
}

export function syncDailyShots(options = {}) {
  return {
    ...verifyLibrary(options),
    deprecated: true,
    replacement: 'verify'
  };
}

export function createInspirationBinding(input, options = {}) {
  const status = input?.status;
  if (!['applied', 'skipped'].includes(status)) {
    throw new Error('status must be applied or skipped');
  }
  if (!supportedArtifactTypes.has(input?.artifact_type)
      || !isNonEmpty(input?.trigger_reason)
      || !digestPattern.test(input?.execution_plan_digest || '')) {
    throw new Error(
      'supported artifact_type, trigger_reason, and execution_plan_digest are required'
    );
  }
  const index = loadShotsIndex(options);
  if (status === 'skipped') {
    if (!isNonEmpty(input.skip_reason)) {
      throw new Error('skipped inspiration requires skip_reason');
    }
    return {
      schema_version: 'design-inspiration-binding/v1',
      artifact_type: input.artifact_type,
      status,
      trigger_reason: input.trigger_reason,
      skip_reason: input.skip_reason,
      execution_plan_digest: input.execution_plan_digest,
      library: {
        server: 'dribbble-hub-mcp',
        server_version: '1.0.0',
        library_version: index.version
      },
      selected_references: []
    };
  }

  const selections = input.selected_references;
  if (!Array.isArray(selections)
      || selections.length < 1
      || selections.length > 3) {
    throw new Error('applied inspiration requires one to three selected references');
  }
  const ids = new Set();
  const roles = new Set();
  const selectedReferences = selections.map((selection) => {
    if (!isNonEmpty(selection?.id) || ids.has(selection.id)) {
      throw new Error('selected reference ids must be present and unique');
    }
    if (![
      'content_topology',
      'visual_language',
      'media_strategy',
      'interaction'
    ].includes(selection.role) || roles.has(selection.role)) {
      throw new Error('selected reference roles must be valid and unique');
    }
    ids.add(selection.id);
    roles.add(selection.role);
    const shot = index.shots.find((item) => item.id === selection.id);
    if (!shot) throw new Error(`reference not found: ${selection.id}`);
    const availableMethods = shot.annotation.visual_methods || [];
    const extractedMethods = selection.extracted_methods?.length
      ? selection.extracted_methods
      : availableMethods;
    if (extractedMethods.some((method) => !availableMethods.includes(method))) {
      throw new Error(
        `reference ${selection.id} extracted_methods must come from the verified annotation`
      );
    }
    return {
      id: shot.id,
      role: selection.role,
      source_url: shot.source_url,
      preview_source_url: shot.preview_source_url,
      preview_sha256: shot.preview_sha256,
      extracted_methods: extractedMethods,
      do_not_copy: shot.annotation.do_not_copy,
      rights: shot.rights
    };
  });
  return {
    schema_version: 'design-inspiration-binding/v1',
    artifact_type: input.artifact_type,
    status,
    trigger_reason: input.trigger_reason,
    execution_plan_digest: input.execution_plan_digest,
    library: {
      server: 'dribbble-hub-mcp',
      server_version: '1.0.0',
      library_version: index.version
    },
    selected_references: selectedReferences
  };
}

function textResult(payload, isError = false) {
  return {
    isError,
    content: [{
      type: 'text',
      text: typeof payload === 'string'
        ? payload
        : JSON.stringify(payload, null, 2)
    }]
  };
}

function validateToolArguments(name, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return 'tool arguments must be an object';
  }
  if (Buffer.byteLength(JSON.stringify(args)) > maximumToolArgumentsBytes) {
    return `tool arguments exceed ${maximumToolArgumentsBytes} bytes`;
  }
  const allowed = toolArgumentKeys.get(name);
  if (!allowed) return null;
  const unknown = Object.keys(args).filter((key) => !allowed.has(key));
  return unknown.length
    ? `unknown tool arguments: ${unknown.sort().join(', ')}`
    : null;
}

export const MCP_TOOLS_MANIFEST = [
  {
    name: 'search_dribbble_references',
    description: 'Search the source-verified local Dribbble reference library by Chinese or English reader job, scenario, topology, or method.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          minLength: 1,
          description: 'Reader job or visual scenario, such as 商家经营工作台 or AI policy graph.'
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 10,
          description: 'Maximum candidates to return. Default 3.'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_dribbble_reference',
    description: 'Get one source-verified Dribbble reference with attribution, local preview binding, extracted methods, and do-not-copy boundaries.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          minLength: 1,
          description: 'Reference id returned by search_dribbble_references.'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'list_dribbble_references',
    description: 'List source-verified Dribbble references available to Design Skill.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 50,
          description: 'Maximum records to return. Default 20.'
        }
      }
    }
  },
  {
    name: 'get_dribbble_library_status',
    description: 'Validate reference source metadata, attribution, rights boundary, local PNG dimensions, and SHA-256 bindings.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {}
    }
  },
  {
    name: 'create_inspiration_binding',
    description: 'Create a read-only design-inspiration-binding/v1 candidate from verified Dribbble references or a declared skip reason.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'artifact_type',
        'status',
        'trigger_reason',
        'execution_plan_digest'
      ],
      properties: {
        artifact_type: {
          type: 'string'
        },
        status: {
          enum: ['applied', 'skipped']
        },
        trigger_reason: {
          type: 'string',
          minLength: 8
        },
        skip_reason: {
          type: 'string',
          minLength: 8
        },
        execution_plan_digest: {
          type: 'string',
          pattern: '^[a-f0-9]{64}$'
        },
        selected_references: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'role'],
            properties: {
              id: {
                type: 'string',
                minLength: 1
              },
              role: {
                enum: [
                  'content_topology',
                  'visual_language',
                  'media_strategy',
                  'interaction'
                ]
              },
              extracted_methods: {
                type: 'array',
                minItems: 1,
                uniqueItems: true,
                items: {
                  type: 'string',
                  minLength: 8
                }
              }
            }
          }
        }
      }
    }
  }
];

export async function executeMcpTool(name, args = {}, options = {}) {
  try {
    const argumentError = validateToolArguments(name, args);
    if (argumentError) return textResult(argumentError, true);
    if (name === 'search_dribbble_references') {
      if (!isNonEmpty(args.query)) {
        return textResult('query is required', true);
      }
      const references = searchShots(args.query, {
        ...options,
        limit: boundedLimit(args.limit, 3, 10)
      });
      return textResult({
        query: args.query,
        count: references.length,
        references
      });
    }
    if (name === 'get_dribbble_reference') {
      if (!isNonEmpty(args.id)) return textResult('id is required', true);
      const reference = getShot(args.id, options);
      return reference
        ? textResult(reference)
        : textResult(`reference not found: ${args.id}`, true);
    }
    if (name === 'list_dribbble_references') {
      const references = listShots({
        ...options,
        limit: boundedLimit(args.limit, 20, 50)
      });
      return textResult({
        count: references.length,
        references
      });
    }
    if (name === 'get_dribbble_library_status') {
      const status = getLibraryStatus(options);
      return textResult(status, !status.ready);
    }
    if (name === 'create_inspiration_binding') {
      return textResult(createInspirationBinding(args, options));
    }
    return textResult(`Unknown tool: "${name}"`, true);
  } catch (error) {
    return textResult(error.message, true);
  }
}

async function handleJsonRpcRequest(request) {
  const { id, method, params } = request;
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'dribbble-hub-mcp',
          version: '1.0.0'
        }
      }
    };
  }
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS_MANIFEST }
    };
  }
  if (method === 'tools/call') {
    return {
      jsonrpc: '2.0',
      id,
      result: await executeMcpTool(
        params?.name,
        params?.arguments || {}
      )
    };
  }
  if (method === 'notifications/initialized' || method === 'ping') {
    return id === undefined ? null : { jsonrpc: '2.0', id, result: {} };
  }
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Method not found: ${method}`
    }
  };
}

export async function startMcpServer() {
  process.stdin.setEncoding('utf8');
  let buffer = '';
  let processing = Promise.resolve();
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
    if (Buffer.byteLength(buffer) > maximumStdioLineBytes
        && !buffer.includes('\n')) {
      process.stderr.write(
        `[dribbble-hub-mcp] request exceeds ${maximumStdioLineBytes} bytes\n`
      );
      buffer = '';
      return;
    }
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    processing = processing.then(async () => {
      for (const line of lines) {
        if (!line.trim()) continue;
        if (Buffer.byteLength(line) > maximumStdioLineBytes) {
          process.stderr.write(
            `[dribbble-hub-mcp] request exceeds ${maximumStdioLineBytes} bytes\n`
          );
          continue;
        }
        try {
          const response = await handleJsonRpcRequest(JSON.parse(line));
          if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
        } catch (error) {
          process.stderr.write(
            `[dribbble-hub-mcp] ${error.message}\n`
          );
        }
      }
    }).catch((error) => {
      process.stderr.write(`[dribbble-hub-mcp] ${error.message}\n`);
    });
  });
}

if (process.argv[1] === modulePath) {
  startMcpServer();
}
