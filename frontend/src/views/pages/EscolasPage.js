import {
  createEscola,
  deleteEscola,
  listEscolas,
  updateEscola,
} from '../../services/escolaService.js'
import { createConfirmDialog } from '../components/ConfirmDialog.js'
import { createModal } from '../components/Modal.js'
import { createEscolaForm } from '../components/EscolaForm.js'
import { createEscolaTable } from '../components/EscolaTable.js'
import './EscolasPage.css'
import '../components/ConfirmDialog.css'
import '../components/Modal.css'
import '../components/EscolaForm.css'
import '../components/EscolaTable.css'

const state = {
  escolas: [],
  loading: true,
  search: '',
  formState: null,
  deleteTarget: null,
  submitting: false,
  feedback: null,
}

let rootElement = null
let feedbackTimer = null

function getFilteredEscolas() {
  const term = state.search.trim().toLowerCase()
  if (!term) return state.escolas

  return state.escolas.filter(
    (escola) =>
      escola.nome.toLowerCase().includes(term) ||
      escola.bairro.toLowerCase().includes(term)
  )
}

function setFeedback(feedback) {
  state.feedback = feedback
  clearTimeout(feedbackTimer)

  if (feedback) {
    feedbackTimer = setTimeout(() => {
      state.feedback = null
      render()
    }, 3500)
  }
}

async function loadEscolas() {
  state.loading = true
  render()

  try {
    state.escolas = await listEscolas()
  } catch (error) {
    setFeedback({ type: 'error', text: error.message })
  } finally {
    state.loading = false
    render()
  }
}

async function handleCreate(payload) {
  state.submitting = true
  render()

  try {
    await createEscola(payload)
    state.formState = null
    state.submitting = false
    setFeedback({ type: 'success', text: 'Escola cadastrada com sucesso.' })
    await loadEscolas()
  } catch (error) {
    state.submitting = false
    setFeedback({ type: 'error', text: error.message })
    render()
  }
}

async function handleUpdate(payload) {
  state.submitting = true
  render()

  try {
    await updateEscola(state.formState.id, payload)
    state.formState = null
    state.submitting = false
    setFeedback({ type: 'success', text: 'Escola atualizada com sucesso.' })
    await loadEscolas()
  } catch (error) {
    state.submitting = false
    setFeedback({ type: 'error', text: error.message })
    render()
  }
}

async function handleDelete() {
  state.submitting = true
  render()

  try {
    await deleteEscola(state.deleteTarget.id)
    state.deleteTarget = null
    state.submitting = false
    setFeedback({ type: 'success', text: 'Escola removida com sucesso.' })
    await loadEscolas()
  } catch (error) {
    state.submitting = false
    setFeedback({ type: 'error', text: error.message })
    render()
  }
}

function createPageShell(filteredEscolas) {
  const page = document.createElement('div')
  page.className = 'escolas-page'
  page.innerHTML = `
    <header class="escolas-page-header">
      <div>
        <span class="escolas-page-eyebrow">Secretaria de Educacao</span>
        <h1>Escolas da rede municipal</h1>
      </div>
      <button type="button" class="btn btn-primary" data-action="new-escola">Nova escola</button>
    </header>
    <div data-region="feedback"></div>
    <div class="escolas-page-toolbar">
      <input
        type="text"
        class="escolas-page-search"
        placeholder="Buscar por nome ou bairro"
      />
      <span class="escolas-page-count">${filteredEscolas.length} escola(s)</span>
    </div>
    <div data-region="content"></div>
  `

  page.querySelector('[data-action="new-escola"]').addEventListener('click', () => {
    state.formState = {}
    render()
  })

  const searchInput = page.querySelector('.escolas-page-search')
  searchInput.value = state.search
  searchInput.addEventListener('input', (event) => {
    state.search = event.target.value
    render()
  })

  return page
}

function renderFeedback(page) {
  const feedbackRegion = page.querySelector('[data-region="feedback"]')
  if (!state.feedback) return

  const feedback = document.createElement('div')
  feedback.className = `escolas-page-feedback escolas-page-feedback-${state.feedback.type}`
  feedback.textContent = state.feedback.text
  feedbackRegion.append(feedback)
}

function renderContent(page, filteredEscolas) {
  const content = page.querySelector('[data-region="content"]')

  if (state.loading) {
    const loading = document.createElement('div')
    loading.className = 'escolas-page-loading'
    loading.textContent = 'Carregando escolas...'
    content.append(loading)
    return
  }

  content.append(
    createEscolaTable({
      escolas: filteredEscolas,
      onEdit: (escola) => {
        state.formState = escola
        render()
      },
      onDelete: (escola) => {
        state.deleteTarget = escola
        render()
      },
    })
  )
}

function renderFormModal(page) {
  if (!state.formState) return

  const close = () => {
    state.formState = null
    state.submitting = false
    render()
  }

  const form = createEscolaForm({
    initialValues: state.formState,
    submitting: state.submitting,
    onCancel: close,
    onSubmit: state.formState.id ? handleUpdate : handleCreate,
  })

  page.append(
    createModal({
      title: state.formState.id ? 'Editar escola' : 'Nova escola',
      content: form,
      onClose: close,
    })
  )
}

function renderDeleteDialog(page) {
  if (!state.deleteTarget) return

  const close = () => {
    state.deleteTarget = null
    state.submitting = false
    render()
  }

  page.append(
    createConfirmDialog({
      title: 'Excluir escola',
      message: `Tem certeza que deseja excluir "${state.deleteTarget.nome}"? Essa acao nao podera ser desfeita.`,
      confirmLabel: 'Excluir',
      loading: state.submitting,
      onCancel: close,
      onConfirm: handleDelete,
    })
  )
}

function render() {
  if (!rootElement) return

  const filteredEscolas = getFilteredEscolas()
  const page = createPageShell(filteredEscolas)

  renderFeedback(page)
  renderContent(page, filteredEscolas)
  renderFormModal(page)
  renderDeleteDialog(page)

  rootElement.replaceChildren(page)
}

export function renderEscolasPage(root) {
  rootElement = root
  render()
  loadEscolas()
}
