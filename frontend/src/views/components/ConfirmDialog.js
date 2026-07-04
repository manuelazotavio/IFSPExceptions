import { createModal } from './Modal.js'

export function createConfirmDialog({ title, message, confirmLabel, loading, onCancel, onConfirm }) {
  const content = document.createElement('div')
  content.innerHTML = `
    <p class="confirm-message"></p>
    <div class="confirm-actions">
      <button type="button" class="btn btn-ghost" data-action="cancel">Cancelar</button>
      <button type="button" class="btn btn-danger" data-action="confirm">
        ${loading ? 'Excluindo...' : confirmLabel}
      </button>
    </div>
  `

  content.querySelector('.confirm-message').textContent = message
  content.querySelector('[data-action="cancel"]').addEventListener('click', onCancel)
  content.querySelector('[data-action="confirm"]').addEventListener('click', onConfirm)
  content.querySelector('[data-action="confirm"]').disabled = loading

  return createModal({ title, content, width: '420px', onClose: onCancel })
}
