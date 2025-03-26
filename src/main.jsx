import { log } from '@/utils/log-utils.js'
// import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { loadingFadeOut } from 'virtual:app-loading'
import App from './App.jsx'
import 'antd-mobile-v2/dist/antd-mobile.css'
import './index.less'

loadingFadeOut()

log('欢迎使用中国象棋')

// ReactDOM.render(<App />, document.getElementById('root'))
createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <App />,
//   // </StrictMode>,
)
//   // <StrictMode>
//     <App />
//   // </StrictMode>,
// )
