const fs = require('fs');
const recipes = require('./fake-data');

fs.writeFileSync(
    'recipes.json',
    JSON.stringify(recipes),
    'utf-8',
);

console.log('Done!');