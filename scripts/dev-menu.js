import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = path.join(workspace, 'ML-TIH-LBackend');
const frontend = path.join(workspace, 'ML-TIH_Frontend');
const separator = '-'.repeat(58);
const readline = createInterface({ input: stdin, output: stdout });

function showMenu() {
  console.log(`\n${separator}\n Marketplace Literacy | Development Menu\n${separator}`);
  console.log('  1  Start backend');
  console.log('  2  Start frontend');
  console.log('  3  Start backend and frontend');
  console.log('  q  Quit');
  console.log(separator);
}

function runService(label, cwd, script) {
  console.log(`\n${separator}\n Starting ${label}\n${separator}`);
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(command, ['run', script], {
    cwd,
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('error', (error) => {
    console.error(`\n${separator}\n ${label} failed to start: ${error.message}\n${separator}`);
  });
  child.on('exit', (code, signal) => {
    const result = signal ? `stopped (${signal})` : `exited (${code ?? 'unknown'})`;
    console.log(`\n${separator}\n ${label} ${result}\n${separator}`);
  });
  return child;
}

let selected;
try {
  showMenu();
  selected = (await readline.question('Select an option: ')).trim().toLowerCase();
} finally {
  readline.close();
}

if (selected === 'q') process.exit(0);

const children = [];
if (selected === '1' || selected === '3') {
  children.push(runService('backend', backend, 'start:dev'));
}
if (selected === '2' || selected === '3') {
  children.push(runService('frontend', frontend, 'dev'));
}
if (children.length === 0) {
  console.log(`\n${separator}\n Invalid option. Run npm run dev and choose 1, 2, 3, or q.\n${separator}`);
  process.exitCode = 1;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
  });
}
