const SCHOOL_ASSETS_DB = 'zela-school-assets'
const SCHOOL_PHOTOS_STORE = 'school-photos'

function canUseIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function openSchoolAssetsDb() {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      resolve(null)
      return
    }

    const request = window.indexedDB.open(SCHOOL_ASSETS_DB, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SCHOOL_PHOTOS_STORE)) {
        db.createObjectStore(SCHOOL_PHOTOS_STORE, { keyPath: 'schoolId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Nao foi possivel abrir o banco local de fotos.'))
  })
}

function runStoreAction(mode, callback) {
  return openSchoolAssetsDb().then((db) => new Promise((resolve, reject) => {
    if (!db) {
      resolve(null)
      return
    }

    const transaction = db.transaction(SCHOOL_PHOTOS_STORE, mode)
    const store = transaction.objectStore(SCHOOL_PHOTOS_STORE)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error || new Error('Nao foi possivel acessar as fotos salvas.'))
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error || new Error('Nao foi possivel concluir a operacao com as fotos.'))
    }
  }))
}

function normalizePhotoRecord(photo, index) {
  const url = String(photo?.url || '').trim()
  if (!url) return null

  return {
    nome: String(photo?.nome || `foto-${index + 1}`).trim() || `foto-${index + 1}`,
    url,
  }
}

export function normalizeSchoolPhotos(photos = []) {
  return Array.isArray(photos)
    ? photos.map(normalizePhotoRecord).filter(Boolean)
    : []
}

export async function saveSchoolPhotos(schoolId, photos = []) {
  if (!schoolId) return []

  const normalizedPhotos = normalizeSchoolPhotos(photos)
  await runStoreAction('readwrite', (store) => store.put({ schoolId, photos: normalizedPhotos }))
  return normalizedPhotos
}

export async function loadSchoolPhotos(schoolId) {
  if (!schoolId) return []

  const record = await runStoreAction('readonly', (store) => store.get(schoolId))
  return normalizeSchoolPhotos(record?.photos)
}

export async function removeSchoolPhotos(schoolId) {
  if (!schoolId) return
  await runStoreAction('readwrite', (store) => store.delete(schoolId))
}

export async function hydrateSchoolWithPhotos(school) {
  if (!school) return school

  const photos = await loadSchoolPhotos(school.id)
  if (!photos.length) {
    return {
      ...school,
      fotos: Array.isArray(school.fotos) ? school.fotos : [],
    }
  }

  return {
    ...school,
    fotos: photos,
    fotoNome: photos[0]?.nome || '',
    fotoUrl: photos[0]?.url || '',
  }
}

export async function hydrateSchoolsWithPhotos(schools = []) {
  return Promise.all((Array.isArray(schools) ? schools : []).map(hydrateSchoolWithPhotos))
}
