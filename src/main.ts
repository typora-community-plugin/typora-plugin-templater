import { editor } from 'typora'
import { fs, Notice, path, Plugin, PluginSettings, openQuickPick } from '@typora-community-plugin/core'
import { DEFAULT_SETTINGS, TemplaterSettings } from './settings'
import { TemplaterSettingTab } from './setting-tab'
import { buildFunction, parseMarkdown, parseTemplate } from './template'
import { TemplateContext, USER_CANCELED } from './context'


export default class TemplaterPlugin extends Plugin<TemplaterSettings> {

  onload() {
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
      title: 'Use Template',
      scope: 'global',
      callback: () => {
        const templates = this.templates.map(t => ({ label: t }))
        openQuickPick(templates, { placeholder: 'Select a template' })
          .then(t => {
            if (!t) return
            const tp = new TemplateContext(this)
            this.runTemplate(tp, t.label)
              .then(md => tp.__filename
                ? this.createNote(tp, md)
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
    const templatesRoot = this.app.config.isUsingGlobalConfig
      ? this.app.config.configDir
      : this.app.vault.path
    return path.join(templatesRoot, this.settings.get('templatesDir'))
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

    const notice = new Notice('[Templater] Writing file...', 0)

    return fs.access(mdPath)
      .then(() => notice
        .setCloseable(true)
        .setMessage('[Templater] Error: The file already exists.')
        .show())
      .catch(() =>
        fs.writeText(mdPath, md)
          .then(() => notice.close()))
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
