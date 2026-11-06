export interface PlayerProfile {
  id: string
  nickname: string
  createdAt: string
}

export interface ProfileStore {
  profiles: PlayerProfile[]
  activeProfileId: string | null
}
