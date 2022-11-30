/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {

    return knex.schema.createTable('divisions_code', (table) =>{
        table.increments('id').primary().comment('Auto-generated id');
        table.text('code').notNullable();
        table.text('name').notNullable();
    });
      
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

    return knex.schema.dropTable('divisions_code');

};