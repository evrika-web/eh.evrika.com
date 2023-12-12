/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {

    return knex.schema.createTable('promotions', (table) =>{
        table.increments('promotion_id').primary().comment('Auto-generated id');
        table.text('doc_number').notNullable();
        table.text('type').notNullable();
        table.datetime('start_date').notNullable();
        table.datetime('end_date').notNullable();
        table.json('percents')
        table.json('products').notNullable();
        table.boolean('participate').notNullable();
        table.boolean('active').notNullable();
        table.datetime('created_at')
        table.datetime('updated_at')
    });
      
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

    return knex.schema.dropTable('promotions');

};