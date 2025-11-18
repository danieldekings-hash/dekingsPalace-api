import axios from "axios";
import { WalletTx } from "../models/WalletTx.model";
import { TRACKED_WALLETS } from "../constants/wallets";

const { bep20, tron, solana } = TRACKED_WALLETS;

/**
 * Check for new USDT deposits on BEP20 (BSC Network)
 */
export async function checkBep20Deposits() {
  try {
    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey) {
      console.warn("[Wallet Tracking] BSCSCAN_API_KEY not set, skipping BEP20 check");
      return;
    }

    // Try Etherscan API V2 (unified endpoint) first
    // BSC chainid = 56
    let url = `https://api.etherscan.io/v2/api?chainid=56&module=account&action=tokentx&contractaddress=${bep20.contract}&address=${bep20.address}&sort=desc&apikey=${apiKey}`;
    
    let response;
    let data;
    
    try {
      response = await axios.get(url);
      data = response.data;
    } catch (error: any) {
      // If unified endpoint fails, try BSCScan-specific V2 endpoint
      if (error.response?.status === 404) {
        url = `https://api.bscscan.com/v2/api?chainid=56&module=account&action=tokentx&contractaddress=${bep20.contract}&address=${bep20.address}&sort=desc&apikey=${apiKey}`;
        try {
          response = await axios.get(url);
          data = response.data;
        } catch (fallbackError: any) {
          // If both V2 endpoints fail, fall back to V1 (might still work temporarily)
          console.warn("[Wallet Tracking] BEP20: V2 endpoints failed, trying V1 as fallback...");
          url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${bep20.contract}&address=${bep20.address}&sort=desc&apikey=${apiKey}`;
          response = await axios.get(url);
          data = response.data;
        }
      } else {
        throw error;
      }
    }

    // BSCScan API returns status: "1" for success, "0" for error
    if (data.status !== "1") {
      const errorMsg = data.message || data.result || "Unknown error";
      
      // Handle different error cases
      if (errorMsg === "No transactions found") {
        // This is normal, no need to log
        return;
      } else if (errorMsg.includes("Free API access is temporarily unavailable")) {
        // Free tier temporarily unavailable - reduce logging frequency
        const lastErrorTime = (global as any).lastBep20ErrorTime || 0;
        const now = Date.now();
        if (now - lastErrorTime > 300000) { // Log once per 5 minutes
          (global as any).lastBep20ErrorTime = now;
          console.warn(`[Wallet Tracking] BEP20: Free API tier temporarily unavailable due to high network activity.`);
          console.warn(`[Wallet Tracking] BEP20: Consider upgrading to a paid plan or reducing check frequency.`);
          console.warn(`[Wallet Tracking] BEP20: Tracking will continue to retry automatically.`);
        }
        return;
      } else if (errorMsg === "NOTOK" || data.status === "0") {
        // NOTOK usually means: Invalid API key, Rate limit exceeded, or Invalid address
        // Only log once per minute to avoid spam
        const lastErrorTime = (global as any).lastBep20ErrorTime || 0;
        const now = Date.now();
        if (now - lastErrorTime > 60000) { // Log once per minute
          (global as any).lastBep20ErrorTime = now;
          console.warn(`[Wallet Tracking] BEP20: API error - ${errorMsg}`);
        }
        return;
      } else {
        // Other errors - log but not too frequently
        const lastErrorTime = (global as any).lastBep20ErrorTime || 0;
        const now = Date.now();
        if (now - lastErrorTime > 60000) {
          (global as any).lastBep20ErrorTime = now;
          console.warn(`[Wallet Tracking] BEP20: ${errorMsg}`);
        }
        return;
      }
    }

    const txs = data.result;

    // Handle case where result is a string (error message) instead of array
    if (typeof txs === "string") {
      if (txs !== "No transactions found") {
        console.warn(`[Wallet Tracking] BEP20: ${txs}`);
      }
      return;
    }

    if (!Array.isArray(txs)) {
      console.warn("[Wallet Tracking] BEP20: Invalid response format - result is not an array");
      return;
    }

    for (const tx of txs) {
      // Only process incoming transactions
      if (tx.to?.toLowerCase() === bep20.address.toLowerCase()) {
        const exists = await WalletTx.findOne({ hash: tx.hash });
        if (!exists) {
          const amount = parseFloat(tx.value) / 1e18; // USDT has 18 decimals on BEP20
          await WalletTx.create({
            hash: tx.hash,
            network: "bep20",
            amount,
            from: tx.from,
            to: tx.to,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
          });
          console.log(
            `[Wallet Tracking] ✅ New BEP20 USDT deposit detected: ${amount} USDT from ${tx.from} (Hash: ${tx.hash})`
          );
        }
      }
    }
  } catch (error: any) {
    console.error("[Wallet Tracking] BEP20 check failed:", error.message);
  }
}

/**
 * Check for new USDT deposits on TRC20 (TRON Network)
 */
export async function checkTrc20Deposits() {
  try {
    // USDT contract address on TRON (TRC20)
    const USDT_TRC20_CONTRACT = tron.contract;
    
    // Try TronGrid API (official TRON API) - no API key needed for basic queries
    const url = `https://api.trongrid.io/v1/accounts/${tron.address}/transactions/trc20?limit=50&only_confirmed=true&contract_address=${USDT_TRC20_CONTRACT}`;

    let response;
    let data;

    try {
      response = await axios.get(url, {
        timeout: 15000,
        headers: {
          "Accept": "application/json",
        },
      });
      data = response.data?.data || response.data;
    } catch (error: any) {
      // If TronGrid fails, try alternative: direct TRON RPC
      try {
        const rpcUrl = "https://api.trongrid.io";
        const rpcResponse = await axios.post(
          `${rpcUrl}/wallet/triggerconstantcontract`,
          {
            owner_address: tron.address,
            contract_address: USDT_TRC20_CONTRACT,
            function_selector: "balanceOf(address)",
            parameter: "",
          },
          {
            timeout: 15000,
            headers: { "Accept": "application/json" },
          }
        );
        
        // For now, if RPC also fails, just skip silently
        // We'll use a simpler approach - get transactions via TronScan public API
        console.warn("[Wallet Tracking] TRC20: TronGrid failed, trying TronScan...");
        
        // Try TronScan public API (no key needed)
        const tronscanUrl = `https://apilist.tronscanapi.com/api/transfer/trc20?limit=50&start=0&sort=-timestamp&toAddress=${tron.address}`;
        const tronscanResponse = await axios.get(tronscanUrl, {
          timeout: 15000,
          headers: { "Accept": "application/json" },
        });
        data = tronscanResponse.data?.data || tronscanResponse.data;
      } catch (fallbackError: any) {
        // Only log TRC20 errors once per minute to avoid spam
        const lastErrorTime = (global as any).lastTrc20ErrorTime || 0;
        const now = Date.now();
        if (now - lastErrorTime > 60000) { // Log once per minute
          (global as any).lastTrc20ErrorTime = now;
          console.warn(`[Wallet Tracking] TRC20: All API endpoints failed - TRON tracking temporarily unavailable`);
        }
        return;
      }
    }

    if (!Array.isArray(data)) {
      // If no transactions, data might be empty object or different structure
      if (data && typeof data === "object" && Object.keys(data).length === 0) {
        return; // No transactions found, this is normal
      }
      console.warn("[Wallet Tracking] TRC20: Invalid response format - data is not an array");
      return;
    }

    for (const tx of data) {
      // Handle different response formats
      const toAddress = tx.to_address || tx.to || tx.toAddress;
      const fromAddress = tx.from_address || tx.from || tx.fromAddress;
      const txHash = tx.transaction_id || tx.transaction || tx.hash || tx.txID;
      const amount = tx.amount || tx.value || tx.token_value;
      const timestamp = tx.block_timestamp || tx.block_timestamp_ms || tx.timestamp;

      // Only process incoming transactions
      if (toAddress && toAddress.toLowerCase() === tron.address.toLowerCase()) {
        const exists = await WalletTx.findOne({ hash: txHash });
        if (!exists && amount) {
          const usdtAmount = parseFloat(amount) / 1e6; // USDT has 6 decimals on TRC20
          await WalletTx.create({
            hash: txHash,
            network: "tron",
            amount: usdtAmount,
            from: fromAddress || "unknown",
            to: toAddress,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
          });
          console.log(
            `[Wallet Tracking] ✅ New TRC20 USDT deposit detected: ${usdtAmount} USDT from ${fromAddress} (Hash: ${txHash})`
          );
        }
      }
    }
  } catch (error: any) {
    console.error("[Wallet Tracking] TRC20 check failed:", error.message);
  }
}

/**
 * Check for new USDT deposits on Solana (SPL Token)
 * Uses Solana public RPC endpoint (no API key required)
 */
export async function checkSolanaDeposits() {
  try {
    // Using Solana public RPC endpoint (no API key required)
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    
    // Get recent signatures for the address
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [
        solana.address,
        { limit: 50 }
      ],
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    const signatures = response.data?.result || [];
    
    for (const sigInfo of signatures) {
      const exists = await WalletTx.findOne({ hash: sigInfo.signature });
      if (!exists) {
        // Get transaction details
        try {
          const txResponse = await axios.post(rpcUrl, {
            jsonrpc: "2.0",
            id: 1,
            method: "getTransaction",
            params: [sigInfo.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
          }, {
            headers: { "Content-Type": "application/json" },
            timeout: 10000,
          });

          const tx = txResponse.data?.result?.transaction;
          if (tx?.message?.instructions) {
            // Parse instructions to find USDT token transfers
            for (const instruction of tx.message.instructions) {
              if (instruction.parsed?.type === "transfer" || instruction.parsed?.type === "transferChecked") {
                const info = instruction.parsed?.info;
                if (
                  info?.destination === solana.address &&
                  info?.mint === solana.mint
                ) {
                  const amount = parseFloat(info.tokenAmount?.uiAmount || info.amount || 0) / 1e6;
                  if (amount > 0) {
                    await WalletTx.create({
                      hash: sigInfo.signature,
                      network: "solana",
                      amount,
                      from: info.authority || info.source || "unknown",
                      to: solana.address,
                      timestamp: new Date(sigInfo.blockTime * 1000),
                    });
                    console.log(
                      `[Wallet Tracking] ✅ New Solana USDT deposit detected: ${amount} USDT (Hash: ${sigInfo.signature})`
                    );
                  }
                }
              }
            }
          }
        } catch (txError) {
          // Skip this transaction if we can't parse it
          continue;
        }
      }
    }
  } catch (error: any) {
    console.error("[Wallet Tracking] Solana RPC check failed:", error.message);
  }
}

/**
 * Run all wallet tracking checks
 */
export async function checkAllWalletDeposits() {
  await Promise.all([
    // BSC/BEP20 tracking is currently disabled due to unreliable free API access.
    // To re-enable in future, add checkBep20Deposits() back into this list.
    // checkBep20Deposits(),
    checkTrc20Deposits(),
    checkSolanaDeposits(),
  ]);
}

