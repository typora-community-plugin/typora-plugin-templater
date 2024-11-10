import { JSBridge } from "typora"
import { App, fs, I18n, Notice, SettingTab } from "@typora-community-plugin/core"
import type TemplaterPlugin from "./main"
import { DEFAULT_SETTINGS } from "./settings"


export class TemplaterSettingTab extends SettingTab {

  get name() {
    return 'Templater'
  }

  i18n = new I18n({
    resources: {
      'en': {
        templateFolder: 'Templater folder',
        templateFolderDesc: '- The folder includes any markdown file. - Reload button: reload templates list from folder, after changed path or files in it.\n - Open folder button: open templates folder to add template files.',
        open: 'Open folder',
        reload: 'Reload',
        reloadedSuccessMsg: 'Templates load successfully.',
        reloadedEmptyMsg: 'No templates be found.',
      },
      'zh-cn': {
        templateFolder: '模板文件夹',
        templateFolderDesc: '- 该文件夹包含任意数量 Markdown 文件。\n - 重新加载按钮：手动从文件夹中重新加载模板列表，适用于修改了文件夹路径或添加/删除了文件。\n - 打开文件夹按钮：打开模板文件夹以添加模板文件',
        open: '打开文件夹',
        reload: '重新加载',
        reloadedSuccessMsg: '模板加载成功。',
        reloadedEmptyMsg: '没有找到任何模板。',
      },
    }
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
