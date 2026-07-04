function formatCoord(value) {
  return Number(value).toFixed(4)
}

function createCell(text, className) {
  const cell = document.createElement('td')
  cell.textContent = text
  if (className) cell.className = className
  return cell
}

export function createEscolaTable({ escolas, onEdit, onDelete }) {
  if (escolas.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'escola-table-empty'
    empty.textContent = 'Nenhuma escola encontrada com os filtros atuais.'
    return empty
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'escola-table-wrapper'

  const table = document.createElement('table')
  table.className = 'escola-table'
  table.innerHTML = `
    <thead>
      <tr>
        <th>Nome</th>
        <th>Bairro</th>
        <th>Endereco</th>
        <th>Latitude</th>
        <th>Longitude</th>
        <th class="escola-table-actions-col">Acoes</th>
      </tr>
    </thead>
    <tbody></tbody>
  `

  const tbody = table.querySelector('tbody')

  escolas.forEach((escola) => {
    const row = document.createElement('tr')
    row.append(
      createCell(escola.nome, 'escola-table-name'),
      createCell(escola.bairro),
      createCell(escola.endereco),
      createCell(formatCoord(escola.latitude)),
      createCell(formatCoord(escola.longitude))
    )

    const actionsCell = document.createElement('td')
    const actions = document.createElement('div')
    actions.className = 'escola-table-actions'

    const editButton = document.createElement('button')
    editButton.type = 'button'
    editButton.className = 'link-btn'
    editButton.textContent = 'Editar'
    editButton.addEventListener('click', () => onEdit(escola))

    const deleteButton = document.createElement('button')
    deleteButton.type = 'button'
    deleteButton.className = 'link-btn link-btn-danger'
    deleteButton.textContent = 'Excluir'
    deleteButton.addEventListener('click', () => onDelete(escola))

    actions.append(editButton, deleteButton)
    actionsCell.append(actions)
    row.append(actionsCell)
    tbody.append(row)
  })

  wrapper.append(table)
  return wrapper
}
