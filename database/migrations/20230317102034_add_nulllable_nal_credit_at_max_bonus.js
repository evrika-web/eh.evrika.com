/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('max_bonus', table => {
        table.setNullable('nal');
        table.setNullable('credit');
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('max_bonus', table => {
        table.dropNullable('nal');
        table.dropNullable('credit');
      })
};
