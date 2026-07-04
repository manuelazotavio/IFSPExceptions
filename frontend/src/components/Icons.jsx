export function Icon({ name, className = 'h-4 w-4' }) {
  const icons = {
    dashboard: 'M5 5h5v5H5V5Zm9 0h5v5h-5V5ZM5 14h5v5H5v-5Zm9 0h5v5h-5v-5Z',
    map: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',
    alert: 'm12 4 9 16H3L12 4Zm0 5v4m0 4h.01',
    school: 'M4 20h16M6 20V9l6-4 6 4v11M9 20v-6h6v6',
    chart: 'M5 20V10m7 10V4m7 16v-7',
    users: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6 8v-2a3 3 0 0 0-2-2.8',
    tag: 'M20 13 11 22l-9-9V4h9l9 9Zm-13-5h.01',
    settings: 'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm0-13v3m0 13v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M1 12h3m16 0h3',
    bell: 'M6 8a6 6 0 1 1 12 0c0 3.4 1 5.4 1.7 6.4a1 1 0 0 1-.8 1.6H5.1a1 1 0 0 1-.8-1.6C5 13.4 6 11.4 6 8Zm4.3 11a2 2 0 0 0 3.4 0',
    paperclip: 'M8 12V7a4 4 0 0 1 8 0v9a3 3 0 0 1-6 0V8',
    send: 'm4 12 16-8-6 8 6 8-16-8Z',
    image: 'M4 5h16v14H4V5Zm3 10 4-4 3 3 3-5 3 6M8.5 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.dashboard} />
    </svg>
  )
}
