# ajax2
A simple ajax library with optional case converter

## Installation
Using npm:
```
npm i --save ajax2
```

## Basic usage
To make a request, use the following structure:

```js
import ajax2 from 'ajax2'

ajax2.get('/path/to/resource')
    .then(function(response){
        // response will be an object if json was returned or text.
    })
    .catch(function(err){
        console.log({
            statusCode: err.statusCode, // e.g. 404
            statusText: err.statusText, // e.g. Not found
            response: err.response // Whatever the body was. Json will be parsed and an object returned
        });
    });

# Adding data to the request
ajax2.post('/whatever', {hereGoesTheData: ''})
```

Supported methods are `get`, `post`, `put`, `patch`, `delete`.

All calls will return a Promise, which you can use with `await`.

## Case conversion
Optionally, ajax2 will convert request data from `camelCase` to `snake_case`, for usage with Python or Ruby. Conversely
responses can be converted from `snake_case` to `camelCase`.

Note that only the keys will be converted. Example:

```js
ajax2.post('/whatever', {exampleKey: 'exampleValue'})
```
will create a request with the following json:
```js
{"example_key": "exampleValue"}
```
This is intended to preserve user input.

To enable this, call `ajax2._configure`...

## Changing configuration
To change configuration, use `ajax2._configure`.

```js
ajax2._configure({
    convertRequest: null, // 'snakeCase', 'camelCase', or null
    convertResponse: null, // 'snakeCase', 'camelCase', or null
    headers: {}, // A dictionary with headers to send with all requests
    addRequestedWith: true, // Adds 'X-Requested-With' to headers
    credentials: 'same-origin', // 'same-origin', 'include', or null
    baseUrl: null // Whatever url to prepend all requests urls with
});
```

You can override configuration for a particular request by passing configuration to the request method.
```js
ajax2.post('/whatever', {hereGoesTheData: ''}, {credentials: null})
```

NB: It is not necessary to specify a `Content-Type` header as this will be set to `application/json` if there is data
(and it is not a `GET` request).
