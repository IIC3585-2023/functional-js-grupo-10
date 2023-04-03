const fs = require('fs')
const _ = require('lodash')

const tagMap = new Map([
    [/^#$/, 'h1'], 
    [/^##$/, 'h2'],
    [/^###$/, 'h3'],
    [/^####$/, 'h4'],
    [/^#####$/, 'h5'],
    [/^######$/, 'h6'],
    [/^[*+-]$/, 'li'],
    [/^\d+\./, 'numero'],
    // [/.*\S.*/, 'p'] // cualquier string que no sea vacio
]);

const tagRegex = Array.from(tagMap.keys())

function getRegex(string) {
    return tagRegex.filter(rx => rx.test(string))[0]
}

// función que recibe el tag de md y le agrega los tag (el primero que calce) html al principio y final de la linea
const addTag = ([md, line]) => `<${tagMap.get(getRegex(md))}>${line}</${tagMap.get(getRegex(md))}>`;

const pipe = functions => data => {
    return functions.reduce( (value, func) => func(value), data)
}

function replace(string, pattern, line) {
    return _.replace(line, pattern, string)
}

const curriedReplace = _.curry(replace)
const replaceBoldCursive = curriedReplace(`<em><strong>$1</strong></em>`)
const replaceBold = curriedReplace(`<strong>$1</strong>`)
const replaceCursive = curriedReplace(`<em>$1</em>`)

const pipelineBoldCursive = pipe([
    replaceBoldCursive(/\*\*\*(.*?)\*\*\*/g),
    replaceBoldCursive(/___(.*?)___/g),
    replaceBoldCursive(/__*(.*?)*__/g),
    replaceBoldCursive(/\*\*_(.*?)_\*\*/g),
])

const pipelineBold = pipe([
    replaceBold(/\*\*(.*?)\*\*/g),
    replaceBold(/__(.*?)__/g),
])

const pipelineCursive = pipe([
    replaceCursive(/\*(.*?)\*/g),
    replaceCursive(/_(.*?)_/g),
])

let filename = process.argv[2]

fs.readFile(filename, 'utf8', (err, data) => {
    // const lines = data.split(/\r?\n/) // eol y salto de linea

    const html = _.chain(data)
        .split(/\r?\n/) // eol y salto de linea
        .map(line => _.split(line, ' ')) // separa cada palabra dentro de cada linea
        .map(words => [words[0], words.slice(1).join(' ')]) // crea una lista donde el primer item es la primera palabra y el segundo es el resto de la linea
        .map(line => getRegex(line[0]) ? addTag(line) : // para cada linea revisa si la primera palabra esta en el dict y si esta le aplica la función addTag
            line[0] != '' ? `<p>${line.slice().join(' ')}</p>`: '') // si no está en el dict se revisa si es que no es una linea vacía, si no es vacía se le añade el tag p al principio y final de la linea
        // .map(line => getRegex(line[0]) ? addTag(line) : '')
        // .filter(line => line != '') // se filtran las lineas vacías
        
        .map(line => pipelineBoldCursive(line))
        // .map(line => _.replace(line, /(\*\*\*|___|__\*|\*\*_)(.*\S.*)\1/,  `<em><strong>$2</strong></em>`))
        // .map(line => _.replace(line, /\*\*\*(.*?)\*\*\*/,  `<em><strong>$1</strong></em>`))
        // .map(line => _.replace(line, /___(.*?)___/,  `<em><strong>$1</strong></em>`))
        // .map(line => _.replace(line, /__*(.*?)*__/,  `<em><strong>$1</strong></em>`))
        // .map(line => _.replace(line, /\*\*_(.*?)_\*\*/,  `<em><strong>$1</strong></em>`))
        
        .map(line => pipelineBold(line))
        // .map(line => _.replace(line, /(\*\*|__)(.*\S.*)\1/,  `<strong>$2</strong>`))
        // .map(line => _.replace(line, /\*\*(.*?)\*\*/,  `<strong>$1</strong>`))
        // .map(line => _.replace(line, /__(.*?)__/,  `<strong>$1</strong>`))

        .map(line => pipelineCursive(line))
        // .map(line => _.replace(line, /(\*|_)(.*\S.*)\1/,  `<em>$2</em>`))
        // .map(line => _.replace(line, /\*(.*?)\*/,  `<em>$1</em>`))
        // .map(line => _.replace(line, /_(.*?)_/,  `<em>$1</em>`))

        .map(line => _.replace(line, /\`(.*?)\`/g,  `<code>$1</code>`))
        .map(line => _.replace(line, /!\[(.*?)\]\((.*?)\)/g, `<img src=$2 alt=$1/>`))
        .map(line => _.replace(line, /\[(.*?)\]\((.*?)\)/g, `<a href=$2>$1</a>`))
        .map(line => _.replace(line, /<li>(.*?)<\/li>/g, `<ul>\n\t<li>$1</li>\n</ul>`))
        .map(line => _.replace(line, /<numero>(.*?)<\/numero>/g, `<ol>\n\t<li>$1</li>\n</ol>`))
        .join('\n')
        .replace(/<\/ul>\n<ul>\n/g, '')
        .replace(/<\/ol>\n<ol>\n/g, '')
        .replace(/\n+/g, '\n') // se filtran las lineas vacías
        .value()
    console.log(html)
    
    fs.writeFile(filename.replace('.md','.html'), html, err => err ? console.log(err) : null)

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