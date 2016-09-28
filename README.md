# ajax2
A simple ajax library with optional case converter

## Basic usage
To make a request, use the following structure:

```
    import ajax from 'ajax2'

    ajax.get('/path/to/resource')
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
    ajax.post('/whatever', {hereGoesTheData: ''})
```

Supported methods are `get`, `post`, `put`, `patch`, `delete`.

All calls will return a Promise, which you can use with `await`.

## Case conversion
By default, ajax2 will convert request data from `camelCase` to `snake_case`, for usage with Python or Ruby. Conversely
responses will be converted from `snake_case` to `camelCase`.

Note that only the keys will be converted. Example:

```
    ajax.post('/whatever', {exampleKey: 'exampleValue'})
```
will create a request with the following json:
```
    {"example_key": "exampleValue"}
```
This is intended to preserve user input.

## Changing configuration
To change configuration, use `ajax2._configure`.

```
    ajax2._configure({
        convertRequest: null, // 'snakeCase', 'camelCase', or null
        convertResponse: null, // 'snakeCase', 'camelCase', or null
        headers: {}, // A dictionary with headers to send with all requests
        credentials: 'same-origin' // 'same-origin', 'include', or null
    });
```

You can override configuration for a particular request by passing configuration to the request method.
```
    ajax.post('/whatever', {hereGoesTheData: ''}, {credentials: null})
```

NB: It is not necessary to specify a `Content-Type` header as this will be set to `application/json` if there is data
(and it is not a `GET` request).
