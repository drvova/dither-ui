export declare const SITE_STORAGE: {
  theme: string
  sounds: string
  styling: string
  agentConfig: string
}

export declare const agentConfig: (
  bridgeUrl: string,
  harness: string,
) => { bridgeUrl: string; harness: string; command: string; auto: boolean; follow: boolean }
