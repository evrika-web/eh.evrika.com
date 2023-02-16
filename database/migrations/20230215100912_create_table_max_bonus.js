/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('max_bonus', (table) =>{
        table.increments('id').primary().comment('Auto-generated id');
        table.text('article').notNullable();
    });      
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {  
    return knex.schema.dropTable('max_bonus');
};
