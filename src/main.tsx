import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';

async function start() {
  let DemoBar: ComponentType | null = null;
  // `npm run demo` only; in normal builds this branch and the demo code are removed entirely.
  if (import.meta.env.VITE_DEMO === 'true') {
    const { startDemo } = await import('./demo/startDemo');
    DemoBar = await startDemo();
  }
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      {DemoBar && <DemoBar />}
    </StrictMode>,
  );
}

void start();
