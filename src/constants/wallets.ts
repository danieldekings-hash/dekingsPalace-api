type TrackedWalletMeta = {
  network: "bep20" | "tron" | "solana";
  label: string;
  address: string;
  contract?: string;
  mint?: string;
};

export const TRACKED_WALLETS: Record<"bep20" | "tron" | "solana", TrackedWalletMeta> = {
  bep20: {
    network: "bep20",
    label: "BSC USDT (BEP20)",
    address: "0x5abee42c0ac408c15e70e5510e031c96b6d76a87",
    contract: "0x55d398326f99059ff775485246999027b3197955",
  },
  tron: {
    network: "tron",
    label: "TRON USDT (TRC20)",
    address: "TMG5F5YTYShrMCZnZkDpGY2LhJwdHVwMMK",
    contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  },
  solana: {
    network: "solana",
    label: "Solana USDT (SPL)",
    address: "7tn5v3dpUNKQepgoeuaWuexQSzhwkzaTEjiMzJnXUFay",
    mint: "Es9vMFrzaCER9dEj7tn5MDuBiwGvNAd8kH1EMwMGL67y",
  },
};

export type TrackedWalletKey = keyof typeof TRACKED_WALLETS;


