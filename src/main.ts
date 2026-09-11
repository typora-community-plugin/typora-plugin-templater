import { editor } from 'typora'
import { fs, I18n, Notice, path, Plugin, PluginSettings, openQuickPick } from '@typora-community-plugin/core'
import * as Locale from './locales/lang.en.json'
import { DEFAULT_SETTINGS, TemplaterSettings } from './settings'
import { TemplaterSettingTab } from './setting-tab'
import { buildFunction, parseMarkdown, parseTemplate } from './template'
import { TemplateContext, USER_CANCELED } from './context'


export default class TemplaterPlugin extends Plugin<TemplaterSettings> {

  i18n!: I18n<typeof Locale>

  onload() {
    this.i18n = new I18n<typeof Locale>({
      localePath: path.join(this.manifest.dir!, 'locales')
    })

    if (!canUseAsync()) {
      setTimeout(() => this.app.plugins.disablePlugin(this.manifest.id))
      const { t } = this.i18n
      new Notice(t.notSupportAsync)
      throw new Error('[Templater] Not support `async`.')
    }

    this.registerSettings(
      new PluginSettings(this.app, this.manifest, {
        version: 1,
      }))

    this.settings.setDefault(DEFAULT_SETTINGS)

    this.registerSettingTab(new TemplaterSettingTab(this.app, this))

    this.loadTemplates()

    this.register(
      this.app.vault.on('mounted', () =>
        this.loadTemplates()))

    this.registerCommand({
      id: 'use-template',
      title: this.i18n.t.useTemplate,
      scope: 'global',
      callback: () => {
        const templates = this.templates.map(item => ({ label: item }))
        openQuickPick(templates, { placeholder: 'Select a template' })
          .then(selected => {
            if (!selected) return
            const tp = new TemplateContext(this)
            this.runTemplate(tp, selected.label)
              .then(md => tp.__filename
                ? (this.createNote(tp, md), tp.__opennote && this.openNote(tp))
                : this.pasteNote(md))
              .catch(reason => reason === USER_CANCELED
                ? Promise.resolve()
                : Promise.reject(reason))
          })
      },
    })
  }

  templates: string[] = []

  get templatesDir() {
    const dir = this.settings.get('templatesDir')

    if (path.isAbsolute(dir)) return dir

    const templatesRoot = this.app.config.isUsingGlobalConfig
      ? this.app.config.configDir
      : this.app.vault.path
    return path.join(templatesRoot, dir)
  }

  loadTemplates() {
    const { templatesDir } = this
    return fs.access(templatesDir)
      .catch(() => fs.mkdir(templatesDir))
      .then(() => fs.list(templatesDir))
      .then((files) => this.templates = files)
  }

  async runTemplate(tp: TemplateContext, file: string) {
    const { templatesDir } = this
    const tmpl = fs.readTextSync(path.join(templatesDir, file))

    const { template, code } = parseTemplate(tmpl)
    const fn = buildFunction(code)
    let md = await fn(tp, template)

    md = md.trimStart()
    return md
  }

  async createNote(tp: TemplateContext, md: string) {
    const mdPath = tp.__filename
    const { t } = this.i18n
    const notice = new Notice(t.writingFile, 0)

    return fs.access(mdPath)
      .then(() => notice
        .setCloseable(true)
        .setMessage(t.fileAlreadyExists)
        .show())
      .catch(() =>
        fs.writeText(mdPath, md)
          .then(() => notice.close()))
  }

  openNote(tp: TemplateContext) {
    return this.app.openFile(tp.__filename)
  }

  pasteNote(md: string) {
    const { frontMatters, content } = parseMarkdown(md)

    // merge frontmatters
    frontMatters.forEach(p => {
      const [, key, value] = p.match(/^(\w+):\s*(.*)$/) ?? []
      editor.docMenu.writeProperty(key, value)
    })

    editor.UserOp.pasteHandler(editor, content, true)
  }
}

function canUseAsync() {
  try {
    new Function('async function test() {}');
    return true;
  } catch (e) {
    return false;
  }
}
