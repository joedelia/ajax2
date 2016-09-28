import 'whatwg-fetch';
import isObject from 'lodash.isobject'
import {toCamelCase, toSnakeCase} from 'case-converter'

var defaultConvertRequest = 'snakeCase',
    defaultConvertResponse = 'camelCase',
    defaultHeaders = {},
    defaultCredentials = 'same-origin';

function configure({convertRequest, convertResponse, headers, credentials} = {}) {
    if(typeof convertRequest !== 'undefined') defaultConvertRequest = convertRequest;
    if(typeof convertResponse !== 'undefined') defaultConvertResponse = convertResponse;
    if(typeof headers !== 'undefined') defaultHeaders = headers;
    if(typeof credentials !== 'undefined') defaultCredentials = credentials;
}

function parseResponse(response, convertResponse) {
    if (response.headers.get('Content-Type') == 'application/json') {
        switch (convertResponse) {
            case 'snakeCase':
                return isObject(response.json()) ? toSnakeCase(response.json()) : response.json();
                break;
            case 'camelCase':
                return isObject(response.json()) ? toCamelCase(response.json()) : response.json();
                break;
            default:
                return response.json();
                break;
        }
    } else {
        return response.text();
    }
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        var error = new Error(response.statusText);
        error.response = response;
        error.status = response.status;
        throw error;
    }
}

function request(method, url, data, {convertRequest, convertResponse, headers, credentials}) {
    return new Promise((resolve, reject) => {
        if (data) {
            if (convertRequest == 'camelCase') {
                data = toCamelCase(data);
            } else if (convertRequest == 'snakeCase') {
                data = toSnakeCase(data);
            }
        }
        if (data) {
            headers['Content-Type'] = 'application/json';
        }
        fetch(url, {
            method: method,
            url: url,
            headers: headers,
            credentials: credentials,
            body: data ? JSON.stringify(data) : null
        })
            .then(checkStatus)
            .then(function (response) {
                resolve(parseResponse(response, convertResponse));
            })
            .catch(function (error) {
                reject({
                    statusCode: error.status,
                    statusText: error.message,
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
                                convertRequest = defaultConvertRequest,
                                convertResponse = defaultConvertResponse,
                                headers = defaultHeaders,
                                credentials = defaultCredentials
                            } = {}) {
        return request(method.toUpperCase(), url, data, {convertRequest, convertResponse, headers, credentials});
    }
}

exp['_configure'] = configure;
exp['_convertCase'] = {toCamelCase, toSnakeCase};

export default exp;
