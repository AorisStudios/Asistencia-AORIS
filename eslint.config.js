// Configuración de ESLint (flat config, ESLint 9+)
// Uso: npm install  &&  npm run lint
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Funciones expuestas en window e invocadas desde onclick en index.html
        intentarMarcar: 'readonly',
        startExperience: 'readonly',
        selEmp: 'readonly',
        verPin: 'readonly',
        jefeLogoClick: 'readonly',
        verificarPinJefe: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['warn', 'smart']
    }
  }
];
