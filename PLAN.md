# Directory Browser Web App with Bun.js

## 1. Project Overview

This project aims to create a simple web application using Bun.js that provides directory browsing functionality similar to the autoindex feature in web servers. The application will allow users to browse the filesystem starting from a specified root directory, displaying files and folders in a user-friendly interface.

## 2. Technology Stack

- **Runtime**: Bun.js
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Bun.js HTTP server

## 3. Project Structure

```
/
├── public/               # Static assets
│   ├── css/              # Stylesheets
│   │   └── style.css     # Main stylesheet
│   ├── js/               # Client-side JavaScript
│   │   └── main.js       # Main JavaScript file
│   └── favicon.ico       # Favicon
├── src/                  # Source code
│   ├── index.ts          # Entry point
│   ├── fileUtils.ts      # File system utilities
│   └── templates.ts      # HTML templates
├── package.json          # Project metadata and dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## 4. Implementation Plan

### Phase 1: Project Setup

1. Initialize a new Bun.js project
2. Set up the project structure
3. Configure TypeScript
4. Create a basic HTTP server

### Phase 2: Core Functionality

1. Implement file system utilities
   - Function to read directory contents
   - Function to get file/directory metadata
   - Function to validate paths (prevent directory traversal attacks)
2. Create HTML templates for directory listing
3. Implement route handling for directory browsing

### Phase 3: User Interface

1. Design and implement the UI for directory browsing
   - File/folder list with icons
   - Breadcrumb navigation
   - Basic sorting options
2. Add CSS styling
3. Implement client-side JavaScript for enhanced functionality

### Phase 4: Security and Error Handling

1. Implement proper error handling
2. Add security measures to prevent directory traversal attacks
3. Add configuration options for root directory path

### Phase 5: Testing and Refinement

1. Test the application with different directory structures
2. Fix bugs and improve performance
3. Add additional features if needed

## 5. Features

### MVP (Minimum Viable Product)

- Browse directories and view files
- Navigate through subdirectories
- Display file metadata (size, modification date)
- Breadcrumb navigation
- Basic styling for usability

### Additional Features (if time permits)

- File preview for common file types
- Search functionality
- Sorting options (by name, size, date)
- File download functionality

## 6. Implementation Details

### Server Setup

- Create a Bun.js HTTP server that listens on a configurable port
- Set up route handling for directory requests
- Implement security measures to restrict access to the specified root directory

### Directory Browsing

- Read directory contents using Bun's file system APIs
- Generate HTML for directory listings
- Handle navigation between directories
- Display relevant file information

### User Interface

- Create a clean, responsive interface
- Use icons to represent different file types
- Implement breadcrumb navigation for easy traversal
- Add basic sorting functionality
- Implement dark/light theme toggle with user preference storage

