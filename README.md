# Personal Finance App

A Tauri-based personal finance application that helps you analyze your bank statements and track your finances.

## Project Setup

### Prerequisites
- Node.js (v16 or later)
- Rust toolchain
- npm (Node package manager)

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd personal-finance
```

2. **Install dependencies**
```bash
npm install
```

3. **Install additional UI components**
```bash
npm install clsx tailwind-merge class-variance-authority
```

4. **Setup environment variables**
Create a `.env` file in the root directory:
```env
SPIKE_API_TOKEN=your_api_token_here
```

## Development

### Running the app
```bash
# Start the development server
npm run tauri dev
```

### Project Structure
```
personal-finance/
├── public/
│   ├── index.html            # HTML entry point
│   ├── tauri.svg            
│   └── vite.svg
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # React components
│   │   ├── ui/             # Shared UI components
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   ├── hooks/              # Custom React hooks
│   │   └── useUpload.ts
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   └── StatementUpload.tsx
│   ├── styles/             # Styling
│   │   └── App.css
│   ├── App.tsx
│   ├── index.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── src-tauri/              # Tauri backend
├── .gitignore
├── index.html
├── package-lock.json
├── package.json
└── vite.config.ts
```

### Key Components

#### StatementUpload
The main component for uploading and processing bank statements. Features:
- PDF file upload
- File validation
- Integration with Spike API for statement processing

#### Alert Component
A reusable alert component for displaying messages and errors. Usage:
```typescript
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertDescription>Error message here</AlertDescription>
</Alert>
```

## API Integration

### Spike API
The application uses the Spike API to process bank statements. Endpoints used:
- `/pdf1` - For processing PDF bank statements

## Build & Deployment

### Building for production
```bash
npm run tauri build
```

This will create platform-specific installers in the `src-tauri/target/release/bundle` directory.

### Supported Platforms
- Windows
- macOS
- Linux

## Troubleshooting

### Common Issues

1. **PDF Upload Issues**
   - Ensure the file is a valid PDF
   - Check file size (max 6MB)
   - Verify API token is set correctly

2. **Build Issues**
   - Ensure Rust toolchain is installed
   - Check that all dependencies are installed
   - Verify Tauri prerequisites are met for your platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.