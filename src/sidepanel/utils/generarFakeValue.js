import { faker } from '@faker-js/faker'
import patronesData from './patrones.json' assert { type: 'json' }
import { createResolvers } from './resolvers.js'

const normalizar = (str = "") =>
    str
        .toLowerCase()
        .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
        .replace(/[_\-\.]/g, " ") // snake/kebab
        .replace(/\s+/g, " ")
        .trim();

// Convertir el JSON de patrones a objetos RegExp
const patrones = {}
Object.keys(patronesData).forEach(categoria => {
    Object.keys(patronesData[categoria]).forEach(key => {
        patrones[key] = new RegExp(patronesData[categoria][key], 'i')
    })
})

export default function generarFakeValue(input, perfil) {
    const raw = `
        ${input.name || ""}
        ${input.id || ""}
        ${input.placeholder || ""}
        ${input.label || ""}
        ${input.ariaLabel || ""}
        ${input.title || ""}
        ${input.alt || ""}
    `
    const key = normalizar(raw)
    const tipo = input.type

    // PRIORIDAD POR TYPE (más fuerte que regex)
    if (tipo === "email") return perfil.email
    if (tipo === "password") return perfil.password
    if (tipo === "date") return perfil.birthDate.toISOString().split("T")[0]
    if (tipo === "datetime-local") return new Date(perfil.birthDate).toISOString().slice(0, 16)
    if (tipo === "month") return `${perfil.birthDate.getFullYear()}-${String(perfil.birthDate.getMonth() + 1).padStart(2, '0')}`
    if (tipo === "week") return `${perfil.birthDate.getFullYear()}-W${String(Math.ceil((perfil.birthDate.getDate() + new Date(perfil.birthDate.getFullYear(), perfil.birthDate.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`
    if (tipo === "time") return `${String(perfil.birthDate.getHours()).padStart(2, '0')}:${String(perfil.birthDate.getMinutes()).padStart(2, '0')}`
    if (tipo === "number") return faker.number.int({ min: 1, max: 100 })
    if (tipo === "range") return faker.number.int({ min: 0, max: 100 })
    if (tipo === "color") return faker.color.rgb()
    if (tipo === "checkbox") return faker.datatype.boolean()
    if (tipo === "radio") return faker.helpers.arrayElement(['option1', 'option2', 'option3'])
    if (tipo === "file") return faker.system.fileName()
    if (tipo === "tel") return perfil.phone
    if (tipo === "url") return faker.internet.url()
    if (tipo === "search") return faker.lorem.words(3)
    if (tipo === "hidden") return faker.string.uuid()

    const resolvers = createResolvers(perfil, patrones)

    for (const r of resolvers) {
        if (r.test && r.test.test(key)) {
            return r.value()
        }
    }

    // Fallback inteligente basado en tipo
    if (tipo === "text" || tipo === "textarea" || tipo === "search") {
        return faker.lorem.words(3)
    }
    
    if (tipo === "select-one" || tipo === "select-multiple") {
        return faker.helpers.arrayElement(['option1', 'option2', 'option3'])
    }
    
    if (tipo === "hidden") {
        return faker.string.uuid()
    }
    
    return null
}