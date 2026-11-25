import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e', fullyParallel:true, workers:2,
  use:{baseURL:'http://127.0.0.1:4195',headless:true,channel:process.env.CI?undefined:'msedge'},
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4195',reuseExistingServer:false,env:{SERVE_DIST:'1'}}
});
