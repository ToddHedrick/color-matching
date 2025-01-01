const Api = {
    _baseUrl: "https://wcb0vg5qng.execute-api.us-west-2.amazonaws.com",

    buildUrl: function (pathPieces, queryParams) {
        let additionalPathPieces = [];
        if (Array.isArray(pathPieces)) {
            additionalPathPieces = [...pathPieces];
        } else if (typeof pathPieces === "string") {
            if (pathPieces.length) {
                additionalPathPieces.push(pathPieces);
            }
        }

        let url = this._baseUrl;
        if (additionalPathPieces.length) {
            url = url + "/" + additionalPathPieces.join("/");
        }

        if (queryParams !== null && typeof queryParams === "object" && Object.keys(queryParams).length) {
            // Create URLSearchParams object
            const urlParams = new URLSearchParams(queryParams);

            // Combine with base URL
            url = `${url}?${urlParams.toString()}`;
        }

        return url;
    },

    call: async function (method, url, postBody, callbacks) {
        let fetchParams = {
            method: method,
            headers: {
                "Content-Type": "application/json",
            },
        };

        if (postBody !== null && typeof postBody === "object" && Object.keys(postBody).length) {
            fetchParams.body = JSON.stringify(postBody);
        }

        try {
            const response = await fetch(url, fetchParams);

            const data = await response.json();
            if (!response.ok) {
                console.error("Error in request:", data, response);
                if (callbacks !== null && typeof callbacks === "object") {
                    if (typeof callbacks?.error === "function") {
                        callbacks.error(data, {status: response.status, statusText: response.statusText});
                    }
                }
            } else {
                if (callbacks !== null && typeof callbacks === "object") {
                    if (typeof callbacks?.success === "function") {
                        callbacks.success(data);
                    }
                }
            }
        } catch (error) {
            console.error("Caught Error in request:", error);
        }
    }
};

export default Api;