import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { injectCSSVariables } from './config/colors'

// 注入 CSS 变量（唯一颜色源：src/config/colors.ts）
injectCSSVariables()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
