#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  statSync
} from 'node:fs';
import {
  dirname,
  join,
  resolve
} from 'node:path';

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith('--'));
const requireConfirmed = args.includes('--require-confirmed');
const posterArgument = args.find((arg) => arg.startsWith('--poster='));
const posterPath = posterArgument ? posterArgument.slice('--poster='.length) : null;
if (!input) {
  console.error('Usage: node scripts/validate-intake-direction.mjs <intake-direction.json-or-directory> [--require-confirmed] [--poster=<poster-handoff.json>]');
  process.exit(2);
}

const file = existsSync(input) && statSync(input).isDirectory()
  ? join(input, 'intake-direction.json')
  : input;
const errors = [];
const coreFields = ['artifact_type', 'goal', 'use_scenario'];
const allowedArtifactTypes = new Set([
  'data-report',
  'dashboard',
  'chart-frame',
  'poster',
  'html-deck',
  'ppt-handoff',
  'screenshot-evidence',
  'tweakable-artifact',
  'design-system',
  'multi-artifact'
]);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function readJson(path) {
  if (!existsSync(path)) {
    errors.push(`missing intake direction file: ${path}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`intake direction is invalid JSON: ${error.message}`);
    return null;
  }
}

function requireArray(value, field) {
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array.`);
    return [];
  }
  return value;
}

function validateOption(option, index) {
  const label = `direction_options[${index}]`;
  for (const field of [
    'id',
    'label',
    'artifact_type',
    'goal',
    'use_scenario',
    'audience',
    'fit',
    'tradeoff'
  ]) {
    if (!isNonEmptyString(option?.[field])) errors.push(`${label}.${field} must be a non-empty string.`);
  }
  if (!allowedArtifactTypes.has(option?.artifact_type)) {
    errors.push(`${label}.artifact_type is unsupported: ${option?.artifact_type}`);
  }
  if (typeof option?.recommended !== 'boolean') {
    errors.push(`${label}.recommended must be a boolean.`);
  }
}

function validateOptions(options) {
  if (options.length < 2 || options.length > 3) {
    errors.push('needs_clarification requires 2-3 direction options.');
  }
  options.forEach(validateOption);
  const optionIds = options.map((option) => option?.id);
  if (new Set(optionIds).size !== optionIds.length) errors.push('direction option ids must be unique.');
  const recommendedCount = options.filter((option) => option?.recommended === true).length;
  if (recommendedCount !== 1) errors.push('direction options must include exactly one recommended option.');
  if (options.length > 0 && options[0]?.recommended !== true) {
    errors.push('the recommended direction must be the first option.');
  }
}

function valuesMatch(left, right) {
  return left === right || (left === null && right === null);
}

