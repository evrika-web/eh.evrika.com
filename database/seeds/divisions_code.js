/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('divisions_code').del()
  await knex('divisions_code').insert([
    {id: 1,  code:  'HQ1000179', name:"Айтеке би"},
    {id: 2,  code:  'HQ1000038', name:"Аксукент"},
    {id: 3,  code:  'HQ1000022', name:"Алматы"},
    {id: 4,  code:  'HQ1000090', name:"Аральск"},
    {id: 5,  code:  'HQ1000044', name:"Арысь"},
    {id: 6,  code:  'HQ1000028', name:"Астана"},
    {id: 7,  code:  'HQ1000158', name:"Жаркент"},
    {id: 8,  code:  'HQ1000039', name:"Жетысай"},
    {id: 9,  code:  'HQ1000084', name:"Казыгурт"},
    {id: 10, code:  'HQ1000095', name:"Карабулак"},
    {id: 11, code:  'HQ1000036', name:"Караганда"},
    {id: 12, code:  'HQ1000157', name:"Каскелен"},
    {id: 13, code:  'HQ1000052', name:"Кызылорда"},
    {id: 14, code:  'HQ1000046', name:"Ленгер"},
    {id: 15, code:  'HQ1000180', name:"Отеген Батыр"},
    {id: 16, code:  'HQ1000040', name:"Сарыагаш"},
    {id: 17, code:  '760000002', name:"Сарыкемер"},
    {id: 18, code:  'HQ1000021', name:"Тараз"},
    {id: 19, code:  'HQ1000171', name:"Торетам"},
    {id: 20, code:  'HQ1000057', name:"Турар Рыскулова"},
    {id: 21, code:  'HQ1000041', name:"Туркестан"},
    {id: 22, code:  'HQ1000168', name:"Узынагаш"},
    {id: 23, code:  'HQ1000175', name:"Шиели"},
    {id: 24, code:  'HQ1000164', name:"Шу"},
    {id: 25, code:  'HQ1000002', name:"Шымкент"},
  ]);
};
