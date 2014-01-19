Corkboard
=========

Installation
---
```bash
npm install
```

Dependencies are specified in `package.json`

Corkboard Frontend
---
The corkboard front end is based on [CSS3 cork board with sticky notes](https://geeksretreat.wordpress.com/2013/09/04/css3-cork-board-with-sticky-notes/).

fonts: `/static/fonts`

uploads by users: `/static/uploads`

style: `/static/css/corkboard.css`

image: `/static/img/`

js: `/static/js/`

Corkboard Backend
---
### Deploy
```bash
node signaler.js
```

### baseurl.js
Fetch base url and store into `base_url`


Reference
---
 * [Simple Chat - Node.js + WebSockets](http://tech.pro/tutorial/1097/simple-chat-nodejs-plus-websockets)
 * [node-mysql](https://github.com/felixge/node-mysql)
 * [QRCode.js](http://davidshimjs.github.io/qrcodejs/)