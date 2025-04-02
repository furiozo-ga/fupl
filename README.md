# Directory Browser

A simple web application built with Bun.js that provides directory browsing functionality similar to the autoindex feature in web servers. The application allows users to browse the filesystem starting from a specified root directory, displaying files and folders in a user-friendly interface.

## Features

- Browse directories and view files
- Navigate through subdirectories
- Display file metadata (size, modification date)
- Breadcrumb navigation
- Sorting by name, size, and date
- Responsive design

## Installation

To install dependencies:

```bash
bun install
```

## Usage

To run the application in development mode with hot reloading:

```bash
bun dev
```

To run the application in production mode:

```bash
bun start
```

## Configuration

You can configure the application using environment variables:

- `PORT`: The port to run the server on (default: 3000)
- `ROOT_DIR`: The root directory to serve files from (default: current directory)

Example:

```bash
PORT=8080 ROOT_DIR=/home/user/documents bun start
```

## Security

The application includes security measures to prevent directory traversal attacks. It validates all paths to ensure they are within the specified root directory.

## Technologies

- [Bun.js](https://bun.sh) - JavaScript runtime and toolkit
- TypeScript - Type-safe JavaScript
- HTML/CSS/JavaScript - Frontend

## License

MIT
