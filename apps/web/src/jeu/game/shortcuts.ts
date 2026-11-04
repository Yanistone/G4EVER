export function isMapKey(event: Pick<KeyboardEvent, "key" | "code">) {
  return (
    event.key?.toLowerCase() === "m" ||
    ((!event.key || event.key === "Unidentified") && event.code === "KeyM")
  )
}
