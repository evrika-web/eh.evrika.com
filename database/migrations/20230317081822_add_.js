/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('max_bonus', table => {
        table.integer('nal');
        table.integer('credit');
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {  
    return knex.schema.table('max_bonus', table => {
        table.dropColumn('nal');
        table.dropColumn('credit');
      })
};
