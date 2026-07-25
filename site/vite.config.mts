import { fileURLToPath } from 'node:url'

export default {
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
}
