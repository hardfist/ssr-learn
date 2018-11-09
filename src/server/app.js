import process from 'process';
import { startServer } from './server';
process.addListener('uncaughtException', err => {
  console.error('uncaughtException:', err);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  console.error('unhandleRejection:', err);
});
startServer();
