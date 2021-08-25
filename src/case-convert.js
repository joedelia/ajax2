import camelCaseConverter from 'lodash/camelCase';
import snakeCaseConverter from 'lodash/snakeCase';

export function toCamelCase(obj) {
  return deepMapKeys(obj, camelCaseConverter);
}
export function toSnakeCase(obj) {
  return deepMapKeys(obj, snakeCaseConverter);
}

function deepMapKeys(obj, mod) {
  if ((obj === null || typeof obj !== 'object') && !Array.isArray(obj))
    throw new Error('You must provide initial argument as an object');

  if (!mod || typeof mod !== 'function')
    throw new Error('You must provide a modifier by which your keys will be changed');

  function innerRoutine(obj, mod) {
    if (Array.isArray(obj))
      return obj.map(val => innerRoutine(val, mod));

    if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj).reduce((accum, key) => {
        accum[mod(key)] = innerRoutine(obj[key], mod);
        return accum;
      }, { });
    }
    return obj;
  }

  return innerRoutine(obj, mod);
}
