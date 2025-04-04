(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
        typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError';
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError';
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError';
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError';
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError';
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError';
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v.replace(/\+/g, " ")) }), {});

        let body;
        // If req stream has ended body has been parsed
        if (req.readableEnded) {
            body = req.body;
        } else {
            body = await parseBody(req);
        }

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }

            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = 'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAPNnpUWHRSYXcgcHJvZmlsZSB0eXBlIGV4aWYAAHja7ZpZdiS7DUT/uQovgSQ4LofjOd6Bl+8LZqpULbWm7vdnqyRVKQeCBAKBAFNm/eff2/yLr2hzMSHmkmpKlq9QQ/WND8VeX+38djac3+cr3af4+5fj5nHCc0h4l+vP8nJicdxzeN7Hxz1O43h8Gmi0+0T/9cT09/jlNuAeBs+XuMuAvQ2YeQ8k/jrhwj2Re3mplvy8hH3PKPr7SLl+jP6KkmL2OeErPnmbQ9q8Rmb0c2ynxafzO+eET7mC65JPjrM95exN2jmmlYLnophSTKLDZH+GGAwWM0cyt3C8nsHWWeG4Z/Tio7cHQiZ2M7JK8X6JE3t++2v5oj9O2nlvfApc50SkGQ5FDnm5B2PezJ8Bw1PUPvl6cYv5G788u8V82y/lPTgfn4CC+e2JN+Ds5T4ubzCVHu8M9JsTLr65QR5m/LPhvh6G/S8zcs75XzxZXn/2nmXvda2uhURs051x51bzMgwXdmIl57bEK/MT+ZzPq/IqJPEA+dMO23kNV50HH9sFN41rbrvlJu/DDeaoMci8ez+AjB4rkn31QxQxQV9u+yxVphRgM8CZSDDiH3Nxx2499oYrWJ6OS71jMCD5+ct8dcF3XptMNupie4XXXQH26nCmoZHT31xGQNy+4xaPg19ejy/zFFghgvG4ubDAZvs1RI/uFVtyACBcF3m/0sjlqVHzByUB25HJOCEENjmJLjkL2LNzQXwhQI2Ze7K0EwEXo59M0geRRGwKOMI292R3rvXRX8fhbuJDRkomNlUawQohgp8cChhqUWKIMZKxscQamyEBScaU0knM1E6WxUxO5pJrbkVKKLGkkksptbTqq1AjYiWLa6m1tobNFkyLjbsbV7TWfZceeuyp51567W0AnxFG1EweZdTRpp8yIayZZp5l1tmWI6fFrLDiSiuvsupqG6xt2WFHOCXvsutuj6jdUX33+kHU3B01fyKl1+VH1Diasw50hnDKM1FjRsR8cEQ8awQAtNeY2eJC8Bo5jZmtnqyInklGjc10thmXCGFYzsftHrF7jdy342bw9Vdx89+JnNHQ/QOR82bJm7j9JmqnGo8TsSsL1adWyD7Or9J8aTjbXx/+9v3/A/1vDUS9tHOXtLaM6JoBquRHJFHdaNU5oF9rKVSjYNewoFNsW032cqqCCx/yljA2cOy7+7zJ0biaicv1TcrWXSDXVT3SpkldUqqPIJj8p9oeWVs4upKL3ZHgpNzYnTRv5EeTYXpahYRgfC+L/FyxBphCmPLK3W1Zu1QZljTMJe5AIqmOyl0qlaFCCJbaPAIMWXzurWAMXiB1fGDtc+ld0ZU12k5cQq4v7+AB2x3qLlQ3hyU/uWdzzgUTKfXSputZRtp97hZ3z4EE36WE7WtjbqMtMr912oRp47HloZDlywxJ+uyzmrW91OivysrM1Mt1rZbrrmXm2jZrYWVuF9xZVB22jM4ccdaE0kh5jIrnzBy5w6U92yZzS1wrEao2ZPnE0tL0eRIpW1dOWuZ1WlLTqm7IdCESsV5RxjQ1/KWC/y/fPxoINmQZI8Cli9oOU+MJYgrv006VQbRGC2Ug8TYzrdtUHNjnfVc6/oN8r7tywa81XHdZN1QBUhfgzRLzmPCxu1G4sjlRvmF4R/mCYdUoF2BYNMq4AjD2GkMGhEt7PAJfKrH1kHmj8eukyLb1oCGW/WdAtx0cURYqtcGnNlAqods6UnaRpY3LY8GFbPeSrjKmsvhKnWTtdYKhRW3TImUqObdpGZgv3ltrdPwwtD+l1FD/htxAwjdUzhtIkWNVy+wBUmDtphwgVemd8jV1miFXWTpumqiqvnNuArCrFMbLPexJYpABbamrLiztZEIeYPasgVbnz9/NZxe4p/B+FV3zGt79B9S0Jc0Lu+YH4FXsAsa2YnRIAb2thQmGc17WdNd9cx4+y4P89EiVRKB+CvRkiPTwM7Ts+aZ5aV0C4zGoqyOGJv3yGMJaHXajKbOGkm40Ychlkw6c6hZ4s+SDJpsmncwmm8ChEmBWspX8MkFB+kzF1ZlgoGWiwzY6w4AIPDOcJxV3rtUnabEgoNBB4MbNm8GlluVIpsboaKl0YR8kGnXZH3JQZrH2MDxxRrHFUduh+CvQszakraM9XNo7rEVjt8VpbSOnSyD5dwLfVI4+Sl+DCZc5zU6zhrXnRhZqUowkruyZupZEm/dA2uVTroDg1nfdJMBua9yCJ8QPtGw2rkzlYLik5SBzUGSoOqBMJvwTe92eGgOVx8/T39TP0r/PYgfkP1IEyGVhYHXyJiVPU0skB3dGqle6OZuwj/Hw5c2gV5nEM6TYaAryq3CRXsj1088XNwt0qcliqNc6bfW+TttRydKpeJOUWTmmUiwJKzpr6hkVzzLrVs+s66xEiCwOzfg5IRgwQgFgrriRlg6WQS/nGyRUNDjulWsUbO8qu/lWaWeFe8QTs0puzrxXH1H0b91KgDm2dkdrpkpx8Ks2zZu4K1GHPpDxPdCL0RH0SZZrGX8hRKTA+oUPzQ+I0K1C16ZSK6TR28HUdlnfpzMsIvd4TR7iuSe/+pn8vief46IQULRGcHvRVUyn9aYeoHbGhEbct+vEuzIxhxJrgk1oyo3AFA7eSSSNI/Vxl0eLMCrJ/j1QH0ybj0C9VCn9BtXbz6Kd10b8QKtpTnecbnKHWZxcK2OiKCuViBHqrzM2T1uFlGJlMKFKRF1Zy6wMqQYtgKYc4PFoGv2dX2ixqGaoFDhjzRmp4fsygFZr3t0GmBqeqbcBFpvsMVCNajVWcLRaPBhRKc4RCCUGZphKJdisKdRjDKdaNbZfwM5BulzzCvyv0AsAlu8HOAdIXAuMAg0mWa0+0vgrODoHlm7Y7rXUHmm9r2RTLpXwOfOaT6iZdASpqOIXfiABLwQkrSPFXQgAMHjYyEVrOBESVgS4g4AxcXyiPwBiCF6g2XTPk0hqn4D67rbQVFv0Lam6Vfmvq90B3WgV+peoNRb702/tesrImcBCvIEaGoI/8YpKa1XmDNr1aGUwjDETBa3VkOLYVLGKeWQcd+WaUlsMdTdUg3TcUPvdT20ftDW4+injyAarDRVVRgc906sNTo1cu7LkDGewjkQ35Z7l4Htnx9MCkbenKiNMsif+5BNVnA6op3gZVZtjIAacNia+00w1ZutIibTMOJ7IISctvEQGDxEYDUSxUiH4R4kkH86dMywCqVJ2XpzkUYUgW3mDPmz0HLW6w9daRn7abZmo4QR5i/A21r4oEvCC31oajm5CR1yBZcIfN7rmgxM9qZBhXh3C6NR9dCS1PTMJ30c4fEcwkq0IXdphpB9eg4x1zycsof4t6C4jyS68eW7OonpSEYCzb5dWjQH3H5fWq2SH41O4LahPrSJA77KqpJYwH6pdxDfDIgxLR9GptCKMoiHETrJ0wFSR3Sk7yI97KdBVSHXeS5FBnYKIz1JU6VhdCkfHIP42o0V6aqgg00JtZfdK6hPeojtXvgfnE/VX0p0+fqxp2/nDfvBuHgeo7ppkrr/MyU1dT73n5B/qi76+lzMnVnHRJDeZOyj3XXdQrrtOUPQunDqgDlz+iuS3QDafITkJd050L0Hi2kiRBX52pIVso0ZpW1YQsT2VRgtxm9iiqU2qXyZ0OdvZy0J1gFotZFEuGrnt3iiiXvECX+UcWBqpPlgLRkdN7cpl8PxDjWseAu1bPdCjBSrQeVD2RHE7bRhMb1Qd3VHVXVNBewZ3Wm7avbifhB+4LNQrmp0WxiCNkm7dd7mV39SnokrvfzIr+oDSFq1D76MZchw6Vl4Z67CL01I6ZiX/VEqfM1azjaSkKqC+kx67tqTg5ntLii5b96TAA3wMTx2NvqsyyUajYQHJ1qkpmzHQITXDUZRGTYtNw9uLSndMmI9tfMdEeRgwWHB7NlosyivZPlvT5KIOc+GefU9UhA4MmKFXmhAuJRFVWHRJySbREImpQysz4g3uJckihD7P84nWtLo7oR4tr8IKdSBXYvYaZnm3ffhh9nyWPDa+zQfzdULsFlr/khrMb7hhAroOKSZgxbUzqdiVIhQc+iZaTbpesLXSbIfbjwXTf8AjbnV6kTpD4ZsMdXMK45G1NRiMdh/bLb6oXX+4rWHen9BW+xJDV1N+i6HTlKdLDMnVkx8tdHryus3VlCOXXKlDIiuOkimXnmzmrtbGqmAHL1TVXU73PX5nx3xhSO3QKtBqbd31iQHHBNXXrYIXHVyQqDGIcc6qHEcz2ieN+radKS9br/cGzC0G7g0YFQPGdqs7MI6pOt2BgYtt/4MNW8NJ3VT5es/izZZFd9yIfwY1lUubGSSnPiWWzDpAN+sExNptEoBx74q8bAzdFu6NocvC2RgK2WR7doZodiZ6OgoUrBoWIBM2xtMHXUX3GGktr5RtwPZ9tTWfleFP3iEc2hTar6IC1Y55ktYKQtXTsKkfgQ+al0aXBCh2dlCxdBtLtc8QJ4WUKIX+jlRR/TN9pXpNA1bUC7LaYUzJvxr6rh2Q7ellILBd0PcFF5F6uArA6ODZdjQYosZpf7lbu5kNFfbGUUY5C2p7esLhhjw94Miqk+8tDPgTVXX23iliu782KzsaVdexRSq4NORtmY3erV/NFsJU9S7naPXmPGLYvuy5USQA2pcb4z/fYafpPj0t5HEeD1y7W/Z+PHA2t8L1eGCCeFS/Ph04Hafu+Uf8ly2tjUNDQnNUIOqVLrBLIwxK67p3fP7LaX/LjnlniCYv6jNK0ce5YrPud1Gc6LQWg+sumIt2hCCVG3e8e5tsLAL2qWekqp1nKPKqKIJcmxO3oljxVa1TXVDVWmxQ/lhHHnYNP9UDrtFdwekRKCueDRSRAYoo0nEssbG3znTTDahVUXyDj+afeEhn3w/UyY0fSv5b8ZuSmaDVrURYmBrf0ZgIMOGuGFNG3FH45iA7VFzUnj/odcwHzY72OnQEhByP3PtKWxh/Q+/hkl9x5lEic5ojDGgEzcSpnJEwY2y6ZN0RiyMBhZQ35AigLvK/dt9fn9ZJXaHUpf9Y4IxtBSkanMxxP6xb/pC/I1D1icMLDcmjZlj9L61LoIyLxKGRjUcUtOiFju4YqimZ3K0odbd1Usaa7gPp/77IJRuOmxAmqhrWXAPOftoY0P/BsgifTmC2ChOlRSbIMBjjm3bQIeahGwQamM9wHqy19zaTCZr/AtjdNfWMu8SZAAAA13pUWHRSYXcgcHJvZmlsZSB0eXBlIGlwdGMAAHjaPU9LjkMhDNtzijlCyMd5HKflgdRdF72/xmFGJSIEx9ihvd6f2X5qdWizy9WH3+KM7xrRp2iw6hLARIfnSKsqoRKGSEXA0YuZVxOx+QcnMMBKJR2bMdNUDraxWJ2ciQuDDPKgNDA8kakNOwMLriTRO2Alk3okJsUiidC9Ex9HbNUMWJz28uQIzhhNxQduKhdkujHiSJVTCt133eqpJX/6MDXh7nrXydzNq9tssr14NXuwFXaoh/CPiLRfLvxMyj3GtTgAAAGFaUNDUElDQyBwcm9maWxlAAB4nH2RPUjDQBzFX1NFKfUD7CDikKE6WRAVESepYhEslLZCqw4ml35Bk4YkxcVRcC04+LFYdXBx1tXBVRAEP0Dc3JwUXaTE/yWFFjEeHPfj3b3H3TtAqJeZanaMA6pmGclYVMxkV8WuVwjoRQCz6JeYqcdTi2l4jq97+Ph6F+FZ3uf+HD1KzmSATySeY7phEW8QT29aOud94hArSgrxOfGYQRckfuS67PIb54LDAs8MGenkPHGIWCy0sdzGrGioxFPEYUXVKF/IuKxw3uKslquseU/+wmBOW0lxneYwYlhCHAmIkFFFCWVYiNCqkWIiSftRD/+Q40+QSyZXCYwcC6hAheT4wf/gd7dmfnLCTQpGgc4X2/4YAbp2gUbNtr+PbbtxAvifgSut5a/UgZlP0mstLXwE9G0DF9ctTd4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
        function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
        users: {
            "35c62d76-8152-4626-8712-eeb96381bea8": {
                email: "peter@abv.bg",
                username: "Peter",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "847ec027-f659-4086-8032-5173e2f9c93a": {
                email: "george@abv.bg",
                username: "George",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
                email: "admin@abv.bg",
                username: "Admin",
                hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302"
            }
        },
        sessions: {
        }
    };
    var seedData = {
        properties: {
            "dad3fd4d-0485-4728-bb26-d02e8a26992a": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "FIVE Palm Jumeirah Dubai",
                typeId: "0j1k2l3m-4567-89ab-cdef-0123456789kl",
                starsCount: "5",
                checkIn: "15:00",
                checkOut: "06:00",
                address: "Palm Jumeirah, Palm Jumeirah, Dubai, United Arab Emirates",
                description: "FIVE Palm Jumeirah Dubai boasts its own private beach as well as 5 outdoor swimming pools, including a 55m long option, running through the heart of the resort. Guests can enjoy free WiFi throughout the property.\n\nThe hotel has 470 guest rooms and suites, spread across 16 floors, decorated in a simple yet elegant style with views of the Arabian Gulf.\n\nThe resort has an array of facilities, including dining venues hosted by world-class chefs, a modern spa and a karaoke room at Maiden Shanghai.\n\nA landmark on the trunk of the iconic Palm Jumeirah, FIVE Palm Jumeirah Dubai is strategically located for convenient access to Dubai’s business districts, as well as the city’s many exciting tourist and entertainment attractions.\n\nThe resort is also accessible from Dubai International Airport (DXB), which is 32.6 km away and Al Maktoum International Airport (DWC), which 42.3 km away. Mall of Emirates is 11.2 km away, while Dubai Mall is 22.7 km from the property.",
                imageUrls: [
                    "https://c.ekstatic.net/dex-media/417/Five-Palm-Jumeirah-Dubai_Desktop_HotelRoomDetailsGallery_1_1.jpg",
                    "https://c.ekstatic.net/dex-media/416/Five-Palm-Jumeirah-Dubai-Desktop-HotelDetails-1-3-637327495922065801.jpg",
                    "https://c.ekstatic.net/dex-media/416/Five-Palm-Jumeirah-Dubai-Desktop-HotelDetails-1-2-637327495922065801.jpg",
                    "https://c.ekstatic.net/dex-media/416/Five-Palm-Jumeirah-Dubai-Desktop-HotelDetails-1-4-637327495922065801.jpg",
                    "https://c.ekstatic.net/dex-media/416/Five-Palm-Jumeirah-Dubai-Desktop-HotelDetails-1-1-637327495922065801.jpg"
                ],
                _createdOn: 1740738248761,
                _id: "dad3fd4d-0485-4728-bb26-d02e8a26992a"
            },
            "1489d70a-329d-4745-bc68-455d9ac75c83": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Hilton Garden Inn Istanbul Beylikduzu",
                typeId: "0j1k2l3m-4567-89ab-cdef-0123456789kl",
                starsCount: "4",
                checkIn: "14:00",
                checkOut: "00:00",
                address: "Barbaros Hayrettin Pasa Mah. 1999 Sok. Esenyurt, 34522 Istanbul, Turkey",
                description: "Located in business area in Beylikduzu, 1 km from Tuyap Convention Centre, Hilton Garden Inn Istanbul Beylikduzu features indoor pool and 24/7 fitness centre. Free WiFi access is available in all areas.\n\nModern rooms are fitted with a flat-screen TV. Some units include a seating area for your convenience. Every room comes with a private bathroom. For your comfort, you will find free toiletries and a hair dryer.\n\nThere is a 24-hour front desk, providing room service at the property. Laundry, dry cleaning and ironing services are also provided upon request at an additional charge.\n\nGuests can enjoy their meals at the on-site restaurant. The lobby bar is ideal for having a drink and relaxing after a busy day.\n\nThe hotel is 35 km from Istanbul’s historic centre, where guests can visit Topkapi Palace, Blue Mosque, and Hagia Sophia Museum. Istanbul Airport is a 50-minute drive away. Mall of Istanbul is 25 km, Airport Outlet Center is 20 km, Akbatı Shopping Mall is 8 km.",
                imageUrls: [
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/484105483.jpg?k=d381f915f7e9311bf64734cbb87742eec40a834264ba1c1237f7e18f7276060a&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max500/484806261.jpg?k=82afaa65c2e8396120999c45e40bb3ec760a91a793f9f93e85abc1e678f0a7a1&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max300/484105537.jpg?k=e47db70ecd10f46adc980421e2495483a18a256147949ec75fecc5fb108a87de&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/513203867.jpg?k=d2899a2b7c4e9951abb20c934dfefbcc7c7e60c025ee3feca3f7483913ab877c&o=&hp=1",
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/484105543.jpg?k=adbc5414747997bd2c7d69ec85b08d84fd379719f210e610d60fa75220500abb&o=&hp=1"
                ],
                _createdOn: 1741882486449,
                _id: "1489d70a-329d-4745-bc68-455d9ac75c83"
            },
            "edfc6ac1-bfc0-466b-b613-0cd86fa709ae": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Summer Beach Maldives",
                typeId: "1k2l3m4n-5678-90ab-cdef-1234567890lm",
                starsCount: "4",
                checkIn: "14:00",
                checkOut: "12:00",
                address: "Boduthakurufaanu Magu, 20006 Male City, Maldives",
                description: "Beachfront Location: Summer Beach Maldives in Male City offers direct beachfront access with stunning sea views. Guests enjoy a terrace and outdoor seating area, perfect for relaxation.\n\nComfortable Accommodation: Rooms feature air-conditioning, private bathrooms, and modern amenities such as free WiFi, minibars, and flat-screen TVs. Family rooms and interconnected rooms cater to all travellers.\n\nDining Experience: The family-friendly restaurant serves Indian, Italian, Thai, and international cuisines, including vegetarian and halal options. Breakfast includes local specialities, fresh pastries, and a variety of beverages.\n\nConvenient Services: The guest house provides a free airport shuttle service, 24-hour front desk, concierge, and tour desk. Additional amenities include a coffee shop, child-friendly buffet, and free toiletries.",
                imageUrls: [
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/398767814.jpg?k=d9962306000f2dfa5aab8437d8b693ee3973b24b5d8e21b0acf6ea0895394d15&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max500/398788806.jpg?k=59ada28a447085e1328c22f48683ae09006e132f368ed5042157dd29b1c5576a&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max300/398793461.jpg?k=ae444a40c98b2d4057628ca8d02aa0c1e8e660babeff1a83c82e9544adcdb948&o=",
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/398767817.jpg?k=e625a8c84d8c55e279931f86ac0bad61436de6f200203801138490f956413528&o=&hp=1",
                    "https://cf.bstatic.com/xdata/images/hotel/max1024x768/398767820.jpg?k=6724f5c42976d9f85d6ea43dd55ac74f19f39236bda8a94b22172f5c73983e7d&o=&hp=1",
                    "https://cf.bstatic.com/xdata/images/hotel/max300/398788805.jpg?k=d62249809015446993fdfd99536284f76de4c7a093cfbb6461d62497d744462a&o="
                ],
                _createdOn: 1741884362990,
                _id: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae"
            },
        },
        propertiesFacilities: {
            "3648be12-1fab-4bee-90d7-3c16c8701565": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "b2c3d4e5-6789-01ab-cdef-2345678901bc",
                _createdOn: 1740738248776,
                _id: "3648be12-1fab-4bee-90d7-3c16c8701565"
            },
            "a8d1e6c9-a193-47e1-a8b2-f7eacdc80343": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "c3d4e5f6-7890-12ab-cdef-3456789012cd",
                _createdOn: 1740738248787,
                _id: "a8d1e6c9-a193-47e1-a8b2-f7eacdc80343"
            },
            "79df9606-ea62-4331-93f1-eea35a3e5f77": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "f6g7h8i9-0123-45ab-cdef-6789012345fg",
                _createdOn: 1740738248798,
                _id: "79df9606-ea62-4331-93f1-eea35a3e5f77"
            },
            "6538feae-c073-40ec-a3db-e5f6f9396a19": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "n4o5p6q7-8901-23ab-cdef-4567890123no",
                _createdOn: 1740738248808,
                _id: "6538feae-c073-40ec-a3db-e5f6f9396a19"
            },
            "b62cc7b0-949b-4ef4-b406-95f9cd4405db": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "t0u1v2w3-4567-89ab-cdef-0123456789tu",
                _createdOn: 1740738248818,
                _id: "b62cc7b0-949b-4ef4-b406-95f9cd4405db"
            },
            "fd587fd4-8863-4110-8472-82fbb97ec335": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "g7h8i9j0-1234-56ab-cdef-7890123456gh",
                _createdOn: 1740738248828,
                _id: "fd587fd4-8863-4110-8472-82fbb97ec335"
            },
            "9c7446f8-a3d4-4bbd-bfdb-2abdbe1cec5a": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "l2m3n4o5-6789-01ab-cdef-2345678901lm",
                _createdOn: 1740738248838,
                _id: "9c7446f8-a3d4-4bbd-bfdb-2abdbe1cec5a"
            },
            "3590673d-3af6-49f3-8901-f1ee9f12a665": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "p6q7r8s9-0123-45ab-cdef-6789012345pq",
                _createdOn: 1740738248848,
                _id: "3590673d-3af6-49f3-8901-f1ee9f12a665"
            },
            "2444f3ec-964e-446e-a04d-f5db09a13b87": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "dad3fd4d-0485-4728-bb26-d02e8a26992a",
                facilityId: "s9t0u1v2-3456-78ab-cdef-9012345678st",
                _createdOn: 1740738248857,
                _id: "2444f3ec-964e-446e-a04d-f5db09a13b87"
            },
            "8d07802c-edfa-4480-b9df-f2406de6c520": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "b2c3d4e5-6789-01ab-cdef-2345678901bc",
                _createdOn: 1741882486461,
                _id: "8d07802c-edfa-4480-b9df-f2406de6c520"
            },
            "a00a3685-93fd-4707-9039-18ff82022540": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "i9j0k1l2-3456-78ab-cdef-9012345678ij",
                _createdOn: 1741882486474,
                _id: "a00a3685-93fd-4707-9039-18ff82022540"
            },
            "ef60266e-3afb-4084-8e4f-ca5fd0532933": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "o5p6q7r8-9012-34ab-cdef-5678901234op",
                _createdOn: 1741882486484,
                _id: "ef60266e-3afb-4084-8e4f-ca5fd0532933"
            },
            "6a9ac99e-b562-49c1-8f6a-d91695e293be": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "r8s9t0u1-2345-67ab-cdef-8901234567rs",
                _createdOn: 1741882486495,
                _id: "6a9ac99e-b562-49c1-8f6a-d91695e293be"
            },
            "230cfecd-cb53-42d9-b079-40372e83e20f": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "t0u1v2w3-4567-89ab-cdef-0123456789tu",
                _createdOn: 1741882486507,
                _id: "230cfecd-cb53-42d9-b079-40372e83e20f"
            },
            "d71b61fb-bb7f-4500-8d77-e810a0e5f883": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
                _createdOn: 1741882486518,
                _id: "d71b61fb-bb7f-4500-8d77-e810a0e5f883"
            },
            "fd7c8272-719e-4ea5-81c1-9d5ebc20d745": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "e5f6g7h8-9012-34ab-cdef-5678901234ef",
                _createdOn: 1741882486528,
                _id: "fd7c8272-719e-4ea5-81c1-9d5ebc20d745"
            },
            "f7e31918-c305-4105-baeb-68e6571be66d": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "h8i9j0k1-2345-67ab-cdef-8901234567hi",
                _createdOn: 1741882486539,
                _id: "f7e31918-c305-4105-baeb-68e6571be66d"
            },
            "800bc2bb-5fa1-4e3f-ab06-a6dc84738cfd": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                propertyId: "1489d70a-329d-4745-bc68-455d9ac75c83",
                facilityId: "m3n4o5p6-7890-12ab-cdef-3456789012mn",
                _createdOn: 1741882486549,
                _id: "800bc2bb-5fa1-4e3f-ab06-a6dc84738cfd"
            },
            "828a756c-9a6d-4471-b7cd-ed2e17b8443c": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "b2c3d4e5-6789-01ab-cdef-2345678901bc",
                _createdOn: 1741884363003,
                _id: "828a756c-9a6d-4471-b7cd-ed2e17b8443c"
            },
            "e490c545-c7f1-40a4-862f-1189979054af": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "f6g7h8i9-0123-45ab-cdef-6789012345fg",
                _createdOn: 1741884363014,
                _id: "e490c545-c7f1-40a4-862f-1189979054af"
            },
            "791d0d9d-dc0e-43a2-81ba-2a0ec13bdb1e": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "k1l2m3n4-5678-90ab-cdef-1234567890kl",
                _createdOn: 1741884363024,
                _id: "791d0d9d-dc0e-43a2-81ba-2a0ec13bdb1e"
            },
            "911a5b38-80a1-4010-b623-77646890a5b0": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "o5p6q7r8-9012-34ab-cdef-5678901234op",
                _createdOn: 1741884363035,
                _id: "911a5b38-80a1-4010-b623-77646890a5b0"
            },
            "1b7bb21d-c3ea-4b13-8bc2-bb0e75ee287b": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "r8s9t0u1-2345-67ab-cdef-8901234567rs",
                _createdOn: 1741884363044,
                _id: "1b7bb21d-c3ea-4b13-8bc2-bb0e75ee287b"
            },
            "40a78ad6-fa8c-45b7-989a-eb124508e4cc": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "e5f6g7h8-9012-34ab-cdef-5678901234ef",
                _createdOn: 1741884363059,
                _id: "40a78ad6-fa8c-45b7-989a-eb124508e4cc"
            },
            "5ffa2b4a-b8e7-4bf6-b4e1-59c7a35e6af0": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "h8i9j0k1-2345-67ab-cdef-8901234567hi",
                _createdOn: 1741884363070,
                _id: "5ffa2b4a-b8e7-4bf6-b4e1-59c7a35e6af0"
            },
            "01459768-5d41-4e75-8de8-bf1c34c2cdb4": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "j0k1l2m3-4567-89ab-cdef-0123456789jk",
                _createdOn: 1741884363080,
                _id: "01459768-5d41-4e75-8de8-bf1c34c2cdb4"
            },
            "57f38986-08dd-4168-800b-8a4b9244f687": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "l2m3n4o5-6789-01ab-cdef-2345678901lm",
                _createdOn: 1741884363088,
                _id: "57f38986-08dd-4168-800b-8a4b9244f687"
            },
            "6b3674ac-3ffa-4f0d-8ffb-c82895536857": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                propertyId: "edfc6ac1-bfc0-466b-b613-0cd86fa709ae",
                facilityId: "p6q7r8s9-0123-45ab-cdef-6789012345pq",
                _createdOn: 1741884363100,
                _id: "6b3674ac-3ffa-4f0d-8ffb-c82895536857"
            },
        },
        bedTypes: {
            "b1a7f3c9-8d22-4e65-9b2f-91e5e3a3c8d1": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Single Bed",
                description: "90 cm x 190 cm",
                isMain: true,
                _id: "b1a7f3c9-8d22-4e65-9b2f-91e5e3a3c8d1"
            },
            "f4e8a6b2-6a39-4b79-94b1-3e7d5c2d3e8a": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Twin Bed",
                description: "90 cm x 190 cm each",
                isMain: true,
                _id: "f4e8a6b2-6a39-4b79-94b1-3e7d5c2d3e8a"
            },
            "c2d4f3b7-5a6e-47f1-b7d9-2e6a3e5c4d8f": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Double Bed",
                description: "135 cm x 190 cm",
                isMain: true,
                _id: "c2d4f3b7-5a6e-47f1-b7d9-2e6a3e5c4d8f"
            },
            "d8a4e3c5-7f6b-49d1-b8e3-1c5d4a7f6e9b": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Queen Bed",
                description: "150 cm x 200 cm",
                isMain: true,
                _id: "d8a4e3c5-7f6b-49d1-b8e3-1c5d4a7f6e9b"
            },
            "e7c6d5b4-8a39-4f1e-b2d3-6c5a4e7f8b9d": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "King Bed",
                description: "180 cm x 200 cm",
                isMain: true,
                _id: "e7c6d5b4-8a39-4f1e-b2d3-6c5a4e7f8b9d"
            },
            "a5d6c7e4-9b38-4f1d-b2a3-6c5e7a4f8d9b": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Bunk Bed",
                description: "90 cm x 190 cm each",
                isMain: true,
                _id: "a5d6c7e4-9b38-4f1d-b2a3-6c5e7a4f8d9b"
            },
            "b9e4d6c7-3a8f-4b2d-1e5c-7a6f9b4d8e3c": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Murphy Bed",
                description: "Size varies",
                isMain: false,
                _id: "b9e4d6c7-3a8f-4b2d-1e5c-7a6f9b4d8e3c"
            },
            "d4c7e6a5-8f3b-4d2a-9b1e-5c6f7a4d8e9b": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Sofa Bed",
                description: "Size varies",
                isMain: false,
                _id: "d4c7e6a5-8f3b-4d2a-9b1e-5c6f7a4d8e9b"
            },
        },
        roomTypes: {
            "1a2b3c4d-5678-90ab-cdef-1234567890ab": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Single Room",
                _id: "1a2b3c4d-5678-90ab-cdef-1234567890ab"
            },
            "2b3c4d5e-6789-01ab-cdef-2345678901bc": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Double Room",
                _id: "2b3c4d5e-6789-01ab-cdef-2345678901bc"
            },
            "3c4d5e6f-7890-12ab-cdef-3456789012cd": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Twin Room",
                _id: "3c4d5e6f-7890-12ab-cdef-3456789012cd"
            },
            "4d5e6f7g-8901-23ab-cdef-4567890123de": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Triple Room",
                _id: "4d5e6f7g-8901-23ab-cdef-4567890123de"
            },
            "5e6f7g8h-9012-34ab-cdef-5678901234ef": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Quad Room",
                _id: "5e6f7g8h-9012-34ab-cdef-5678901234ef"
            },
            "6f7g8h9i-0123-45ab-cdef-6789012345fg": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Family Room",
                _id: "6f7g8h9i-0123-45ab-cdef-6789012345fg"
            },
            "7g8h9i0j-1234-56ab-cdef-7890123456gh": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Studio",
                _id: "7g8h9i0j-1234-56ab-cdef-7890123456gh"
            }
        },
        propertyTypes: {
            "8h9i0j1k-2345-67ab-cdef-8901234567ij": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Entire homes & apartments",
                _id: "8h9i0j1k-2345-67ab-cdef-8901234567ij"
            },
            "9i0j1k2l-3456-78ab-cdef-9012345678jk": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Apartments",
                _id: "9i0j1k2l-3456-78ab-cdef-9012345678jk"
            },
            "0j1k2l3m-4567-89ab-cdef-0123456789kl": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Hotels",
                _id: "0j1k2l3m-4567-89ab-cdef-0123456789kl"
            },
            "1k2l3m4n-5678-90ab-cdef-1234567890lm": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Guest houses",
                _id: "1k2l3m4n-5678-90ab-cdef-1234567890lm"
            },
            "2l3m4n5o-6789-01ab-cdef-2345678901mn": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Villas",
                _id: "2l3m4n5o-6789-01ab-cdef-2345678901mn"
            }
        },
        facilities: {
            "a1b2c3d4-5678-90ab-cdef-1234567890ab": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Higher level toilet",
                IsForAccessibility: true,
                _id: "a1b2c3d4-5678-90ab-cdef-1234567890ab"
            },
            "b2c3d4e5-6789-01ab-cdef-2345678901bc": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Airport shuttle",
                IsForAccessibility: false,
                _id: "b2c3d4e5-6789-01ab-cdef-2345678901bc"
            },
            "c3d4e5f6-7890-12ab-cdef-3456789012cd": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Free WiFi",
                IsForAccessibility: false,
                _id: "c3d4e5f6-7890-12ab-cdef-3456789012cd"
            },
            "d4e5f6g7-8901-23ab-cdef-4567890123de": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Pets allowed",
                IsForAccessibility: false,
                _id: "d4e5f6g7-8901-23ab-cdef-4567890123de"
            },
            "e5f6g7h8-9012-34ab-cdef-5678901234ef": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Toilet with grab rails",
                IsForAccessibility: true,
                _id: "e5f6g7h8-9012-34ab-cdef-5678901234ef"
            },
            "f6g7h8i9-0123-45ab-cdef-6789012345fg": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Room service",
                IsForAccessibility: false,
                _id: "f6g7h8i9-0123-45ab-cdef-6789012345fg"
            },
            "g7h8i9j0-1234-56ab-cdef-7890123456gh": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Wheelchair accessible",
                IsForAccessibility: true,
                _id: "g7h8i9j0-1234-56ab-cdef-7890123456gh"
            },
            "h8i9j0k1-2345-67ab-cdef-8901234567hi": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Visual aids: Tactile signs",
                IsForAccessibility: true,
                _id: "h8i9j0k1-2345-67ab-cdef-8901234567hi"
            },
            "i9j0k1l2-3456-78ab-cdef-9012345678ij": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Swimming Pool",
                IsForAccessibility: false,
                _id: "i9j0k1l2-3456-78ab-cdef-9012345678ij"
            },
            "j0k1l2m3-4567-89ab-cdef-0123456789jk": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Electric vehicle charging station",
                IsForAccessibility: true,
                _id: "j0k1l2m3-4567-89ab-cdef-0123456789jk"
            },
            "k1l2m3n4-5678-90ab-cdef-1234567890kl": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Family rooms",
                IsForAccessibility: false,
                _id: "k1l2m3n4-5678-90ab-cdef-1234567890kl"
            },
            "l2m3n4o5-6789-01ab-cdef-2345678901lm": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Visual aids: Braille",
                IsForAccessibility: true,
                _id: "l2m3n4o5-6789-01ab-cdef-2345678901lm"
            },
            "m3n4o5p6-7890-12ab-cdef-3456789012mn": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Lower bathroom sink",
                IsForAccessibility: true,
                _id: "m3n4o5p6-7890-12ab-cdef-3456789012mn"
            },
            "n4o5p6q7-8901-23ab-cdef-4567890123no": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Fitness centre",
                IsForAccessibility: false,
                _id: "n4o5p6q7-8901-23ab-cdef-4567890123no"
            },
            "o5p6q7r8-9012-34ab-cdef-5678901234op": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Non-smoking rooms",
                IsForAccessibility: false,
                _id: "o5p6q7r8-9012-34ab-cdef-5678901234op"
            },
            "p6q7r8s9-0123-45ab-cdef-6789012345pq": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Emergency cord in bathroom",
                IsForAccessibility: true,
                _id: "p6q7r8s9-0123-45ab-cdef-6789012345pq"
            },
            "q7r8s9t0-1234-56ab-cdef-7890123456qr": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Parking",
                IsForAccessibility: false,
                _id: "q7r8s9t0-1234-56ab-cdef-7890123456qr"
            },
            "r8s9t0u1-2345-67ab-cdef-8901234567rs": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Restaurant",
                IsForAccessibility: false,
                _id: "r8s9t0u1-2345-67ab-cdef-8901234567rs"
            },
            "s9t0u1v2-3456-78ab-cdef-9012345678st": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Auditory guidance",
                IsForAccessibility: true,
                _id: "s9t0u1v2-3456-78ab-cdef-9012345678st"
            },
            "t0u1v2w3-4567-89ab-cdef-0123456789tu": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Spa and wellness centre",
                IsForAccessibility: false,
                _id: "t0u1v2w3-4567-89ab-cdef-0123456789tu"
            }
        },
        roomFacilities: {
            "1f2b3c4d-5678-90ab-cdef-1234567890ab": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Private bathroom",
                IsForAccessibility: false,
                _id: "1f2b3c4d-5678-90ab-cdef-1234567890ab"
            },
            "2b3c4d5e-6789-01ab-cdef-2345678901bc": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Sea view",
                IsForAccessibility: false,
                _id: "2b3c4d5e-6789-01ab-cdef-2345678901bc"
            },
            "3c4d5e6f-7890-12ab-cdef-3456789012cd": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Balcony",
                IsForAccessibility: false,
                _id: "3c4d5e6f-7890-12ab-cdef-3456789012cd"
            },
            "4d5e6f7g-8901-23ab-cdef-4567890123de": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Kitchen/kitchenette",
                IsForAccessibility: false,
                _id: "4d5e6f7g-8901-23ab-cdef-4567890123de"
            },
            "5e6f7g8h-9012-34ab-cdef-5678901234ef": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Terrace",
                IsForAccessibility: false,
                _id: "5e6f7g8h-9012-34ab-cdef-5678901234ef"
            },
            "6f7g8h9i-0123-45ab-cdef-6789012345fg": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Coffee/tea maker",
                IsForAccessibility: false,
                _id: "6f7g8h9i-0123-45ab-cdef-6789012345fg"
            },
            "7g8h9i0j-1234-56ab-cdef-7890123456gh": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Air conditioning",
                IsForAccessibility: false,
                _id: "7g8h9i0j-1234-56ab-cdef-7890123456gh"
            },
            "8h9i0j1k-2345-67ab-cdef-8901234567hi": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Fireplace",
                IsForAccessibility: false,
                _id: "8h9i0j1k-2345-67ab-cdef-8901234567hi"
            },
            "9i0j1k2l-3456-78ab-cdef-9012345678ij": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "TV",
                IsForAccessibility: false,
                _id: "9i0j1k2l-3456-78ab-cdef-9012345678ij"
            },
            "0j1k2l3m-4567-89ab-cdef-0123456789jk": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Flat-screen TV",
                IsForAccessibility: false,
                _id: "0j1k2l3m-4567-89ab-cdef-0123456789jk"
            },
            "1k2l3m4n-5678-90ab-cdef-1234567890kl": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Kitchenette",
                IsForAccessibility: false,
                _id: "1k2l3m4n-5678-90ab-cdef-1234567890kl"
            },
            "2l3m4n5o-6789-01ab-cdef-2345678901lm": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Private pool",
                IsForAccessibility: false,
                _id: "2l3m4n5o-6789-01ab-cdef-2345678901lm"
            },
            "3m4n5o6p-7890-12ab-cdef-3456789012mn": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "View",
                IsForAccessibility: false,
                _id: "3m4n5o6p-7890-12ab-cdef-3456789012mn"
            },
            "4n5o6p7q-8901-23ab-cdef-4567890123no": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Toilet paper",
                IsForAccessibility: false,
                _id: "4n5o6p7q-8901-23ab-cdef-4567890123no"
            },
            "5o6p7q8r-9012-34ab-cdef-5678901234op": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Soundproofing",
                IsForAccessibility: false,
                _id: "5o6p7q8r-9012-34ab-cdef-5678901234op"
            },
            "6p7q8r9s-0123-45ab-cdef-6789012345pq": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Electric kettle",
                IsForAccessibility: false,
                _id: "6p7q8r9s-0123-45ab-cdef-6789012345pq"
            },
            "7q8r9s0t-1234-56ab-cdef-7890123456qr": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Rooftop pool",
                IsForAccessibility: false,
                _id: "7q8r9s0t-1234-56ab-cdef-7890123456qr"
            },
            "8r9s0t1u-2345-67ab-cdef-8901234567rs": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Refrigerator",
                IsForAccessibility: false,
                _id: "8r9s0t1u-2345-67ab-cdef-8901234567rs"
            },
            "9s0t1u2v-3456-78ab-cdef-9012345678st": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Patio",
                IsForAccessibility: false,
                _id: "9s0t1u2v-3456-78ab-cdef-9012345678st"
            },
            "a1b2c3d4-5678-90ab-cdef-1234567890ab": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Hairdryer",
                IsForAccessibility: false,
                _id: "a1b2c3d4-5678-90ab-cdef-1234567890ab"
            },
            "b2c3d4e5-6789-01bc-def2-2345678901bc": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Socket near the bed",
                IsForAccessibility: false,
                _id: "b2c3d4e5-6789-01bc-def2-2345678901bc"
            },
            "c3d4e5f6-7890-12cd-ef34-3456789012cd": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Walk-in shower",
                IsForAccessibility: false,
                _id: "c3d4e5f6-7890-12cd-ef34-3456789012cd"
            },
            "d4e5f6g7-8901-23de-f456-4567890123de": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Heating",
                IsForAccessibility: false,
                _id: "d4e5f6g7-8901-23de-f456-4567890123de"
            },
            "e5f6g7h8-9012-34ef-5678-5678901234ef": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Seating Area",
                IsForAccessibility: false,
                _id: "e5f6g7h8-9012-34ef-5678-5678901234ef"
            },
            "f6g7h8i9-0123-45fg-6789-6789012345fg": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Entire unit located on ground floor",
                IsForAccessibility: true,
                _id: "f6g7h8i9-0123-45fg-6789-6789012345fg"
            },
            "g7h8i9j0-1234-56gh-7890-7890123456gh": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Upper floors accessible by elevator",
                IsForAccessibility: true,
                _id: "g7h8i9j0-1234-56gh-7890-7890123456gh"
            },
            "h8i9j0k1-2345-67hi-8901-8901234567hi": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Entire unit wheelchair accessible",
                IsForAccessibility: true,
                _id: "h8i9j0k1-2345-67hi-8901-8901234567hi"
            },
            "i9j0k1l2-3456-78ij-9012-9012345678ij": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Toilet with grab rails",
                IsForAccessibility: true,
                _id: "i9j0k1l2-3456-78ij-9012-9012345678ij"
            },
            "j0k1l2m3-4567-89jk-0123-0123456789jk": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Adapted bath",
                IsForAccessibility: true,
                _id: "j0k1l2m3-4567-89jk-0123-0123456789jk"
            },
            "k1l2m3n4-5678-90kl-1234-1234567890kl": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Roll-in shower",
                IsForAccessibility: true,
                _id: "k1l2m3n4-5678-90kl-1234-1234567890kl"
            },
            "l2m3n4o5-6789-01lm-2345-2345678901lm": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Walk-in shower",
                IsForAccessibility: true,
                _id: "l2m3n4o5-6789-01lm-2345-2345678901lm"
            },
            "m3n4o5p6-7890-12mn-3456-3456789012mn": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Raised toilet",
                IsForAccessibility: true,
                _id: "m3n4o5p6-7890-12mn-3456-3456789012mn"
            },
            "n4o5p6q7-8901-23no-4567-4567890123no": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Lowered sink",
                IsForAccessibility: true,
                _id: "n4o5p6q7-8901-23no-4567-4567890123no"
            },
            "o5p6q7r8-9012-34op-5678-5678901234op": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Emergency cord in bathroom",
                IsForAccessibility: true,
                _id: "o5p6q7r8-9012-34op-5678-5678901234op"
            },
            "p6q7r8s9-0123-45pq-6789-6789012345pq": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                name: "Shower chair",
                IsForAccessibility: true,
                _id: "p6q7r8s9-0123-45pq-6789-6789012345pq"
            }
        },
        recipes: {
            "3987279d-0ad4-4afb-8ca9-5b256ae3b298": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Easy Lasagna",
                img: "assets/lasagna.jpg",
                ingredients: [
                    "1 tbsp Ingredient 1",
                    "2 cups Ingredient 2",
                    "500 g  Ingredient 3",
                    "25 g Ingredient 4"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551279012
            },
            "8f414b4f-ab39-4d36-bedb-2ad69da9c830": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Grilled Duck Fillet",
                img: "assets/roast.jpg",
                ingredients: [
                    "500 g  Ingredient 1",
                    "3 tbsp Ingredient 2",
                    "2 cups Ingredient 3"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551344360
            },
            "985d9eab-ad2e-4622-a5c8-116261fb1fd2": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Roast Trout",
                img: "assets/fish.jpg",
                ingredients: [
                    "4 cups Ingredient 1",
                    "1 tbsp Ingredient 2",
                    "1 tbsp Ingredient 3",
                    "750 g  Ingredient 4",
                    "25 g Ingredient 5"
                ],
                steps: [
                    "Prepare ingredients",
                    "Mix ingredients",
                    "Cook until done"
                ],
                _createdOn: 1613551388703
            }
        },
        comments: {
            "0a272c58-b7ea-4e09-a000-7ec988248f66": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                content: "Great recipe!",
                recipeId: "8f414b4f-ab39-4d36-bedb-2ad69da9c830",
                _createdOn: 1614260681375,
                _id: "0a272c58-b7ea-4e09-a000-7ec988248f66"
            }
        },
        records: {
            i01: {
                name: "John1",
                val: 1,
                _createdOn: 1613551388703
            },
            i02: {
                name: "John2",
                val: 1,
                _createdOn: 1613551388713
            },
            i03: {
                name: "John3",
                val: 2,
                _createdOn: 1613551388723
            },
            i04: {
                name: "John4",
                val: 2,
                _createdOn: 1613551388733
            },
            i05: {
                name: "John5",
                val: 2,
                _createdOn: 1613551388743
            },
            i06: {
                name: "John6",
                val: 3,
                _createdOn: 1613551388753
            },
            i07: {
                name: "John7",
                val: 3,
                _createdOn: 1613551388763
            },
            i08: {
                name: "John8",
                val: 2,
                _createdOn: 1613551388773
            },
            i09: {
                name: "John9",
                val: 3,
                _createdOn: 1613551388783
            },
            i10: {
                name: "John10",
                val: 1,
                _createdOn: 1613551388793
            }
        },
        catches: {
            "07f260f4-466c-4607-9a33-f7273b24f1b4": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                angler: "Paulo Admorim",
                weight: 636,
                species: "Atlantic Blue Marlin",
                location: "Vitoria, Brazil",
                bait: "trolled pink",
                captureTime: 80,
                _createdOn: 1614760714812,
                _id: "07f260f4-466c-4607-9a33-f7273b24f1b4"
            },
            "bdabf5e9-23be-40a1-9f14-9117b6702a9d": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                angler: "John Does",
                weight: 554,
                species: "Atlantic Blue Marlin",
                location: "Buenos Aires, Argentina",
                bait: "trolled pink",
                captureTime: 120,
                _createdOn: 1614760782277,
                _id: "bdabf5e9-23be-40a1-9f14-9117b6702a9d"
            }
        },
        furniture: {
        },
        orders: {
        },
        movies: {
            "1240549d-f0e0-497e-ab99-eb8f703713d7": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Black Widow",
                description: "Natasha Romanoff aka Black Widow confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises. Comes on the screens 2020.",
                img: "https://miro.medium.com/max/735/1*akkAa2CcbKqHsvqVusF3-w.jpeg",
                _createdOn: 1614935055353,
                _id: "1240549d-f0e0-497e-ab99-eb8f703713d7"
            },
            "143e5265-333e-4150-80e4-16b61de31aa0": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Wonder Woman 1984",
                description: "Diana must contend with a work colleague and businessman, whose desire for extreme wealth sends the world down a path of destruction, after an ancient artifact that grants wishes goes missing.",
                img: "https://pbs.twimg.com/media/ETINgKwWAAAyA4r.jpg",
                _createdOn: 1614935181470,
                _id: "143e5265-333e-4150-80e4-16b61de31aa0"
            },
            "a9bae6d8-793e-46c4-a9db-deb9e3484909": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                title: "Top Gun 2",
                description: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
                img: "https://i.pinimg.com/originals/f2/a4/58/f2a458048757bc6914d559c9e4dc962a.jpg",
                _createdOn: 1614935268135,
                _id: "a9bae6d8-793e-46c4-a9db-deb9e3484909"
            }
        },
        likes: {
        },
        ideas: {
            "833e0e57-71dc-42c0-b387-0ce0caf5225e": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "Best Pilates Workout To Do At Home",
                description: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Minima possimus eveniet ullam aspernatur corporis tempore quia nesciunt nostrum mollitia consequatur. At ducimus amet aliquid magnam nulla sed totam blanditiis ullam atque facilis corrupti quidem nisi iusto saepe, consectetur culpa possimus quos? Repellendus, dicta pariatur! Delectus, placeat debitis error dignissimos nesciunt magni possimus quo nulla, fuga corporis maxime minus nihil doloremque aliquam quia recusandae harum. Molestias dolorum recusandae commodi velit cum sapiente placeat alias rerum illum repudiandae? Suscipit tempore dolore autem, neque debitis quisquam molestias officia hic nesciunt? Obcaecati optio fugit blanditiis, explicabo odio at dicta asperiores distinctio expedita dolor est aperiam earum! Molestias sequi aliquid molestiae, voluptatum doloremque saepe dignissimos quidem quas harum quo. Eum nemo voluptatem hic corrupti officiis eaque et temporibus error totam numquam sequi nostrum assumenda eius voluptatibus quia sed vel, rerum, excepturi maxime? Pariatur, provident hic? Soluta corrupti aspernatur exercitationem vitae accusantium ut ullam dolor quod!",
                img: "./images/best-pilates-youtube-workouts-2__medium_4x3.jpg",
                _createdOn: 1615033373504,
                _id: "833e0e57-71dc-42c0-b387-0ce0caf5225e"
            },
            "247efaa7-8a3e-48a7-813f-b5bfdad0f46c": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                title: "4 Eady DIY Idea To Try!",
                description: "Similique rem culpa nemo hic recusandae perspiciatis quidem, quia expedita, sapiente est itaque optio enim placeat voluptates sit, fugit dignissimos tenetur temporibus exercitationem in quis magni sunt vel. Corporis officiis ut sapiente exercitationem consectetur debitis suscipit laborum quo enim iusto, labore, quod quam libero aliquid accusantium! Voluptatum quos porro fugit soluta tempore praesentium ratione dolorum impedit sunt dolores quod labore laudantium beatae architecto perspiciatis natus cupiditate, iure quia aliquid, iusto modi esse!",
                img: "./images/brightideacropped.jpg",
                _createdOn: 1615033452480,
                _id: "247efaa7-8a3e-48a7-813f-b5bfdad0f46c"
            },
            "b8608c22-dd57-4b24-948e-b358f536b958": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                title: "Dinner Recipe",
                description: "Consectetur labore et corporis nihil, officiis tempora, hic ex commodi sit aspernatur ad minima? Voluptas nesciunt, blanditiis ex nulla incidunt facere tempora laborum ut aliquid beatae obcaecati quidem reprehenderit consequatur quis iure natus quia totam vel. Amet explicabo quidem repellat unde tempore et totam minima mollitia, adipisci vel autem, enim voluptatem quasi exercitationem dolor cum repudiandae dolores nostrum sit ullam atque dicta, tempora iusto eaque! Rerum debitis voluptate impedit corrupti quibusdam consequatur minima, earum asperiores soluta. A provident reiciendis voluptates et numquam totam eveniet! Dolorum corporis libero dicta laborum illum accusamus ullam?",
                img: "./images/dinner.jpg",
                _createdOn: 1615033491967,
                _id: "b8608c22-dd57-4b24-948e-b358f536b958"
            }
        },
        catalog: {
            "53d4dbf5-7f41-47ba-b485-43eccb91cb95": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                make: "Table",
                model: "Swedish",
                year: 2015,
                description: "Medium table",
                price: 235,
                img: "./images/table.png",
                material: "Hardwood",
                _createdOn: 1615545143015,
                _id: "53d4dbf5-7f41-47ba-b485-43eccb91cb95"
            },
            "f5929b5c-bca4-4026-8e6e-c09e73908f77": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                make: "Sofa",
                model: "ES-549-M",
                year: 2018,
                description: "Three-person sofa, blue",
                price: 1200,
                img: "./images/sofa.jpg",
                material: "Frame - steel, plastic; Upholstery - fabric",
                _createdOn: 1615545572296,
                _id: "f5929b5c-bca4-4026-8e6e-c09e73908f77"
            },
            "c7f51805-242b-45ed-ae3e-80b68605141b": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                make: "Chair",
                model: "Bright Dining Collection",
                year: 2017,
                description: "Dining chair",
                price: 180,
                img: "./images/chair.jpg",
                material: "Wood laminate; leather",
                _createdOn: 1615546332126,
                _id: "c7f51805-242b-45ed-ae3e-80b68605141b"
            }
        },
        teams: {
            "34a1cab1-81f1-47e5-aec3-ab6c9810efe1": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                name: "Storm Troopers",
                logoUrl: "/assets/atat.png",
                description: "These ARE the droids we're looking for",
                _createdOn: 1615737591748,
                _id: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1"
            },
            "dc888b1a-400f-47f3-9619-07607966feb8": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Team Rocket",
                logoUrl: "/assets/rocket.png",
                description: "Gotta catch 'em all!",
                _createdOn: 1615737655083,
                _id: "dc888b1a-400f-47f3-9619-07607966feb8"
            },
            "733fa9a1-26b6-490d-b299-21f120b2f53a": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                name: "Minions",
                logoUrl: "/assets/hydrant.png",
                description: "Friendly neighbourhood jelly beans, helping evil-doers succeed.",
                _createdOn: 1615737688036,
                _id: "733fa9a1-26b6-490d-b299-21f120b2f53a"
            }
        },
        members: {
            "cc9b0a0f-655d-45d7-9857-0a61c6bb2c4d": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
                status: "member",
                _createdOn: 1616236790262,
                _updatedOn: 1616236792930
            },
            "61a19986-3b86-4347-8ca4-8c074ed87591": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237188183,
                _updatedOn: 1616237189016
            },
            "8a03aa56-7a82-4a6b-9821-91349fbc552f": {
                _ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
                teamId: "733fa9a1-26b6-490d-b299-21f120b2f53a",
                status: "member",
                _createdOn: 1616237193355,
                _updatedOn: 1616237195145
            },
            "9be3ac7d-2c6e-4d74-b187-04105ab7e3d6": {
                _ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237231299,
                _updatedOn: 1616237235713
            },
            "280b4a1a-d0f3-4639-aa54-6d9158365152": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
                status: "member",
                _createdOn: 1616237257265,
                _updatedOn: 1616237278248
            },
            "e797fa57-bf0a-4749-8028-72dba715e5f8": {
                _ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
                teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
                status: "member",
                _createdOn: 1616237272948,
                _updatedOn: 1616237293676
            }
        }
    };
    var rules$1 = {
        users: {
            ".create": false,
            ".read": [
                "Owner"
            ],
            ".update": false,
            ".delete": false
        },
        members: {
            ".update": "isOwner(user, get('teams', data.teamId))",
            ".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
            "*": {
                teamId: {
                    ".update": "newData.teamId = data.teamId"
                },
                status: {
                    ".create": "newData.status = 'pending'"
                }
            }
        }
    };
    var settings = {
        identity: identity,
        protectedData: protectedData,
        seedData: seedData,
        rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    return server;

})));
