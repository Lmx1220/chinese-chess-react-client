export function getImgUrl(key) {
  return new URL(`../assets/avatar/${key}.png`, import.meta.url).href
}

export const avatarList = []

Array.from({ length: 24 }).map((key, index) => {
  return avatarList.push({
    url: getImgUrl(index + 1),
    id: index + 1,
    type: 'systemAvatar',
  })
})
