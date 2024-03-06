/**
 * @typedef {import('./lib/util/info.js').Info} Info
 * @typedef {import('./lib/util/schema.js').Schema} Schema
 */

import {aria} from './lib/aria.js'
import {find} from './lib/find.js'
import {hastToReact as htr} from './lib/hast-to-react.js'
import {html as htmlBase} from './lib/html.js'
import {normalize} from './lib/normalize.js'
import {svg as svgBase} from './lib/svg.js'
import {merge} from './lib/util/merge.js'
import {xlink} from './lib/xlink.js'
import {xml} from './lib/xml.js'
import {xmlns} from './lib/xmlns.js'

export const html = merge([xml, xlink, xmlns, aria, htmlBase], 'html')
export const svg = merge([xml, xlink, xmlns, aria, svgBase], 'svg')
export const hastToReact = htr;
export {
    find,
    normalize
}