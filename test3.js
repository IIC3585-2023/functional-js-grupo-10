const fs = require('fs')
const _ = require('lodash')

const tagMap = new Map([
    [/^#$/, 'h1'],
    [/^##$/, 'h2'],
    [/^###$/, 'h3'],
    [/^####$/, 'h4'],
    [/^#####$/, 'h5'],
    [/^######$/, 'h6'],
    [/^\*$/, 'li'],
    [/^\d+\./, 'numero'],
    [/.*\S.*/, 'p'] // cualquier string que no sea vacio
]);

const tagRegex = Array.from(tagMap.keys())

function getRegex(string) {
    return tagRegex.filter(rx => rx.test(string))[0]
}

// función que recibe el tag de md y le agrega los tag (el primero que calce) html al principio y final de la linea
const addTag = ([md, line]) => `<${tagMap.get(getRegex(md))}>${line}</${tagMap.get(getRegex(md))}>`;

fs.readFile('ejemplo1.md', 'utf8', (err, data) => {
    const lines = data.split(/\r?\n/) // eol y salto de linea

    const splitLines = _.chain(lines) // chain
        .map(line => _.split(line, ' ')) // separa cada palabra dentro de cada linea
        .map(words => [words[0], words.slice(1).join(' ')]) // crea una lista donde el primer item es la primera palabra y el segundo es el resto de la linea
        // .map(line => getRegex(line[0]) ? addTag(line) : // para cada linea revisa si la primera palabra esta en el dict y si esta le aplica la función addTag
        //     line[0] != '' ? `<p>${line.slice().join(' ')}</p>`: '') // si no está en el dict se revisa si es que no es una linea vacía, si no es vacía se le añade el tag p al principio y final de la linea
        .map(line => getRegex(line[0]) ? addTag(line) : '')
        .filter(line => line != '') // se filtran las lineas vacías
        .map(line => _.replace(line, /\*\*\*(.*?)\*\*\*/,  `<em><strong>$1</strong></em>`))
        .map(line => _.replace(line, /\*\*(.*?)\*\*/,  `<strong>$1</strong>`))
        .map(line => _.replace(line, /\*(.*?)\*/,  `<em>$1</em>`))
        .map(line => _.replace(line, /\`(.*?)\`/,  `<code>$1</code>`))
        .map(line => _.replace(line, /<li>(.*?)<\/li>/, `<ul>\n\t<li>$1</li>\n</ul>`))
        .map(line => _.replace(line, /<numero>(.*?)<\/numero>/, `<ol>\n\t<li>$1</li>\n</ol>`))
        .join('\n')
        .replace(/<\/ul>\n<ul>\n/g, '')
        .replace(/<\/ol>\n<ol>\n/g, '')
        .value()
    console.log(splitLines)

    // const listLines = _.chain(splitLines)
    //     .map(line => line.startsWith('<li>') ? line : '') // reemplazo lineas no li con string vacio
    //     .map((line, idx, array) => line.startsWith('<li>') && (array[idx - 1] === '' || array[idx - 1] === undefined) ? `<ul>\n\t${line}` : line) // si el predecedor de una linea li es vacio o indefinido le agrego ul al principio
    //     .map((line, idx, array) => line.startsWith('<li>') && (array[idx + 1] === '' || array[idx + 1] === undefined) ? `${line}\n</ul>` : line) // si el sucesor de una linea li es vacio o indefinido le agrego ul al final
    //     .map(line => line.startsWith('<li>') ? `\t${line}` : line) // agrego indentacion a lineas li
    //     .map((line, idx) => line === '' ? splitLines[idx] : line) // se restablecen lineas no li
    //     // .join('\n')
    //     .value()

    // const numberLines = _.chain(listLines)
    //     .map(line => _.replace(line, /<numero>(.*?)<\/numero>/,  `<li>$1</li>`))
    //     .map(line => line.startsWith('<li>') ? line : '') // reemplazo lineas no li con string vacio
    //     .map((line, idx, array) => line.startsWith('<li>') && (array[idx - 1] === '' || array[idx - 1] === undefined) ? `<ol>\n\t${line}` : line) // si el predecedor de una linea li es vacio o indefinido le agrego ul al principio
    //     .map((line, idx, array) => line.startsWith('<li>') && (array[idx + 1] === '' || array[idx + 1] === undefined) ? `${line}\n</ol>` : line) // si el sucesor de una linea li es vacio o indefinido le agrego ul al final
    //     .map(line => line.startsWith('<li>') ? `\t${line}` : line) // agrego indentacion a lineas li
    //     .map((line, idx) => line === '' ? listLines[idx] : line) // se restablecen lineas no li
    //     .join('\n')
    //     .value()

    // console.log(numberLines)
})