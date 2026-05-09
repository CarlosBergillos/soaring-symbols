import { readFileSync, writeFileSync } from 'fs';
import { optimize } from 'svgo';

const fileIn = "assets/ana/logo-original.svg";
const fileOut = "assets/ana/logo.svg";
const targetSize = 64;

let originalWidth;
let originalHeight;

export const myPlugin = {
  name: 'myPlugin',
  description: 'My plugin.',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
            if (node.name == "svg") {
                const viewBox = node.attributes.viewBox.split(" ");
                originalWidth = parseInt(viewBox[2])
                originalHeight = parseInt(viewBox[3])
                node.attributes.viewBox = `0 0 ${targetSize} ${targetSize}`
                delete node.attributes.width;
                delete node.attributes.height;
            }

            if (node.name == "path") {
                if (originalWidth != targetSize || originalHeight != targetSize) {
                    const scale = targetSize / Math.max(originalWidth, originalHeight);
                    node.attributes.transform = node.attributes.transform ?? "";
                    node.attributes.transform += `scale(${scale})`
                }

                if (originalWidth > originalHeight) {
                    const translateY = (originalWidth / 2) - (originalHeight / 2);
                    node.attributes.transform = node.attributes.transform ?? "";
                    node.attributes.transform += ` translate(0, ${translateY})`
                }
            }
        },
      },
    };
  },
};

function main() {
    console.log("Reading", fileIn)
    const svgContent = readFileSync(fileIn)

    const { data } = optimize(svgContent, {
        multipass: true,
        plugins: [
            myPlugin,
            'preset-default',
        ]
    });
    console.log(data);

    writeFileSync(fileOut, data);
}


main()