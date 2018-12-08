
[![](https://img.shields.io/npm/v/kaia-services.js.svg)](https://www.npmjs.com/package/kaia-services.js)
[![](https://img.shields.io/npm/dw/kaia-services.js.svg)](https://www.npmjs.com/package/kaia-services.js)
[![](https://img.shields.io/npm/l/kaia-services.js.svg)](https://www.npmjs.com/package/kaia-services.js)

# Kaia-services.js
Services provided by Kaia.ai platform.

We have not yet launched the platform. For launch announcement please follow us on [Facebook](https://www.facebook.com/kaiaai/).

## Live Demos
- Browse [sample apps](https://github.com/kaiaai/sample-apps) for live demos, source code

## Installation
Kaia.ai robot apps run on Android smartphones. To run sample apps:
1. Go to [kaia.ai](https://kaia.ai/), familiarize yourself with how the robot platform works
2. Optional, but highly recommended: if you don't have Kaia.ai account, create an account
3. Go to Google Play, search for "kaia.ai" to find and install Kaia.ai Android app
4. Launch Kaia.ai Android app on your Android smartphone
5. In Kaia.ai Android app: (optional, but highly recommended): sign in, navigate to Kaia.ai App Store
6. Choose a robot app to launch
7. Optionally: click the heart icon to pin the robot app to your launch screen

## API Overview

### Messaging

- Remote Console sample app, [Live Demo](https://kaia.ai/view-app/5aa78c8f1f0267133aedce1c), [Source](https://github.com/kaiaai/sample-apps/tree/master/remote-console)
- Remote Debug sample app, [Live Demo](https://kaia.ai/view-app/5bfcedb875527d379800bb86), [Source](https://github.com/kaiaai/sample-apps/tree/master/remote-debug)

```js
let messaging = await createMessaging({ io: io(), eventListener: onMessageEvent, rooms: 'myRoom' });
// Send string or objects
messaging.send('Hello');
messaging.send({ firstName: 'Mary', lastName: 'Jane'});
...
  function onMessageEvent(err, msg) {
    if (err) {
      print ('Error ' + err);
      return;
    }
    
    switch (msg.event) {
      case 'message':
        print(msg.client + ' in room ' + msg.room + ' says ' + msg.message);
        break;
      case 'joined':
        print('  ' + msg.room + ' clients now are ' + msg.clients);
        print(msg.client + ' joined room ' + msg.room);
        break;
      case 'left':
        print('  ' + msg.room + ' clients now are ' + msg.clients);
        print(msg.client + ' left room ' + msg.room);
        break;
      case 'reconnect':
        print('Reconnected');
        break;
      case 'disconnect':
        print('Disconnected');
        break;
    }
  }
```

## Installing

### Via npm + webpack/rollup

```sh
npm install kaia-messaging.js
```

Now you can require/import `kaia-messaging.js`:

```js
import { createMessaging } from 'kaia-messaging.js';
```

### Via `<script>`

* `dist/kaia-services.mjs` is a valid JS module.
* `dist/kaia-services-iife.js` can be used in browsers that don't support modules. `kaiaServicesJs` is created as a global.
* `dist/kaia-services-iife.min.js` As above, but minified.
* `dist/kaia-services-iife-compat.min.js` As above, but works in older browsers such as IE 10.
* `dist/kaia-services-amd.js` is an AMD module.
* `dist/kaia-services-amd.min.js` is a minified AMD module.

These built versions are also available on jsDelivr, e.g.:

```html
<script src="https://cdn.jsdelivr.net/npm/kaia.js/dist/kaia-services-iife.min.js"></script>
<!-- Or in modern browsers: -->
<script type="module">
  import { createMessaging } from 'https://cdn.jsdelivr.net/npm/kaia-services.js';
</script>
```
and unpkg
```html
<script src="https://unpkg.com/kaia.js/dist/kaia-services-iife.min.js"></script>
<!-- Or in modern browsers: -->
<script type="module">
  import { createMessaging } from 'https://unpkg.com/kaia-services.js';
</script>
```
