/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
  return knex.schema.createTable('races', (table) => {
    // Identificador Único Universal
    table.uuid('id').primary();
    
    // Dados Principais (O "Ouro" da Pesca)
    table.string('title').notNullable();
    table.string('date');
    table.string('location');
    table.decimal('price', 10, 2);
    
    // O "Link" é a nossa trava de segurança para não duplicar dados
    table.string('link').unique().notNullable();
    
    // Rastreabilidade
    table.string('origin_platform'); // Ex: chiptiming, zenite
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
  return knex.schema.dropTable('races');
};