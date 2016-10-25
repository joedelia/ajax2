import 'whatwg-fetch';
import {
	toCamelCase,
	toSnakeCase
} from 'case-converter'

var defaultConvertRequest = null,
	defaultConvertResponse = null,
	defaultHeaders = {},
	defaultCredentials = 'same-origin',
	defaultBaseUrl = null;

function isObject(value) {
	var type = typeof value;
	return !!value && (type == 'object' || type == 'function');
}

function configure({
	convertRequest,
	convertResponse,
	headers,
	credentials,
	baseUrl
} = {}) {
	if (typeof convertRequest !== 'undefined') defaultConvertRequest = convertRequest;
	if (typeof convertResponse !== 'undefined') defaultConvertResponse = convertResponse;
	if (typeof headers !== 'undefined') defaultHeaders = headers;
	if (typeof credentials !== 'undefined') defaultCredentials = credentials;
	if (typeof baseUrl !== 'undefined') defaultBaseUrl = baseUrl;
}

function serializeQuery(obj, prefix) {
	var str = [];
	for (var p in obj) {
		if (obj.hasOwnProperty(p)) {
			var k = prefix ? prefix + "[" + p + "]" : p,
				v = obj[p];
			str.push(typeof v == "object" ?
				serializeQuery(v, k) :
				encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
	}
	return str.join("&");
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
	if (response.ok) {
		return response;
	} else {
		var error = new Error(response.statusText);
		error.response = response;
		error.status = response.status;
		throw error;
	}
}

function request(method, url, data, {
	convertRequest,
	convertResponse,
	headers,
	credentials,
	baseUrl
}) {
	return new Promise((resolve, reject) => {
		try {
			if (data) {
				if (convertRequest == 'camelCase') {
					data = toCamelCase(data);
				} else if (convertRequest == 'snakeCase') {
					data = toSnakeCase(data);
				}
			}
			if (baseUrl !== null) {
				var joiner = '';
				if (baseUrl.substr(-1, 1) !== '/' && url.substr(0, 1) !== '/') {
					joiner = '/';
				} else if (baseUrl.substr(-1, 1) === '/' && url.substr(0, 1) === '/') {
					baseUrl = baseUrl.substr(0, baseUrl.length - 1);
				}
				url = baseUrl + joiner + url;
			}
			if (data && method === 'GET') {
				url = url + '?' + serializeQuery(data);
				data = null;
			} else if (data) {
				headers['Content-Type'] = 'application/json';
			}

			headers['X-Requested-With'] = `XMLHttpRequest`;

			var fetchDict = {
				method: method,
				headers: headers,
				credentials: credentials
			};
			if (data) {
				fetchDict['body'] = JSON.stringify(data);
			}

			fetch(url, fetchDict)
				.then(checkStatus)
				.then(function(response) {
					parseResponse(response, convertResponse).then(resolve);
				})
				.catch(function(error) {
					if (error.response) {
						parseResponse(error.response, convertResponse)
							.then(function(parsedResponse) {
								reject({
									statusCode: error.status,
									statusText: error.message,
									response: parsedResponse
								});
							})
							.catch(reject);
					} else {
						reject(error);
					}
				});
		} catch (err) {
			reject(err);
		}
	});
}

var exp = {};

for (let method of['get', 'post', 'put', 'patch', 'delete']) {
	exp[method] = function(url,
		data = null, {
			convertRequest = defaultConvertRequest,
			convertResponse = defaultConvertResponse,
			headers = defaultHeaders,
			credentials = defaultCredentials,
			baseUrl = defaultBaseUrl
		} = {}) {
		return request(method.toUpperCase(), url, data, {
			convertRequest,
			convertResponse,
			headers,
			credentials,
			baseUrl
		});
	}
}

exp['_configure'] = configure;
exp['_convertCase'] = {
	toCamelCase,
	toSnakeCase
};

module.exports = exp;
