import { Resvg } from '@resvg/resvg-js'
import { optimize, loadConfig } from 'svgo'
import { readFileSync, writeFileSync } from 'fs'

const fileIn = 'assets/wip/level/original2.svg'
const fileOut = 'assets/wip/level/logo.svg'

const targetSize = 64

let firstPass = true
const bboxPlugin = (bbox) => {
    const scale = targetSize / Math.max(bbox.width, bbox.height)

    const transformNode = (node) => {
        node.attributes.transform = node.attributes.transform ?? ''

        if (bbox.width != targetSize || bbox.height != targetSize) {
            node.attributes.transform += ` scale(${scale})`
        }

        if (bbox.x != 0 || bbox.y != 0) {
            const translateX = -bbox.x
            const translateY = -bbox.y
            node.attributes.transform += ` translate(${translateX} ${translateY})`
        }

        if (bbox.width > bbox.height) {
            const translateY = bbox.width / 2 - bbox.height / 2
            node.attributes.transform += ` translate(0, ${translateY})`
        }
    }

    return {
        name: 'bbox',
        fn: () => {
            return {
                element: {
                    enter: (node, parent) => {
                        if (!firstPass) {
                            return
                        }
                        if (node.name == 'svg') {
                            node.attributes.viewBox = `0 0 ${targetSize} ${targetSize}`
                            delete node.attributes.width
                            delete node.attributes.height
                        }
                        if (
                            (node.name == 'path') |
                            (node.name == 'rect') |
                            (node.name == 'polygon')
                        ) {
                            transformNode(node)
                        }
                    },
                },
                root: {
                    exit: (node) => {
                        firstPass = false
                    },
                },
            }
        },
    }
}

const optimizeSvgFile = (filePath) => {
    const originalSvg = readFileSync(filePath, 'utf8')
    const bbox = new Resvg(originalSvg).getBBox()

    const { data: optimizedSvg } = optimize(originalSvg, {
        floatPrecision: 5,
        multipass: true,
        plugins: ['preset-default', bboxPlugin(bbox)],
    })

    writeFileSync(fileOut, optimizedSvg)
}

optimizeSvgFile(fileIn)
