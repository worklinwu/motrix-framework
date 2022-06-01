import is from 'electron-is'

export const PLATFORM_BLUR_TYPE_MAP = {
  darwin: 'vibrancy',
  win32: 'blurbehind',
  default: 'blurbehind'
}

export default {
  index: {
    attrs: {
      title: 'Motrix',
      width: 1024,
      height: 768,
      minWidth: 478,
      minHeight: 420,
      // 实现毛玻璃需要设置的参数
      backgroundColor: '#00000000',
      transparent: true,
      frame: false,
      blur: true,
      blurType: PLATFORM_BLUR_TYPE_MAP[process.platform] || PLATFORM_BLUR_TYPE_MAP.default
    },
    glasstron: false,
    bindCloseToHide: true,
    url: is.dev() ? 'http://localhost:9080' : require('path').join('file://', __dirname, '/index.html')
  },
  about: {
    attrs: {
      title: 'About',
      width: 1024,
      height: 768,
      minWidth: 478,
      minHeight: 420,
      transparent: !is.windows()
    },
    bindCloseToHide: true,
    url: is.dev() ? 'http://localhost:9080/about.html' : require('path').join('file://', __dirname, '/about.html')
  }
}
