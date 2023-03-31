const fs = require('fs')
const _ = require('lodash')

const tagDictionary = {
    '#': 'h1',
    '##': 'h2',
    '###': 'h3',
    '####': 'h4',
    '#####': 'h5',
    '######': 'h6',
    '*': 'li', // Agregar ul despues
    // '>': 'blockquote'
}

function addTag([sign, ...wordArray]) {
    const tag = tagDictionary[sign]
    const line = _.join(wordArray, ' ')
    return `<${tag}>${line}</${tag}>`
}

function createParagraph(wordArray) {
    const line = _.join(wordArray, ' ')
    if (line !== '') {
        return `<p>${line}</p>`
    }
    return ''
}

// function test([first, second]) {
//     console.log(first, second)
// }

fs.readFile('ejemplo.md', 'utf8', (err, data) => {
    const lines = data.split(/\r?\n/) // eol y salto de linea

    const chained = _.chain(lines)
        .map(line => _.split(line, ' '))
        .map(words => _.has(tagDictionary, words[0]) ? addTag(words) : createParagraph(words))
        .value()
    console.log(chained)
})