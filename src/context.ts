import { app, openInputBox, openQuickPick, path } from "@typora-community-plugin/core"
import type TemplaterPlugin from "./main"


const plugin = Symbol('plugin')

export const USER_CANCELED = 'User canceled.'

export class TemplateContext {

  [plugin]: TemplaterPlugin

  __filename: string

  constructor(templater: TemplaterPlugin) {
    this[plugin] = templater
  }

  quickInput(options?: Parameters<typeof openInputBox>[0]) {
    return openInputBox({ ...options, title: 'Templater' })
      .then(text => {
        if (text) return text
        else return Promise.reject(USER_CANCELED)
      })
  }

  quickPick(items: string[], options?: Parameters<typeof openQuickPick>[1]) {
    return openQuickPick(items.map(label => ({ label })), { ...options, title: 'Templater' })
      .then((item: any) => {
        if (item) {
          if (options?.canPickMany)
            return item.map((i: any) => i.label)
          else
            return item.label
        }
        else return Promise.reject(USER_CANCELED)
      })
  }

  async writeNoteTo(mdPath: string) {
    const ext = path.extname(mdPath)
    if (ext !== '.md') {
      mdPath += '.md'
    }

    this.__filename = path.join(app.vault.path, mdPath)
  }
}
