import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.ImNotBiron.crm.botilleria',
  appName: 'CRM Botilleria',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: "http",
  }
};

export default config;
