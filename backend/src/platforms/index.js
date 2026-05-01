import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const platforms = {};

const files = fs .readdirSync(__dirname).filter(file => file.startsWith('dna-') && file.endsWith('.js'));

for (const file of files) {
  const key = file.replace('dna-', '').replace('.js', '');
  const module = await import(`./${file}`);
  platforms[key] = module.dna;
}

console.log('Loaded platforms:', Object.keys(platforms));

export default platforms; 
