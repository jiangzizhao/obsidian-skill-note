import {
  App,
  Component,
  ItemView,
  MarkdownRenderer,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  requestUrl,
  Setting,
  WorkspaceLeaf,
  setIcon,
} from "obsidian";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

const { shell } = require("electron") as {
  shell: {
    showItemInFolder(filePath: string): void;
    openExternal(url: string): Promise<void>;
    openPath(filePath: string): Promise<string>;
  };
};

const VIEW_TYPE = "skill-manager-view";

interface SkillRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  path: string;
  source: string;
  scope: "已安装" | "资源库";
  favorite: boolean;
  usageCount: number;
  lastUsed?: number;
}

interface SkillManagerSettings {
  skillRoot: string;
  localSkillRoots: string[];
  records: Record<string, Partial<Pick<SkillRecord, "favorite" | "usageCount" | "lastUsed">>>;
  translations: Record<string, string>;
  boardStates: Record<string, Record<string, { status: "unresolved" | "provisional" | "locked"; value: string }>>;
}

const DEFAULT_SETTINGS: SkillManagerSettings = {
  skillRoot: "5-常用Skill/技能卡",
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
    "~/tools",
  ],
  records: {},
  translations: {},
  boardStates: {},
};

const STYLE_BOARD_FIELDS: Array<[string, string, string]> = [
  ["story_job", "故事目标", "希望观众理解什么、感受到什么？"],
  ["world_and_era", "世界与年代", "历史、当代、未来世界，还是混合时间线？"],
  ["subject_language", "主体语言", "摄影剪贴、插画人物、档案素材、产品图或混合？"],
  ["material_system", "材质系统", "纸张、撕边、印刷、胶带、印章、织物或颜料？"],
  ["composition_system", "构图系统", "视觉焦点、标题区域、密度、层次与留白怎么安排？"],
  ["palette_and_light", "色彩与光线", "主色、强调色、饱和度、对比度和光线逻辑？"],
  ["typography_direction", "字体方向", "字体类别、字重、大小写、位置和制作方式？"],
  ["motion_character", "运动性格", "定格、海报微动、木偶、视差、镜头和节奏？"],
  ["continuity_rules", "连续性规则", "哪些人物、主体、符号和视觉特征必须保持一致？"],
  ["avoid_rules", "避免事项", "不要出现哪些视觉俗套、错误文字、漂移或不良运动？"],
  ["delivery_constraints", "交付限制", "画幅、时长、分辨率、平台、素材与费用限制？"],
  ["motion_route", "运动路线", "选择 Remotion、Seedance 或混合，并说明分工。"],
];

const STYLE_TEMPLATES: Array<{ name: string; subtitle: string; colors: [string, string, string]; values: Record<string, string> }> = [
  { name: "档案纪实拼贴", subtitle: "旧报纸、档案照片、打字机标题 · 克制而可信", colors: ["#d8c8a5", "#302d29", "#a64b38"], values: { world_and_era: "历史档案与当代叙事混合", subject_language: "档案照片与摄影剪贴主体", material_system: "泛黄报纸、粗糙撕边、印章与胶带", palette_and_light: "低饱和米褐色，暗红强调，自然纸张光", typography_direction: "报刊编辑体与打字机字体，文字后期在 Remotion 中完成", motion_character: "克制定格、纸张推入、轻微镜头移动", motion_route: "Remotion 为主，必要的照片微动使用 Seedance" } },
  { name: "鲜艳流行杂志", subtitle: "高饱和色块、粗体大字、快速剪贴 · 年轻有冲击", colors: ["#ff4f87", "#ffd83d", "#2f5cff"], values: { world_and_era: "当代流行文化", subject_language: "摄影人物剪贴与大胆几何图形", material_system: "光面杂志、彩色贴纸、网点印刷", palette_and_light: "高饱和粉黄蓝，对比强烈，明亮平光", typography_direction: "超粗无衬线大标题，非对称编辑排版", motion_character: "快速弹入、节拍切换、夸张缩放与定格", motion_route: "Remotion 完成精确节拍与排版动画" } },
  { name: "温暖手账纸艺", subtitle: "奶油纸、手写批注、布纹胶带 · 亲切有故事感", colors: ["#f4dfb8", "#cf8f76", "#75866d"], values: { world_and_era: "温暖的个人记忆与日常叙事", subject_language: "生活照片、手绘小元素与纸质标签", material_system: "奶油纸、手撕边、布纹胶带、铅笔与水彩", palette_and_light: "柔和奶油色、陶土粉与鼠尾草绿，暖光", typography_direction: "人文衬线搭配少量手写批注", motion_character: "轻柔翻页、手工摆放、慢速视差", motion_route: "Remotion 负责纸片与文字，Seedance 仅用于自然环境微动" } },
  { name: "冷峻科技编辑", subtitle: "深色网格、数据标签、银蓝高光 · 精密未来感", colors: ["#111827", "#4fd1ff", "#b7c2d0"], values: { world_and_era: "近未来科技与工业系统", subject_language: "产品摄影、技术剖面与数据图层", material_system: "金属、玻璃、屏幕网格与透明膜", palette_and_light: "深灰黑底、青蓝高光、冷白数据层", typography_direction: "窄体无衬线与等宽数字，严格网格排版", motion_character: "扫描、跟踪、数据递进与稳定镜头", motion_route: "Remotion 制作 UI、图表与精确动效，Seedance 用于产品环境镜头" } },
  { name: "黑白报刊观点", subtitle: "黑白照片、醒目标题、单色强调 · 严肃有立场", colors: ["#eee9df", "#191919", "#d23b32"], values: { world_and_era: "跨时代新闻与观点叙事", subject_language: "高反差黑白照片与新闻剪报", material_system: "新闻纸、油墨错位、裁切标题与红色批注", palette_and_light: "黑白灰为主，只保留单一红色强调", typography_direction: "粗黑标题配传统衬线正文，强烈层级", motion_character: "硬切、报纸展开、标题压入与有限视差", motion_route: "全部优先使用 Remotion 保持排版与节奏精确" } },
];

