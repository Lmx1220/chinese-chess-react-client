import { antfu } from '@antfu/eslint-config'

import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default antfu({
  react: true,
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  ignores: [
    'public',
    'dist*',
  ],
}, {
  rules: {
    'no-console': 'off',
    'react/no-array-index-key': 'off',
  },

})
