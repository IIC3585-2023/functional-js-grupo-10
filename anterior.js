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
]);

const tagRegex = Array.from(tagMap.keys())

function getRegex(string) {
    return tagRegex.filter(rx => rx.test(string))[0]
}

const addTag = ([md, line]) => `<${tagMap.get(getRegex(md))}>${line}</${tagMap.get(getRegex(md))}>`;

let filename = process.argv[2]

fs.readFile(filename, 'utf8', (err, data) => {
    const lines = data.split(/\r?\n/)

    const regularLines = _.chain(lines)
        .map(line => _.split(line, ' '))
        .map(words => [words[0], words.slice(1).join(' ')])
        .map(line => getRegex(line[0]) ? addTag(line) :
            line[0] != '' ? `<p>${line.slice().join(' ')}</p>`: '')
        
        .map(line => _.replace(line, /\*\*\*(.*?)\*\*\*/,  `<em><strong>$1</strong></em>`))
        .map(line => _.replace(line, /___(.*?)___/,  `<em><strong>$1</strong></em>`))
        .map(line => _.replace(line, /__*(.*?)*__/,  `<em><strong>$1</strong></em>`))
        .map(line => _.replace(line, /\*\*_(.*?)_\*\*/,  `<em><strong>$1</strong></em>`))
        
        .map(line => _.replace(line, /\*\*(.*?)\*\*/,  `<strong>$1</strong>`))
        .map(line => _.replace(line, /__(.*?)__/,  `<strong>$1</strong>`))

        .map(line => _.replace(line, /\*(.*?)\*/,  `<em>$1</em>`))
        .map(line => _.replace(line, /_(.*?)_/,  `<em>$1</em>`))

        .map(line => _.replace(line, /\`(.*?)\`/g,  `<code>$1</code>`))
        .map(line => _.replace(line, /!\[(.*?)\]\((.*?)\)/g, `<img src=$2 alt=$1/>`))
        .map(line => _.replace(line, /\[(.*?)\]\((.*?)\)/g, `<a href=$2>$1</a>`))

        .value()

        const fixedListLines = _.chain(regularLines)
            .map(line => line.startsWith('<li>') ? line : '')
            .map((line, idx, array) => line.startsWith('<li>') && (array[idx - 1] === '' || array[idx - 1] === undefined) ? `<ul>\n\t${line}` : line) // si el predecedor de una linea li es vacio o indefinido le agrego ul al principio
            .map((line, idx, array) => line.startsWith('<li>') && (array[idx + 1] === '' || array[idx + 1] === undefined) ? `${line}\n</ul>` : line) // si el sucesor de una linea li es vacio o indefinido le agrego ul al final
            .map(line => line.startsWith('<li>') ? `\t${line}` : line)
            .map((line, idx) => line === '' ? splitLines[idx] : line)
            .value()

        const fixedNumberLines = _.chain(fixedListLines)
            .map(line => _.replace(line, /<numero>(.*?)<\/numero>/,  `<li>$1</li>`))
            .map(line => line.startsWith('<li>') ? line : '')
            .map((line, idx, array) => line.startsWith('<li>') && (array[idx - 1] === '' || array[idx - 1] === undefined) ? `<ol>\n\t${line}` : line) // si el predecedor de una linea li es vacio o indefinido le agrego ul al principio
            .map((line, idx, array) => line.startsWith('<li>') && (array[idx + 1] === '' || array[idx + 1] === undefined) ? `${line}\n</ol>` : line) // si el sucesor de una linea li es vacio o indefinido le agrego ul al final
            .map(line => line.startsWith('<li>') ? `\t${line}` : line)
            .map((line, idx) => line === '' ? listLines[idx] : line)
            .join('\n')
            .replace(/\n+/g, '\n')
            .value()
    
    fs.writeFile(filename.replace('.md','.html'), fixedNumberLines, err => err ? console.log(err) : null)
})