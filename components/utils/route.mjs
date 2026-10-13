export const Route = {
    Upload: "upload",
    Download: "download",
    Invalid: "invalid",
};

export function parseHash(hash) {
    const fragment = hash.startsWith("#") ? hash.substring(1) : hash;
    if (fragment.length === 0) return { name: Route.Upload };

    const [ uuid, secret, ...rest ] = fragment.split(";");
    if (!uuid || !secret || rest.length > 0) return { name: Route.Invalid };

    return { name: Route.Download, uuid, secret };
}

export function buildShareLink(href, uuid, secret) {
    const url = new URL(href);
    url.hash = uuid + ";" + secret;
    return url.toString();
}

export function navigateToUpload() {
    history.pushState(null, "", location.pathname + location.search);
    // send event manually for the useHash hook
    window.dispatchEvent(new HashChangeEvent("hashchange"));
}
