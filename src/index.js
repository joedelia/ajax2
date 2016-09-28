import 'whatwg-fetch';
import isObject from 'lodash.isobject'
import {toCamelCase, toSnakeCase} from 'case-converter'

var defaultConvertRequest = 'snakeCase',
    defaultConvertResponse = 'camelCase',
    defaultHeaders = {},
    defaultCredentials = 'same-origin';

function configure({convertRequest = 'snakeCase', convertResponse = 'camelCase', headers = {}, credentials = 'same-origin'} = {}) {
    defaultConvertRequest = convertRequest;
    defaultConvertResponse = convertResponse;
    defaultHeaders = headers;
    defaultCredentials = credentials;
}

function parseResponse(body, convertResponse) {
    if (response.headers.get('Content-Type') == 'application/json') {
        switch (convertResponse) {
            case 'snakeCase':
                return isObject(body.json()) ? toSnakeCase(body.json()) : body.json();
                break;
            case 'camelCase':
                return isObject(body.json()) ? toCamelCase(body.json()) : body.json();
                break;
            default:
                return body.json();
                break;
        }
    } else {
        return body.text();
    }
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        var error = new Error(response.statusText);
        error.response = response;
        error.status = status;
        throw error;
    }
}

function request(method, url, data, {convertRequest, convertResponse}) {
    return new Promise((resolve, reject) => {
        if (data) {
            if (convertRequest == 'camelCase') {
                data = toCamelCase(data);
            } else if (convertRequest == 'snakeCase') {
                data = toSnakeCase(data);
            }
        }
        var headers = defaultHeaders;
        if (data) {
            headers['Content-Type'] = 'application/json';
        }
        fetch(url, {
            method: method,
            url: url,
            headers: headers,
            credentials: defaultCredentials,
            body: data ? JSON.stringify(data) : null
        })
            .then(checkStatus)
            .then(function (response) {
                resolve(parseResponse(response, convertResponse));
            })
            .catch(function (error) {
                reject({
                    code: error.status,
                    error: error.message,
                    response: parseResponse(error.response, convertResponse)
                });
            });
    });
}

var exp = {};

for (let method of ['get', 'post', 'put', 'patch', 'delete']) {
    exp[method] = function (url,
                            data = null,
                            {
                                convertRequest = defaultConvertRequest || 'snakeCase',
                                convertResponse = defaultConvertResponse || 'camelCase'
                            } = {}) {
        return request(method.toUpperCase(), url, data, {convertRequest, convertResponse});
    }
}

exp['_configure'] = configure;
exp['_convertCase'] = {toCamelCase, toSnakeCase};

export default exp;
