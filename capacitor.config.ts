import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.fitpulse.app',
  appName: 'FitPulse',
  webDir: 'public',
  server: {
    url: 'https://fit-pulse-sandy.vercel.app',
    cleartext: false,
  },
}

export default config
