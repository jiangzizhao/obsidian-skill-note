var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SkillManagerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_fs = require("fs");
var import_path = __toESM(require("path"));
var import_os = __toESM(require("os"));
var import_child_process = require("child_process");
var { shell } = require("electron");
var VIEW_TYPE = "skill-manager-view";
var DEFAULT_SETTINGS = {
  skillRoot: "5-\u5E38\u7528Skill/\u6280\u80FD\u5361",
  localSkillRoots: [
    "~/.codex/skills",
    "~/.codex/vendor_imports/skills",
    "~/.codex/.chatgpt-projects",
    "~/.agents/skills",
    "~/.claude/skills",
    "~/.codex/plugins/cache",
    "~/.claude/plugins",
    "~/Library/Application Support/Claude",
    "~/Documents/Codex",
    "~/tools"
  ],
  records: {},
  translations: {},
  boardStates: {}
};
var STYLE_BOARD_FIELDS = [
  ["story_job", "\u6545\u4E8B\u76EE\u6807", "\u5E0C\u671B\u89C2\u4F17\u7406\u89E3\u4EC0\u4E48\u3001\u611F\u53D7\u5230\u4EC0\u4E48\uFF1F"],
  ["world_and_era", "\u4E16\u754C\u4E0E\u5E74\u4EE3", "\u5386\u53F2\u3001\u5F53\u4EE3\u3001\u672A\u6765\u4E16\u754C\uFF0C\u8FD8\u662F\u6DF7\u5408\u65F6\u95F4\u7EBF\uFF1F"],
  ["subject_language", "\u4E3B\u4F53\u8BED\u8A00", "\u6444\u5F71\u526A\u8D34\u3001\u63D2\u753B\u4EBA\u7269\u3001\u6863\u6848\u7D20\u6750\u3001\u4EA7\u54C1\u56FE\u6216\u6DF7\u5408\uFF1F"],
  ["material_system", "\u6750\u8D28\u7CFB\u7EDF", "\u7EB8\u5F20\u3001\u6495\u8FB9\u3001\u5370\u5237\u3001\u80F6\u5E26\u3001\u5370\u7AE0\u3001\u7EC7\u7269\u6216\u989C\u6599\uFF1F"],
  ["composition_system", "\u6784\u56FE\u7CFB\u7EDF", "\u89C6\u89C9\u7126\u70B9\u3001\u6807\u9898\u533A\u57DF\u3001\u5BC6\u5EA6\u3001\u5C42\u6B21\u4E0E\u7559\u767D\u600E\u4E48\u5B89\u6392\uFF1F"],
  ["palette_and_light", "\u8272\u5F69\u4E0E\u5149\u7EBF", "\u4E3B\u8272\u3001\u5F3A\u8C03\u8272\u3001\u9971\u548C\u5EA6\u3001\u5BF9\u6BD4\u5EA6\u548C\u5149\u7EBF\u903B\u8F91\uFF1F"],
  ["typography_direction", "\u5B57\u4F53\u65B9\u5411", "\u5B57\u4F53\u7C7B\u522B\u3001\u5B57\u91CD\u3001\u5927\u5C0F\u5199\u3001\u4F4D\u7F6E\u548C\u5236\u4F5C\u65B9\u5F0F\uFF1F"],
  ["motion_character", "\u8FD0\u52A8\u6027\u683C", "\u5B9A\u683C\u3001\u6D77\u62A5\u5FAE\u52A8\u3001\u6728\u5076\u3001\u89C6\u5DEE\u3001\u955C\u5934\u548C\u8282\u594F\uFF1F"],
  ["continuity_rules", "\u8FDE\u7EED\u6027\u89C4\u5219", "\u54EA\u4E9B\u4EBA\u7269\u3001\u4E3B\u4F53\u3001\u7B26\u53F7\u548C\u89C6\u89C9\u7279\u5F81\u5FC5\u987B\u4FDD\u6301\u4E00\u81F4\uFF1F"],
  ["avoid_rules", "\u907F\u514D\u4E8B\u9879", "\u4E0D\u8981\u51FA\u73B0\u54EA\u4E9B\u89C6\u89C9\u4FD7\u5957\u3001\u9519\u8BEF\u6587\u5B57\u3001\u6F02\u79FB\u6216\u4E0D\u826F\u8FD0\u52A8\uFF1F"],
  ["delivery_constraints", "\u4EA4\u4ED8\u9650\u5236", "\u753B\u5E45\u3001\u65F6\u957F\u3001\u5206\u8FA8\u7387\u3001\u5E73\u53F0\u3001\u7D20\u6750\u4E0E\u8D39\u7528\u9650\u5236\uFF1F"],
  ["motion_route", "\u8FD0\u52A8\u8DEF\u7EBF", "\u9009\u62E9 Remotion\u3001Seedance \u6216\u6DF7\u5408\uFF0C\u5E76\u8BF4\u660E\u5206\u5DE5\u3002"]
];
var STYLE_TEMPLATES = [
  { name: "\u6863\u6848\u7EAA\u5B9E\u62FC\u8D34", subtitle: "\u65E7\u62A5\u7EB8\u3001\u6863\u6848\u7167\u7247\u3001\u6253\u5B57\u673A\u6807\u9898 \xB7 \u514B\u5236\u800C\u53EF\u4FE1", colors: ["#d8c8a5", "#302d29", "#a64b38"], values: { world_and_era: "\u5386\u53F2\u6863\u6848\u4E0E\u5F53\u4EE3\u53D9\u4E8B\u6DF7\u5408", subject_language: "\u6863\u6848\u7167\u7247\u4E0E\u6444\u5F71\u526A\u8D34\u4E3B\u4F53", material_system: "\u6CDB\u9EC4\u62A5\u7EB8\u3001\u7C97\u7CD9\u6495\u8FB9\u3001\u5370\u7AE0\u4E0E\u80F6\u5E26", palette_and_light: "\u4F4E\u9971\u548C\u7C73\u8910\u8272\uFF0C\u6697\u7EA2\u5F3A\u8C03\uFF0C\u81EA\u7136\u7EB8\u5F20\u5149", typography_direction: "\u62A5\u520A\u7F16\u8F91\u4F53\u4E0E\u6253\u5B57\u673A\u5B57\u4F53\uFF0C\u6587\u5B57\u540E\u671F\u5728 Remotion \u4E2D\u5B8C\u6210", motion_character: "\u514B\u5236\u5B9A\u683C\u3001\u7EB8\u5F20\u63A8\u5165\u3001\u8F7B\u5FAE\u955C\u5934\u79FB\u52A8", motion_route: "Remotion \u4E3A\u4E3B\uFF0C\u5FC5\u8981\u7684\u7167\u7247\u5FAE\u52A8\u4F7F\u7528 Seedance" } },
  { name: "\u9C9C\u8273\u6D41\u884C\u6742\u5FD7", subtitle: "\u9AD8\u9971\u548C\u8272\u5757\u3001\u7C97\u4F53\u5927\u5B57\u3001\u5FEB\u901F\u526A\u8D34 \xB7 \u5E74\u8F7B\u6709\u51B2\u51FB", colors: ["#ff4f87", "#ffd83d", "#2f5cff"], values: { world_and_era: "\u5F53\u4EE3\u6D41\u884C\u6587\u5316", subject_language: "\u6444\u5F71\u4EBA\u7269\u526A\u8D34\u4E0E\u5927\u80C6\u51E0\u4F55\u56FE\u5F62", material_system: "\u5149\u9762\u6742\u5FD7\u3001\u5F69\u8272\u8D34\u7EB8\u3001\u7F51\u70B9\u5370\u5237", palette_and_light: "\u9AD8\u9971\u548C\u7C89\u9EC4\u84DD\uFF0C\u5BF9\u6BD4\u5F3A\u70C8\uFF0C\u660E\u4EAE\u5E73\u5149", typography_direction: "\u8D85\u7C97\u65E0\u886C\u7EBF\u5927\u6807\u9898\uFF0C\u975E\u5BF9\u79F0\u7F16\u8F91\u6392\u7248", motion_character: "\u5FEB\u901F\u5F39\u5165\u3001\u8282\u62CD\u5207\u6362\u3001\u5938\u5F20\u7F29\u653E\u4E0E\u5B9A\u683C", motion_route: "Remotion \u5B8C\u6210\u7CBE\u786E\u8282\u62CD\u4E0E\u6392\u7248\u52A8\u753B" } },
  { name: "\u6E29\u6696\u624B\u8D26\u7EB8\u827A", subtitle: "\u5976\u6CB9\u7EB8\u3001\u624B\u5199\u6279\u6CE8\u3001\u5E03\u7EB9\u80F6\u5E26 \xB7 \u4EB2\u5207\u6709\u6545\u4E8B\u611F", colors: ["#f4dfb8", "#cf8f76", "#75866d"], values: { world_and_era: "\u6E29\u6696\u7684\u4E2A\u4EBA\u8BB0\u5FC6\u4E0E\u65E5\u5E38\u53D9\u4E8B", subject_language: "\u751F\u6D3B\u7167\u7247\u3001\u624B\u7ED8\u5C0F\u5143\u7D20\u4E0E\u7EB8\u8D28\u6807\u7B7E", material_system: "\u5976\u6CB9\u7EB8\u3001\u624B\u6495\u8FB9\u3001\u5E03\u7EB9\u80F6\u5E26\u3001\u94C5\u7B14\u4E0E\u6C34\u5F69", palette_and_light: "\u67D4\u548C\u5976\u6CB9\u8272\u3001\u9676\u571F\u7C89\u4E0E\u9F20\u5C3E\u8349\u7EFF\uFF0C\u6696\u5149", typography_direction: "\u4EBA\u6587\u886C\u7EBF\u642D\u914D\u5C11\u91CF\u624B\u5199\u6279\u6CE8", motion_character: "\u8F7B\u67D4\u7FFB\u9875\u3001\u624B\u5DE5\u6446\u653E\u3001\u6162\u901F\u89C6\u5DEE", motion_route: "Remotion \u8D1F\u8D23\u7EB8\u7247\u4E0E\u6587\u5B57\uFF0CSeedance \u4EC5\u7528\u4E8E\u81EA\u7136\u73AF\u5883\u5FAE\u52A8" } },
  { name: "\u51B7\u5CFB\u79D1\u6280\u7F16\u8F91", subtitle: "\u6DF1\u8272\u7F51\u683C\u3001\u6570\u636E\u6807\u7B7E\u3001\u94F6\u84DD\u9AD8\u5149 \xB7 \u7CBE\u5BC6\u672A\u6765\u611F", colors: ["#111827", "#4fd1ff", "#b7c2d0"], values: { world_and_era: "\u8FD1\u672A\u6765\u79D1\u6280\u4E0E\u5DE5\u4E1A\u7CFB\u7EDF", subject_language: "\u4EA7\u54C1\u6444\u5F71\u3001\u6280\u672F\u5256\u9762\u4E0E\u6570\u636E\u56FE\u5C42", material_system: "\u91D1\u5C5E\u3001\u73BB\u7483\u3001\u5C4F\u5E55\u7F51\u683C\u4E0E\u900F\u660E\u819C", palette_and_light: "\u6DF1\u7070\u9ED1\u5E95\u3001\u9752\u84DD\u9AD8\u5149\u3001\u51B7\u767D\u6570\u636E\u5C42", typography_direction: "\u7A84\u4F53\u65E0\u886C\u7EBF\u4E0E\u7B49\u5BBD\u6570\u5B57\uFF0C\u4E25\u683C\u7F51\u683C\u6392\u7248", motion_character: "\u626B\u63CF\u3001\u8DDF\u8E2A\u3001\u6570\u636E\u9012\u8FDB\u4E0E\u7A33\u5B9A\u955C\u5934", motion_route: "Remotion \u5236\u4F5C UI\u3001\u56FE\u8868\u4E0E\u7CBE\u786E\u52A8\u6548\uFF0CSeedance \u7528\u4E8E\u4EA7\u54C1\u73AF\u5883\u955C\u5934" } },
  { name: "\u9ED1\u767D\u62A5\u520A\u89C2\u70B9", subtitle: "\u9ED1\u767D\u7167\u7247\u3001\u9192\u76EE\u6807\u9898\u3001\u5355\u8272\u5F3A\u8C03 \xB7 \u4E25\u8083\u6709\u7ACB\u573A", colors: ["#eee9df", "#191919", "#d23b32"], values: { world_and_era: "\u8DE8\u65F6\u4EE3\u65B0\u95FB\u4E0E\u89C2\u70B9\u53D9\u4E8B", subject_language: "\u9AD8\u53CD\u5DEE\u9ED1\u767D\u7167\u7247\u4E0E\u65B0\u95FB\u526A\u62A5", material_system: "\u65B0\u95FB\u7EB8\u3001\u6CB9\u58A8\u9519\u4F4D\u3001\u88C1\u5207\u6807\u9898\u4E0E\u7EA2\u8272\u6279\u6CE8", palette_and_light: "\u9ED1\u767D\u7070\u4E3A\u4E3B\uFF0C\u53EA\u4FDD\u7559\u5355\u4E00\u7EA2\u8272\u5F3A\u8C03", typography_direction: "\u7C97\u9ED1\u6807\u9898\u914D\u4F20\u7EDF\u886C\u7EBF\u6B63\u6587\uFF0C\u5F3A\u70C8\u5C42\u7EA7", motion_character: "\u786C\u5207\u3001\u62A5\u7EB8\u5C55\u5F00\u3001\u6807\u9898\u538B\u5165\u4E0E\u6709\u9650\u89C6\u5DEE", motion_route: "\u5168\u90E8\u4F18\u5148\u4F7F\u7528 Remotion \u4FDD\u6301\u6392\u7248\u4E0E\u8282\u594F\u7CBE\u786E" } }
];
function parseFrontmatter(content) {
  const block = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!block) return {};
  const result = {};
  block[1].split("\n").forEach((line) => {
    const index = line.indexOf(":");
    if (index > 0) result[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "");
  });
  return result;
}
function getTags(value = "") {
  return value.replace(/^\[|\]$/g, "").split(",").map((tag) => tag.trim().replace(/^['\"]|['\"]$/g, "")).filter(Boolean);
}
var IMAGE_EXTENSIONS = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);
var VIDEO_EXTENSIONS = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".m4v"]);
function stripFrontmatter(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
function extractSection(markdown, headingPattern) {
  var _a;
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => /^#{1,4}\s+/.test(line) && headingPattern.test(line.replace(/^#{1,4}\s+/, "")));
  if (start < 0) return "";
  const level = ((_a = lines[start].match(/^#+/)) == null ? void 0 : _a[0].length) || 2;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s+/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}
function extractPlainSummary(markdown) {
  const line = markdown.split("\n").map((value) => value.trim()).find((value) => value && !value.startsWith("#") && !value.startsWith("```") && !/^[-*]\s*$/.test(value));
  if (!line) return "\u5DF2\u751F\u6210\u4E2D\u6587\u8BF4\u660E\uFF0C\u8BF7\u67E5\u770B\u4E0B\u65B9\u7B80\u5355\u7528\u6CD5\u3002";
  const plain = line.replace(/^[-*+>]\s+/, "").replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").trim();
  return plain.length > 180 ? `${plain.slice(0, 180)}\u2026` : plain;
}
function extractCapabilityList(markdown) {
  const focused = extractSection(markdown, /功能|能力|可以做什么|features|capabilities|what (it|this).*(do|does)/i) || markdown;
  return focused.split("\n").map((line) => line.trim()).filter((line) => /^[-*+]\s+\S/.test(line)).map((line) => line.replace(/^[-*+]\s+/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").trim()).filter((line) => line.length >= 8 && line.length <= 180).slice(0, 5);
}
var SkillUsageModal = class extends import_obsidian.Modal {
  constructor(app, skill, plugin) {
    super(app);
    this.skill = skill;
    this.plugin = plugin;
    this.renderer = new import_obsidian.Component();
    this.showingOriginal = false;
  }
  onOpen() {
    this.renderer.load();
    void this.renderContent();
  }
  async renderContent() {
    this.modalEl.addClass("skill-usage-modal");
    this.contentEl.empty();
    const header = this.contentEl.createDiv("skill-usage-modal__header");
    const icon = header.createDiv("skill-usage-modal__icon");
    (0, import_obsidian.setIcon)(icon, "sparkles");
    const heading = header.createDiv();
    heading.createEl("h2", { text: this.skill.name });
    const descriptionEl = heading.createEl("p", { text: this.skill.description });
    const languageButton = header.createEl("button", { cls: "skill-usage-modal__language", text: this.showingOriginal ? "\u67E5\u770B\u4E2D\u6587" : "\u67E5\u770B\u539F\u6587" });
    languageButton.onclick = () => {
      this.showingOriginal = !this.showingOriginal;
      void this.renderContent();
    };
    const meta = this.contentEl.createDiv("skill-usage-modal__meta");
    meta.createSpan({ text: this.skill.category });
    meta.createSpan({ text: `\u5DF2\u67E5\u770B ${this.skill.usageCount + 1} \u6B21` });
    const pathRow = this.contentEl.createDiv("skill-usage-modal__path");
    (0, import_obsidian.setIcon)(pathRow.createSpan(), "file-text");
    pathRow.createSpan({ text: this.skill.path });
    try {
      const content = await import_fs.promises.readFile(this.skill.path, "utf8");
      const originalMarkdown = stripFrontmatter(content);
      const translating = !this.showingOriginal && this.plugin.needsChineseTranslation(originalMarkdown);
      const status = translating ? this.contentEl.createDiv({ cls: "skill-usage-modal__translating", text: "\u6B63\u5728\u751F\u6210\u4E2D\u6587\u8BF4\u660E\u2026" }) : null;
      const markdown = translating ? await this.plugin.translateMarkdown(originalMarkdown, this.skill.path) : originalMarkdown;
      status == null ? void 0 : status.remove();
      if (translating) descriptionEl.setText(extractPlainSummary(markdown));
      if (translating && this.plugin.needsChineseTranslation(markdown)) this.renderModelGenerationCta(originalMarkdown);
      const purpose = extractPlainSummary(markdown) || this.skill.description;
      const whenToUse = extractSection(markdown, /适合|何时|什么时候|使用场景|触发|when to use|use when|triggers?/i);
      const capabilities = extractCapabilityList(markdown);
      this.renderOverview(purpose, whenToUse, capabilities);
      const quickUsage = extractSection(markdown, /快速|quick|用法|usage|开始|getting started|workflow|步骤|如何使用/i) || markdown.split(/\n(?=#{1,3}\s)/)[0].trim();
      const example = extractSection(markdown, /示例|例子|example|demo|案例/i);
      await this.renderMarkdownSection("\u7B80\u5355\u7528\u6CD5", quickUsage || "\u8BF7\u53C2\u8003\u4E0B\u65B9\u5B8C\u6574\u8BF4\u660E\u3002");
      if (example && example !== quickUsage) await this.renderMarkdownSection("\u793A\u4F8B", example);
      const resources = await this.collectResources(originalMarkdown);
      const media = resources.filter((item) => item.kind !== "workbench");
      const workbenches = resources.filter((item) => item.kind === "workbench");
      if (media.length) await this.renderMedia(media);
      if (workbenches.length) await this.renderWorkbenches(workbenches);
      await this.renderMarkdownSection(this.showingOriginal ? "\u5B8C\u6574 Skill \u539F\u6587" : "\u5B8C\u6574 Skill \u4E2D\u6587\u8BF4\u660E", markdown, true);
    } catch (e) {
      const section = this.contentEl.createDiv("skill-usage-modal__section");
      section.createEl("p", { text: "\u65E0\u6CD5\u8BFB\u53D6\u8FD9\u4E2A Skill \u7684\u4F7F\u7528\u8BF4\u660E\u3002" });
    }
  }
  renderOverview(purpose, whenToUse, capabilities) {
    const overview = this.contentEl.createDiv("skill-usage-modal__overview");
    const purposeCard = overview.createDiv("skill-usage-modal__overview-card is-purpose");
    purposeCard.createEl("h3", { text: "\u8FD9\u4E2A Skill \u80FD\u505A\u4EC0\u4E48" });
    purposeCard.createEl("p", { text: purpose || this.skill.description || "\u8BF7\u67E5\u770B\u4E0B\u65B9\u4F7F\u7528\u8BF4\u660E\u3002" });
    if (whenToUse) {
      const useCard = overview.createDiv("skill-usage-modal__overview-card is-when");
      useCard.createEl("h3", { text: "\u9002\u5408\u4EC0\u4E48\u65F6\u5019\u7528" });
      const plain = extractPlainSummary(whenToUse.replace(/^#{1,4}\s+.*$/m, ""));
      useCard.createEl("p", { text: plain });
    }
    if (capabilities.length) {
      const capabilityCard = overview.createDiv("skill-usage-modal__overview-card is-capabilities");
      capabilityCard.createEl("h3", { text: "\u80FD\u5B8C\u6210\u8FD9\u4E9B\u4E8B\u60C5" });
      const list = capabilityCard.createEl("ul");
      capabilities.forEach((item) => list.createEl("li", { text: item }));
    }
  }
  renderModelGenerationCta(originalMarkdown) {
    const section = this.contentEl.createDiv("skill-usage-modal__section skill-usage-modal__model-cta");
    section.createEl("h3", { text: "\u4EA4\u7ED9\u5927\u6A21\u578B\u751F\u6210\u4E2D\u6587" });
    section.createEl("p", { text: "\u5F53\u524D\u6CA1\u6709\u73B0\u6210\u4E2D\u6587\u8BF4\u660E\u3002\u590D\u5236\u4EFB\u52A1\u5230 Claude\u3001Codex \u7B49\u5927\u6A21\u578B\u8FD0\u884C\uFF0C\u751F\u6210\u7684\u4E2D\u6587\u6587\u4EF6\u4F1A\u88AB Skill \u4FBF\u7B3A\u81EA\u52A8\u8BC6\u522B\u3002" });
    const button = section.createEl("button", { cls: "mod-cta", text: "\u590D\u5236\u751F\u6210\u4EFB\u52A1" });
    button.onclick = async () => {
      const outputPath = import_path.default.join(import_path.default.dirname(this.skill.path), "SKILL.zh-CN.md");
      const prompt = `\u8BF7\u8BFB\u53D6\u6587\u4EF6 ${this.skill.path}\uFF0C\u5C06\u5176\u4E2D\u7684\u4F7F\u7528\u8BF4\u660E\u6574\u7406\u4E3A\u7B80\u6D01\u3001\u81EA\u7136\u3001\u5BB9\u6613\u7406\u89E3\u7684\u7B80\u4F53\u4E2D\u6587\u3002\u4FDD\u7559 Markdown \u7ED3\u6784\u3001\u4EE3\u7801\u3001\u547D\u4EE4\u3001\u53C2\u6570\u3001\u6587\u4EF6\u8DEF\u5F84\u3001\u94FE\u63A5\u548C\u4E13\u6709\u540D\u8BCD\uFF1B\u4E0D\u8981\u6539\u53D8 Skill \u7684\u529F\u80FD\u3002\u628A\u7ED3\u679C\u5199\u5165 ${outputPath}\u3002\u539F\u59CB\u5185\u5BB9\u5982\u4E0B\uFF1A

${originalMarkdown}`;
      await navigator.clipboard.writeText(prompt);
      new import_obsidian.Notice("\u751F\u6210\u4EFB\u52A1\u5DF2\u590D\u5236\uFF0C\u7C98\u8D34\u5230\u5F53\u524D\u5927\u6A21\u578B\u5373\u53EF");
    };
  }
  async renderMarkdownSection(title, markdown, collapsible = false) {
    const section = this.contentEl.createDiv(`skill-usage-modal__section${collapsible ? " is-collapsible" : ""}`);
    if (collapsible) {
      const details = section.createEl("details");
      details.createEl("summary", { text: title });
      const body2 = details.createDiv("skill-usage-modal__markdown");
      await import_obsidian.MarkdownRenderer.render(this.app, markdown, body2, this.skill.path, this.renderer);
      return;
    }
    section.createEl("h3", { text: title });
    const body = section.createDiv("skill-usage-modal__markdown");
    await import_obsidian.MarkdownRenderer.render(this.app, markdown, body, this.skill.path, this.renderer);
  }
  async collectResources(markdown) {
    const resources = [];
    const directory = import_path.default.dirname(this.skill.path);
    const links = [...markdown.matchAll(/(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)];
    for (const match of links) {
      const embedded = match[1] === "!";
      let label = match[2] || import_path.default.basename(match[3]);
      const target = match[3].replace(/^<|>$/g, "");
      if (/style[-_ ]?interview/i.test(target)) label = "\u98CE\u683C\u9009\u62E9\u770B\u677F";
      const isRemote = /^https?:\/\//i.test(target);
      const localPath = isRemote ? void 0 : import_path.default.resolve(directory, decodeURIComponent(target.split("#")[0]));
      const extension = import_path.default.extname((localPath || target).split("?")[0]).toLowerCase();
      if (embedded && IMAGE_EXTENSIONS.has(extension)) resources.push({ label, target, localPath, kind: "image" });
      else if (embedded && VIDEO_EXTENSIONS.has(extension)) resources.push({ label, target, localPath, kind: "video" });
      else if ((isRemote || /\.html?$/i.test(target)) && /工作台|看板|模板|workbench|studio|playground|dashboard|preview|演示|template/i.test(`${label} ${target}`)) {
        resources.push({ label: label || "\u6253\u5F00\u5DE5\u4F5C\u53F0", target, localPath, kind: "workbench" });
      }
    }
    const bareUrls = markdown.match(/https?:\/\/[^\s<>)\]]+/g) || [];
    bareUrls.filter((url) => /workbench|studio|playground|dashboard|localhost|127\.0\.0\.1/i.test(url)).forEach((url) => {
      resources.push({ label: "\u6253\u5F00\u5DE5\u4F5C\u53F0", target: url.replace(/[.,;:]+$/, ""), kind: "workbench" });
    });
    if (/canvas-codex|chatgpt-imagegen/i.test(markdown)) {
      const launcherPath = this.plugin.expandHome("~/tools/canvas-codex/start-canvas.command");
      try {
        await import_fs.promises.access(launcherPath);
        resources.push({
          label: "\u65E0\u9650\u753B\u5E03\uFF08canvas-codex\uFF09",
          target: "http://127.0.0.1:3000",
          launcherPath,
          description: "\u7528\u4E8E\u751F\u6210\u3001\u6574\u7406\u56FE\u7247\u7684\u65E0\u9650\u753B\u5E03\uFF0C\u4E0D\u662F\u98CE\u683C\u6A21\u677F\u5E93\u3002",
          related: true,
          kind: "workbench"
        });
      } catch (e) {
      }
    }
    if (/ref[-_ ]?mg|mg[-_ ]?seedance/i.test(this.skill.name)) {
      const styleWorkbench = this.plugin.expandHome("~/Documents/Codex/2026-08-23/https-x-com-xiaoxiaodong01-s-20/outputs/tina-style-workbench");
      const motionLibrary = this.plugin.expandHome("~/Documents/Codex/2026-07-27/cobalt-grid-example-html-chrome/work/pop-frame-motion/dist/editable-motion-style-library.html");
      try {
        await import_fs.promises.access(import_path.default.join(styleWorkbench, "package.json"));
        resources.push({
          label: "\u98CE\u683C\u56FE\u5E93\u770B\u677F",
          target: "http://127.0.0.1:4174",
          serverCwd: styleWorkbench,
          serverArgs: ["run", "dev", "--", "--port", "4174"],
          description: "\u771F\u5B9E\u98CE\u683C\u56FE\u4F8B\u5E93\uFF0C\u53EF\u6309\u5206\u7C7B\u641C\u7D22\u3001\u67E5\u770B\u56FE\u7247\u5E76\u9009\u62E9\u89C6\u89C9\u98CE\u683C\u3002",
          related: true,
          kind: "workbench"
        });
      } catch (e) {
      }
      try {
        await import_fs.promises.access(motionLibrary);
        resources.push({
          label: "MG \u52A8\u753B\u98CE\u683C\u770B\u677F",
          target: motionLibrary,
          localPath: motionLibrary,
          description: "\u53EF\u5207\u6362\u591A\u5957\u89C6\u89C9\u98CE\u683C\uFF0C\u9884\u89C8 Remotion \u52A8\u753B\u3001\u7F16\u8F91\u573A\u666F\u5E76\u5BFC\u51FA\u72EC\u7ACB HTML\u3002",
          related: true,
          kind: "workbench"
        });
      } catch (e) {
      }
    }
    const boardFiles = await this.findBoardFiles(directory);
    boardFiles.forEach((localPath) => {
      const filename = import_path.default.basename(localPath, import_path.default.extname(localPath));
      const label = /style[-_ ]?interview/i.test(filename) ? "\u98CE\u683C\u9009\u62E9\u770B\u677F" : /storyboard/i.test(filename) ? "\u5206\u955C\u6A21\u677F" : /template|模板/i.test(filename) ? `${filename.replace(/[-_]/g, " ")} \u6A21\u677F` : filename.replace(/[-_]/g, " ");
      resources.push({ label, target: localPath, localPath, kind: "workbench" });
    });
    return resources.filter((item, index, all) => index === all.findIndex((other) => other.kind === item.kind && other.target === item.target)).slice(0, 16);
  }
  async findBoardFiles(root, depth = 0) {
    if (depth > 3) return [];
    try {
      const entries = await import_fs.promises.readdir(root, { withFileTypes: true });
      const nested = await Promise.all(entries.map(async (entry) => {
        const fullPath = import_path.default.join(root, entry.name);
        if (entry.isDirectory()) return this.findBoardFiles(fullPath, depth + 1);
        const relative = import_path.default.relative(import_path.default.dirname(this.skill.path), fullPath);
        const relevantName = /(^|\/)(workbench|dashboard|studio|playground|templates?|模板)(\/|$)|board/i.test(relative);
        const supported = /\.html?$/i.test(entry.name);
        return relevantName && supported ? [fullPath] : [];
      }));
      return nested.flat().slice(0, 12);
    } catch (e) {
      return [];
    }
  }
  async renderMedia(resources) {
    const section = this.contentEl.createDiv("skill-usage-modal__section");
    section.createEl("h3", { text: "\u56FE\u7247\u4E0E\u89C6\u9891" });
    const gallery = section.createDiv("skill-usage-modal__gallery");
    for (const resource of resources) {
      const item = gallery.createDiv("skill-usage-modal__media");
      try {
        if (resource.kind === "image") {
          const image = item.createEl("img", { attr: { alt: resource.label, loading: "lazy" } });
          if (resource.localPath) {
            const data = await import_fs.promises.readFile(resource.localPath);
            const mime = import_path.default.extname(resource.localPath).toLowerCase() === ".svg" ? "image/svg+xml" : `image/${import_path.default.extname(resource.localPath).slice(1).replace("jpg", "jpeg")}`;
            image.src = `data:${mime};base64,${data.toString("base64")}`;
          } else image.src = resource.target;
        } else {
          const video = item.createEl("video", { attr: { controls: "true", preload: "metadata" } });
          video.src = resource.localPath ? `file://${resource.localPath.split(import_path.default.sep).map(encodeURIComponent).join("/")}` : resource.target;
        }
        if (resource.label) item.createEl("small", { text: resource.label });
      } catch (e) {
        item.remove();
      }
    }
  }
  async renderWorkbenches(resources) {
    const section = this.contentEl.createDiv("skill-usage-modal__section");
    section.createEl("h3", { text: "\u770B\u677F\u4E0E\u672C\u5730\u5DE5\u5177" });
    section.createEl("p", { cls: "skill-usage-modal__board-help", text: "Skill \u81EA\u5E26\u7F51\u9875\u4E0E\u5DF2\u6838\u5BF9\u7684\u672C\u5730\u5173\u8054\u5DE5\u5177\u4F1A\u5206\u5F00\u6807\u660E\u3002" });
    const controls = section.createDiv("skill-usage-modal__board-controls");
    const select = controls.createEl("select", { attr: { "aria-label": "\u9009\u62E9\u770B\u677F\u6216\u6A21\u677F" } });
    resources.forEach((resource, index) => select.createEl("option", { text: resource.label || `\u6A21\u677F ${index + 1}`, value: String(index) }));
    const openButton = controls.createEl("button", { cls: "mod-cta" });
    (0, import_obsidian.setIcon)(openButton.createSpan(), "panel-top-open");
    openButton.createSpan({ text: "\u6253\u5F00\u770B\u677F" });
    const preview = section.createDiv("skill-usage-modal__board-preview");
    const showSelected = async () => {
      var _a;
      const resource = resources[Number(select.value) || 0];
      preview.empty();
      const isTemplate = /模板|template/i.test(`${resource.label} ${resource.target}`);
      preview.createEl("strong", { text: resource.related ? "\u5173\u8054\u7684\u672C\u5730\u5DE5\u5177" : "Skill \u81EA\u5E26\u6216\u660E\u786E\u94FE\u63A5" });
      preview.createEl("p", { text: resource.description || `${resource.label} \u53EF\u70B9\u51FB\u6309\u94AE\u76F4\u63A5\u6253\u5F00\u3002` });
      (_a = openButton.querySelector("span:last-child")) == null ? void 0 : _a.setText(isTemplate ? "\u6253\u5F00\u6A21\u677F" : "\u6253\u5F00\u770B\u677F");
    };
    select.onchange = () => void showSelected();
    openButton.onclick = async () => {
      const resource = resources[Number(select.value) || 0];
      if (resource.serverCwd && resource.serverArgs) {
        try {
          await (0, import_obsidian.requestUrl)({ url: resource.target, method: "GET" });
        } catch (e) {
          const child = (0, import_child_process.spawn)("npm", resource.serverArgs, { cwd: resource.serverCwd, detached: true, stdio: "ignore" });
          child.unref();
          await new Promise((resolve) => window.setTimeout(resolve, 2600));
        }
      }
      if (resource.launcherPath) {
        try {
          await (0, import_obsidian.requestUrl)({ url: resource.target, method: "GET" });
        } catch (e) {
          await shell.openPath(resource.launcherPath);
          await new Promise((resolve) => window.setTimeout(resolve, 1800));
        }
      }
      void (resource.localPath ? shell.openPath(resource.localPath) : shell.openExternal(resource.target));
    };
    await showSelected();
  }
  renderStyleBoard(container, resource) {
    container.addClass("skill-style-board");
    const stateKey = resource.localPath || `${this.skill.path}:style-board`;
    const saved = this.plugin.settings.boardStates[stateKey] || {};
    container.createEl("h4", { cls: "skill-style-board__template-title", text: "\u5148\u9009\u62E9\u4E00\u4E2A\u89C6\u89C9\u98CE\u683C\u6A21\u677F" });
    container.createEl("p", { cls: "skill-style-board__template-help", text: "\u6A21\u677F\u4F1A\u9884\u586B\u914D\u8272\u3001\u6750\u8D28\u3001\u6392\u7248\u4E0E\u8FD0\u52A8\u65B9\u5411\uFF0C\u4E4B\u540E\u4ECD\u53EF\u9010\u9879\u4FEE\u6539\u3002" });
    const templates = container.createDiv("skill-style-board__templates");
    STYLE_TEMPLATES.forEach((template) => {
      var _a, _b;
      const card = templates.createEl("button", { cls: `skill-style-board__template${((_a = saved.__template) == null ? void 0 : _a.value) === template.name ? " is-selected" : ""}` });
      card.style.setProperty("--style-a", template.colors[0]);
      card.style.setProperty("--style-b", template.colors[1]);
      card.style.setProperty("--style-c", template.colors[2]);
      const visual = card.createDiv("skill-style-board__template-visual");
      visual.createSpan("is-photo");
      visual.createSpan("is-title");
      visual.createSpan("is-label");
      card.createEl("strong", { text: template.name });
      card.createEl("small", { text: template.subtitle });
      if (((_b = saved.__template) == null ? void 0 : _b.value) === template.name) card.createEl("em", { text: "\u2713 \u5DF2\u9009\u62E9" });
      card.onclick = async () => {
        await this.plugin.applyBoardTemplate(stateKey, template.name, template.values);
        new import_obsidian.Notice(`\u5DF2\u6253\u5F00\u5E76\u5E94\u7528\u300C${template.name}\u300D\u6A21\u677F`);
        container.empty();
        this.renderStyleBoard(container, resource);
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    const advanced = container.createEl("details", { cls: "skill-style-board__advanced" });
    advanced.open = true;
    advanced.createEl("summary", { text: "\u9AD8\u7EA7\u8C03\u6574\uFF1A\u5B8C\u6574\u98CE\u683C\u6863\u6848" });
    const advancedBody = advanced.createDiv("skill-style-board__advanced-body");
    const heading = advancedBody.createDiv("skill-style-board__heading");
    const title = heading.createDiv();
    title.createEl("h4", { text: "\u62FC\u8D34\u52A8\u753B\u98CE\u683C\u6863\u6848" });
    title.createEl("p", { text: "\u9010\u9879\u586B\u5199\u5E76\u6807\u8BB0\u72B6\u6001\uFF0C\u9009\u62E9\u4F1A\u4FDD\u5B58\u5728 Skill \u4FBF\u7B3A\u4E2D\u3002" });
    const progress = heading.createEl("strong");
    const updateProgress = () => {
      const locked = Object.values(this.plugin.settings.boardStates[stateKey] || {}).filter((item) => item.status === "locked").length;
      progress.setText(`${locked}/${STYLE_BOARD_FIELDS.length} \u5DF2\u786E\u5B9A`);
    };
    const grid = advancedBody.createDiv("skill-style-board__grid");
    STYLE_BOARD_FIELDS.forEach(([key, label, question], index) => {
      const current = saved[key] || { status: "unresolved", value: "" };
      const card = grid.createDiv("skill-style-board__card");
      card.createEl("small", { text: String(index + 1).padStart(2, "0") });
      card.createEl("h5", { text: label });
      card.createEl("p", { text: question });
      const input = card.createEl("textarea", { placeholder: "\u586B\u5199\u4F60\u7684\u9009\u62E9\u6216\u8BA9\u5927\u6A21\u578B\u6839\u636E\u53C2\u8003\u56FE\u63A8\u65AD\u2026" });
      input.value = current.value;
      const status = card.createEl("select", { attr: { "aria-label": `${label}\u72B6\u6001` } });
      [["unresolved", "\u5F85\u9009\u62E9"], ["provisional", "\u6682\u5B9A"], ["locked", "\u5DF2\u786E\u5B9A"]].forEach(([value, text]) => {
        const option = status.createEl("option", { value, text });
        option.selected = current.status === value;
      });
      const save = async () => {
        await this.plugin.updateBoardState(stateKey, key, status.value, input.value.trim());
        card.toggleClass("is-locked", status.value === "locked");
        updateProgress();
      };
      input.onchange = () => void save();
      status.onchange = () => void save();
      card.toggleClass("is-locked", current.status === "locked");
    });
    updateProgress();
  }
  onClose() {
    this.renderer.unload();
    this.contentEl.empty();
  }
};
var SkillManagerView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.skills = [];
    this.query = "";
    this.category = "\u5168\u90E8";
    this.skillScope = "\u5DF2\u5B89\u88C5";
    this.favoritesOnly = false;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Skill \u4FBF\u7B3A";
  }
  getIcon() {
    return "sticky-note";
  }
  async onOpen() {
    await this.refresh();
  }
  async refresh() {
    this.skills = await this.plugin.scanSkills();
    this.render();
  }
  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.addClass("skill-manager");
    const header = root.createDiv("skill-manager__header");
    const title = header.createDiv();
    title.createEl("h2", { text: "Skill \u4FBF\u7B3A" });
    const installedCount = this.skills.filter((skill) => skill.scope === "\u5DF2\u5B89\u88C5").length;
    const libraryCount = this.skills.length - installedCount;
    title.createEl("p", { text: `\u5DF2\u5B89\u88C5 ${installedCount} \u4E2A \xB7 \u8D44\u6E90\u5E93 ${libraryCount} \u4E2A` });
    const refresh = header.createEl("button", { cls: "skill-manager__icon-button", attr: { "aria-label": "\u91CD\u65B0\u626B\u63CF" } });
    (0, import_obsidian.setIcon)(refresh, "refresh-cw");
    refresh.onclick = () => void this.refresh();
    const scopeNav = root.createDiv("skill-manager__scopes");
    scopeNav.createSpan({ cls: "skill-manager__categories-label", text: "\u5927\u7C7B" });
    ["\u5DF2\u5B89\u88C5", "\u8D44\u6E90\u5E93", "\u5168\u90E8"].forEach((scope) => {
      const count = scope === "\u5168\u90E8" ? this.skills.length : this.skills.filter((skill) => skill.scope === scope).length;
      const button = scopeNav.createEl("button", { cls: `skill-manager__scope${scope === this.skillScope ? " is-active" : ""}` });
      button.createSpan({ text: scope === "\u8D44\u6E90\u5E93" ? "\u8D44\u6E90\u5E93 Skill" : scope === "\u5DF2\u5B89\u88C5" ? "\u5DF2\u5B89\u88C5 Skill" : "\u5168\u90E8 Skill" });
      button.createEl("small", { text: String(count) });
      button.onclick = () => {
        this.skillScope = scope;
        this.category = "\u5168\u90E8";
        this.render();
      };
    });
    const scopedSkills = this.skillScope === "\u5168\u90E8" ? this.skills : this.skills.filter((skill) => skill.scope === this.skillScope);
    const categories = ["\u5168\u90E8", ...new Set(scopedSkills.map((skill) => skill.category))];
    const categoryNav = root.createDiv("skill-manager__categories");
    categoryNav.createSpan({ cls: "skill-manager__categories-label", text: "\u5206\u7C7B" });
    categories.forEach((category) => {
      const count = category === "\u5168\u90E8" ? scopedSkills.length : scopedSkills.filter((skill) => skill.category === category).length;
      const button = categoryNav.createEl("button", {
        cls: `skill-manager__category${category === this.category ? " is-active" : ""}`,
        attr: { "aria-pressed": String(category === this.category) }
      });
      button.createSpan({ text: category });
      button.createEl("small", { text: String(count) });
      button.onclick = () => {
        this.category = category;
        this.render();
      };
    });
    const toolbar = root.createDiv("skill-manager__toolbar");
    const searchWrap = toolbar.createDiv("skill-manager__search");
    (0, import_obsidian.setIcon)(searchWrap.createSpan(), "search");
    const search = searchWrap.createEl("input", { type: "search", placeholder: "\u641C\u7D22\u540D\u79F0\u3001\u8BF4\u660E\u6216\u6807\u7B7E\u2026", value: this.query });
    search.oninput = () => {
      this.query = search.value;
      this.renderCards(root);
    };
    const favoriteButton = toolbar.createEl("button", { cls: this.favoritesOnly ? "is-active" : "" });
    favoriteButton.setText("\u2605 \u4EC5\u770B\u6536\u85CF");
    favoriteButton.onclick = () => {
      this.favoritesOnly = !this.favoritesOnly;
      this.render();
    };
    this.renderCards(root);
  }
  renderCards(root) {
    var _a;
    (_a = root.querySelector(".skill-manager__content")) == null ? void 0 : _a.remove();
    const content = root.createDiv("skill-manager__content");
    const query = this.query.trim().toLowerCase();
    const visible = this.skills.filter((skill) => {
      const matchesQuery = !query || [skill.name, skill.description, skill.category, skill.source, ...skill.tags].join(" ").toLowerCase().includes(query);
      return matchesQuery && (this.skillScope === "\u5168\u90E8" || skill.scope === this.skillScope) && (this.category === "\u5168\u90E8" || skill.category === this.category) && (!this.favoritesOnly || skill.favorite);
    }).sort((a, b) => this.compareUsage(a, b));
    if (!visible.length) {
      const empty = content.createDiv("skill-manager__empty");
      (0, import_obsidian.setIcon)(empty.createSpan(), "package-open");
      empty.createEl("h3", { text: "\u6CA1\u6709\u627E\u5230 Skill" });
      empty.createEl("p", { text: "\u53EF\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\uFF0C\u6216\u5728\u8BBE\u7F6E\u7684 Skill \u76EE\u5F55\u4E2D\u6DFB\u52A0 SKILL.md\u3002" });
      return;
    }
    const grid = content.createDiv("skill-manager__grid");
    visible.forEach((skill) => this.renderCard(grid, skill));
  }
  renderCard(grid, skill) {
    const card = grid.createDiv("skill-card");
    card.setAttr("title", `\u53CC\u51FB\u67E5\u770B Skill \u4F7F\u7528\u60C5\u51B5\uFF1A${skill.path}`);
    card.ondblclick = () => void this.plugin.showSkillUsage(skill);
    const top = card.createDiv("skill-card__top");
    const icon = top.createDiv("skill-card__avatar");
    (0, import_obsidian.setIcon)(icon, "sparkles");
    const favorite = top.createEl("button", { cls: `skill-card__favorite${skill.favorite ? " is-favorite" : ""}`, attr: { "aria-label": "\u6536\u85CF" } });
    (0, import_obsidian.setIcon)(favorite, "star");
    favorite.onclick = async (event) => {
      event.stopPropagation();
      await this.plugin.updateRecord(skill.id, { favorite: !skill.favorite });
      await this.refresh();
    };
    card.createEl("h3", { text: skill.name });
    card.createEl("p", { cls: "skill-card__description", text: skill.description || "\u6682\u65E0\u529F\u80FD\u8BF4\u660E" });
    const tags = card.createDiv("skill-card__tags");
    [skill.category, skill.source, ...skill.tags.slice(0, 1)].filter(Boolean).forEach((tag) => tags.createSpan({ text: tag }));
    const file = card.createDiv("skill-card__file");
    (0, import_obsidian.setIcon)(file.createSpan(), "file-text");
    file.createSpan({ text: skill.path });
    const stats = card.createDiv("skill-card__stats");
    stats.createSpan({ text: `\u67E5\u770B ${skill.usageCount} \u6B21` });
    stats.createSpan({ text: skill.lastUsed ? `\u6700\u8FD1\u67E5\u770B ${this.relativeTime(skill.lastUsed)}` : "\u5C1A\u672A\u67E5\u770B" });
    const actions = card.createDiv("skill-card__actions");
    const usage = actions.createEl("button", { text: "\u67E5\u770B\u4F7F\u7528\u60C5\u51B5" });
    usage.onclick = (event) => {
      event.stopPropagation();
      void this.plugin.showSkillUsage(skill);
    };
    const locate = actions.createEl("button", { cls: "mod-cta", text: "Finder \u4E2D\u5B9A\u4F4D" });
    locate.onclick = (event) => {
      event.stopPropagation();
      void this.plugin.locateSkill(skill);
    };
  }
  relativeTime(timestamp) {
    const days = Math.floor((Date.now() - timestamp) / 864e5);
    if (days <= 0) return "\u4ECA\u5929";
    if (days === 1) return "\u6628\u5929";
    return `${days} \u5929\u524D`;
  }
  compareUsage(a, b) {
    return b.usageCount - a.usageCount || (b.lastUsed || 0) - (a.lastUsed || 0) || a.category.localeCompare(b.category, "zh-CN") || a.name.localeCompare(b.name, "zh-CN");
  }
};
var SkillManagerSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    new import_obsidian.Setting(this.containerEl).setName("\u5206\u7C7B\u8D44\u6599\u76EE\u5F55").setDesc("Vault \u5185\u7528\u4E8E\u8865\u5145 Skill \u5206\u7C7B\u548C\u8BF4\u660E\u7684\u6280\u80FD\u5361\u76EE\u5F55\u3002").addText((text) => text.setPlaceholder("Skills").setValue(this.plugin.settings.skillRoot).onChange(async (value) => {
      this.plugin.settings.skillRoot = value.trim().replace(/^\/+|\/+$/g, "") || "Skills";
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(this.containerEl).setName("\u7535\u8111 Skill \u76EE\u5F55").setDesc("\u626B\u63CF\u7535\u8111\u4E0A\u7684\u771F\u5B9E SKILL.md\uFF1B\u591A\u4E2A\u76EE\u5F55\u8BF7\u7528\u82F1\u6587\u9017\u53F7\u5206\u9694\u3002").addText((text) => text.setPlaceholder("~/.codex/skills, ~/.agents/skills, ~/.claude/skills").setValue(this.plugin.settings.localSkillRoots.join(", ")).onChange(async (value) => {
      this.plugin.settings.localSkillRoots = value.split(",").map((item) => item.trim()).filter(Boolean);
      await this.plugin.saveSettings();
    }));
  }
};
var SkillManagerPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new SkillManagerView(leaf, this));
    this.addRibbonIcon("sticky-note", "\u6253\u5F00 Skill \u4FBF\u7B3A", () => void this.activateView());
    this.addCommand({ id: "open-skill-manager", name: "\u6253\u5F00 Skill \u4FBF\u7B3A", callback: () => void this.activateView() });
    this.addSettingTab(new SkillManagerSettingTab(this.app, this));
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }
  async scanSkills() {
    const metadata = await this.loadCatalogMetadata();
    const skillFiles = (await Promise.all(this.settings.localSkillRoots.map((root) => this.findSkillFiles(this.expandHome(root))))).flat();
    const uniqueFiles = [...new Set(skillFiles)];
    const scanned = await Promise.all(uniqueFiles.map(async (filePath) => {
      const content = await import_fs.promises.readFile(filePath, "utf8");
      const frontmatter = parseFrontmatter(content);
      const folderName = import_path.default.basename(import_path.default.dirname(filePath));
      const name = frontmatter.name || folderName;
      const catalog = metadata.get(name) || metadata.get(folderName);
      const id = filePath;
      const saved = { favorite: false, usageCount: 0, ...this.settings.records[id] };
      return {
        id,
        name,
        description: (catalog == null ? void 0 : catalog.description) || frontmatter.description || "\u771F\u5B9E Skill \u6E90\u6587\u4EF6",
        category: (catalog == null ? void 0 : catalog.category) || frontmatter.category || this.inferCategory(name, filePath),
        tags: getTags(frontmatter.tags),
        path: filePath,
        source: this.inferSource(filePath),
        scope: this.inferScope(filePath),
        contentSignature: this.hashText(content.replace(/\r\n/g, "\n").trim()),
        ...saved
      };
    }));
    const deduplicated = /* @__PURE__ */ new Map();
    scanned.forEach((skill) => {
      const key = skill.contentSignature;
      if (!deduplicated.has(key)) deduplicated.set(key, skill);
    });
    return [...deduplicated.values()].sort((a, b) => b.usageCount - a.usageCount || (b.lastUsed || 0) - (a.lastUsed || 0) || a.category.localeCompare(b.category, "zh-CN") || a.name.localeCompare(b.name, "zh-CN"));
  }
  async showSkillUsage(skill) {
    await this.updateRecord(skill.id, { usageCount: skill.usageCount + 1, lastUsed: Date.now() });
    new SkillUsageModal(this.app, skill, this).open();
  }
  needsChineseTranslation(markdown) {
    const letters = (markdown.match(/[A-Za-z]/g) || []).length;
    const chinese = (markdown.match(/[\u3400-\u9fff]/g) || []).length;
    return letters > 80 && letters > chinese * 1.4;
  }
  async translateMarkdown(markdown, filePath) {
    const companionPath = import_path.default.join(import_path.default.dirname(filePath), "SKILL.zh-CN.md");
    try {
      const companion = stripFrontmatter(await import_fs.promises.readFile(companionPath, "utf8"));
      if (!this.needsChineseTranslation(companion)) return companion;
    } catch (e) {
    }
    const cacheKey = `${filePath}:${this.hashText(markdown)}`;
    const cached = this.settings.translations[cacheKey];
    if (cached) return cached;
    try {
      try {
        await this.assertLocalTranslationAvailable();
      } catch (e) {
        return markdown;
      }
      const parts = markdown.split(/(```[\s\S]*?```)/g);
      const translated = [];
      for (const part of parts) {
        if (!part || part.startsWith("```")) {
          translated.push(part);
          continue;
        }
        const chunks = this.chunkText(part, 1800);
        for (const chunk of chunks) translated.push(await this.translateTextLocal(chunk));
      }
      const result = translated.join("");
      this.settings.translations[cacheKey] = result;
      await this.saveSettings();
      return result;
    } catch (e) {
      return markdown;
    }
  }
  async translateTextLocal(text) {
    if (!text.trim() || !/[A-Za-z]/.test(text)) return text;
    const response = await (0, import_obsidian.requestUrl)({
      url: "http://127.0.0.1:11434/api/generate",
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({
        model: "gemma3:4b",
        stream: false,
        prompt: `\u8BF7\u628A\u4E0B\u9762\u7684 Skill \u4F7F\u7528\u8BF4\u660E\u7FFB\u8BD1\u6210\u7B80\u6D01\u3001\u81EA\u7136\u3001\u5BB9\u6613\u7406\u89E3\u7684\u7B80\u4F53\u4E2D\u6587\u3002\u4FDD\u6301 Markdown \u6807\u9898\u3001\u5217\u8868\u3001\u94FE\u63A5\u3001\u4EE3\u7801\u3001\u547D\u4EE4\u3001\u53C2\u6570\u3001\u6587\u4EF6\u8DEF\u5F84\u548C\u4E13\u6709\u540D\u8BCD\u4E0D\u53D8\u3002\u53EA\u8F93\u51FA\u7FFB\u8BD1\u7ED3\u679C\uFF0C\u4E0D\u8981\u89E3\u91CA\u3002

${text}`,
        options: { temperature: 0.1 }
      })
    });
    const data = response.json;
    if (!data.response) throw new Error("\u672C\u673A\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u7FFB\u8BD1\u7ED3\u679C");
    return data.response;
  }
  async assertLocalTranslationAvailable() {
    var _a;
    const response = await (0, import_obsidian.requestUrl)({ url: "http://127.0.0.1:11434/api/tags", method: "GET" });
    const models = (_a = response.json) == null ? void 0 : _a.models;
    if (!(models == null ? void 0 : models.some((model) => {
      var _a2;
      return model.name === "gemma3:4b" || ((_a2 = model.name) == null ? void 0 : _a2.startsWith("gemma3:4b"));
    }))) {
      throw new Error("\u672A\u627E\u5230\u672C\u673A gemma3:4b \u6A21\u578B");
    }
  }
  chunkText(text, maxLength) {
    const chunks = [];
    let current = "";
    text.split(/(?<=\n)/).forEach((line) => {
      if (current.length + line.length > maxLength && current) {
        chunks.push(current);
        current = "";
      }
      if (line.length > maxLength) {
        if (current) {
          chunks.push(current);
          current = "";
        }
        for (let index = 0; index < line.length; index += maxLength) chunks.push(line.slice(index, index + maxLength));
      } else current += line;
    });
    if (current) chunks.push(current);
    return chunks;
  }
  hashText(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  }
  async locateSkill(skill) {
    shell.showItemInFolder(skill.path);
  }
  expandHome(input) {
    return input.startsWith("~/") ? import_path.default.join(import_os.default.homedir(), input.slice(2)) : input;
  }
  async findSkillFiles(root) {
    const found = [];
    const walk = async (directory) => {
      let entries;
      try {
        entries = await import_fs.promises.readdir(directory, { withFileTypes: true });
      } catch (e) {
        return;
      }
      await Promise.all(entries.map(async (entry) => {
        const entryPath = import_path.default.join(directory, entry.name);
        if (entry.isDirectory() && ![".git", ".tmp", "node_modules"].includes(entry.name)) await walk(entryPath);
        else if (entry.isFile() && entry.name.toLowerCase() === "skill.md") found.push(entryPath);
      }));
    };
    await walk(root);
    return found;
  }
  async loadCatalogMetadata() {
    const result = /* @__PURE__ */ new Map();
    const root = `${this.settings.skillRoot}/`;
    const files = this.app.vault.getMarkdownFiles().filter((file) => file.path.startsWith(root));
    await Promise.all(files.map(async (file) => {
      var _a, _b, _c, _d, _e, _f;
      const content = await this.app.vault.cachedRead(file);
      const name = ((_b = (_a = content.match(/^skill:\s*(.+)$/m)) == null ? void 0 : _a[1]) == null ? void 0 : _b.trim()) || file.basename;
      const category = ((_d = (_c = content.match(/^category:\s*(.+)$/m)) == null ? void 0 : _c[1]) == null ? void 0 : _d.trim()) || "\u672A\u5206\u7C7B";
      const description = ((_f = (_e = content.match(/\*\*用途\*\*[：:]\s*([^\n]+)/)) == null ? void 0 : _e[1]) == null ? void 0 : _f.trim()) || "";
      result.set(name, { category, description });
    }));
    return result;
  }
  inferCategory(name, filePath) {
    const value = `${name} ${filePath}`.toLowerCase();
    if (/lark|feishu/.test(value)) return "\u98DE\u4E66";
    if (/video|motion|remotion|voice|music|caption|transcri|multicam/.test(value)) return "\u89C6\u9891\u4E0E\u97F3\u9891";
    if (/stock|finance|trading|polymarket|akshare|tushare/.test(value)) return "\u6295\u8D44\u5206\u6790";
    if (/figma|canva|slide|document|spreadsheet|excel|pdf|docx|pptx|design/.test(value)) return "\u8BBE\u8BA1\u4E0E\u529E\u516C";
    if (/perspective|research|knowledge|feynman|munger|karpathy/.test(value)) return "\u7814\u7A76\u4E0E\u601D\u7EF4";
    if (/content|writer|writing|seo|xhs|cover|social|news|script|editor/.test(value)) return "\u5185\u5BB9\u521B\u4F5C";
    if (/cloudflare|api|fullstack|architect|code|developer|plugin|site/.test(value)) return "\u5F00\u53D1\u5DE5\u5177";
    return "\u7CFB\u7EDF\u5DE5\u5177";
  }
  inferSource(filePath) {
    if (filePath.includes("/.claude/skills/")) return "Claude";
    if (filePath.includes("/.claude/plugins/") || filePath.includes("/Application Support/Claude/")) return "Claude \u63D2\u4EF6";
    if (filePath.includes("/.codex/plugins/")) return "Codex \u63D2\u4EF6";
    if (filePath.includes("/.agents/skills/")) return "Agents";
    if (filePath.includes("/Open Design.app/")) return "Open Design";
    if (filePath.includes("/Documents/Codex/")) return "\u9879\u76EE\u8D44\u6E90";
    if (filePath.includes("/.codex/vendor_imports/")) return "Codex \u5BFC\u5165\u5E93";
    return "Codex";
  }
  inferScope(filePath) {
    return /\/Documents\/Codex\/|\/tools\/|\/\.codex\/vendor_imports\/|\/\.codex\/\.chatgpt-projects\//.test(filePath) ? "\u8D44\u6E90\u5E93" : "\u5DF2\u5B89\u88C5";
  }
  async updateRecord(id, patch) {
    this.settings.records[id] = { favorite: false, usageCount: 0, ...this.settings.records[id], ...patch };
    await this.saveSettings();
  }
  async updateBoardState(stateKey, field, status, value) {
    var _a;
    (_a = this.settings.boardStates)[stateKey] || (_a[stateKey] = {});
    this.settings.boardStates[stateKey][field] = { status, value };
    await this.saveSettings();
  }
  async applyBoardTemplate(stateKey, templateName, values) {
    var _a;
    (_a = this.settings.boardStates)[stateKey] || (_a[stateKey] = {});
    this.settings.boardStates[stateKey].__template = { status: "locked", value: templateName };
    Object.entries(values).forEach(([field, value]) => {
      this.settings.boardStates[stateKey][field] = { status: "provisional", value };
    });
    await this.saveSettings();
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    const configured = (saved == null ? void 0 : saved.localSkillRoots) || [];
    this.settings.localSkillRoots = [.../* @__PURE__ */ new Set([...DEFAULT_SETTINGS.localSkillRoots, ...configured])];
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
