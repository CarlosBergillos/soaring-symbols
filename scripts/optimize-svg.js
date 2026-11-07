import { Resvg } from '@resvg/resvg-js'
import { optimize, loadConfig } from 'svgo'
import { readFileSync, writeFileSync } from 'fs'
import { parseArgs } from 'util'

const normalizeGeometry = {
    name: 'normalizeGeometry',
    fn: (root, params, info) => {
        const shapeNodes = new Set(['path', 'rect', 'polygon'])
        const bbox = params.originalBBox

        const scale = targetSize / Math.max(bbox.width, bbox.height)
        const translateX = -bbox.x + Math.max(0, bbox.height - bbox.width) / 2
        const translateY = -bbox.y + Math.max(0, bbox.width - bbox.height) / 2

        const transformNode = (node) => {
            node.attributes.transform = node.attributes.transform ?? ''
            if (scale !== 1) {
                node.attributes.transform += ` scale(${scale})`
            }
            if (translateX !== 0 || translateY !== 0) {
                node.attributes.transform += ` translate(${translateX} ${translateY})`
            }
        }

        return {
            element: {
                enter: (node) => {
                    if (info.multipassCount !== 0) {
                        return
                    }
                    if (node.name == 'svg') {
                        node.attributes.viewBox = `0 0 ${targetSize} ${targetSize}`
                        delete node.attributes.width
                        delete node.attributes.height
                    }
                    if (shapeNodes.has(node.name)) {
                        transformNode(node)
                    }
                },
            },
        }
    },
}

const optimizeSvgFile = async (filePath, targetSize) => {
    const originalSvg = readFileSync(filePath, 'utf8')
    const config = (await loadConfig()) ?? {}
    const plugins = config.plugins ?? []

    if (targetSize !== null) {
        const bbox = new Resvg(originalSvg).getBBox()
        plugins.push({
            ...normalizeGeometry,
            params: {
                originalBBox: bbox,
                targetSize: targetSize,
            },
        })
    }

    const { data } = optimize(originalSvg, {
        ...config,
        plugins,
    })

    return data
}

const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        'normalize-geometry': { type: 'string', default: '' }, // 'icon' | 'logo' | ''
    },
})

if (!positionals[0]) {
    console.error('Missing input file argument')
    process.exit(1)
}

const fileIn = positionals[0]
const fileOut = fileIn.replace(/\.svg$/, '.optimized.svg')
const targetSize =
    {
        logo: 64,
        icon: 24,
    }[values['normalize-geometry']] ?? null

const optimizedSvg = await optimizeSvgFile(fileIn, targetSize)
writeFileSync(fileOut, optimizedSvg)

console.log(`Optimized SVG written to ${fileOut}`)
