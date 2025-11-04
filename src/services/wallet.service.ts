import { Wallet, IWallet } from "../models/Wallet.model";
import { Transaction } from "../models/Transaction.model";
import { v4 as uuid } from "uuid";

export async function getOrCreateWallet(userId: string): Promise<IWallet> {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({ userId });
  }
  return wallet;
}

export async function getWallet(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  return wallet.toObject();
}

export async function getOrGenerateAddresses(userId: string) {
  const wallet = await getOrCreateWallet(userId);
  const addresses = { ...wallet.addresses } as { BTC?: string; ETH?: string; USDT?: string };
  if (!addresses.BTC) addresses.BTC = `btc_${uuid().slice(0, 12)}`;
  if (!addresses.ETH) addresses.ETH = `eth_${uuid().slice(0, 12)}`;
  if (!addresses.USDT) addresses.USDT = `usdt_${uuid().slice(0, 12)}`;
  wallet.addresses = addresses;
  await wallet.save();
  return addresses;
}

export async function createDeposit(userId: string, amount: number, currency: string, transactionHash?: string) {
  const wallet = await getOrCreateWallet(userId);
  const address = wallet.addresses[currency as "BTC" | "ETH" | "USDT"];
  if (!address) {
    const addrs = await getOrGenerateAddresses(userId);
    return createDeposit(userId, amount, currency, transactionHash);
  }

  const reference = `dep_${uuid()}`;
  const tx = await Transaction.create({
    userId,
    type: "deposit",
    amount,
    currency,
    address,
    reference,
    status: transactionHash ? "pending" : "waiting_payment",
    txHash: transactionHash,
  });
  return { reference, address, transactionId: String(tx._id) };
}

export async function createWithdrawal(userId: string, amount: number, currency: string, walletAddress: string) {
  const wallet = await getOrCreateWallet(userId);
  const currentBalance = wallet.balances[currency as "BTC" | "ETH" | "USDT"] || 0;
  if (amount > currentBalance) {
    throw { status: 400, code: "INSUFFICIENT_BALANCE", message: "Insufficient balance" };
  }
  // Deduct immediately (a real system may hold or use double-entry)
  wallet.balances[currency as "BTC" | "ETH" | "USDT"] = currentBalance - amount;
  wallet.totalWithdrawn[currency as "BTC" | "ETH" | "USDT"] += amount;
  await wallet.save();

  const reference = `wd_${uuid()}`;
  const tx = await Transaction.create({
    userId,
    type: "withdrawal",
    amount,
    currency,
    address: walletAddress,
    reference,
    status: "pending",
  });
  return { reference, transactionId: String(tx._id) };
}


