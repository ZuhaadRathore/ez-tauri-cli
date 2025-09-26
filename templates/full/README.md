# EZ Tauri

**The fastest way to build desktop apps that don't suck.**

Skip the 3-hour setup hell. This isn't another bloated boilerplate with 47 dependencies you'll never use. It's a clean, fast Tauri + React starter that gets you from `npm create` to shipping in minutes, not days.

Built by developers who got tired of wrestling with build configs instead of building features.

## What This Actually Is

This is a **desktop application boilerplate**, not a web app. It creates real native desktop applications that run on Windows, macOS, and Linux. Think VS Code, Discord, or Figma - but built with web technologies instead of learning platform-specific languages.

**The stack:**
- **Frontend**: React app (just like any web app you'd build)
- **Backend**: Rust application that handles file system, databases, native APIs
- **Bridge**: Tauri connects them securely (no full Node.js access like Electron)
- **Output**: Real native installers (.msi, .dmg, .deb) that users double-click to install

**What you build:**
- Desktop apps with native performance and small file sizes
- Apps that can access the file system, send notifications, manage windows
- Cross-platform applications from a single codebase
- Something your users install and run offline, not visit in a browser

## What You Get

**Frontend Stack**
- React 18 + TypeScript (obviously)
- Tailwind CSS (no bloated component library)
- React Router for routing that actually works
- Zustand for state (Redux is dead, deal with it)
- Theme switching that respects system preferences

**Desktop Runtime**
- Tauri v2 (not Electron, thank god)
- Rust backend for actual performance
- File operations, notifications, system access
- Secure secrets storage with Stronghold
- Real native feel, not just a website in a frame

**Database Ready**
- PostgreSQL with SQLx (type-safe queries)
- Docker setup that doesn't break
- Migrations that won't corrupt your data
- Connection pooling because we're not animals

**Testing That Works**
- Vitest for unit tests (Jest is slow)
- WebdriverIO for real desktop E2E testing
- Setup that runs on CI without mysterious failures

**Dev Experience**
- Hot reload for both frontend AND backend
- ESLint + Prettier (fights over formatting are dumb)
- TypeScript everywhere (catch bugs before users do)
- GitHub Actions that don't randomly break

## Prerequisites

**Required:**
- Node.js 18+ (use [fnm](https://github.com/Schniz/fnm) if you're smart)
- Rust 1.70+ (get it from [rustup.rs](https://rustup.rs/))
- Docker (for the database)

**Platform Setup:**

**Windows:** Install Visual Studio Build Tools. WebView2 is probably already there.

**macOS:** Run `xcode-select --install` and grab a coffee.

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

## Get Started

**Option 1: Use the template**
```bash
npm create ez-tauri my-app
cd my-app
npm install
```

**Option 2: Clone it**
```bash
git clone https://github.com/ZuhaadRathore/ez-tauri.git
cd ez-tauri
npm install
```

**Boot the database:**
```bash
docker-compose up -d
```

**Set up your environment:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

**Start developing:**
```bash
npm run dev
```

That's it. Your app opens, hot reload works, database is connected. No 30-step setup guide.

## Scripts You'll Actually Use

**Development:**
```bash
npm run dev          # Start everything (frontend + backend + DB)
npm run test         # Run tests
npm run lint:fix     # Fix code style
```

**Production:**
```bash
npm run build        # Build for production
npm run tauri:build  # Package desktop app
```

**Database:**
```bash
npm run db:up        # Start PostgreSQL
npm run db:reset     # Nuclear option (wipe and restart)
```

**The others exist but you probably won't need them.**

## Project Structure

```
├── src/                      # React frontend
├── src-tauri/               # Rust backend
├── tests/                   # Tests (unit + E2E)
├── database/                # Database init scripts
└── .github/workflows/       # CI/CD
```

Keep it simple. Frontend goes in `src/`, backend goes in `src-tauri/`. Tests go in `tests/`. Everything else is just config.

## How It Works

**Development workflow:**
1. You write React components in `src/` (normal web development)
2. You write Rust functions in `src-tauri/src/handlers/` for file system, database, etc.
3. You call Rust functions from React using `invoke('function_name')`
4. Hot reload works for both frontend and backend changes

**Example - Reading a file from React:**

**Rust side** (`src-tauri/src/handlers/files.rs`):
```rust
#[tauri::command]
pub async fn read_config_file() -> Result<String, String> {
    let contents = std::fs::read_to_string("config.json")
        .map_err(|e| e.to_string())?;
    Ok(contents)
}
```

**React side** (`src/components/Settings.tsx`):
```tsx
import { invoke } from '@tauri-apps/api/core'

const Settings = () => {
  const [config, setConfig] = useState('')

  useEffect(() => {
    invoke<string>('read_config_file').then(setConfig)
  }, [])

  return <div>{config}</div>
}
```

**The bridge is type-safe** - TypeScript knows what your Rust functions return.

## Database

Your `.env` needs a `DATABASE_URL`. First run encrypts and stores it securely via Stronghold, then deletes the plaintext. Migrations live in `src-tauri/migrations/` and run automatically.

```sql
-- Example migration
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

- CSP is configured (no inline scripts)
- API commands are allowlisted
- Input validation with Zod
- SQL injection protection with SQLx
- Secrets stored in Stronghold, not plaintext

Run `npm audit` and `cd src-tauri && cargo audit` to check for vulnerabilities.

## What's Included Out of the Box

**Sample App Features:**
- Modern UI with light/dark theme toggle
- File system operations (read/write files in app data directory)
- Database integration with user management
- Window management (resize, minimize, close)
- Native notifications
- System information access
- Logging system with file rotation
- Error boundaries and proper error handling

**The boilerplate comes with a working example app** that demonstrates all these features. You can see the code, learn from it, then replace it with your own app.

**Real-world examples you could build:**
- Note-taking app (like Obsidian)
- Database admin tool (like Sequel Pro)
- File manager or backup tool
- Development tools (like Postman)
- Media organizer or photo editor
- Chat application with offline storage

## Building for Production

```bash
npm run build
npm run tauri:build
```

Outputs native installers:
- Windows: `.msi`
- macOS: `.dmg`
- Linux: `.deb` + `.AppImage`

## Why Not Electron?

- **Size**: Tauri apps are ~10MB, Electron apps are ~100MB+
- **Memory**: Tauri uses ~50MB RAM, Electron uses ~500MB+
- **Security**: Tauri has proper API boundaries, Electron gives full Node.js access
- **Performance**: Tauri compiles to native code, Electron is JavaScript all the way down

## Troubleshooting

**Build fails?**
- Check Rust and Node.js versions
- On Linux, install the webkit dependencies above
- Clear caches: `rm -rf node_modules target/ && npm install`

**Database won't connect?**
- Check Docker is running: `docker ps`
- Reset everything: `npm run db:reset`

**Tests failing?**
- Check you're not running the app while testing
- WebdriverIO tests need the app to be stopped first

## Contributing

1. Fork it
2. Make changes
3. Add tests
4. Open PR

Don't overthink it.

## License

MIT - build whatever you want.

---

**Stop configuring. Start building.**