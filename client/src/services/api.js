import { getLoggedInUserAccessToken } from "../utils/auth-utils";

const host = import.meta.env.VITE_API_URL;

export async function requester(method, url, body) {
    const options = {
        method,
        headers: {},
    };

    if (body) {
        options.headers['content-type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    const loggedInUserAccessToken = getLoggedInUserAccessToken();

    if (loggedInUserAccessToken) {
        options.headers['X-Authorization'] = loggedInUserAccessToken;
    }

    const request = await fetch(`${host}/${url}`, options);

    if (!request.ok) {
        if (request.status === 403) {
            //auth.removeUserData();
        }
        
        const errorResponse = await request.json();

        throw new Error(errorResponse.message);
    }

    if (request.status !== 204) {
        return await request.json();
    }
}

export const get = requester.bind(null, 'GET');
export const post = requester.bind(null, 'POST');
export const put = requester.bind(null, 'PUT');
export const del = requester.bind(null, 'DELETE');