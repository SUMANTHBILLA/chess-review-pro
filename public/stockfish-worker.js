/**
 * Worker that loads Stockfish 18 lite single (no threading needed).
 * This file runs inside a Web Worker context.
 */
importScripts('/stockfish-18-lite-single.js');

// Stockfish() is now globally available from the imported script
// It returns a promise that resolves to the engine instance.
let engine: any = null;

Stockfish().then((sf: any) => {
  engine = sf;
  engine.addMessageListener((line: string) => {
    self.postMessage(line);
  });
  engine.postMessage('uci');
});

self.onmessage = (e: MessageEvent) => {
  if (engine) {
    engine.postMessage(e.data);
  }
};
