const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '<path d="M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z" />',
  },
  {
    id: 'ocorrencias',
    label: 'Ocorrências',
    icon: '<path d="m12 4 9 16H3L12 4Zm0 5v4m0 4h.01" />',
  },
  {
    id: 'escolas',
    label: 'Escolas',
    icon: '<path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-6h6v6M9 11h.01M12 11h.01M15 11h.01" />',
  },
  {
    id: 'locais',
    label: 'Locais',
    icon: '<path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />',
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icon: '<path d="M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8v-2a3 3 0 0 0-2-2.8M18 7a3 3 0 0 1 0 6" />',
  },
  {
    id: 'checklists',
    label: 'Checklists',
    icon: '<path d="M8 4h8l1 3H7l1-3Zm-1 3h10v13H7V7Zm3 4h4m-4 4h4" />',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: '<path d="M5 20V10m7 10V4m7 16v-7" />',
  },
  {
    id: 'painel-publico',
    label: 'Painel Público',
    icon: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-8-9h16M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" />',
  },
]

function createMenuLink(item, activeItem) {
  const link = document.createElement('a')
  link.href = '#'
  link.className = item.id === activeItem ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
  link.setAttribute('aria-current', item.id === activeItem ? 'page' : 'false')
  link.innerHTML = `
    <span class="sidebar-link-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">${item.icon}</svg>
    </span>
    ${item.label}
  `

  return link
}

export function createSidebar({ activeItem = 'dashboard' } = {}) {
  const sidebar = document.createElement('aside')
  sidebar.className = 'sidebar'
  sidebar.innerHTML = `
    <div class="sidebar-panel">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="img">
            <path d="M4 10.4 12 5l8 5.4v8.1a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-8.1Z" />
            <path d="M9 20v-6h6v6M9 10h.01M12 10h.01M15 10h.01" />
          </svg>
        </div>
        <div>
          <strong>EduGestao</strong>
          <span>Rede Municipal</span>
        </div>
      </div>
      <nav class="sidebar-nav" aria-label="Navegacao principal"></nav>
    </div>
  `

  const nav = sidebar.querySelector('.sidebar-nav')
  menuItems.forEach((item) => nav.append(createMenuLink(item, activeItem)))

  return sidebar
}
