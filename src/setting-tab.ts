import { JSBridge } from "typora"
import { App, fs, I18n, Notice, SettingTab, path } from "@typora-community-plugin/core"
import type TemplaterPlugin from "./main"
import * as Locale from './locales/lang.en.json'
import { DEFAULT_SETTINGS } from "./settings"


export class TemplaterSettingTab extends SettingTab {

  get name() {
    return 'Templater'
  }

  i18n = new I18n<typeof Locale>({
    localePath: path.join(this.plugin.manifest.dir!, 'locales')
  })

  constructor(
    private app: App,
    private plugin: TemplaterPlugin
  ) {
    super()

    this.render()
  }

  render() {
    const { plugin } = this
    const { t } = this.i18n

    this.addSetting(setting => {
      setting.addName(t.templateFolder)
      setting.addDescription(t.templateFolderDesc)
      setting.addText(input => {
        input.value = plugin.settings.get('templatesDir')
        input.placeholder = DEFAULT_SETTINGS.templatesDir
        input.oninput = () => {
          plugin.settings.set('templatesDir', input.value ?? DEFAULT_SETTINGS.templatesDir)
        }
      })
      setting.addButton(button => {
        button.classList.add('primary')
        button.innerHTML = '<span class="fa fa-refresh"></span>'
        button.title = t.reload
        button.onclick = () =>
          this.plugin.loadTemplates()
            .then(() => {
              if (plugin.templates.length)
                new Notice(t.reloadedSuccessMsg)
              else
                new Notice(t.reloadedEmptyMsg)
            })
      })
      setting.addButton(button => {
        button.classList.add('primary')
        button.innerHTML = '<span class="fa fa-folder-o"></span>'
        button.title = t.open
        button.onclick = () => {
          const { templatesDir } = this.plugin
          fs.access(templatesDir)
            .catch(() => fs.mkdir(templatesDir))
            .then(() => JSBridge.invoke("shell.openItem", templatesDir))
        }
      })
    })
  }
}
