const fs = require('fs')
const _ = require('lodash')

function checkLineStart(char) {
    return function(line) {
        return line.startsWith(`${char} `)
    }
}

// diccionario que mapea el md a html
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

const inlineDictionary = {
    '*': 'em',
    '**': 'strong',
    '`': 'code',
}

// función que recibe el tag de mg y le agrega los tag html al principio y final de la linea
const addTag = ([md, line]) => `<${tagDictionary[md]}>${line}</${tagDictionary[md]}>`;


fs.readFile('ejemplo.md', 'utf8', (err, data) => {
    // let html = []
    const lines = data.split(/\r?\n/) // eol y salto de linea
    // lines.forEach(line => {
    //     console.log(checkLineStart('')(line), line)
    // })
    
    // const [firstWord, ...rest] = _.split(lines[1], ' ')
    // console.log(firstWord)
    // console.log(rest)
    // console.log(tagDictionary[firstWord])

    // const splitLines = _.chain(lines)
    //     .map(line => _.split(line, ' '))
    //     .map(words => [words[0], words.slice(1).join(' ')])
    //     .value()
    // console.log(splitLines)

    const splitLines = _.chain(lines) // chain
        .map(line => _.split(line, ' ')) // separa cada palabra dentro de cada linea
        .map(words => [words[0], words.slice(1).join(' ')]) // crea una lista donde el primer item es la primera palabra y el segundo es el resto de la linea
        .map(line => _.has(tagDictionary, line[0]) ? addTag(line) : // para cada linea revisa si la primera palabra esta en el dict y si esta le aplica la función addTag
            line[0] != '' ? `<p>${line.slice().join(' ')}</p>`: '') // si no está en el dict se revisa si es que no es una linea vacía, si no es vacía se le añade el tag p al principio y final de la linea
        .filter(line => line != '') // se filtran las lineas vacías
        .map(line => _.replace(line, /\*\*\*(.*?)\*\*\*/,  `<em><strong>$1</strong></em>`))
        .map(line => _.replace(line, /\*\*(.*?)\*\*/,  `<strong>$1</strong>`))
        .map(line => _.replace(line, /\*(.*?)\*/,  `<em>$1</em>`))
        .map(line => _.replace(line, /\`(.*?)\`/,  `<code>$1</code>`))
        .value()
    console.log(splitLines)

})