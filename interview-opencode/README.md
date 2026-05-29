# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## API base URL

The frontend reads the API base URL in this order:

1. `apiBase` query parameter (stored in localStorage)
2. Stored `apiBase` from localStorage
3. `VITE_API_BASE_URL` at build time
4. Local fallback: `http://<frontend-hostname>:8080/api`

To test the hosted frontend with a local backend, expose your local backend port (8080) using a tunnel (for example, ngrok), then open the frontend with:

```
https://settribe-task.onrender.com/?apiBase=https://<public-tunnel-host>/api
```

The value is saved in localStorage under `settribe_api_base_url`, so you only need to set it once per device.
