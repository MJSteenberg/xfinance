# Personal Finance Manager

A desktop application built with Tauri and React for managing personal finances and analyzing bank statements.

## Features

- 🔒 Secure local authentication
- 📊 Transaction dashboard with financial overview
- 📄 PDF bank statement processing
- 📈 CSV file support
- 💰 Income and expense tracking
- 📅 Date range filtering
- 🔍 Transaction search and categorization
- 💾 Local SQLite database storage

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (LTS version)
- [Rust](https://www.rust-lang.org/tools/install)
- Platform-specific dependencies:
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `apt install libwebkit2gtk-4.0-dev libgtk-3-dev libappindicator3-dev`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/MJSteenberg/xfinance.git
cd xfinance
```

2. Install dependencies:
```bash
npm install
```

3. Run the development build:
```bash
npm run tauri dev
```

4. Build for production:
```bash
npm run tauri build
```

## Usage

1. Launch the application
2. Create an account or sign in
3. Upload bank statements (PDF or CSV)
4. View your financial dashboard
5. Filter transactions by date
6. Track income and expenses

## Security

- All data is stored locally in a SQLite database
- No data is transmitted to external servers
- Passwords are securely hashed using bcrypt
- File system access is limited to application scope

## Development

The application is built with:
- [Tauri](https://tauri.app/) - Desktop framework
- [React](https://reactjs.org/) - Frontend framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Rust](https://www.rust-lang.org/) - Backend logic
- [SQLite](https://www.sqlite.org/) - Local database
- [TailwindCSS](https://tailwindcss.com/) - Styling

## Project Structure

```
├── src/                  # React frontend code
│   ├── components/       # Reusable React components
│   ├── pages/           # Application pages
│   ├── types/           # TypeScript type definitions
│   └── styles/          # CSS and styling
├── src-tauri/           # Rust backend code
│   ├── src/             # Rust source files
│   └── Cargo.toml       # Rust dependencies
└── package.json         # Node.js dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is private and not licensed for public use.

## Support

For support, please open an issue in the GitHub repository.