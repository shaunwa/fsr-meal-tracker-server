import { getIngredients, getPopulatedMeals } from '../db';

const conversions = {
    cups: 48,
    tablespoons: 3,
    teaspoons: 1,
}

const convertToTeaspoons = ingredient =>
    ingredient.amount * conversions[ingredient.units];

const removeDuplicates = arr =>
    [...new Set(arr)];

const getAmounts = ingredients =>
    ingredients.reduce((acc, ingredient) => ({
        ...acc,
        [ingredient.units]: acc[ingredient.units]
            ? acc[ingredient.units] + ingredient.amount
            : ingredient.amount,
    }), {});

const getAmountsString = ingredients =>
    ingredients.map(ingredient => `${ingredient.amount} ${ingredient.units}`)
               .join(' + ');

const emptyIngredients = { count: 0, pounds: 0, cups: 0, tablespoons: 0, teaspoons: 0 };

const condenseIngredients = ingredients =>
    ingredients.reduce((acc, i) => ({
        ...acc,
        [i.name]: acc[i.name]
            ? { ...acc[i.name], [i.units]: acc[i.name][i.units] + i.amount }
            : { ...emptyIngredients, [i.units]: i.amount }
    }), {});

const getMissingIngredients = (required, owned) =>
    Object.keys(required).reduce((acc, name) => ({
        ...acc,
        [name]: Object.keys(required[name]).reduce((unitAmounts, unit) => ({
            ...unitAmounts,
            [unit]: Math.max(required[name][unit] - ((owned[name] || {})[unit] || 0), 0),
        }), {}),
    }), {});

const getShoppingList = (missingIngredients) =>
    Object.keys(missingIngredients).map(name =>
        name + ': ' + Object.keys(missingIngredients[name])
            .filter(unit => missingIngredients[name][unit] > 0)
            .map(unit => `${missingIngredients[name][unit]} ${unit}`)
            .join(' + '));

export const getShoppingListRoute = {
    method: 'get',
    path: '/shopping-list',
    handler: async (req, res) => {
        const ingredients = await getIngredients();
        const populatedMeals = await getPopulatedMeals();

        const requiredIngredients = populatedMeals.flatMap(meal => meal.recipe.ingredients);
        const condensedMealIngredients = condenseIngredients(requiredIngredients);
        const condensedUserIngredients = condenseIngredients(ingredients);
        const missingIngredients = getMissingIngredients(
            condensedMealIngredients,
            condensedUserIngredients,
        );
        const shoppingList = getShoppingList(missingIngredients);

        res.status(200).json(shoppingList);
    },
}