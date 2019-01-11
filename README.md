
# dn-middleware-webpack-hmr

[dawn](https://alibaba.github.io/dawn/) 的webpack中间件。

内建支持：

- `Webpack 3.x`
- `React`开发环境

## 特性

- `Create-react-app` 式的开发体验 (使用 `react-dev-utils` )
- 简单配置`pipe.yml`即可上手开发
- 支持React开发环境下热更新(Hot Module Reload)
- 支持远程热更新（配合`charles`用于调试日常或预发环境）
- 支持`Postcss`，其配置可以内建开启或用户自定义
- 支持`antd`和`antd-mobile`的按需加载及主题配置
- 开发期间`eslint`实时报错支持
- react语法错误提示
- 支持代理（使用server.yml）

## 开始使用

1. 更新 your .dawn/pipe.yml:

```yaml
dev:
  - name: webpack-hmr
    <...options>  # 写配置
```

2. 标识入口组件为可热更新: (详见 [react-hot-loader](https://github.com/gaearon/react-hot-loader))

```js
// App.js
import React from 'react'
import { hot } from 'react-hot-loader'

const App = () => <div>Hello World!</div>

export default hot(module)(App)
```

3. 更新依赖

```shell
$ dn update
$ dn dev
```

4. 需要远程热更新

适合用`charles`或其他第三方代理mock静态资源请求，并保持热更新功能

举例：本地启动服务为`http://localhost:8080` ，日常环境为`http://daily.taobao.net`

将`http://daily.taobao.net/js/index.js` 代理到 `http://localhost:8080/index.js`，用于在日常环境下做实时调试。

```shell
$ dn dev -e maplocal
```

## 自定义配置

除了在`pipe.yml`下可自定义配置外，可通过根目录`webpack.config.js`来进行深度定制

举例：

```js
// webpack.config.js
module.exports = function(webpackConf){
  let cmd = process.env.DN_CMD;
  webpackConf.resolve = {
    alias:{
      'components':path.resolve(__dirname,'src/components'),      
    }
  };
};
```

## Mock

在`server.yml`中配置。参考[webpack-dev-server](https://webpack.js.org/configuration/dev-server/#devserver-proxy)的配置。

示例：

```yaml
proxy:
    rules: 
      ^/api(.*): 'https://www.aliyun.com/'
```


## Options

### env 

- 环境变量，配置后会使用`webpack.definePlugin`设置`process.env.NODE_ENV`.
- `dn dev`时默认为`development`, `dn build`时默认为`production` 
- 如果自建了一个pipe，需要显式声明`env`。

### entry

- webpack entry。支持glob匹配

示例：

```yaml
 entry: ./src/*.js # 将 src 下所有 .js 文件作为入口（不包括子目录中的 js）
```

### output

- webpack output, 默认为根目录 `./build`。


### template

- 模板，支持glob匹配

```yaml
template: ./src/assets/*.html   # 将 assest 下的所有 html 作为页面模板 
```

### port

- 开发端口号，仅当开发时可用。
- 默认值为`8001`

### appSrc

- 项目代码所在目录，默认为根目录`src`。
- 传参需要`string`和`Array`格式。

### sourceMap

- 是否开启sourceMap。 env为development时默认开启；为production时默认关闭。

### compress

- 是否开启压缩。env为development时默认开启；为production时默认关闭。

### babel

- babel自定义配置，**需要在用户目录下手动安装**。
- 大部分babel配置已经内建。

举例：

`pipe.yml`:

```yaml
babel: $require ./babel.json  # 同目录下
```

`babel.json`:

```json
{
  "plugins": [
    ["import", { "libraryName": "antd-mobile", "style": "css" }]
  ]
}
```

### inject

- 自定义插入entry的内容

```yaml
inject:
  - babel-polyfill
```

### cssModules

- 是否开启`cssModules`, 默认为`false`

### stats

- 是否对编译后资源做分析（使用[webpack-visualizer-plugin](https://github.com/chrisbateman/webpack-visualizer#readme)）, 默认为`false`

### folders 

- 自定义build后资源存在的目录。

```yaml
folders:                       
  js: js
  css: css
  font: font
  img: img
```

### common

- 自定义抽取公共资源部分，默认开启。

```yaml
common:
  disabled: true      # 禁用
  name: common        # 公共chunk名称
```

### externals

- 声明排除的库文件。默认会排除`jquery`, `zepto`, `react`, `react-dom`

```yaml
externals:
  jquery: jQuery
```

### theme

- 主题配置，可适用于`antd`或`antd-mobile`。
- 因为主题配置可能较多，推荐新建一个yaml文件单独保存。

举例：

`pipe.yml`:

```yaml
    theme: $require ./theme.yml  # 同目录下
```

`theme.yml`:

```yaml
---
brand-primary: '#0070cc'
brand-success: '#35b42b'
```

### isMobile

- 是否开启移动端配置，默认false.
- 开启后会加入`postcss-px-to-viewport`， `postcss-aspect-ratio-mini`和`postcss-write-svg`支持
- 开启后会加入`browserslist`支持 （'iOS >= 8', 'Android >= 4'）。

### pxToViewportOptions

- 开启`isMobile`后可以进一步配置。
- 参考[postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport)的配置。

### cssnano

- 参考[cssnano](https://github.com/cssnano/cssnano)的配置。


### lessLoaderOptions

- 参考[less-loader](https://github.com/webpack-contrib/less-loader)的配置。

### browserslist

- 自定义浏览器支持范围，格式为数组。
- 定义后会用于`babel-preset-env`和`postcss`的`autoprefixer`。

### extraPostCSSPlugins

- 自定义postcss plugin，格式为数组。**需要在用户目录下手动安装**。

### yamlqlOptions

- 自定义yamlql配置，请见[yamlql-loader](https://www.npmjs.com/package/yamlql-loader)

举例：

```yaml
    yamlqlOptions: 
      url: '/graphql'
```




