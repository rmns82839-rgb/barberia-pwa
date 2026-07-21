import { scryptSync, randomBytes } from 'crypto'

const password = 'admin123' // Cambia por tu password
const salt = randomBytes(16).toString('hex')
const hash = scryptSync(password, salt, 64).toString('hex')
console.log(`${salt}:${hash}`)