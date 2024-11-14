import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getVersion() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageData = readFileSync(packageJsonPath, 'utf-8');
  const { version } = JSON.parse(packageData);
  return version;
}
