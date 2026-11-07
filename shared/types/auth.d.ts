declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'professional' | 'member'
  }
  interface UserSession {
    loggedInAt?: number
  }
}
export {}
