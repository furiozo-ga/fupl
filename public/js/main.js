document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle functionality
  initThemeToggle();

  // Add sorting functionality
  const table = document.querySelector('table');
  if (table) {
    const headers = table.querySelectorAll('thead th');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Add click event to headers for sorting
    headers.forEach((header, index) => {
      if (index > 0) { // Skip the icon column
        header.addEventListener('click', () => {
          // Toggle sort direction
          const isAscending = header.getAttribute('data-sort') !== 'asc';
          header.setAttribute('data-sort', isAscending ? 'asc' : 'desc');

          // Reset other headers
          headers.forEach(h => {
            if (h !== header) h.removeAttribute('data-sort');
          });

          // Sort the rows
          const sortedRows = sortRows(rows, index, isAscending);

          // Update the DOM
          sortedRows.forEach(row => tbody.appendChild(row));
        });

        // Add cursor pointer and sort indicator
        header.style.cursor = 'pointer';
        // header.setAttribute('title', 'Click to sort');
      }
    });
  }
});

/**
 * Initialize theme toggle functionality
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');

  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Set initial theme based on saved preference or system preference
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  // Add click event to theme toggle button
  themeToggle.addEventListener('click', () => {
    // Toggle theme
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (isDark) {
      // Switch to light theme
      document.documentElement.removeAttribute('data-theme');
      themeIcon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
    } else {
      // Switch to dark theme
      document.documentElement.setAttribute('data-theme', 'dark');
      themeIcon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
    }
  });
}

/**
 * Sort table rows based on column index
 * @param {Array} rows Array of TR elements
 * @param {number} columnIndex Column index to sort by
 * @param {boolean} ascending Sort direction
 * @returns {Array} Sorted array of TR elements
 */
function sortRows(rows, columnIndex, ascending) {
  return [...rows].sort((a, b) => {
    // Get cell content
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();

    // Special case for size column
    if (columnIndex === 2) { // Size column
      // Handle directory entries (marked with '-')
      if (aValue === '-') return -1;
      if (bValue === '-') return 1;

      // Extract numeric values for size comparison
      const aSize = parseFileSize(aValue);
      const bSize = parseFileSize(bValue);
      return ascending ? aSize - bSize : bSize - aSize;
    }

    // Special case for date column
    if (columnIndex === 3) { // Date column
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return ascending ? aDate - bDate : bDate - aDate;
    }

    // Default string comparison
    return ascending
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
}

/**
 * Parse file size string to bytes
 * @param {string} sizeStr Size string (e.g., "1.5 MB")
 * @returns {number} Size in bytes
 */
function parseFileSize(sizeStr) {
  const units = {
    'Bytes': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };

  const parts = sizeStr.split(' ');
  if (parts.length !== 2) return 0;

  const size = parseFloat(parts[0]);
  const unit = parts[1];

  return size * (units[unit] || 0);
}
