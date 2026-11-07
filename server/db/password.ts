// Standalone equivalent of nuxt-auth-utils' hashPassword (same @adonisjs/hash scrypt driver and
// default options), for scripts that run outside Nitro such as the seed.
import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

const hash = new Hash(new Scrypt({}))
export const hashPassword = (password: string) => hash.make(password)
export const verifyPassword = (hashed: string, plain: string) => hash.verify(hashed, plain)
