import { TemplateContext } from "./context"


const RE_FRONT_MATTER = /^---\n([\s\S]+?)\n---\n?/
const RE_CODE_BLOCK = /\n?```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/

export function parseTemplate(rawTemplate: string) {
  let code = ''

  const template = rawTemplate
    .replace(RE_CODE_BLOCK, (_, $1) => {
      if (!code) {
        code = $1
        return ''
      }
      else {
        return _
      }
    })

  return { template, code }
}

export function parseMarkdown(md: string) {
  let frontMatter = ''

  const content = md
    .replace(RE_FRONT_MATTER, (_, $1) => {
      frontMatter = $1
      return ''
    })

  const frontMatters = frontMatter.split(/\n(?=\S)/)

  return { frontMatters, content }
}

const AsyncFunction = async function () { }.constructor;

export function buildFunction(rawCode: string) {
  const code = `${rawCode}\n\nreturn __template.replace(/{{(.*?)}}/g, function (_, $1) { return eval($1); });`
  // @ts-ignore
  const fn = new AsyncFunction('tp', '__template', code)
  return fn as (ctx: TemplateContext, __template: string) => Promise<string>
}
