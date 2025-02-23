import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const execAsync = promisify(exec);

async function checkPlaywrightInstallation(): Promise<boolean> {
  try {
    // Check if playwright is in node_modules
    const playwrightPath = join('node_modules', '@playwright');
    if (!existsSync(playwrightPath)) {
      return false;
    }

    // Try running playwright command
    await execAsync('bunx playwright -V');
    return true;
  } catch (error) {
    return false;
  }
}

async function installPlaywright() {
  try {
    console.log('Installing Playwright...');
    await execAsync('bun add -d @playwright/test');
    
    console.log('\nInstalling Playwright browsers...');
    const browsers = ['chromium', 'firefox', 'webkit'];
    for (const browser of browsers) {
      process.stdout.write(`Installing ${browser}... `);
      await execAsync(`bunx playwright install ${browser}`);
      process.stdout.write('✓\n');
    }
    
    console.log('\nInstalling system dependencies...');
    process.stdout.write('Installing dependencies... ');
    await execAsync('bunx playwright install-deps');
    process.stdout.write('✓\n');
    
    console.log('\nPlaywright installation completed successfully! ✨');
    return true;
  } catch (error) {
    console.error('\nError installing Playwright:', error);
    return false;
  }
}

export async function ensurePlaywright() {
  console.log('Checking Playwright installation...');
  
  const isInstalled = await checkPlaywrightInstallation();
  if (!isInstalled) {
    console.log('Playwright not found or not properly configured.');
    const success = await installPlaywright();
    if (!success) {
      throw new Error('Failed to install Playwright. Please install it manually.');
    }
  } else {
    console.log('Playwright is already installed and configured.');
  }
}