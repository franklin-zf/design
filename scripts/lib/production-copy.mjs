const PRODUCTION_COMMENTARY = [
  /(?:依据|基于|根据|按).{0,12}(?:文本快照|提取文本).{0,8}(?:整理|生成|绘制)/u,
  /原文(?:时长|范围|验收要求|措施|未(?:单独)?(?:展开|说明))/u,
  /(?:按|依据|根据)原文(?:确认|整理|生成)/u,
  /(?:原始\s*DOC|原始文档).{0,16}未重新核验/iu,
  /(?:不据此推算预算|不推算预算)/u,
  /(?:此页|本页|以下).{0,12}(?:占位内容|占位文案|待替换文案)/u,
];

/** Finds known author-side phrases; does not edit copy or judge its meaning. */
export function findProductionCommentary(text) {
  const normalized = String(text).replace(/\s+/gu, ' ');
  return PRODUCTION_COMMENTARY.flatMap((pattern) => {
    const match = normalized.match(pattern);
    return match ? [match[0]] : [];
  });
}
