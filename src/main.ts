import App from 'client/App.svelte';

const rootElement = document.getElementById('app') as HTMLDivElement;

if (!rootElement) {
  throw new Error(
    'Root container was not found. Failed to mount Svelte app. Please make sure the container exists and is in the DOM.',
  );
}

const app = new App({ target: rootElement });

export default app;
