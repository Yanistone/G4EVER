type Sound = "hover" | "click"

const sounds: Record<Sound, HTMLAudioElement> = {
  hover: new Audio("/assets/audio/ui/hover.ogg"),
  click: new Audio("/assets/audio/ui/click.ogg"),
}

Object.values(sounds).forEach((audio) => {
  audio.preload = "auto"
  audio.volume = 0.4
})

export function playSound(sound: Sound): void {
  const audio = sounds[sound]

  audio.currentTime = 0

  void audio.play().catch(() => {})
}
