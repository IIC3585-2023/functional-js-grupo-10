const fs = require('fs')
const _ = require('lodash')

// Asociación entre carácteres markdown (como expresiones regulares) y tags html
const tagMap = new Map([
    [/^#$/, 'h1'], // String debe ser exactamente igual a # (encabezado de nivel 1)
    [/^##$/, 'h2'], // String debe ser exactamente igual a ## (encabezado de nivel 2)
    [/^###$/, 'h3'], // String debe ser exactamente igual a ### (encabezado de nivel 3)
    [/^####$/, 'h4'], // String debe ser exactamente igual a #### (encabezado de nivel 4)
    [/^#####$/, 'h5'], // String debe ser exactamente igual a ##### (encabezado de nivel 5)
    [/^######$/, 'h6'], // String debe ser exactamente igual a ###### (encabezado de nivel 6)
    [/^[*+-]$/, 'li'], // String debe ser exactamente igual a *,+,- (item de lista de punteo)
    [/^\d+\./, 'numero'], // String debe ser un número seguido de un punto (item de lista ordenada) - Tag 'numero' es temporal
]);

// Lista con las expresiones regulares del tagMap
const tagRegex = Array.from(tagMap.keys())

// Función que busca la expresión regular con la que el string hace match primero
function getRegex(string) {
    return tagRegex.filter(rx => rx.test(string))[0]
}

// Función que recibe el caracter de markdown y retorna el texto con las etiquetas html del tagMap
const addTag = ([md, line]) => `<${tagMap.get(getRegex(md))}>${line}</${tagMap.get(getRegex(md))}>`;

// Función pipe (extraída de slides del curso)
const pipe = functions => data => {
    return functions.reduce( (value, func) => func(value), data)
}

// Función para reemplazar patrones con string en una linea (se invirtieron el orden de los parámetros para el currying)
function replace(string, pattern, line) {
    return _.replace(line, pattern, string)
}

// Currying de la función de reemplazo
const curriedReplace = _.curry(replace)

// Entregamos string html con etiquetas de énfasis y el texto a capturar ($1)
const replaceBoldCursive = curriedReplace(`<em><strong>$1</strong></em>`) // Html para texto en cursiva y negrita
const replaceBold = curriedReplace(`<strong>$1</strong>`) // Html para texto en negrita
const replaceCursive = curriedReplace(`<em>$1</em>`) // Html para texto en cursiva

// Pipeline que busca patrones (expresiones regulares) en negrita y cursiva, y los reemplaza con el string de replaceBoldCursive
const pipelineBoldCursive = pipe([
    replaceBoldCursive(/\*\*\*(.*?)\*\*\*/g), // Captura textos entre *** y *** en toda la línea
    replaceBoldCursive(/___(.*?)___/g), // Captura textos entre ___ y ___ en toda la línea
    replaceBoldCursive(/__\*(.*?)\*__/g), // Captura textos entre __* y *__ en toda la línea
    replaceBoldCursive(/\*\*_(.*?)_\*\*/g), // Captura textos entre **_ y _** en toda la línea
])

// Pipeline que busca patrones (expresiones regulares) en negrita, y los reemplaza con el string de replaceBold
const pipelineBold = pipe([
    replaceBold(/\*\*(.*?)\*\*/g), // Captura textos entre ** y ** en toda la línea
    replaceBold(/__(.*?)__/g), // Captura textos entre __ y __ en toda la línea
])

// Pipeline que busca patrones (expresiones regulares) en cursiva, y los reemplaza con el string de replaceCursive
const pipelineCursive = pipe([
    replaceCursive(/\*(.*?)\*/g), // Captura textos entre * y * en toda la línea
    replaceCursive(/_(.*?)_/g), // Captura textos entre _ y _ en toda la línea
])

// Obtenemos el nombre del archivo desde los parámetros de la línea de comando
let filename = process.argv[2]

// Leemos archivo
fs.readFile(filename, 'utf8', (err, data) => {
    const html = _.chain(data)
        .split(/\r?\n/) // Dividimos string completo del markdown en lineas (split por EOL y saltos de lineas)
        .map(line => _.split(line, ' ')) // Separamos cada palabra dentro de cada linea
        .map(words => [words[0], words.slice(1).join(' ')]) // Creamos una lista donde el primer item es la primera palabra y el segundo es el resto de la linea
        .map(line => getRegex(line[0]) ? addTag(line) : // Para cada linea revisa si la primera palabra hace match con alguna expresión, y si lo hace se le aplica la función addTag
            line[0] != '' ? `<p>${line.slice().join(' ')}</p>`: '') // Si no hace match se revisa que la línea no sea vacía, y si no lo es, es un párrafo (encerramos el texto en un tag <p>)
        .map(line => pipelineBoldCursive(line)) // Transformamos texto dentro de la línea que está en negrita y cursiva
        .map(line => pipelineBold(line)) // Transformamos texto dentro de la línea que está en negrita
        .map(line => pipelineCursive(line)) // Transformamos texto dentro de la línea que está en cursiva
        .map(line => _.replace(line, /\`(.*?)\`/g,  `<code>$1</code>`)) // reemplaza las ocurrencias de `(texto)` por <code>(texto)</code>
        .map(line => _.replace(line, /!\[(.*?)\]\((.*?)\)/g, `<img src="$2" alt="$1"/>`)) // reemplaza las ocurrencias de ![desc. imagen](link) por <img src=link alt=desc. imagen/>
        .map(line => _.replace(line, /\[(.*?)\]\((.*?)\)/g, `<a href="$2">$1</a>`)) // reemplaza las ocurrencias de [texto](link) por <a href= link>texto</a>
        .map(line => _.replace(line, /<li>(.*?)<\/li>/g, `<ul>\n\t<li>$1</li>\n</ul>`)) // a todas las ocurrencias de <li>(texto)</li> lo reemplaza por <ul>\n\t<li>texto</li>\n</ul>
        .map(line => _.replace(line, /<numero>(.*?)<\/numero>/g, `<ol>\n\t<li>$1</li>\n</ol>`)) // reemplaza a todas las ocurrencias de <numero>(texto)<\/numero> por <ol>\n\t<li>texto</li>\n</ol>
        .join('\n') // une las lineas con un salto de linea
        .replace(/<\/ul>\n<ul>\n/g, '') // reemplaza cada </ul>\n<ul>\n por un string vacío
        .replace(/<\/ol>\n<ol>\n/g, '') // reemplaza cada </ol>\n<ol>\n por un string vacío
        .replace(/\n+/g, '\n') // se eliminan las lineas vacías
        .value() // se retorna el valor del chain
    
    fs.writeFile(filename.replace('.md','.html'), html, err => err ? console.log(err) : null) // Creamos archivo html a partir del string transformado
})