import { faker } from '@faker-js/faker'

export default function generarPerfilFake() {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()

    return {
        firstName,
        lastName,
        password: faker.internet.password({ length: 12 }),
        username: faker.internet.username({ firstName, lastName }),
        email: faker.internet.email({ firstName, lastName }),
        birthDate: faker.date.birthdate({ min: 18, max: 50, mode: 'age' }),
        phone: faker.phone.number(),
        address: faker.location.streetAddress()
    }
}