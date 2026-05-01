/**
 * DNA Tecnico: RunnerBrasil (Python scraper)
 */

const RunnerBrasilDNA = {
  name: 'RunnerBrasil (Python scraper)',
  format: 'Python (PDF/TXT parsing)',
  baseUrl: 'https://www.runnerbrasil.com.br',
  fields: {
    event: ['idEvento', 'nome', 'data', 'local', 'distâncias'],
    athlete: ['pos (rank)', 'nome', 'faixa', 'equipe', 'tempo'],
    result: ['gender (deduzido faixa)', 'tempo']
  },
  keys: {
    event: 'idEvento + idAno',
    athlete: 'nome + pos'
  },
  parsers: ['list_events(year)', 'get_pdf_links()', 'parse_txt(content)', 'parse_pdf(filepath)', 'import_to_db()'],
  normalization: {
    time: 'tempo → HH:MM:SS',
    distance: 'distâncias → normDist → 5K,10K,etc.',
    pace: 'tempo / distancia',
    name: 'UPPERCASE',
    gender: 'GF/CF → F, M → M'
  },
  particularidades: [
    'Suporta arquivos .pdf e .txt',
    'Parse "Class. Num Nome ..." (formato antigo)',
    'Python: pdfplumber, psycopg2, urllib, re, ssl',
    'Processa anos 2014 a 2026'
  ],
  sanityChecks: ['tempo HH:MM:SS', 'Nome ≥ 3 caracteres', 'pace 2:00-20:00/km'],
  dependencies: ['pdfplumber', 'psycopg2-binary', 're, sys, os, json, time, urllib, ssl'],
  adapter: 'adapters/runner-brasil.js (wrapper Python)'
};

export const dna = RunnerBrasilDNA;   