const direction = readJson(file);
if (direction) {
  if (direction.schema_version !== 'design-intake-direction/v1') {
    errors.push('schema_version must be design-intake-direction/v1.');
  }
  if (!['needs_clarification', 'confirmed'].includes(direction.status)) {
    errors.push(`status is unsupported: ${direction.status}`);
  }

  const hasKnownObject = direction.known
    && typeof direction.known === 'object'
    && !Array.isArray(direction.known);
  if (!hasKnownObject) errors.push('known must be an object.');
  const known = hasKnownObject ? direction.known : {};
  const missingFields = requireArray(direction.missing_fields, 'missing_fields');
  const options = requireArray(direction.direction_options, 'direction_options');
  const questions = requireArray(direction.questions, 'questions');
  const missingSet = new Set(missingFields);

  if (missingSet.size !== missingFields.length) errors.push('missing_fields must not contain duplicates.');
  for (const field of missingFields) {
    if (!coreFields.includes(field)) errors.push(`missing_fields contains unsupported field: ${field}`);
  }
  for (const field of coreFields) {
    const knownValue = known[field];
    if (isNonEmptyString(knownValue) && missingSet.has(field)) {
      errors.push(`${field} cannot be both known and missing.`);
    }
    if (!isNonEmptyString(knownValue) && !missingSet.has(field)) {
      errors.push(`${field} must be listed in missing_fields when it is not known.`);
    }
  }
  if (isNonEmptyString(known.artifact_type) && !allowedArtifactTypes.has(known.artifact_type)) {
    errors.push(`known.artifact_type is unsupported: ${known.artifact_type}`);
  }

  if (direction.status === 'needs_clarification') {
    if (missingFields.length === 0) errors.push('needs_clarification requires at least one missing field.');
    validateOptions(options);
    for (const [index, option] of options.entries()) {
      for (const field of coreFields) {
        if (isNonEmptyString(known[field]) && option?.[field] !== known[field]) {
          errors.push(`direction_options[${index}].${field} must preserve known.${field}.`);
        }
      }
    }
    if (questions.length < 1 || questions.length > 3) {
      errors.push('needs_clarification requires 1-3 questions.');
    }
    const questionFields = new Set();
    for (const [index, question] of questions.entries()) {
      if (!coreFields.includes(question?.field)) {
        errors.push(`questions[${index}].field is unsupported: ${question?.field}`);
      } else {
        questionFields.add(question.field);
      }
      if (!isNonEmptyString(question?.prompt)) {
        errors.push(`questions[${index}].prompt must be a non-empty string.`);
      }
    }
    for (const field of missingFields) {
      if (!questionFields.has(field)) errors.push(`missing question for ${field}.`);
    }
    if (direction.confirmed_brief !== null) {
      errors.push('confirmed_brief must be null while clarification is required.');
    }
  }

  if (direction.status === 'confirmed') {
    if (missingFields.length > 0) errors.push('confirmed direction must not have missing fields.');
    if (questions.length > 0) errors.push('confirmed direction must not retain questions.');
    const brief = direction.confirmed_brief;
    if (!brief || typeof brief !== 'object') {
      errors.push('confirmed direction requires confirmed_brief.');
    } else {
      for (const field of [...coreFields, 'audience', 'selection_source', 'confirmation_evidence']) {
        if (!isNonEmptyString(brief[field])) errors.push(`confirmed_brief.${field} must be a non-empty string.`);
      }
      if (!['user_explicit', 'user_selected_direction'].includes(brief.selection_source)) {
        errors.push(`confirmed_brief.selection_source is unsupported: ${brief.selection_source}`);
      }
      if (!allowedArtifactTypes.has(brief.artifact_type)) {
        errors.push(`confirmed_brief.artifact_type is unsupported: ${brief.artifact_type}`);
      }
      if (!Array.isArray(brief.source_materials)) {
        errors.push('confirmed_brief.source_materials must be an array.');
      }
      if (brief.selection_source === 'user_selected_direction') {
        validateOptions(options);
        if (!isNonEmptyString(brief.selected_direction_id)) {
          errors.push('confirmed_brief.selected_direction_id is required for a user-selected direction.');
        }
        if (!isNonEmptyString(brief.accepted_tradeoff)) {
          errors.push('confirmed_brief.accepted_tradeoff is required for a user-selected direction.');
        }
        const selectedOption = options.find((option) => option?.id === brief.selected_direction_id);
        if (!selectedOption) {
          errors.push('user_selected_direction requires selected_direction_id to match one offered direction.');
        } else {
          for (const field of [...coreFields, 'audience']) {
            if (!valuesMatch(selectedOption[field], brief[field])) {
              errors.push(`confirmed_brief.${field} must match the selected direction option.`);
            }
          }
          if (!valuesMatch(selectedOption.tradeoff, brief.accepted_tradeoff)) {
            errors.push('confirmed_brief.accepted_tradeoff must match the selected direction option.');
          }
        }
      }
      if (brief.selection_source === 'user_explicit') {
        if (options.length > 0) errors.push('an explicit brief must not retain direction options.');
        if (brief.selected_direction_id !== null) {
          errors.push('confirmed_brief.selected_direction_id must be null for an explicit brief.');
        }
        if (brief.accepted_tradeoff !== null) {
          errors.push('confirmed_brief.accepted_tradeoff must be null for an explicit brief.');
        }
      }
      for (const field of coreFields) {
        if (brief[field] !== known[field]) {
          errors.push(`confirmed_brief.${field} must match known.${field}.`);
        }
      }
    }
  }

  if ((requireConfirmed || posterPath) && direction.status !== 'confirmed') {
    errors.push('--require-confirmed requires status confirmed.');
  }

  if (posterPath && direction.status === 'confirmed' && direction.confirmed_brief) {
    const poster = readJson(posterPath);
    if (poster) {
      let posterShapeValid = true;
      function addPosterShapeError(message) {
        errors.push(message);
        posterShapeValid = false;
      }
      if (poster.role !== 'poster') addPosterShapeError('Poster role must be poster.');
      if (!isNonEmptyString(poster.intake_direction_ref)) {
        addPosterShapeError('Poster intake_direction_ref must be a non-empty string.');
      } else if (resolve(dirname(posterPath), poster.intake_direction_ref) !== resolve(file)) {
        addPosterShapeError('Poster intake_direction_ref must resolve to the validated intake direction.');
      }
      for (const field of ['source_materials', 'constraints', 'known_gaps']) {
        if (!Array.isArray(poster[field])) addPosterShapeError(`Poster ${field} must be an array.`);
      }
      if (!poster.summary_policy || typeof poster.summary_policy !== 'object' || Array.isArray(poster.summary_policy)) {
        addPosterShapeError('Poster summary_policy must be an object.');
      } else {
        for (const field of ['preserve_meaning', 'preserve_numbers_verbatim', 'plain_language']) {
          if (poster.summary_policy[field] !== true) {
            addPosterShapeError(`Poster summary_policy.${field} must be true.`);
          }
        }
      }
      if (posterShapeValid) {
        for (const field of [
          'artifact_type',
          'goal',
          'use_scenario',
          'audience',
          'selection_source',
          'selected_direction_id',
          'accepted_tradeoff',
          'confirmation_evidence'
        ]) {
          if (!valuesMatch(poster[field], direction.confirmed_brief[field])) {
            errors.push(`Poster ${field} must match confirmed_brief.${field}.`);
          }
        }
      }
    }
  }
}

if (errors.length) {
  console.error('Intake direction validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Intake direction validation passed: ${file}`);
