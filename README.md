# 🌐 Mochi MCP

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-1.29.0-FF4B91.svg?style=for-the-badge&logo=modelcontextprotocol)](https://modelcontextprotocol.io/)
[![Package Manager](https://img.shields.io/badge/pnpm-10.3-orange.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![Code Style](https://img.shields.io/badge/Style-Modular-purple.svg?style=for-the-badge)](https://github.com/)

**A premium, modular Model Context Protocol (MCP) server for the Mochi website uptime and monitoring suite.**  
*Equip your AI assistants in Cursor and Antigravity IDE with real-time website checks, intervals, active latency, and uptime reports.*

[Features](#-key-features) • [Quick Start](#-quick-start) • [Architecture](#-modular-architecture) • [Tools](#-mcp-tools-exposed) • [IDE Configuration](#-ide-integration)

</div>

---

## ⚡ Key Features

*   **🛡️ Robust TypeScript & ESM**: Built from the ground up on modern TypeScript ESM standards, compiled via `tsup` into optimized, minified production builds.
*   **🎨 Designer CLI Wizard**: A stunning setup experience powered by `@clack/prompts`, `gradient-string`, `ora` spinners, and `boxen`.
*   **🤖 Multi-IDE Auto-Configurator**: Auto-detects platform paths (Windows, macOS, Linux) and injects configurations directly into both **Cursor** and **Antigravity IDE** configuration stores.
*   **🔑 Smart Configuration Fallbacks**: Leverages `conf` secure stores while maintaining seamless fallback checks across environment variables and legacy `.mochirc` configurations.

---

## 🗺️ System Flow

```mermaid
graph TD
    A[User Terminal / IDE Boot] --> B[src/index.ts Entrypoint]
    
    B -->|'login' Argument| C[src/cli/login.ts Wizard]
    B -->|Default Stdio Boot| D[src/mcp/server.ts Server]
    
    C -->|Validate Key & Store| E[src/config.ts Storage Manager]
    C -->|Auto-Inject Settings| F[(mcp_config.json stores)]
    
    D -->|Read Token / URL| E
    D -->|Expose Tools & Handlers| G[src/mcp/tools.ts Actions]
    G -->|Axios HTTPS Requests| H[Mochi Backend API]
    H -->|Return Monitor States| G
    G -->|Format Beautiful Markdown Table| D
```

---

## 🚀 Quick Start

### 1. Boot the Interactive Setup Wizard
Initialize the package configurations and link your IDEs instantly:

```bash
pnpm run dev login
```

You'll be greeted with a colorful double-bordered title box and guided step-by-step:
1.  **API Key Entry**: Paste your Mochi Access Token (format verified in real-time).
2.  **Live Token Verification**: A sleek animated spinner verifies your credentials directly against the Mochi API.
3.  **Automatic IDE Linking**: Choose whether to configure Cursor, Antigravity IDE, both, or skip.

---

## ⚙️ Configuration Hierarchy

The system resolves your credentials dynamically according to the following strict priority:

```
┌────────────────────────────────────────────────────────┐
│  1. Env Variables (MOCHI_API_KEY / MOCHI_API_URL)     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│  2. Secure 'conf' Store (Saved during setup)           │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│  3. Legacy ~/.mochirc File Configs                     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│  4. Legacy ~/.config/mochi/config.json File Configs     │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ MCP Tools Exposed

### 🌐 `list_monitors`
Queries and lists all active and configured website monitors directly linked to your Mochi account.

#### Input Schema
*No parameters required.*

#### Live Markdown Response (LLM Rendered)

### 🌐 Mochi Active Monitors

| Monitor ID | Target URL | Cron Schedule | Current Status | Total Checks | Avg Latency | Uptime | Downtime |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `d0f41ab9...` | `https://mywebsite.com` | `*/5 * * * *` | **ACTIVE** | `12,840` | `102ms` | `240.5 hrs` | `0.0 hrs` |
| `f3922c01...` | `https://api.mywebsite.com` | `*/10 * * * *` | **ACTIVE** | `6,420` | `84ms` | `120.2 hrs` | `0.1 hrs` |

---

## 📂 Modular Architecture

```
src/
├── index.ts             # Lightweight entry router (CLI login or MCP standard boot)
├── config.ts            # Configuration manager (handles Typed conf store & fallbacks)
├── cli/
│   └── login.ts         # High-fidelity setup wizard (clack prompts, ora spinner, multi-IDE setup)
└── mcp/
    ├── server.ts        # Bootstraps the MCP Server over StdioServerTransport
    └── tools.ts         # Handles tool definitions, Axios API calls, and markdown tables
```

---

## 💻 Developer Guide

### Install Dependencies
```bash
pnpm install
```

### Run Dev Live Reloading
```bash
pnpm run dev
```

### Production ESM Bundle
Bundles and minifies TypeScript using `tsup`:
```bash
pnpm run build
```

---

## 🤖 IDE Integration (Manual)

If you prefer to configure your workspace manually, simply update your settings:

> [!IMPORTANT]
> **Cursor Configuration Paths:**
> - **Windows**: `%APPDATA%\Cursor\User\globalStorage\moe.polymath.vscsublime\mcp_config.json`
> - **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/moe.polymath.vscsublime/mcp_config.json`
> - **Linux**: `~/.config/Cursor/User/globalStorage/moe.polymath.vscsublime/mcp_config.json`

> [!IMPORTANT]
> **Antigravity IDE Configuration Path:**
> - `~/.gemini/antigravity-ide/mcp_config.json`

### Configuration Snippet
Add this snippet inside the `"mcpServers"` object in either of the files:
```json
{
  "mcpServers": {
    "mochi": {
      "command": "npx",
      "args": ["-y", "mochi-mcp-kit"]
    }
  }
}
```

---

<div align="center">

Made with ♥ for the Mochi Ecosystem.

</div>
