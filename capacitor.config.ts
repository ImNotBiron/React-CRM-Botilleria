import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cl.ImNotBiron.crm.botilleria',
  appName: 'CRM Botilleria',
  webDir: 'dist',
  server: {
    url: "https://botilleriaelparaiso.cl",  
    cleartext: true,
    androidScheme: "https",                
  }
};

export default config;
