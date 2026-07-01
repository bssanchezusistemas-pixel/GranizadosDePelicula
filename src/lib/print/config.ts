const DEFAULT_BRIDGE_URL = "http://127.0.0.1:9101";

export function getPrintBridgeUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL?.trim() || DEFAULT_BRIDGE_URL
  );
}

export function isPrintBridgeConfigured(): boolean {
  return Boolean(getPrintBridgeUrl());
}
