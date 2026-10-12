export const operationalH0Requirements = [
  {
    id: 'VIS-ALIGN',
    type: 'visual',
    priority: 'P0',
    requirement: '页面、区块、组件和 icon/text 使用声明锚点。',
    acceptance_criteria: [
      '页面、区块、组件和 icon/text 使用声明锚点',
      '边缘偏差不超过 2px，图标中心偏差不超过 1px'
    ],
    surface_states: [
      '1440-default',
      '1440-dense',
      '390-default',
      '390-dense',
      '320-default',
      '320-dense'
    ],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-LOCALE',
    type: 'content',
    priority: 'P0',
    requirement: '默认 zh-CN，非白名单英文为 0。',
    acceptance_criteria: [
      '默认 zh-CN',
      '除品牌、技术 ID、原始字段和批准缩写外，英文泄漏为 0'
    ],
    surface_states: [
      '1440-default',
      '1440-dense',
      '1440-error',
      '390-default',
      '390-dense',
      '390-error',
      '320-default',
      '320-dense',
      '320-error'
    ],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-ICON',
    type: 'visual',
    priority: 'P0',
    requirement: '单一 icon family、中文名称和 visible fallback。',
    acceptance_criteria: [
      '单一 icon family',
      '图标使用中文可见名称、accessible name 和 visible fallback',
      '图标资产本地化且 provenance 与授权可追溯'
    ],
    surface_states: [
      '1440-default',
      '1440-dense',
      '1440-error',
      '390-default',
      '390-dense',
      '390-error',
      '320-default',
      '320-dense',
      '320-error'
    ],
    verification_method: 'mixed'
  },
  {
    id: 'VIS-COLOR',
    type: 'visual',
    priority: 'P0',
    requirement: 'accent 与 semantic 状态颜色分离。',
    acceptance_criteria: [
      '蓝色只承担 action、selection 和 focus',
      'positive、warning 和 danger 与 accent 分离'
    ],
    surface_states: ['1440-error', '390-error', '320-error'],
    verification_method: 'mixed'
  }
];
