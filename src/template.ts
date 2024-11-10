import { TemplateContext } from "./context"

const RE_FRONT_MATTER = /^---\n([\s\S]+?)\n---\n/
const RE_CODE_BLOCK = /```j(?:ava)?s(?:cript)?\n([\s\S]+?)\n```/

export function parseTemplate(rawTemplate: string) {
  let code = ''

  const template = rawTemplate
    .replace(RE_FRONT_MATTER, '')
    .replace(RE_CODE_BLOCK, (_, $1) => {
      code = $1
      return ''
    })

  return { template, code }
}

const AsyncFunction = async function () {}.constructor;

export function buildFunction(rawCode: string) {
  const code = `${rawCode}\n\nreturn __template.replace(/{{(.*?)}}/g, function (_, $1) { return eval($1); });`
  // @ts-ignore
  const fn = new AsyncFunction('tp', '__template', code)
  return fn as (ctx: TemplateContext, __template: string) => Promise<string>
}