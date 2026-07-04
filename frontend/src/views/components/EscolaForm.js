const EMPTY_FORM = {
  nome: '',
  bairro: '',
  endereco: '',
  latitude: '',
  longitude: '',
}

function validate(values) {
  const errors = {}

  if (!values.nome.trim()) errors.nome = 'Informe o nome da escola'
  if (!values.bairro.trim()) errors.bairro = 'Informe o bairro'
  if (!values.endereco.trim()) errors.endereco = 'Informe o endereco'

  const latitude = Number(values.latitude)
  if (values.latitude === '' || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    errors.latitude = 'Latitude invalida'
  }

  const longitude = Number(values.longitude)
  if (values.longitude === '' || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    errors.longitude = 'Longitude invalida'
  }

  return errors
}

function fieldTemplate(name, label, type = 'text', placeholder = '') {
  return `
    <div class="escola-form-field">
      <label for="${name}">${label}</label>
      <input id="${name}" name="${name}" type="${type}" ${type === 'number' ? 'step="any"' : ''} placeholder="${placeholder}" />
      <span class="escola-form-error" data-error="${name}"></span>
    </div>
  `
}

export function createEscolaForm({ initialValues = {}, submitting = false, onCancel, onSubmit }) {
  const values = {
    ...EMPTY_FORM,
    ...initialValues,
    latitude: initialValues.latitude ?? '',
    longitude: initialValues.longitude ?? '',
  }

  const form = document.createElement('form')
  form.className = 'escola-form'
  form.noValidate = true
  form.innerHTML = `
    ${fieldTemplate('nome', 'Nome da escola', 'text', 'Ex.: EMEF Professor Alberto Souza')}
    <div class="escola-form-row">
      ${fieldTemplate('bairro', 'Bairro')}
      ${fieldTemplate('endereco', 'Endereco')}
    </div>
    <div class="escola-form-row">
      ${fieldTemplate('latitude', 'Latitude', 'number', '-23.5505')}
      ${fieldTemplate('longitude', 'Longitude', 'number', '-46.6333')}
    </div>
    <div class="escola-form-actions">
      <button type="button" class="btn btn-ghost" data-action="cancel">Cancelar</button>
      <button type="submit" class="btn btn-primary">${submitting ? 'Salvando...' : 'Salvar'}</button>
    </div>
  `

  Object.entries(values).forEach(([key, value]) => {
    const input = form.elements.namedItem(key)
    if (input) input.value = value
  })

  form.querySelector('[data-action="cancel"]').addEventListener('click', onCancel)
  form.querySelector('[type="submit"]').disabled = submitting

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())
    const errors = validate(payload)

    form.querySelectorAll('[data-error]').forEach((element) => {
      element.textContent = errors[element.dataset.error] || ''
    })

    if (Object.keys(errors).length > 0) return

    onSubmit({
      nome: payload.nome.trim(),
      bairro: payload.bairro.trim(),
      endereco: payload.endereco.trim(),
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
    })
  })

  return form
}
