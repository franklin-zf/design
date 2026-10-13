import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

// Universal anti-bleeding and UI hierarchy inspection rules
export function validateHtmlHierarchy(htmlContent, filePath = 'snippet.html') {
  const findings = [];
  const content = htmlContent || '';

  // 1. Check for untranslated English placeholder words (Lorem ipsum, etc.)
  const placeholderRegex = /lorem\s+ipsum|dolor\s+sit\s+amet|consectetur\s+adipiscing/i;
  if (placeholderRegex.test(content)) {
    findings.push({
      rule: 'ANTI_AI_SLOP_PLACEHOLDER',
      severity: 'error',
      message: 'Found raw Lorem Ipsum placeholder text; default locale requires clear Simplified Chinese copy.'
    });
  }

  // 2. Check for emoji used as functional UI button icons
  const emojiButtonRegex = /<button[^>]*>[\s\n]*[🔥⚡⚙️❌✅💡📌⭐][\s\n]*<\/button>/u;
  if (emojiButtonRegex.test(content)) {
    findings.push({
      rule: 'NO_EMOJI_FUNCTIONAL_ICON',
      severity: 'error',
      message: 'Emoji used as solitary button icon; functional actions require vector SVGs.'
    });
  }

  // 3. Check for switch / toggle controls and ensure they have tactile shadows / borders
  const switchRegex = /role=["']switch["'][^>]*>/g;
  let switchMatch;
  while ((switchMatch = switchRegex.exec(content)) !== null) {
    const switchTag = switchMatch[0];
    const hasShadow = switchTag.includes('shadow-') || switchTag.includes('box-shadow');
    const hasBorder = switchTag.includes('border') || switchTag.includes('border:');
    if (!hasShadow && !hasBorder) {
      findings.push({
        rule: 'SWITCH_TACTILE_DEFENSE',
        severity: 'error',
        message: 'Switch control lacks tactile inset shadow or micro-border, causing boundary dissolution.'
      });
    }
  }

  // 4. Check for nested card containers with zero padding
  if (content.includes('class="') && /class=["'][^"']*\b(card|panel)\b[^"']*p-0\b/.test(content)) {
    findings.push({
      rule: 'SAFE_INSET_FLOOR',
      severity: 'warning',
      message: 'Card container explicitly sets zero padding (p-0); inner controls may suffer boundary collision.'
    });
  }

  const errors = findings.filter(f => f.severity === 'error');
  const valid = errors.length === 0;

  return {
    valid,
    file: filePath,
    total_findings: findings.length,
    errors: errors.length,
    warnings: findings.filter(f => f.severity === 'warning').length,
    findings
  };
}

// CLI entry point
function runCli() {
  const args = process.argv.slice(2);
  const targetPath = args[0];

  if (!targetPath) {
    console.error('Usage: node scripts/validate-ui-hierarchy.mjs <html-file-or-dir>');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(fullPath);
  let files = [];
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(fullPath, { recursive: true });
    files = entries.filter(e => e.endsWith('.html')).map(e => path.join(fullPath, e));
  } else {
    files = [fullPath];
  }

  let allPassed = true;
  const results = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const res = validateHtmlHierarchy(content, f);
    results.push(res);
    if (!res.valid) allPassed = false;
  }

  console.log(JSON.stringify(results, null, 2));
  process.exit(allPassed ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
