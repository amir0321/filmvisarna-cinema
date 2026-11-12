import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { ApiError } from '../../api/client'
import { uploadImage } from '../../api/movies'
import { createPerson, searchPersons, updatePerson } from '../../api/persons'
import type { MovieCastInput, PersonProfile } from '../../types/movie'
import { isSafeImageUrl, validateImageFile } from '../../utils/imageValidation'
import { InlineFeedback } from '../Toast'

export interface CastMemberEditorProps {
  value: MovieCastInput[]
  onChange: (members: MovieCastInput[]) => void
  disabled?: boolean
  onDraftChange?: (open: boolean) => void
}

interface ProfileDraft {
  index: number | null
  personId?: number
  tmdbId?: number | null
  name: string
  photoUrl: string | undefined
  bio: string | undefined
  character: string
  file: File | null
}

interface SearchResult {
  query: string
  people: PersonProfile[]
  error: string | null
  loading: boolean
}

const normalizedName = (name?: string) => name?.trim().toLocaleLowerCase('sv-SE') || ''

function samePerson(member: MovieCastInput, person: { person_id?: number; tmdb_id?: number | null; name?: string }): boolean {
  return (member.person_id !== undefined && member.person_id === person.person_id)
    || (member.tmdb_id != null && member.tmdb_id === person.tmdb_id)
    || (normalizedName(member.name) !== '' && normalizedName(member.name) === normalizedName(person.name))
}

function personToMember(person: PersonProfile, character: string | null, billingOrder: number): MovieCastInput {
  return {
    person_id: person.id, name: person.name, photo_url: person.photo_url, bio: person.bio,
    tmdb_id: person.tmdb_id, character_name: character, billing_order: billingOrder,
  }
}

