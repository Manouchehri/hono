import type { Context } from '../../context'
import type { Next } from '../../types'
import { getFilePath } from '../../utils/filepath'
import { getMimeType } from '../../utils/mime'

export type ServeStaticOptions = {
  root?: string
  path?: string
  rewriteRequestPath?: (path: string) => string
}

const DEFAULT_DOCUMENT = 'index.html'

export const serveStatic = (options: ServeStaticOptions = { root: '' }) => {
  return async (c: Context, next: Next) => {
    // Do nothing if Response is already set
    if (c.finalized) {
      await next()
      return
    }

    const url = new URL(c.req.url)
    const filename = options.path ?? decodeURI(url.pathname)
    let path = getFilePath({
      filename: options.rewriteRequestPath ? options.rewriteRequestPath(filename) : filename,
      root: options.root,
      defaultDocument: DEFAULT_DOCUMENT,
    })

    path = `./${path}`

    let content

    try {
      content = await Deno.readFile(path)
    } catch (e) {
      console.warn(`${e}`)
    }

    if (content) {
      const mimeType = getMimeType(path)
      if (mimeType) {
        c.header('Content-Type', mimeType)
      }
      // Return Response object
      return c.body(content)
    } else {
      console.warn(`Static file: ${path} is not found`)
      await next()
    }
    return
  }
}
