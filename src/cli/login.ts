import gradient from 'gradient-string';
import pc from 'picocolors';
import boxen from 'boxen';
import ora from 'ora';
import axios from 'axios';
import { intro, outro, text, select, cancel, isCancel } from '@clack/prompts';
import { setApiKey, getApiUrl, getConfigPath } from '../config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Custom Mochi theme gradient
const mochiGradient = gradient(['#FF4B91', '#FF7676', '#FFB000', '#FFD369']);

// IDE MCP Path resolver
interface IdeConfig {
  name: string;
  paths: string[];
}

function getIdeConfigs(choice: 'cursor' | 'antigravity' | 'both'): IdeConfig[] {
  const homeDir = os.homedir();
  const configs: IdeConfig[] = [];

  if (choice === 'cursor' || choice === 'both') {
    const paths = [
      path.join(homeDir, '.cursor', 'mcp.json'),
    ];
    let cursorLegacyPath = '';
    if (process.platform === 'win32') {
      cursorLegacyPath = path.join(
        process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
        'Cursor',
        'User',
        'globalStorage',
        'moe.polymath.vscsublime',
        'mcp_config.json'
      );
    } else if (process.platform === 'darwin') {
      cursorLegacyPath = path.join(
        homeDir,
        'Library',
        'Application Support',
        'Cursor',
        'User',
        'globalStorage',
        'moe.polymath.vscsublime',
        'mcp_config.json'
      );
    } else {
      cursorLegacyPath = path.join(
        homeDir,
        '.config',
        'Cursor',
        'User',
        'globalStorage',
        'moe.polymath.vscsublime',
        'mcp_config.json'
      );
    }
    paths.push(cursorLegacyPath);

    configs.push({
      name: 'Cursor',
      paths,
    });
  }

  if (choice === 'antigravity' || choice === 'both') {
    const paths = [
      path.join(homeDir, '.gemini', 'config', 'mcp_config.json'),
      path.join(homeDir, '.gemini', 'antigravity-ide', 'mcp_config.json'),
    ];
    configs.push({
      name: 'Antigravity IDE',
      paths,
    });
  }

  return configs;
}

/**
 * Interactive login flow.
 */
export async function runLoginFlow(): Promise<void> {
  // Show gorgeous ASCII Art Title inside a double-bordered box
  const asciiArt = [
    "███╗      ███╗    ██████╗      ██████╗    ██╗   ██╗   ██╗",
    "████╗    ████║   ██╔═══██╗    ██╔════╝    ██║   ██║   ██║",
    "██╔████╗██╔██║   ██║   ██║    ██║         ███████║   ██║",
    "██║╚██╔╝██║██║   ██║   ██║    ██║         ██╔══██║   ██║",
    "██║ ╚═╝ ╚═╝██║   ╚██████╔╝    ╚██████╗    ██║  ██║   ██║",
    "╚═╝         ╚═╝    ╚═════╝      ╚═════╝    ╚═╝  ╚═╝   ╚═╝"
  ].join('\n');

  console.log(
    boxen(mochiGradient.multiline(asciiArt), {
      padding: 1,
      margin: { top: 1, bottom: 1 },
      borderStyle: 'double',
      borderColor: '#FF4B91',
      title: pc.bold(pc.cyan(' Mochi Setup Wizard ')),
      titleAlignment: 'center',
    })
  );

  intro(pc.bold(pc.magenta('Welcome to the Mochi MCP Configuration!')));

  // Step 1: Request Mochi API Key (No emoji)
  const apiKeyResult = await text({
    message: 'Enter your Mochi API Key:',
    placeholder: 'mochi_pat_...',
    validate(value) {
      const trimmed = (value || '').trim();
      if (!trimmed) return 'API Key is required';
      if (!trimmed.startsWith('mochi_pat_')) {
        return 'Invalid format. Mochi Personal Access Tokens start with "mochi_pat_"';
      }
    },
  });

  if (isCancel(apiKeyResult)) {
    cancel('Setup cancelled. Goodbye!');
    process.exit(0);
  }

  const apiKey = apiKeyResult.trim();

  // Step 2: Verify API Key with Spinner
  const verificationSpinner = ora({
    text: pc.cyan('Verifying API Key credentials with Mochi backend...'),
    spinner: 'dots',
  }).start();

  try {
    const backendUrl = getApiUrl();
    await axios.get(`${backendUrl}/mcp/monitors`, {
      headers: {
        'x-mochi-api-key': apiKey,
      },
      timeout: 8000,
    });

    verificationSpinner.succeed(pc.green('API key successfully verified with Mochi backend!'));
  } catch (error: any) {
    verificationSpinner.warn(
      pc.yellow(
        `Could not verify API Key on backend (${error.response?.status || error.message}). Saving key anyway.`
      )
    );
  }

  // Step 3: Save API Key
  try {
    setApiKey(apiKey);
    console.log(pc.gray(`\nConfiguration saved securely at: ${getConfigPath()}`));
  } catch (error: any) {
    cancel(`Failed to save configuration: ${error.message}`);
    process.exit(1);
  }

  // Step 4: Ask for IDE Configuration setup (No emoji)
  const ideChoice = await select({
    message: 'Which IDE configuration would you like to automatically update?',
    options: [
      { value: 'both', label: 'Both (Cursor & Antigravity IDE)', hint: 'Recommended' },
      { value: 'antigravity', label: 'Antigravity IDE only' },
      { value: 'cursor', label: 'Cursor only' },
      { value: 'none', label: 'None (Configure manually later)' },
    ],
  });

  if (isCancel(ideChoice)) {
    cancel('IDE configuration step skipped.');
    outro(pc.bold(pc.green('Setup complete! Mochi API key has been saved.')));
    process.exit(0);
  }

  if (ideChoice !== 'none') {
    const configs = getIdeConfigs(ideChoice as 'cursor' | 'antigravity' | 'both');

    for (const ide of configs) {
      const ideSpinner = ora(`Configuring ${ide.name}...`).start();
      let configuredAtLeastOne = false;
      const errorMsgs: string[] = [];

      for (const filepath of ide.paths) {
        try {
          let config: any = { mcpServers: {} };
          const dir = path.dirname(filepath);

          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }

          if (fs.existsSync(filepath)) {
            const contents = fs.readFileSync(filepath, 'utf8');
            try {
              config = JSON.parse(contents);
            } catch (e) {
              // Silent overwrite if malformed
            }
          }

          if (!config.mcpServers) {
            config.mcpServers = {};
          }

          // Add or overwrite the mochi server definition with exact requested env variables
          config.mcpServers.mochi = {
            command: 'npx',
            args: ['-y', 'mochi-mcp-kit'],
            env: {
              MOCHI_API_KEY: apiKey,
              DOTENV_CONFIG_QUIET: 'true',
              DOTENVX_LOG: 'error',
            },
          };

          fs.writeFileSync(filepath, JSON.stringify(config, null, 2), 'utf8');
          configuredAtLeastOne = true;
        } catch (err: any) {
          errorMsgs.push(err.message);
        }
      }

      if (configuredAtLeastOne) {
        ideSpinner.succeed(pc.green(`Successfully configured Mochi MCP in ${ide.name}!`));
      } else {
        ideSpinner.fail(pc.red(`Failed to configure ${ide.name}: ${errorMsgs.join(', ')}`));
      }
    }
  }

  // Outro without emoji
  outro(
    pc.bold(
      mochiGradient(
        'All set! Your Mochi MCP integration is successfully configured and ready to roll.'
      )
    )
  );
}