function ProfileImage({ src, name }: { src: string | null; name: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  return (
    <span className="cast-editor__portrait">
      {src && src !== failedSrc
        ? <img src={src} alt={`Profilbild av ${name || 'skådespelaren'}`} loading="lazy" onError={() => setFailedSrc(src)} />
        : <i className="bi bi-person-fill" aria-hidden="true" />}
    </span>
  )
}

function safePhoto(value: unknown): string | null {
  return isSafeImageUrl(value) ? value.trim() : null
}

export default function CastMemberEditor({ value, onChange, disabled = false, onDraftChange }: CastMemberEditorProps) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<SearchResult>({ query: '', people: [], error: null, loading: false })
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState<'upload' | 'save' | null>(null)
  const previewRef = useRef<string | null>(null)
  const operationRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const searchQuery = query.trim()
  const canSearch = !disabled && draft === null && pending === null && searchQuery.length >= 2
  const currentSearch = search.query === searchQuery ? search : null
  const searching = canSearch && (!currentSearch || currentSearch.loading)
  const locked = disabled || pending !== null
  const nextOrder = Math.max(-1, ...value.map((member, index) => member.billing_order ?? index)) + 1
  const invalidUrl = draft && Boolean(draft.photoUrl?.trim()) && !isSafeImageUrl(draft.photoUrl)

  useEffect(() => {
    if (!canSearch) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearch({ query: searchQuery, people: [], error: null, loading: true })
      void searchPersons(searchQuery, controller.signal).then(people => {
        if (!controller.signal.aborted) setSearch({ query: searchQuery, people, error: null, loading: false })
      }).catch(err => {
        if (!controller.signal.aborted) setSearch({ query: searchQuery, people: [], loading: false,
          error: err instanceof ApiError ? err.message : 'Det gick inte att söka efter skådespelare. Försök igen.' })
      })
    }, 300)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [searchQuery, canSearch])

  useEffect(() => () => {
    operationRef.current?.abort()
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
  }, [])

  // Focus the draft only on opening; typing does not move the cursor.
  const isEditing = draft !== null
  useEffect(() => {
    if (isEditing) nameInputRef.current?.focus()
  }, [isEditing])

  function releasePreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closeDraft() {
    releasePreview()
    setDraft(null)
    onDraftChange?.(false)
    setFileError(null)
    setError(null)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  function openDraft(index: number | null) {
    const member = index === null ? undefined : value[index]
    if (member?.person_id && !member.name) {
      setError('Profiluppgifter saknas för skådespelaren. Läs in filmens fullständiga rollista innan du redigerar profilen.')
      return
    }
    releasePreview()
    setDraft({ index, personId: member?.person_id, tmdbId: member?.tmdb_id,
      name: member?.name ?? query.trim(),
      photoUrl: member?.photo_url ?? undefined, bio: member?.bio ?? undefined,
      character: member?.character_name ?? '', file: null })
    onDraftChange?.(true)
    setFileError(null)
    setError(null)
    setNotice(null)
  }

  function addPerson(person: PersonProfile) {
    if (locked || draft) return
    if (value.some(member => samePerson(member, { ...person, person_id: person.id }))) {
      setError(`${person.name} finns redan i filmens rollista.`)
      return
    }
    onChange([...value, personToMember(person, null, nextOrder)])
    setQuery('')
    setError(null)
    setNotice(`${person.name} har lagts till i filmen.`)
    searchInputRef.current?.focus()
  }

  function removeMember(index: number) {
    if (locked || draft) return
    const name = value[index].name || 'Skådespelaren'
    onChange(value.filter((_, position) => position !== index))
    setNotice(`${name} har tagits bort från filmen. Personens profil finns kvar i registret.`)
    setError(null)
  }

  function updateDraft<K extends keyof ProfileDraft>(field: K, fieldValue: ProfileDraft[K]) {
    setDraft(current => current ? { ...current, [field]: fieldValue } : null)
    setError(null)
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const validation = validateImageFile(file)
    releasePreview()
    setFileError(validation ?? null)
    updateDraft('file', validation ? null : file)
    if (!validation) {
      updateDraft('photoUrl', '')
      const objectUrl = URL.createObjectURL(file)
      previewRef.current = objectUrl
      setPreview(objectUrl)
    }
  }

  async function saveDraft() {
    if (!draft || locked || operationRef.current) return
    if (!draft.name.trim()) { setError('Ange skådespelarens namn.'); nameInputRef.current?.focus(); return }
    if (draft.name.trim().length > 200 || (draft.bio?.trim().length ?? 0) > 10000 || draft.character.trim().length > 300) {
      setError('Namn får vara högst 200 tecken, biografi 10 000 tecken och rollfigur 300 tecken.'); return
    }
    if (fileError || invalidUrl) { setError(fileError || 'Ange en giltig bild-URL.'); return }
    const identity = { person_id: draft.personId, tmdb_id: draft.tmdbId, name: draft.name }
    if (value.some((member, index) => index !== draft.index && samePerson(member, identity))) {
      setError('Skådespelaren finns redan i filmens rollista. Redigera den posten i stället.'); return
    }

    const controller = new AbortController()
    operationRef.current = controller
    setPending(draft.file ? 'upload' : 'save')
    setError(null)
    try {
      const photoUrl = draft.file ? await uploadImage(draft.file, controller.signal)
        : draft.photoUrl === undefined ? undefined : draft.photoUrl.trim() || null
      if (controller.signal.aborted) return
      setPending('save')
      const payload = { name: draft.name.trim(), photo_url: photoUrl,
        bio: draft.bio === undefined ? undefined : draft.bio.trim() || null, tmdb_id: draft.tmdbId }
      const person = draft.personId
        ? await updatePerson(draft.personId, payload, controller.signal)
        : await createPerson(payload, controller.signal)
      if (controller.signal.aborted) return
      // The server may reuse a person by TMDB ID or normalized name.
      if (value.some((member, index) => index !== draft.index && samePerson(member, { ...person, person_id: person.id }))) {
        setError('Personen finns redan i filmens rollista. Ingen extra post har lagts till.'); return
      }
      const member = personToMember(person, draft.character.trim() || null,
        draft.index === null ? nextOrder : value[draft.index].billing_order ?? draft.index)
      onChange(draft.index === null ? [...value, member] : value.map((item, index) => index === draft.index ? member : item))
      setNotice(`${person.name}: profilen har sparats och rollistan har uppdaterats.`)
      setQuery('')
      closeDraft()
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof ApiError ? err.message : 'Det gick inte att spara skådespelaren. Försök igen.')
    } finally {
      operationRef.current = null
      if (!controller.signal.aborted) setPending(null)
    }
  }

  function handleDraftKey(event: KeyboardEvent<HTMLFieldSetElement>) {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement && event.target.type !== 'file') {
      event.preventDefault()
      void saveDraft()
    }
  }

  return (
    <section className="cast-editor" aria-labelledby={`${id}-title`}>
      <header><h3 id={`${id}-title`}>Rollista</h3><p>Sök i personregistret för att återanvända en skådespelare, eller lägg till en ny.</p></header>
      {notice ? <InlineFeedback variant="success" message={notice} className="mb-3" /> : null}
      {error ? <InlineFeedback variant="danger" message={error} className="mb-3" /> : null}
      <fieldset className="cast-editor__search" disabled={locked || isEditing}>
        <label htmlFor={`${id}-search`} className="form-label">Sök skådespelare</label>
        <div className="cast-editor__search-controls">
          <input ref={searchInputRef} id={`${id}-search`} type="search" className="form-control" value={query} maxLength={200}
            placeholder="Skriv minst två tecken" aria-describedby={`${id}-search-status`}
            onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') event.preventDefault() }} />
          <button type="button" className="btn btn-outline-light" onClick={() => openDraft(null)}><i className="bi bi-plus-lg me-1" aria-hidden="true" />Ny skådespelare</button>
        </div>
        <div id={`${id}-search-status`} role="status" className="cast-editor__search-status">
          {searching ? 'Söker efter skådespelare…' : canSearch && currentSearch && !currentSearch.error && currentSearch.people.length === 0 ? 'Inga skådespelare hittades. Du kan lägga till en ny.' : null}
        </div>
        {canSearch && currentSearch?.error ? <InlineFeedback variant="danger" message={currentSearch.error} /> : null}
        {canSearch && currentSearch && !currentSearch.loading && currentSearch.people.length > 0 ? (
          <ul className="cast-editor__results" aria-label="Hittade skådespelare">
            {currentSearch.people.map(person => {
              const added = value.some(member => samePerson(member, { ...person, person_id: person.id }))
              return <li key={person.id}><ProfileImage src={safePhoto(person.photo_url)} name={person.name} /><span>{person.name}</span>
                <button type="button" className="btn btn-sm btn-outline-light" disabled={added} onClick={() => addPerson(person)}
                  aria-label={added ? `${person.name} är redan tillagd` : `Lägg till ${person.name}`}>{added ? 'Redan tillagd' : 'Lägg till'}</button></li>
            })}
          </ul>
        ) : null}
      </fieldset>

      <ul className="cast-editor__members" aria-label="Skådespelare i filmen">
        {value.map((member, index) => (
          <li key={member.person_id ? `person-${member.person_id}` : member.tmdb_id ? `tmdb-${member.tmdb_id}` : `name-${normalizedName(member.name)}`}>
            <ProfileImage src={safePhoto(member.photo_url)} name={member.name ?? ''} />
            <div className="cast-editor__member-text"><strong>{member.name || `Person ${member.person_id}`}</strong><span>{member.character_name ? `Rollfigur: ${member.character_name}` : 'Ingen rollfigur angiven'}</span></div>
            <div className="cast-editor__member-actions">
              <button type="button" className="btn btn-sm admin-table__edit" disabled={locked || isEditing} onClick={() => openDraft(index)} aria-label={`Redigera ${member.name || 'skådespelaren'}`}>Redigera</button>
              <button type="button" className="btn btn-sm btn-outline-danger" disabled={locked || isEditing} onClick={() => removeMember(index)} aria-label={`Ta bort ${member.name || 'skådespelaren'} från filmen`}>Ta bort från filmen</button>
            </div>
          </li>
        ))}
      </ul>
      {value.length === 0 ? <p className="cast-editor__hint">Inga skådespelare är tillagda ännu.</p> : null}
      <p className="cast-editor__hint">Rollistan sparas när du sparar filmen. När du tar bort en skådespelare från filmen finns personens profil kvar i registret.</p>

      {draft ? (
        <fieldset className="cast-editor__draft" disabled={locked} onKeyDown={handleDraftKey} aria-busy={pending !== null}>
          <legend>{draft.index === null ? 'Lägg till skådespelare' : 'Redigera skådespelare'}</legend>
          <p className="cast-editor__hint">Namn, bild och biografi sparas i personregistret och används i alla filmer där personen medverkar. Rollfiguren gäller bara den här filmen.</p>
          <label htmlFor={`${id}-name`} className="form-label">Namn <span aria-hidden="true">*</span></label>
          <input ref={nameInputRef} id={`${id}-name`} className="form-control" value={draft.name} maxLength={200} aria-required="true" onChange={event => updateDraft('name', event.target.value)} />
          <div className="cast-editor__photo-fields">
            <div className="cast-editor__preview"><ProfileImage src={preview || safePhoto(draft.photoUrl)} name={draft.name} /><span>Förhandsvisning</span></div>
            <div>
              <label htmlFor={`${id}-file`} className="form-label">Ladda upp profilbild</label>
              <input ref={fileInputRef} id={`${id}-file`} type="file" className="form-control" accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif" onChange={selectFile} aria-invalid={fileError !== null} aria-describedby={`${id}-file-help`} />
              <p id={`${id}-file-help`} className="cast-editor__hint">JPEG, PNG, WebP eller GIF. Högst 5 MB.{draft.file ? ` Vald fil: ${draft.file.name}.` : ''}</p>
              {fileError ? <InlineFeedback variant="danger" message={fileError} /> : null}
              <label htmlFor={`${id}-photo-url`} className="form-label">Eller ange bild-URL</label>
              <input id={`${id}-photo-url`} type="text" inputMode="url" className="form-control" value={draft.photoUrl ?? ''} maxLength={2048}
                aria-invalid={Boolean(invalidUrl)} aria-describedby={`${id}-url-help`} onChange={event => {
                  releasePreview(); setFileError(null); updateDraft('file', null); updateDraft('photoUrl', event.target.value)
                }} />
              <p id={`${id}-url-help`} className={`cast-editor__hint${invalidUrl ? ' text-danger' : ''}`}>Använd http://, https:// eller /uploads/ utan inloggningsuppgifter eller dubbla punkter i sökvägen.</p>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={() => {
                releasePreview(); setFileError(null); updateDraft('file', null); updateDraft('photoUrl', '')
              }}>Ta bort profilbild</button>
            </div>
          </div>
          <label htmlFor={`${id}-bio`} className="form-label">Biografi</label>
          <textarea id={`${id}-bio`} className="form-control" rows={4} value={draft.bio ?? ''} maxLength={10000} onChange={event => updateDraft('bio', event.target.value)} />
          <label htmlFor={`${id}-character`} className="form-label">Rollfigur i filmen</label>
          <input id={`${id}-character`} className="form-control" value={draft.character} maxLength={300} onChange={event => updateDraft('character', event.target.value)} />
          <div className="cast-editor__draft-actions">
            <button type="button" className="btn btn-outline-light" onClick={closeDraft}>Avbryt</button>
            <button type="button" className="btn btn-danger" onClick={() => void saveDraft()} disabled={!draft.name.trim() || Boolean(invalidUrl) || fileError !== null}>
              {pending ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
              {pending === 'upload' ? 'Laddar upp bild…' : pending === 'save' ? 'Sparar profil…' : draft.index === null ? 'Spara profil och lägg till' : 'Spara profil och rollfigur'}
            </button>
          </div>
        </fieldset>
      ) : null}
    </section>
  )
}
