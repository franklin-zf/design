// *
  // Curated high-quality vector icon dataset with Chinese and English keyword mappings.
  // Geometry uses standardized 24x24 viewBox with 1.5/2.0 stroke styling.
  // /
export const VECTOR_ICON_REGISTRY = {
  // Navigation & Dashboard
  "layout-dashboard": {
    name: "layout-dashboard",
    tags: ["dashboard", "看板", "仪表盘", "大盘", "工作台", "首页", "overview"],
    category: "navigation",
    svgBody: `<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`
  },
  "search": {
    name: "search",
    tags: ["search", "find", "搜索", "查找", "查询", "检视"],
    category: "general",
    svgBody: `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`
  },
  "settings": {
    name: "settings",
    tags: ["settings", "config", "gear", "设置", "配置", "管理", "首选项"],
    category: "general",
    svgBody: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>`
  },
  "user": {
    name: "user",
    tags: ["user", "account", "profile", "用户", "个人", "账户", "成员", "头像"],
    category: "general",
    svgBody: `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`
  },
  "users": {
    name: "users",
    tags: ["users", "team", "group", "团队", "用户群", "群组", "成员列表", "人员"],
    category: "general",
    svgBody: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`
  },
  "bar-chart-3": {
    name: "bar-chart-3",
    tags: ["chart", "bar", "metrics", "柱状图", "数据", "统计", "指标", "报表", "趋势"],
    category: "data",
    svgBody: `<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>`
  },
  "line-chart": {
    name: "line-chart",
    tags: ["line", "trend", "chart", "折线图", "趋势", "走势", "波动", "分析"],
    category: "data",
    svgBody: `<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>`
  },
  "pie-chart": {
    name: "pie-chart",
    tags: ["pie", "chart", "distribution", "饼图", "占比", "分布", "份额"],
    category: "data",
    svgBody: `<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>`
  },
  "trending-up": {
    name: "trending-up",
    tags: ["trend", "up", "growth", "增长", "上升", "提升", "突破", "同比增加"],
    category: "data",
    svgBody: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`
  },
  "trending-down": {
    name: "trending-down",
    tags: ["trend", "down", "decline", "下降", "减少", "跌幅", "降低"],
    category: "data",
    svgBody: `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>`
  },
  "filter": {
    name: "filter",
    tags: ["filter", "funnel", "筛选", "过滤", "漏斗", "条件"],
    category: "action",
    svgBody: `<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`
  },
  "download": {
    name: "download",
    tags: ["download", "export", "下载", "导出", "获取", "拉取"],
    category: "action",
    svgBody: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`
  },
  "upload": {
    name: "upload",
    tags: ["upload", "import", "上传", "导入", "提交", "同步"],
    category: "action",
    svgBody: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>`
  },
  "refresh-cw": {
    name: "refresh-cw",
    tags: ["refresh", "reload", "sync", "刷新", "重载", "重试", "同步", "更新"],
    category: "action",
    svgBody: `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`
  },
  "plus": {
    name: "plus",
    tags: ["plus", "add", "new", "create", "添加", "新建", "创建", "增加"],
    category: "action",
    svgBody: `<path d="M5 12h14"/><path d="M12 5v14"/>`
  },
  "trash-2": {
    name: "trash-2",
    tags: ["trash", "delete", "remove", "删除", "移除", "清理", "垃圾桶"],
    category: "action",
    svgBody: `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`
  },
  "check-circle-2": {
    name: "check-circle-2",
    tags: ["check", "success", "passed", "成功", "通过", "完成", "校验", "正确"],
    category: "status",
    svgBody: `<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>`
  },
  "alert-triangle": {
    name: "alert-triangle",
    tags: ["alert", "warning", "warn", "警告", "注意", "异常", "风险", "提示"],
    category: "status",
    svgBody: `<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>`
  },
  "alert-circle": {
    name: "alert-circle",
    tags: ["error", "danger", "fail", "错误", "失败", "危险", "拦截", "未通过"],
    category: "status",
    svgBody: `<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>`
  },
  "shield-check": {
    name: "shield-check",
    tags: ["shield", "security", "audit", "安全", "风控", "审核", "防护", "合规", "机审"],
    category: "security",
    svgBody: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>`
  },
  "lock": {
    name: "lock",
    tags: ["lock", "private", "secure", "锁定", "私密", "权限", "密码", "加密"],
    category: "security",
    svgBody: `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>`
  },
  "calendar": {
    name: "calendar",
    tags: ["calendar", "date", "time", "schedule", "日历", "日期", "时间", "计划", "排期"],
    category: "general",
    svgBody: `<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>`
  },
  "clock": {
    name: "clock",
    tags: ["clock", "time", "history", "时钟", "耗时", "历史", "周期", "AHT", "时长"],
    category: "general",
    svgBody: `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`
  },
  "database": {
    name: "database",
    tags: ["database", "storage", "sql", "数据库", "数据源", "存储", "数仓", "表"],
    category: "technical",
    svgBody: `<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>`
  },
  "code": {
    name: "code",
    tags: ["code", "developer", "api", "代码", "开发", "接口", "脚本", "函数"],
    category: "technical",
    svgBody: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`
  },
  "cpu": {
    name: "cpu",
    tags: ["cpu", "model", "ai", "llm", "算力", "大模型", "芯片", "处理器", "推理"],
    category: "technical",
    svgBody: `<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>`
  },
  "sparkles": {
    name: "sparkles",
    tags: ["sparkles", "ai", "magic", "smart", "智能", "生成", "推荐", "特效", "优化"],
    category: "ai",
    svgBody: `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>`
  },
  "file-text": {
    name: "file-text",
    tags: ["file", "doc", "report", "document", "文档", "报告", "文件", "PRD", "方案"],
    category: "content",
    svgBody: `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>`
  },
  "layers": {
    name: "layers",
    tags: ["layers", "stack", "topology", "层级", "架构", "分层", "结构", "堆叠"],
    category: "content",
    svgBody: `<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>`
  },
  "external-link": {
    name: "external-link",
    tags: ["link", "external", "jump", "外链", "跳转", "查看更多", "访问"],
    category: "action",
    svgBody: `<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>`
  }
};

