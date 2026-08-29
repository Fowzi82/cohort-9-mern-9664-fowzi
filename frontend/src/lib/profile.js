const PROFILE_KEY = 'khayaal.profile'

function safeJsonParse(value) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function getStoredProfile() {
  const profile = safeJsonParse(localStorage.getItem(PROFILE_KEY))
  return profile || {}
}

export function saveStoredProfile(partialProfile) {
  const current = getStoredProfile()
  const nextProfile = {
    ...current,
    ...partialProfile,
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile))
  return nextProfile
}

export function getAvatarDisplayName(user, profile) {
  return profile?.displayName || user?.username || user?.name || user?.email || 'Khayaal User'
}

export function getInitials(value) {
  const source = (value || '').trim()
  if (!source) return 'K'

  const chunks = source.split(/\s+/).filter(Boolean)
  if (chunks.length === 1) {
    return chunks[0].slice(0, 2).toUpperCase()
  }

  return `${chunks[0][0] || ''}${chunks[1][0] || ''}`.toUpperCase()
}

export function getProfileCreatedAt(user, profile) {
  if (profile?.createdAt) return profile.createdAt
  if (user?.createdAt) return user.createdAt
  if (user?.iat) return new Date(user.iat * 1000).toISOString()
  return new Date().toISOString()
}
