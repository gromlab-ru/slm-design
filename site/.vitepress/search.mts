const headingPattern = /<h(\d).*?>(.*?<a.*? href="#.*?".*?>.*?<\/a>)<\/h\1>/gi
const headingContentPattern = /(.*?)<a.*? href="#(.*?)".*?>.*?<\/a>/i
const ruleBlockPattern = /<p id="(slm-(?:base|adv|pro)-[a-z][a-z0-9]*-\d{3})" class="[^"]*\bslm-rule\b[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
const rulePermalinkPattern = /<a\b[^>]*class="[^"]*\bslm-rule__permalink\b[^"]*"[^>]*>[\s\S]*?<\/a>/i

function clearHtml(value: string) {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function makeRulesSearchable(html: string) {
  return html.replace(ruleBlockPattern, (_block, anchor: string, innerHtml: string) => {
    const strong = innerHtml.match(/<strong>([\s\S]*?)<\/strong>/i)
    const label = clearHtml(strong?.[1] || anchor.toUpperCase())
    const bodyHtml = innerHtml
      .replace(/<strong>[\s\S]*?<\/strong>/i, '')
      .replace(rulePermalinkPattern, '')
      .trim()
    return `<h6>${label}<a href="#${anchor}"></a></h6><p>${bodyHtml}</p>`
  })
}

function* splitByHeadings(html: string) {
  const parts = html.split(headingPattern)
  parts.shift()
  let parentTitles: string[] = []

  for (let index = 0; index < parts.length; index += 3) {
    const level = Number.parseInt(parts[index], 10) - 1
    const heading = headingContentPattern.exec(parts[index + 1])
    const title = clearHtml(heading?.[1] || '')
    const anchor = heading?.[2] || ''
    const text = clearHtml(parts[index + 2] || '')

    if (!title || !text) continue

    let titles = parentTitles.slice(0, level)
    titles[level] = title
    titles = titles.filter(Boolean)

    yield { anchor, titles, text }

    if (level === 0) parentTitles = [title]
    else parentTitles[level] = title
  }
}

export function* splitSearchSections(file: string, html: string) {
  const normalizedFile = file.replaceAll('\\', '/')
  const documentTitle = normalizedFile.includes('/ru/specification/')
    ? 'Спецификация'
    : normalizedFile.includes('/ru/guide/')
      ? 'Архитектурный гайд'
      : null

  for (const section of splitByHeadings(makeRulesSearchable(html))) {
    yield {
      ...section,
      titles: documentTitle ? [documentTitle, ...section.titles] : section.titles,
    }
  }
}
