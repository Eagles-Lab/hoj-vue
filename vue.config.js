const UglifyJsPlugin = require('uglifyjs-webpack-plugin') // 清除注释
const CompressionWebpackPlugin = require('compression-webpack-plugin'); // 开启压缩

const isProduction = process.env.NODE_ENV === 'production';
const isCi = String(process.env.CI || '').toLowerCase() === 'true'
const enableAnalyze = String(process.env.ANALYZE || '').toLowerCase() === 'true'
const useCdnCss = process.env.USE_CDN_CSS ? String(process.env.USE_CDN_CSS).toLowerCase() === 'true' : true;
const useCdnJs = process.env.USE_CDN_JS ? String(process.env.USE_CDN_JS).toLowerCase() === 'true' : true;

// cdn链接
const cdnCssLinks = [
  "https://cdn.jsdelivr.net/npm/github-markdown-css@4.0.0/github-markdown.min.css",
  "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.css",
  "https://cdn.jsdelivr.net/npm/muse-ui@3.0.2/dist/muse-ui.min.css",
  "https://cdn.jsdelivr.net/npm/element-ui@2.15.14/lib/theme-chalk/index.css",
]
const cdnJsLinks = [
  "https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js",
  "https://cdn.jsdelivr.net/npm/vue-router@3.2.0/dist/vue-router.min.js",
  "https://unpkg.com/axios@1.6.7/dist/axios.min.js",
  "https://cdn.jsdelivr.net/npm/element-ui@2.15.14/lib/index.min.js",
  "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.2/build/highlight.min.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.1/min/moment.min.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.1/locale/zh-cn.js",
  "https://cdn.jsdelivr.net/npm/moment@2.29.1/locale/en-gb.js",
  "https://cdn.jsdelivr.net/npm/echarts@4.9.0/dist/echarts.js",
  "https://cdn.jsdelivr.net/npm/vue-echarts@5.0.0-beta.0/dist/vue-echarts.js",
  "https://cdn.jsdelivr.net/npm/vuex@3.5.1/dist/vuex.min.js",
  "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/katex.min.js",
  "https://cdn.jsdelivr.net/npm/katex@0.12.0/dist/contrib/auto-render.min.js",
  "https://cdn.jsdelivr.net/npm/muse-ui@3.0.2/dist/muse-ui.min.js",
  "https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js",
]
const cdnExternals = {
  vue: 'Vue',
  'vue-router':'VueRouter',
  axios:'axios',
  vuex:'Vuex',
  'element-ui':'ELEMENT',
  'highlight.js': 'hljs',
  "moment": "moment",
  "echarts":"echarts",
  'vue-echarts': 'VueECharts',
  katex:'katex',
  'muse-ui':'MuseUI',
  jquery:'$',
}

module.exports={
  publicPath: process.env.PUBLIC_PATH || '/',
  assetsDir: "assets",
  devServer: {
    open: false,  // npm run serve后自动打开页面
    host: '0.0.0.0',  // 匹配本机IP地址(默认是0.0.0.0)
    port: 8066, // 开发服务器运行端口号
    proxy: {
      '/api': {                                //   以'/api'开头的请求会被代理进行转发
        target: 'http://localhost:6688',       //   要发向的后台服务器地址  如果后台服务跑在后台开发人员的机器上，就写成 `http://ip:port` 如 `http:192.168.12.213:8081`   ip为后台服务器的ip
        changeOrigin: true 
      }
    },
    disableHostCheck: true,
  },
  //去除生产环境的productionSourceMap
  productionSourceMap: false,

  /**
   * 构建时的链式 Webpack 配置
   * 仅在设置 ANALYZE=true 时启用 bundle 分析，避免在 CI 环境卡住
   */
  chainWebpack: config => {
    // 注入cdn start
    config.plugin('html').tap(args => {
        args[0].cdn = {
          css: useCdnCss ? cdnCssLinks : [],
          js: useCdnJs ? cdnJsLinks : []
        }
        return args
    })
    if (enableAnalyze && !isCi) {
      config.plugin('webpack-bundle-analyzer')
        .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [{
          analyzerMode: 'static',
          openAnalyzer: false
        }])
    }
    // 注入cdn end
  },
  /**
   * 常规模块化 Webpack 配置修改
   * 根据环境设置 externals 与压缩、gzip 等优化
   */
  configureWebpack: (config) => {
    const plugins = [];
    if (isProduction || useCdnJs) {
      config.externals = cdnExternals
    }
    if (isProduction){
      config["performance"] = {//打包文件大小配置
        "maxEntrypointSize": 10000000,
        "maxAssetSize": 30000000
      }
      config.plugins.push(
        new UglifyJsPlugin({
          uglifyOptions: {
            output: {
              comments: false, // 去掉注释
            },
            warnings: false,
            compress: {
              drop_console: false,
              drop_debugger: false,
              // pure_funcs: ['console.log']//移除console
            }
          }
        })
      )
       // 服务器也要相应开启gzip
       config.plugins.push(
        new CompressionWebpackPlugin({
            filename: '[path].gz[query]',
            algorithm: 'gzip',
            test: /\.(js|css)$/,// 匹配文件名
            threshold: 10000, // 对超过10k的数据压缩
            deleteOriginalAssets: false, // 不删除源文件
            minRatio: 0.8 // 压缩比
        })
      )
    }
  }

}
