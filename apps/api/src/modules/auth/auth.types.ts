export interface Player {
  id: string
  username: string
  email: string
}

export interface PlayerRecord extends Player {
  password: string
}

export interface RegisterInput {
  username: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}
