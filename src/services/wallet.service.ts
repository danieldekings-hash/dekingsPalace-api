import { Wallet, IWallet } from "../models/Wallet.model";
import { Transaction } from "../models/Transaction.model";
import { v4 as uuid } from "uuid";
import mongoose from "mongoose";

export async function getWallet(userId: string) {
  let wallet = await Wallet.findOne({ userId }).lean();
  if (!wallet) {
    const newWallet = await Wallet.create({
      userId,
      balances: { BTC: 0, ETH: 0, USDT: 0 },
      totalDeposited: { BTC: 0, ETH: 0, USDT: 0 },
      totalWithdrawn: { BTC: 0, ETH: 0, USDT: 0 },
    });
    wallet = newWallet.toObject() as any;
  }
  return wallet;
}

export async function getOrGenerateAddresses(userId: string) {
  let wallet = await Wallet.findOne({ userId });
  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balances: { BTC: 0, ETH: 0, USDT: 0 },
      totalDeposited: { BTC: 0, ETH: 0, USDT: 0 },
      totalWithdrawn: { BTC: 0, ETH: 0, USDT: 0 },
    });
  }
  if (!wallet.addresses.BTC) wallet.addresses.BTC = `btc_${uuid()}`;
  if (!wallet.addresses.ETH) wallet.addresses.ETH = `eth_${uuid()}`;
  if (!wallet.addresses.USDT) wallet.addresses.USDT = `usdt_${uuid()}`;
  await wallet.save();
  return wallet.addresses;
}

export async function createDeposit(userId: string, amount: number, currency: string, transactionHash?: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) {
      const newWallets = await Wallet.create(
        [
          {
            userId,
            balances: { BTC: 0, ETH: 0, USDT: 0 },
            totalDeposited: { BTC: 0, ETH: 0, USDT: 0 },
            totalWithdrawn: { BTC: 0, ETH: 0, USDT: 0 },
          },
        ],
        { session }
      );
      wallet = newWallets[0] as any;
    }
    if (!wallet) {
      throw new Error("Failed to create or find wallet");
    }
    const ref = `dep_${uuid()}`;
    const tx = await Transaction.create(
      [
        {
          userId,
          type: "deposit",
          amount,
          currency: currency.toUpperCase(),
          reference: ref,
          status: transactionHash ? "pending" : "confirmed",
          txHash: transactionHash,
        },
      ],
      { session }
    );
    const curr = currency.toUpperCase() as "BTC" | "ETH" | "USDT";
    wallet.balances[curr] += amount;
    wallet.totalDeposited[curr] += amount;
    await wallet.save({ session });
    await session.commitTransaction();
    return { reference: ref, transactionId: String(tx[0]._id) };
  } catch (err: any) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function createWithdrawal(userId: string, amount: number, currency: string, walletAddress: string) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const wallet = await Wallet.findOne({ userId }).session(session);
    if (!wallet) throw new Error("Wallet not found");
    const curr = currency.toUpperCase() as "BTC" | "ETH" | "USDT";
    if (wallet.balances[curr] < amount) {
      await session.abortTransaction();
      const err: any = new Error("Insufficient balance");
      err.code = "INSUFFICIENT_BALANCE";
      throw err;
    }
    const ref = `with_${uuid()}`;
    const tx = await Transaction.create(
      [
        {
          userId,
          type: "withdrawal",
          amount,
          currency: curr,
          address: walletAddress,
          reference: ref,
          status: "pending",
        },
      ],
      { session }
    );
    wallet.balances[curr] -= amount;
    wallet.totalWithdrawn[curr] += amount;
    await wallet.save({ session });
    await session.commitTransaction();
    return { reference: ref, transactionId: String(tx[0]._id) };
  } catch (err: any) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
