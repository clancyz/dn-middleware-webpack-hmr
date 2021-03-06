
## dn-middleware-webpack-hmr

Webpack HMR middleware for [dawn](https://alibaba.github.io/dawn/) template. (Compatible with wepback 3.x)

> Warning: support React only.

### Features

- Enable hot module reload (HMR)
- `Create-react-app` development experience (use `react-dev-utils`)


### Getting Started

1. update your .dawn/pipe.yml:

```yaml
dev:
  - name: webpack-hmr

```


2. Mark your root component as hot-exported: (detail see [react-hot-loader](https://github.com/gaearon/react-hot-loader))

```js
// App.js
import React from 'react'
import { hot } from 'react-hot-loader'

const App = () => <div>Hello World!</div>

export default hot(module)(App)
```

3. update dependencies 

```shell
$ dn update
$ dn dev
```

### Options

Example

```yaml
dev:
  - name: webpack-hmr
    port: 7777 // set dev-server listening port (default a random port)
    eslint: false // disable eslint check, default `true`
    inject:  // inject to webpack entries
      - babel-polyfill  
    template: ./assets/*.html  // html-webpack-plugin template 
    sourceMap: true // enable sourceMap, default `true`
    common:  // common dependencies chunk building
      disabled: true 
    
```




