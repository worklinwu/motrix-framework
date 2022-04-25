import is from 'electron-is'

export default {
  index: {
    attrs: {
      title: 'Motrix',
      width: 1024,
      height: 768,
      minWidth: 478,
      minHeight: 420,
      // backgroundColor: '#FFFFFF',
      transparent: !is.windows()
    },
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
