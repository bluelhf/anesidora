> **Note**  
> I am not a front-end developer. This repository is a mess. I am sorry.

# Anesidora

Anesidora is an end-to-end encrypted file sharing service. This repository contains the front-end for the service,
written in JavaScript with Preact. The back-end is written in Rust and can be found in a [separate repository](https://github.com/bluelhf/Pithos).

## Note of compatibility

Several features used by Anesidora are not supported by all browsers:
- **Streaming File Uploads**
    - Defined in [WHATWG Fetch Standard](https://fetch.spec.whatwg.org/#dom-requestinit-duplex:~:text=any%20Window.-,duplex,-%22half%22%20is)
    - Support as of 2023-04-15:
        - Chromium: Introduced in 105
        - Mozilla: [Unclear Standard Position](https://github.com/mozilla/standards-positions/issues/663), not implemented
        - WebKit: [Positive Standard Position](https://github.com/WebKit/standards-positions/issues/24), not implemented
- **Native File System Access**
    - Defined in [WICG File System Access API](https://github.com/wicg/file-system-access)
    - Support as of 2023-04-15:
        - Chromium: Introduced in 86
        - Mozilla: [Harmful Standard Position](https://mozilla.github.io/standards-positions/#native-file-system), won't implement
        - WebKit: [Opposing Standard Position](https://github.com/WebKit/standards-positions/issues/28), won't implement

So, **only Chromium 105+ is supported. Firefox and Safari are not supported.**

## Serving

Anesidora does not require Node.JS or, in fact, any build step. Simply serve the root directory of the repository
using a web server. For local development, Python's `http.server` is sufficient:
```sh
python3 -m http.server 6969
```
