export default {
  plugins: {
    'postcss-preset-env': {},
    'postcss-px-to-viewport-8-plugin': {
      // 视窗的宽度，对应的是我们设计稿的宽度，一般是375
      viewportWidth: 375,
      viewportHeight: 667,
      // 指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
      unitPrecision: 2,
      // 指定需要转换成的视窗单位，建议使用vw
      viewportUnit: 'vw',
      // 指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
      // selectorBlackList: ['.ignore', '.hairlines'],
      // 小于或等于`1px`不转换为视窗单位
      minPixelValue: 1,
      // 允许在媒体查询中转换`px`
      mediaQuery: false,
      // 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
      exclude: [/node_modules/, /loading.html/, /index.html/],
    },
  },
}
