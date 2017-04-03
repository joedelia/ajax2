import 'whatwg-fetch'; // eslint-disable-line import/no-unassigned-import
import {toCamelCase, toSnakeCase} from 'case-converter';
import EventDispatcher from './events';

let defaultConvertRequest = null,
  defaultConvertResponse = null,
  defaultHeaders = {},
  defaultAddRequestedWith = true,
  defaultCredentials = 'same-origin',
  defaultBaseUrl = null;

const events = new EventDispatcher();

function isObject(value) {
  const type = typeof value;
  return Boolean(value) && (type === 'object' || type === 'function');
}

function configure({
  convertRequest,
  convertResponse,
  headers,
  credentials,
  addRequestedWith,
  baseUrl
} = {}) {
  if (typeof convertRequest !== 'undefined') defaultConvertRequest = convertRequest;
  if (typeof convertResponse !== 'undefined') defaultConvertResponse = convertResponse;
  if (typeof headers !== 'undefined') defaultHeaders = headers;
  if (typeof credentials !== 'undefined') defaultCredentials = credentials;
  if (typeof addRequestedWith !== 'undefined') defaultAddRequestedWith = addRequestedWith;
  if (typeof baseUrl !== 'undefined') defaultBaseUrl = baseUrl;
}

function serializeQuery(obj, prefix) {
  const str = [];
  for (const p in obj) {
    if (obj.hasOwnProperty(p)) {
      const k = prefix ? prefix + '[' + p + ']' : p,
        v = obj[p];
      str.push(typeof v === 'object' ?
      serializeQuery(v, k) :
      encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
  }
  return str.join('&');
}

function parseResponse(response, convertResponse) {
  return new Promise(resolve => {
    if (!response) return null;
    if (response.headers.get('Content-Type') &&
      response.headers.get('Content-Type').indexOf('application/json') !== -1) {
      response.json()
        .then(json => {
          switch (convertResponse) {
          case 'snakeCase':
            resolve(isObject(json) ? toSnakeCase(json) : json);
            break;
          case 'camelCase':
            resolve(isObject(json) ? toCamelCase(json) : json);
            break;
          default:
            resolve(json);
            break;
          }
        });
    } else {
      response.text()
        .then(resolve);
    }
  });
}

function checkStatus(response) {
  if (response.ok)
    return response;

  const error = new Error(response.statusText);
  error.response = response;
  error.status = response.status;
  throw error;
}

function request(method, url, data, {
  convertRequest,
  convertResponse,
  headers,
  credentials,
  addRequestedWith,
  baseUrl
}) {
  events._fire('request', {
    method, url, data, convertRequest, convertResponse, headers,
    credentials, addRequestedWith, baseUrl
  });
  return new Promise((resolve, reject) => {
    try {
      if (data) {
        if (convertRequest === 'camelCase')
          data = toCamelCase(data);
        else if (convertRequest === 'snakeCase')
          data = toSnakeCase(data);
      }
      if (baseUrl !== null) {
        let joiner = '';
        if (baseUrl.substr(-1, 1) !== '/' && url.substr(0, 1) !== '/')
          joiner = '/';
        else if (baseUrl.substr(-1, 1) === '/' && url.substr(0, 1) === '/')
          baseUrl = baseUrl.substr(0, baseUrl.length - 1);
        url = baseUrl + joiner + url;
      }
      if (data && method === 'GET') {
        url = url + '?' + serializeQuery(data);
        data = null;
      } else if (data) {
        headers['Content-Type'] = 'application/json';
      }

      if (addRequestedWith) headers['X-Requested-With'] = 'XMLHttpRequest';

      const fetchDict = {
        method,
        headers,
        credentials
      };
      if (data)
        fetchDict.body = JSON.stringify(data);

      fetch(url, fetchDict)
        .then(checkStatus)
        .then(response => {
          events._fire('responseRaw', response);
          parseResponse(response, convertResponse).then(parsedResponse => {
            events._fire('success', parsedResponse);
            resolve(parsedResponse);
          });
        })
        .catch(err => {
          if (err.response) {
            events._fire('responseRaw', err.response);
            parseResponse(err.response, convertResponse)
              .then(parsedResponse => {
                const errorResponse = {
                  statusCode: err.status,
                  statusText: err.message,
                  response: parsedResponse
                };
                events._fire('error', errorResponse);
                reject(errorResponse);
              })
              .catch(reject);
          } else {
            reject(err);
          }
        });
    } catch (err) {
      reject(err);
    }
  });
}

const exp = {};

for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
  exp[method] = function (url,
    data = null, {
      convertRequest = defaultConvertRequest,
      convertResponse = defaultConvertResponse,
      headers = defaultHeaders,
      credentials = defaultCredentials,
      addRequestedWith = defaultAddRequestedWith,
      baseUrl = defaultBaseUrl
    } = {}) {
    return request(method.toUpperCase(), url, data, {
      convertRequest,
      convertResponse,
      headers,
      credentials,
      addRequestedWith,
      baseUrl
    });
  };
}

exp._configure = configure;
exp._convertCase = {
  toCamelCase,
  toSnakeCase
};

exp.on = (...args) => events.on(...args);
exp.off = (...args) => events.off(...args);
exp.once = (...args) => events.once(...args);

module.exports = exp;