function parseFrontmatter(content: string): Record<string, string> {
  const block = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!block) return {};
  const result: Record<string, string> = {};
  block[1].split("\n").forEach((line) => {
    const index = line.indexOf(":");
    if (index > 0) result[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "");
  });
  return result;
}

function getTags(value = ""): string[] {
  return value.replace(/^\[|\]$/g, "").split(",").map((tag) => tag.trim().replace(/^['\"]|['\"]$/g, "")).filter(Boolean);
}

interface SkillResource {
  label: string;
  target: string;
  kind: "image" | "video" | "workbench";
  localPath?: string;
  launcherPath?: string;
  serverCwd?: string;
  serverArgs?: string[];
  description?: string;
  related?: boolean;
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".webm", ".m4v"]);

function stripFrontmatter(content: string): string {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function extractSection(markdown: string, headingPattern: RegExp): string {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => /^#{1,4}\s+/.test(line) && headingPattern.test(line.replace(/^#{1,4}\s+/, "")));
  if (start < 0) return "";
  const level = lines[start].match(/^#+/)?.[0].length || 2;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s+/);
    if (match && match[1].length <= level) { end = index; break; }
  }
  return lines.slice(start, end).join("\n").trim();
}

function extractPlainSummary(markdown: string): string {
  const line = markdown.split("\n")
    .map((value) => value.trim())
    .find((value) => value && !value.startsWith("#") && !value.startsWith("```") && !/^[-*]\s*$/.test(value));
  if (!line) return "已生成中文说明，请查看下方简单用法。";
  const plain = line
    .replace(/^[-*+>]\s+/, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
  return plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
}

function extractCapabilityList(markdown: string): string[] {
  const focused = extractSection(markdown, /功能|能力|可以做什么|features|capabilities|what (it|this).*(do|does)/i) || markdown;
  return focused.split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*+]\s+\S/.test(line))
    .map((line) => line.replace(/^[-*+]\s+/, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").trim())
    .filter((line) => line.length >= 8 && line.length <= 180)
    .slice(0, 5);
}

class SkillUsageModal extends Modal {
  private renderer = new Component();
  private showingOriginal = false;
  constructor(app: App, private skill: SkillRecord, private plugin: SkillManagerPlugin) { super(app); }

  onOpen(): void { this.renderer.load(); void this.renderContent(); }

  private async renderContent(): Promise<void> {
    this.modalEl.addClass("skill-usage-modal");
    this.contentEl.empty();
    const header = this.contentEl.createDiv("skill-usage-modal__header");
    const icon = header.createDiv("skill-usage-modal__icon");
    setIcon(icon, "sparkles");
    const heading = header.createDiv();
    heading.createEl("h2", { text: this.skill.name });
    const descriptionEl = heading.createEl("p", { text: this.skill.description });

    const languageButton = header.createEl("button", { cls: "skill-usage-modal__language", text: this.showingOriginal ? "查看中文" : "查看原文" });
    languageButton.onclick = () => { this.showingOriginal = !this.showingOriginal; void this.renderContent(); };

    const meta = this.contentEl.createDiv("skill-usage-modal__meta");
    meta.createSpan({ text: this.skill.category });
    meta.createSpan({ text: `已查看 ${this.skill.usageCount + 1} 次` });
    const pathRow = this.contentEl.createDiv("skill-usage-modal__path");
    setIcon(pathRow.createSpan(), "file-text");
    pathRow.createSpan({ text: this.skill.path });

    try {
      const content = await fs.readFile(this.skill.path, "utf8");
      const originalMarkdown = stripFrontmatter(content);
      const translating = !this.showingOriginal && this.plugin.needsChineseTranslation(originalMarkdown);
      const status = translating ? this.contentEl.createDiv({ cls: "skill-usage-modal__translating", text: "正在生成中文说明…" }) : null;
      const markdown = translating ? await this.plugin.translateMarkdown(originalMarkdown, this.skill.path) : originalMarkdown;
      status?.remove();
      if (translating) descriptionEl.setText(extractPlainSummary(markdown));
      if (translating && this.plugin.needsChineseTranslation(markdown)) this.renderModelGenerationCta(originalMarkdown);
      const purpose = extractPlainSummary(markdown) || this.skill.description;
      const whenToUse = extractSection(markdown, /适合|何时|什么时候|使用场景|触发|when to use|use when|triggers?/i);
      const capabilities = extractCapabilityList(markdown);
      this.renderOverview(purpose, whenToUse, capabilities);
      const quickUsage = extractSection(markdown, /快速|quick|用法|usage|开始|getting started|workflow|步骤|如何使用/i)
        || markdown.split(/\n(?=#{1,3}\s)/)[0].trim();
      const example = extractSection(markdown, /示例|例子|example|demo|案例/i);

      await this.renderMarkdownSection("简单用法", quickUsage || "请参考下方完整说明。");
      if (example && example !== quickUsage) await this.renderMarkdownSection("示例", example);

      const resources = await this.collectResources(originalMarkdown);
      const media = resources.filter((item) => item.kind !== "workbench");
      const workbenches = resources.filter((item) => item.kind === "workbench");
      if (media.length) await this.renderMedia(media);
      if (workbenches.length) await this.renderWorkbenches(workbenches);

      await this.renderMarkdownSection(this.showingOriginal ? "完整 Skill 原文" : "完整 Skill 中文说明", markdown, true);
    } catch {
      const section = this.contentEl.createDiv("skill-usage-modal__section");
      section.createEl("p", { text: "无法读取这个 Skill 的使用说明。" });
    }
  }

  private renderOverview(purpose: string, whenToUse: string, capabilities: string[]): void {
    const overview = this.contentEl.createDiv("skill-usage-modal__overview");
    const purposeCard = overview.createDiv("skill-usage-modal__overview-card is-purpose");
    purposeCard.createEl("h3", { text: "这个 Skill 能做什么" });
    purposeCard.createEl("p", { text: purpose || this.skill.description || "请查看下方使用说明。" });

    if (whenToUse) {
      const useCard = overview.createDiv("skill-usage-modal__overview-card is-when");
      useCard.createEl("h3", { text: "适合什么时候用" });
      const plain = extractPlainSummary(whenToUse.replace(/^#{1,4}\s+.*$/m, ""));
      useCard.createEl("p", { text: plain });
    }

    if (capabilities.length) {
      const capabilityCard = overview.createDiv("skill-usage-modal__overview-card is-capabilities");
      capabilityCard.createEl("h3", { text: "能完成这些事情" });
      const list = capabilityCard.createEl("ul");
      capabilities.forEach((item) => list.createEl("li", { text: item }));
    }
  }

  private renderModelGenerationCta(originalMarkdown: string): void {
    const section = this.contentEl.createDiv("skill-usage-modal__section skill-usage-modal__model-cta");
    section.createEl("h3", { text: "交给大模型生成中文" });
    section.createEl("p", { text: "当前没有现成中文说明。复制任务到 Claude、Codex 等大模型运行，生成的中文文件会被 Skill 便笺自动识别。" });
    const button = section.createEl("button", { cls: "mod-cta", text: "复制生成任务" });
    button.onclick = async () => {
      const outputPath = path.join(path.dirname(this.skill.path), "SKILL.zh-CN.md");
      const prompt = `请读取文件 ${this.skill.path}，将其中的使用说明整理为简洁、自然、容易理解的简体中文。保留 Markdown 结构、代码、命令、参数、文件路径、链接和专有名词；不要改变 Skill 的功能。把结果写入 ${outputPath}。原始内容如下：\n\n${originalMarkdown}`;
      await navigator.clipboard.writeText(prompt);
      new Notice("生成任务已复制，粘贴到当前大模型即可");
    };
  }

  private async renderMarkdownSection(title: string, markdown: string, collapsible = false): Promise<void> {
    const section = this.contentEl.createDiv(`skill-usage-modal__section${collapsible ? " is-collapsible" : ""}`);
    if (collapsible) {
      const details = section.createEl("details");
      details.createEl("summary", { text: title });
      const body = details.createDiv("skill-usage-modal__markdown");
      await MarkdownRenderer.render(this.app, markdown, body, this.skill.path, this.renderer);
      return;
    }
    section.createEl("h3", { text: title });
    const body = section.createDiv("skill-usage-modal__markdown");
    await MarkdownRenderer.render(this.app, markdown, body, this.skill.path, this.renderer);
  }

  private async collectResources(markdown: string): Promise<SkillResource[]> {
    const resources: SkillResource[] = [];
    const directory = path.dirname(this.skill.path);
    const links = [...markdown.matchAll(/(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)];
    for (const match of links) {
      const embedded = match[1] === "!";
      let label = match[2] || path.basename(match[3]);
      const target = match[3].replace(/^<|>$/g, "");
      if (/style[-_ ]?interview/i.test(target)) label = "风格选择看板";
      const isRemote = /^https?:\/\//i.test(target);
      const localPath = isRemote ? undefined : path.resolve(directory, decodeURIComponent(target.split("#")[0]));
      const extension = path.extname((localPath || target).split("?")[0]).toLowerCase();
      if (embedded && IMAGE_EXTENSIONS.has(extension)) resources.push({ label, target, localPath, kind: "image" });
      else if (embedded && VIDEO_EXTENSIONS.has(extension)) resources.push({ label, target, localPath, kind: "video" });
      else if ((isRemote || /\.html?$/i.test(target)) && /工作台|看板|模板|workbench|studio|playground|dashboard|preview|演示|template/i.test(`${label} ${target}`)) {
        resources.push({ label: label || "打开工作台", target, localPath, kind: "workbench" });
      }
    }
    const bareUrls = markdown.match(/https?:\/\/[^\s<>)\]]+/g) || [];
    bareUrls.filter((url) => /workbench|studio|playground|dashboard|localhost|127\.0\.0\.1/i.test(url)).forEach((url) => {
      resources.push({ label: "打开工作台", target: url.replace(/[.,;:]+$/, ""), kind: "workbench" });
    });
    if (/canvas-codex|chatgpt-imagegen/i.test(markdown)) {
      const launcherPath = this.plugin.expandHome("~/tools/canvas-codex/start-canvas.command");
      try {
        await fs.access(launcherPath);
        resources.push({
          label: "无限画布（canvas-codex）",
          target: "http://127.0.0.1:3000",
          launcherPath,
          description: "用于生成、整理图片的无限画布，不是风格模板库。",
          related: true,
          kind: "workbench",
        });
      } catch { /* 依赖未安装时不展示虚假入口。 */ }
    }
    if (/ref[-_ ]?mg|mg[-_ ]?seedance/i.test(this.skill.name)) {
      const styleWorkbench = this.plugin.expandHome("~/Documents/Codex/2026-08-23/https-x-com-xiaoxiaodong01-s-20/outputs/tina-style-workbench");
      const motionLibrary = this.plugin.expandHome("~/Documents/Codex/2026-07-27/cobalt-grid-example-html-chrome/work/pop-frame-motion/dist/editable-motion-style-library.html");
      try {
        await fs.access(path.join(styleWorkbench, "package.json"));
        resources.push({
          label: "风格图库看板",
          target: "http://127.0.0.1:4174",
          serverCwd: styleWorkbench,
          serverArgs: ["run", "dev", "--", "--port", "4174"],
          description: "真实风格图例库，可按分类搜索、查看图片并选择视觉风格。",
          related: true,
          kind: "workbench",
        });
      } catch { /* 本地项目不存在时不展示。 */ }
      try {
        await fs.access(motionLibrary);
        resources.push({
          label: "MG 动画风格看板",
          target: motionLibrary,
          localPath: motionLibrary,
          description: "可切换多套视觉风格，预览 Remotion 动画、编辑场景并导出独立 HTML。",
          related: true,
          kind: "workbench",
        });
      } catch { /* 本地网页不存在时不展示。 */ }
    }
    const boardFiles = await this.findBoardFiles(directory);
    boardFiles.forEach((localPath) => {
      const filename = path.basename(localPath, path.extname(localPath));
      const label = /style[-_ ]?interview/i.test(filename) ? "风格选择看板"
        : /storyboard/i.test(filename) ? "分镜模板"
          : /template|模板/i.test(filename) ? `${filename.replace(/[-_]/g, " ")} 模板`
            : filename.replace(/[-_]/g, " ");
      resources.push({ label, target: localPath, localPath, kind: "workbench" });
    });
    return resources.filter((item, index, all) => index === all.findIndex((other) => other.kind === item.kind && other.target === item.target)).slice(0, 16);
  }

  private async findBoardFiles(root: string, depth = 0): Promise<string[]> {
    if (depth > 3) return [];
    try {
      const entries = await fs.readdir(root, { withFileTypes: true });
      const nested = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(root, entry.name);
        if (entry.isDirectory()) return this.findBoardFiles(fullPath, depth + 1);
        const relative = path.relative(path.dirname(this.skill.path), fullPath);
        const relevantName = /(^|\/)(workbench|dashboard|studio|playground|templates?|模板)(\/|$)|board/i.test(relative);
        const supported = /\.html?$/i.test(entry.name);
        return relevantName && supported ? [fullPath] : [];
      }));
      return nested.flat().slice(0, 12);
    } catch { return []; }
  }

  private async renderMedia(resources: SkillResource[]): Promise<void> {
    const section = this.contentEl.createDiv("skill-usage-modal__section");
    section.createEl("h3", { text: "图片与视频" });
    const gallery = section.createDiv("skill-usage-modal__gallery");
    for (const resource of resources) {
      const item = gallery.createDiv("skill-usage-modal__media");
      try {
        if (resource.kind === "image") {
          const image = item.createEl("img", { attr: { alt: resource.label, loading: "lazy" } });
          if (resource.localPath) {
            const data = await fs.readFile(resource.localPath);
            const mime = path.extname(resource.localPath).toLowerCase() === ".svg" ? "image/svg+xml" : `image/${path.extname(resource.localPath).slice(1).replace("jpg", "jpeg")}`;
            image.src = `data:${mime};base64,${data.toString("base64")}`;
          } else image.src = resource.target;
        } else {
          const video = item.createEl("video", { attr: { controls: "true", preload: "metadata" } });
          video.src = resource.localPath ? `file://${resource.localPath.split(path.sep).map(encodeURIComponent).join("/")}` : resource.target;
        }
        if (resource.label) item.createEl("small", { text: resource.label });
      } catch { item.remove(); }
    }
  }

  private async renderWorkbenches(resources: SkillResource[]): Promise<void> {
    const section = this.contentEl.createDiv("skill-usage-modal__section");
    section.createEl("h3", { text: "看板与本地工具" });
    section.createEl("p", { cls: "skill-usage-modal__board-help", text: "Skill 自带网页与已核对的本地关联工具会分开标明。" });
    const controls = section.createDiv("skill-usage-modal__board-controls");
    const select = controls.createEl("select", { attr: { "aria-label": "选择看板或模板" } });
    resources.forEach((resource, index) => select.createEl("option", { text: resource.label || `模板 ${index + 1}`, value: String(index) }));
    const openButton = controls.createEl("button", { cls: "mod-cta" });
    setIcon(openButton.createSpan(), "panel-top-open");
    openButton.createSpan({ text: "打开看板" });
    const preview = section.createDiv("skill-usage-modal__board-preview");
    const showSelected = async (): Promise<void> => {
      const resource = resources[Number(select.value) || 0];
      preview.empty();
      const isTemplate = /模板|template/i.test(`${resource.label} ${resource.target}`);
      preview.createEl("strong", { text: resource.related ? "关联的本地工具" : "Skill 自带或明确链接" });
      preview.createEl("p", { text: resource.description || `${resource.label} 可点击按钮直接打开。` });
      (openButton.querySelector("span:last-child") as HTMLElement | null)?.setText(isTemplate ? "打开模板" : "打开看板");
    };
    select.onchange = () => void showSelected();
    openButton.onclick = async () => {
      const resource = resources[Number(select.value) || 0];
      if (resource.serverCwd && resource.serverArgs) {
        try { await requestUrl({ url: resource.target, method: "GET" }); }
        catch {
          const child = spawn("npm", resource.serverArgs, { cwd: resource.serverCwd, detached: true, stdio: "ignore" });
          child.unref();
          await new Promise((resolve) => window.setTimeout(resolve, 2600));
        }
      }
      if (resource.launcherPath) {
        try { await requestUrl({ url: resource.target, method: "GET" }); }
        catch {
          await shell.openPath(resource.launcherPath);
          await new Promise((resolve) => window.setTimeout(resolve, 1800));
        }
      }
      void (resource.localPath ? shell.openPath(resource.localPath) : shell.openExternal(resource.target));
    };
    await showSelected();
  }

  private renderStyleBoard(container: HTMLElement, resource: SkillResource): void {
    container.addClass("skill-style-board");
    const stateKey = resource.localPath || `${this.skill.path}:style-board`;
    const saved = this.plugin.settings.boardStates[stateKey] || {};
    container.createEl("h4", { cls: "skill-style-board__template-title", text: "先选择一个视觉风格模板" });
    container.createEl("p", { cls: "skill-style-board__template-help", text: "模板会预填配色、材质、排版与运动方向，之后仍可逐项修改。" });
    const templates = container.createDiv("skill-style-board__templates");
    STYLE_TEMPLATES.forEach((template) => {
      const card = templates.createEl("button", { cls: `skill-style-board__template${saved.__template?.value === template.name ? " is-selected" : ""}` });
      card.style.setProperty("--style-a", template.colors[0]);
      card.style.setProperty("--style-b", template.colors[1]);
      card.style.setProperty("--style-c", template.colors[2]);
      const visual = card.createDiv("skill-style-board__template-visual");
      visual.createSpan("is-photo"); visual.createSpan("is-title"); visual.createSpan("is-label");
      card.createEl("strong", { text: template.name });
      card.createEl("small", { text: template.subtitle });
      if (saved.__template?.value === template.name) card.createEl("em", { text: "✓ 已选择" });
      card.onclick = async () => {
        await this.plugin.applyBoardTemplate(stateKey, template.name, template.values);
        new Notice(`已打开并应用「${template.name}」模板`);
        container.empty();
        this.renderStyleBoard(container, resource);
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    const advanced = container.createEl("details", { cls: "skill-style-board__advanced" });
    advanced.open = true;
    advanced.createEl("summary", { text: "高级调整：完整风格档案" });
    const advancedBody = advanced.createDiv("skill-style-board__advanced-body");
    const heading = advancedBody.createDiv("skill-style-board__heading");
    const title = heading.createDiv();
    title.createEl("h4", { text: "拼贴动画风格档案" });
    title.createEl("p", { text: "逐项填写并标记状态，选择会保存在 Skill 便笺中。" });
    const progress = heading.createEl("strong");
    const updateProgress = (): void => {
      const locked = Object.values(this.plugin.settings.boardStates[stateKey] || {}).filter((item) => item.status === "locked").length;
      progress.setText(`${locked}/${STYLE_BOARD_FIELDS.length} 已确定`);
    };
    const grid = advancedBody.createDiv("skill-style-board__grid");
    STYLE_BOARD_FIELDS.forEach(([key, label, question], index) => {
      const current = saved[key] || { status: "unresolved" as const, value: "" };
      const card = grid.createDiv("skill-style-board__card");
      card.createEl("small", { text: String(index + 1).padStart(2, "0") });
      card.createEl("h5", { text: label });
      card.createEl("p", { text: question });
      const input = card.createEl("textarea", { placeholder: "填写你的选择或让大模型根据参考图推断…" });
      input.value = current.value;
      const status = card.createEl("select", { attr: { "aria-label": `${label}状态` } });
      [["unresolved", "待选择"], ["provisional", "暂定"], ["locked", "已确定"]].forEach(([value, text]) => {
        const option = status.createEl("option", { value, text });
        option.selected = current.status === value;
      });
      const save = async (): Promise<void> => {
        await this.plugin.updateBoardState(stateKey, key, status.value as "unresolved" | "provisional" | "locked", input.value.trim());
        card.toggleClass("is-locked", status.value === "locked");
        updateProgress();
      };
      input.onchange = () => void save();
      status.onchange = () => void save();
      card.toggleClass("is-locked", current.status === "locked");
    });
    updateProgress();
  }

  onClose(): void { this.renderer.unload(); this.contentEl.empty(); }
}

class SkillManagerView extends ItemView {
  private plugin: SkillManagerPlugin;
  private skills: SkillRecord[] = [];
  private query = "";
  private category = "全部";
  private skillScope: "全部" | "已安装" | "资源库" = "已安装";
  private favoritesOnly = false;

  constructor(leaf: WorkspaceLeaf, plugin: SkillManagerPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE; }
  getDisplayText(): string { return "Skill 便笺"; }
  getIcon(): string { return "sticky-note"; }

  async onOpen(): Promise<void> { await this.refresh(); }

  async refresh(): Promise<void> {
    this.skills = await this.plugin.scanSkills();
    this.render();
  }

  private render(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("skill-manager");

    const header = root.createDiv("skill-manager__header");
    const title = header.createDiv();
    title.createEl("h2", { text: "Skill 便笺" });
    const installedCount = this.skills.filter((skill) => skill.scope === "已安装").length;
    const libraryCount = this.skills.length - installedCount;
    title.createEl("p", { text: `已安装 ${installedCount} 个 · 资源库 ${libraryCount} 个` });
    const refresh = header.createEl("button", { cls: "skill-manager__icon-button", attr: { "aria-label": "重新扫描" } });
    setIcon(refresh, "refresh-cw");
    refresh.onclick = () => void this.refresh();

    const scopeNav = root.createDiv("skill-manager__scopes");
    scopeNav.createSpan({ cls: "skill-manager__categories-label", text: "大类" });
    (["已安装", "资源库", "全部"] as const).forEach((scope) => {
      const count = scope === "全部" ? this.skills.length : this.skills.filter((skill) => skill.scope === scope).length;
      const button = scopeNav.createEl("button", { cls: `skill-manager__scope${scope === this.skillScope ? " is-active" : ""}` });
      button.createSpan({ text: scope === "资源库" ? "资源库 Skill" : scope === "已安装" ? "已安装 Skill" : "全部 Skill" });
      button.createEl("small", { text: String(count) });
      button.onclick = () => { this.skillScope = scope; this.category = "全部"; this.render(); };
    });

    const scopedSkills = this.skillScope === "全部" ? this.skills : this.skills.filter((skill) => skill.scope === this.skillScope);
    const categories = ["全部", ...new Set(scopedSkills.map((skill) => skill.category))];
    const categoryNav = root.createDiv("skill-manager__categories");
    categoryNav.createSpan({ cls: "skill-manager__categories-label", text: "分类" });
    categories.forEach((category) => {
      const count = category === "全部" ? scopedSkills.length : scopedSkills.filter((skill) => skill.category === category).length;
      const button = categoryNav.createEl("button", {
        cls: `skill-manager__category${category === this.category ? " is-active" : ""}`,
        attr: { "aria-pressed": String(category === this.category) },
      });
      button.createSpan({ text: category });
      button.createEl("small", { text: String(count) });
      button.onclick = () => { this.category = category; this.render(); };
    });

    const toolbar = root.createDiv("skill-manager__toolbar");
    const searchWrap = toolbar.createDiv("skill-manager__search");
    setIcon(searchWrap.createSpan(), "search");
    const search = searchWrap.createEl("input", { type: "search", placeholder: "搜索名称、说明或标签…", value: this.query });
    search.oninput = () => { this.query = search.value; this.renderCards(root); };

    const favoriteButton = toolbar.createEl("button", { cls: this.favoritesOnly ? "is-active" : "" });
    favoriteButton.setText("★ 仅看收藏");
    favoriteButton.onclick = () => { this.favoritesOnly = !this.favoritesOnly; this.render(); };
    this.renderCards(root);
  }

  private renderCards(root: HTMLElement): void {
    root.querySelector(".skill-manager__content")?.remove();
    const content = root.createDiv("skill-manager__content");
    const query = this.query.trim().toLowerCase();
    const visible = this.skills.filter((skill) => {
      const matchesQuery = !query || [skill.name, skill.description, skill.category, skill.source, ...skill.tags].join(" ").toLowerCase().includes(query);
      return matchesQuery && (this.skillScope === "全部" || skill.scope === this.skillScope) && (this.category === "全部" || skill.category === this.category) && (!this.favoritesOnly || skill.favorite);
    }).sort((a, b) => this.compareUsage(a, b));

    if (!visible.length) {
      const empty = content.createDiv("skill-manager__empty");
      setIcon(empty.createSpan(), "package-open");
      empty.createEl("h3", { text: "没有找到 Skill" });
      empty.createEl("p", { text: "可调整筛选条件，或在设置的 Skill 目录中添加 SKILL.md。" });
      return;
    }

    const grid = content.createDiv("skill-manager__grid");
    visible.forEach((skill) => this.renderCard(grid, skill));
  }

  private renderCard(grid: HTMLElement, skill: SkillRecord): void {
    const card = grid.createDiv("skill-card");
    card.setAttr("title", `双击查看 Skill 使用情况：${skill.path}`);
    card.ondblclick = () => void this.plugin.showSkillUsage(skill);
    const top = card.createDiv("skill-card__top");
    const icon = top.createDiv("skill-card__avatar");
    setIcon(icon, "sparkles");
    const favorite = top.createEl("button", { cls: `skill-card__favorite${skill.favorite ? " is-favorite" : ""}`, attr: { "aria-label": "收藏" } });
    setIcon(favorite, "star");
    favorite.onclick = async (event) => { event.stopPropagation(); await this.plugin.updateRecord(skill.id, { favorite: !skill.favorite }); await this.refresh(); };

    card.createEl("h3", { text: skill.name });
    card.createEl("p", { cls: "skill-card__description", text: skill.description || "暂无功能说明" });
    const tags = card.createDiv("skill-card__tags");
    [skill.category, skill.source, ...skill.tags.slice(0, 1)].filter(Boolean).forEach((tag) => tags.createSpan({ text: tag }));

    const file = card.createDiv("skill-card__file");
    setIcon(file.createSpan(), "file-text");
    file.createSpan({ text: skill.path });

    const stats = card.createDiv("skill-card__stats");
    stats.createSpan({ text: `查看 ${skill.usageCount} 次` });
    stats.createSpan({ text: skill.lastUsed ? `最近查看 ${this.relativeTime(skill.lastUsed)}` : "尚未查看" });

    const actions = card.createDiv("skill-card__actions");
    const usage = actions.createEl("button", { text: "查看使用情况" });
    usage.onclick = (event) => { event.stopPropagation(); void this.plugin.showSkillUsage(skill); };
    const locate = actions.createEl("button", { cls: "mod-cta", text: "Finder 中定位" });
    locate.onclick = (event) => { event.stopPropagation(); void this.plugin.locateSkill(skill); };
  }

  private relativeTime(timestamp: number): string {
    const days = Math.floor((Date.now() - timestamp) / 86_400_000);
    if (days <= 0) return "今天";
    if (days === 1) return "昨天";
    return `${days} 天前`;
  }

  private compareUsage(a: SkillRecord, b: SkillRecord): number {
    return b.usageCount - a.usageCount
      || (b.lastUsed || 0) - (a.lastUsed || 0)
      || a.category.localeCompare(b.category, "zh-CN")
      || a.name.localeCompare(b.name, "zh-CN");
  }
}

class SkillManagerSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: SkillManagerPlugin) { super(app, plugin); }
  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("分类资料目录")
      .setDesc("Vault 内用于补充 Skill 分类和说明的技能卡目录。")
      .addText((text) => text.setPlaceholder("Skills").setValue(this.plugin.settings.skillRoot).onChange(async (value) => {
        this.plugin.settings.skillRoot = value.trim().replace(/^\/+|\/+$/g, "") || "Skills";
        await this.plugin.saveSettings();
      }));
    new Setting(this.containerEl)
      .setName("电脑 Skill 目录")
      .setDesc("扫描电脑上的真实 SKILL.md；多个目录请用英文逗号分隔。")
      .addText((text) => text
        .setPlaceholder("~/.codex/skills, ~/.agents/skills, ~/.claude/skills")
        .setValue(this.plugin.settings.localSkillRoots.join(", "))
        .onChange(async (value) => {
          this.plugin.settings.localSkillRoots = value.split(",").map((item) => item.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        }));
  }
}

export default class SkillManagerPlugin extends Plugin {
  settings: SkillManagerSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new SkillManagerView(leaf, this));
    this.addRibbonIcon("sticky-note", "打开 Skill 便笺", () => void this.activateView());
    this.addCommand({ id: "open-skill-manager", name: "打开 Skill 便笺", callback: () => void this.activateView() });
    this.addSettingTab(new SkillManagerSettingTab(this.app, this));
  }

  async activateView(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  async scanSkills(): Promise<SkillRecord[]> {
    const metadata = await this.loadCatalogMetadata();
    const skillFiles = (await Promise.all(this.settings.localSkillRoots.map((root) => this.findSkillFiles(this.expandHome(root))))).flat();
    const uniqueFiles = [...new Set(skillFiles)];
    const scanned = await Promise.all(uniqueFiles.map(async (filePath) => {
      const content = await fs.readFile(filePath, "utf8");
      const frontmatter = parseFrontmatter(content);
      const folderName = path.basename(path.dirname(filePath));
      const name = frontmatter.name || folderName;
      const catalog = metadata.get(name) || metadata.get(folderName);
      const id = filePath;
      const saved = { favorite: false, usageCount: 0, ...this.settings.records[id] };
      return {
        id,
        name,
        description: catalog?.description || frontmatter.description || "真实 Skill 源文件",
        category: catalog?.category || frontmatter.category || this.inferCategory(name, filePath),
        tags: getTags(frontmatter.tags),
        path: filePath,
        source: this.inferSource(filePath),
        scope: this.inferScope(filePath),
        contentSignature: this.hashText(content.replace(/\r\n/g, "\n").trim()),
        ...saved,
      };
    }));
    const deduplicated = new Map<string, SkillRecord>();
    scanned.forEach((skill) => {
      const key = (skill as SkillRecord & { contentSignature: string }).contentSignature;
      if (!deduplicated.has(key)) deduplicated.set(key, skill);
    });
    return [...deduplicated.values()].sort((a, b) => b.usageCount - a.usageCount
      || (b.lastUsed || 0) - (a.lastUsed || 0)
      || a.category.localeCompare(b.category, "zh-CN")
      || a.name.localeCompare(b.name, "zh-CN"));
  }

  async showSkillUsage(skill: SkillRecord): Promise<void> {
    await this.updateRecord(skill.id, { usageCount: skill.usageCount + 1, lastUsed: Date.now() });
    new SkillUsageModal(this.app, skill, this).open();
  }

  needsChineseTranslation(markdown: string): boolean {
    const letters = (markdown.match(/[A-Za-z]/g) || []).length;
    const chinese = (markdown.match(/[\u3400-\u9fff]/g) || []).length;
    return letters > 80 && letters > chinese * 1.4;
  }

  async translateMarkdown(markdown: string, filePath: string): Promise<string> {
    const companionPath = path.join(path.dirname(filePath), "SKILL.zh-CN.md");
    try {
      const companion = stripFrontmatter(await fs.readFile(companionPath, "utf8"));
      if (!this.needsChineseTranslation(companion)) return companion;
    } catch { /* 中文伴随文件尚未由大模型生成。 */ }
    const cacheKey = `${filePath}:${this.hashText(markdown)}`;
    const cached = this.settings.translations[cacheKey];
    if (cached) return cached;
    try {
      try { await this.assertLocalTranslationAvailable(); }
      catch { return markdown; }
      const parts = markdown.split(/(```[\s\S]*?```)/g);
      const translated: string[] = [];
      for (const part of parts) {
        if (!part || part.startsWith("```")) { translated.push(part); continue; }
        const chunks = this.chunkText(part, 1800);
        for (const chunk of chunks) translated.push(await this.translateTextLocal(chunk));
      }
      const result = translated.join("");
      this.settings.translations[cacheKey] = result;
      await this.saveSettings();
      return result;
    } catch {
      return markdown;
    }
  }

  private async translateTextLocal(text: string): Promise<string> {
    if (!text.trim() || !/[A-Za-z]/.test(text)) return text;
    const response = await requestUrl({
      url: "http://127.0.0.1:11434/api/generate",
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({
        model: "gemma3:4b",
        stream: false,
        prompt: `请把下面的 Skill 使用说明翻译成简洁、自然、容易理解的简体中文。保持 Markdown 标题、列表、链接、代码、命令、参数、文件路径和专有名词不变。只输出翻译结果，不要解释。\n\n${text}`,
        options: { temperature: 0.1 },
      }),
    });
    const data = response.json as { response?: string };
    if (!data.response) throw new Error("本机模型没有返回翻译结果");
    return data.response;
  }

  private async assertLocalTranslationAvailable(): Promise<void> {
    const response = await requestUrl({ url: "http://127.0.0.1:11434/api/tags", method: "GET" });
    const models = response.json?.models as Array<{ name?: string }> | undefined;
    if (!models?.some((model) => model.name === "gemma3:4b" || model.name?.startsWith("gemma3:4b"))) {
      throw new Error("未找到本机 gemma3:4b 模型");
    }
  }

  private chunkText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let current = "";
    text.split(/(?<=\n)/).forEach((line) => {
      if (current.length + line.length > maxLength && current) { chunks.push(current); current = ""; }
      if (line.length > maxLength) {
        if (current) { chunks.push(current); current = ""; }
        for (let index = 0; index < line.length; index += maxLength) chunks.push(line.slice(index, index + maxLength));
      } else current += line;
    });
    if (current) chunks.push(current);
    return chunks;
  }

  private hashText(text: string): string {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    return (hash >>> 0).toString(36);
  }

  async locateSkill(skill: SkillRecord): Promise<void> {
    shell.showItemInFolder(skill.path);
  }

  expandHome(input: string): string {
    return input.startsWith("~/") ? path.join(os.homedir(), input.slice(2)) : input;
  }

  private async findSkillFiles(root: string): Promise<string[]> {
    const found: string[] = [];
    const walk = async (directory: string): Promise<void> => {
      let entries;
      try { entries = await fs.readdir(directory, { withFileTypes: true }); } catch { return; }
      await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory() && ![".git", ".tmp", "node_modules"].includes(entry.name)) await walk(entryPath);
        else if (entry.isFile() && entry.name.toLowerCase() === "skill.md") found.push(entryPath);
      }));
    };
    await walk(root);
    return found;
  }

  private async loadCatalogMetadata(): Promise<Map<string, { category: string; description: string }>> {
    const result = new Map<string, { category: string; description: string }>();
    const root = `${this.settings.skillRoot}/`;
    const files = this.app.vault.getMarkdownFiles().filter((file) => file.path.startsWith(root));
    await Promise.all(files.map(async (file) => {
      const content = await this.app.vault.cachedRead(file);
      const name = content.match(/^skill:\s*(.+)$/m)?.[1]?.trim() || file.basename;
      const category = content.match(/^category:\s*(.+)$/m)?.[1]?.trim() || "未分类";
      const description = content.match(/\*\*用途\*\*[：:]\s*([^\n]+)/)?.[1]?.trim() || "";
      result.set(name, { category, description });
    }));
    return result;
  }

  private inferCategory(name: string, filePath: string): string {
    const value = `${name} ${filePath}`.toLowerCase();
    if (/lark|feishu/.test(value)) return "飞书";
    if (/video|motion|remotion|voice|music|caption|transcri|multicam/.test(value)) return "视频与音频";
    if (/stock|finance|trading|polymarket|akshare|tushare/.test(value)) return "投资分析";
    if (/figma|canva|slide|document|spreadsheet|excel|pdf|docx|pptx|design/.test(value)) return "设计与办公";
    if (/perspective|research|knowledge|feynman|munger|karpathy/.test(value)) return "研究与思维";
    if (/content|writer|writing|seo|xhs|cover|social|news|script|editor/.test(value)) return "内容创作";
    if (/cloudflare|api|fullstack|architect|code|developer|plugin|site/.test(value)) return "开发工具";
    return "系统工具";
  }

  private inferSource(filePath: string): string {
    if (filePath.includes("/.claude/skills/")) return "Claude";
    if (filePath.includes("/.claude/plugins/") || filePath.includes("/Application Support/Claude/")) return "Claude 插件";
    if (filePath.includes("/.codex/plugins/")) return "Codex 插件";
    if (filePath.includes("/.agents/skills/")) return "Agents";
    if (filePath.includes("/Open Design.app/")) return "Open Design";
    if (filePath.includes("/Documents/Codex/")) return "项目资源";
    if (filePath.includes("/.codex/vendor_imports/")) return "Codex 导入库";
    return "Codex";
  }

  private inferScope(filePath: string): "已安装" | "资源库" {
    return /\/Documents\/Codex\/|\/tools\/|\/\.codex\/vendor_imports\/|\/\.codex\/\.chatgpt-projects\//.test(filePath)
      ? "资源库"
      : "已安装";
  }

  async updateRecord(id: string, patch: SkillManagerSettings["records"][string]): Promise<void> {
    this.settings.records[id] = { favorite: false, usageCount: 0, ...this.settings.records[id], ...patch };
    await this.saveSettings();
  }

  async updateBoardState(stateKey: string, field: string, status: "unresolved" | "provisional" | "locked", value: string): Promise<void> {
    this.settings.boardStates[stateKey] ||= {};
    this.settings.boardStates[stateKey][field] = { status, value };
    await this.saveSettings();
  }

  async applyBoardTemplate(stateKey: string, templateName: string, values: Record<string, string>): Promise<void> {
    this.settings.boardStates[stateKey] ||= {};
    this.settings.boardStates[stateKey].__template = { status: "locked", value: templateName };
    Object.entries(values).forEach(([field, value]) => {
      this.settings.boardStates[stateKey][field] = { status: "provisional", value };
    });
    await this.saveSettings();
  }

  async loadSettings(): Promise<void> {
    const saved = await this.loadData() as Partial<SkillManagerSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    const configured = saved?.localSkillRoots || [];
    this.settings.localSkillRoots = [...new Set([...DEFAULT_SETTINGS.localSkillRoots, ...configured])];
  }
  async saveSettings(): Promise<void> { await this.saveData(this.settings); }
}
