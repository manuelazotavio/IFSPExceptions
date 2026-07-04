export function createModal({ title, content, width, onClose }) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'

  const box = document.createElement('div')
  box.className = 'modal-box'
  if (width) box.style.maxWidth = width

  box.innerHTML = `
    <div class="modal-header">
      <h2>${title}</h2>
      <button type="button" class="modal-close" aria-label="Fechar">&times;</button>
    </div>
    <div class="modal-body"></div>
  `

  box.querySelector('.modal-body').append(content)
  overlay.append(box)

  overlay.addEventListener('mousedown', onClose)
  box.addEventListener('mousedown', (event) => event.stopPropagation())
  box.querySelector('.modal-close').addEventListener('click', onClose)

  return overlay
}
