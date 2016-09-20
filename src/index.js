import $ from 'jquery'
import _ from 'lodash'
import {toCamelCase, toSnakeCase} from 'case-converter'

var defaultConvertRequest,
    defaultConvertResponse;

function configure({convertRequest = 'snakeCase', convertResponse = 'camelCase', headers = {}} = {}) {
    defaultConvertRequest = convertRequest;
    defaultConvertResponse = convertResponse;
    if(!_.isEmpty(headers)) {
        $.ajaxSetup({
            headers: headers
        });
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
        $.ajax({
            method: method,
            url: url,
            data: data,
            success: (body) => {
                switch (convertResponse) {
                    case 'snakeCase':
                        resolve(_.isObject(body) ? toSnakeCase(body) : body);
                        break;
                    case 'camelCase':
                        resolve(_.isObject(body) ? toCamelCase(body) : body);
                        break;
                    default:
                        resolve(body);
                        break;
                }
            },
            error: function (jqXHR, jqError, error) {
                reject({
                    code: jqXHR.status,
                    error: error
                });
            }
        });
    });
}

var exp = {};

for (let method of ['get', 'post', 'put', 'patch', 'delete']) {
    exp[method] = function (url, data = null, {convertRequest = 'snakeCase', convertResponse = 'camelCase'} = {}) {
        return request(method, url, data, {convertRequest, convertResponse});
    }
}

exp['_configure'] = configure;

export default exp;
