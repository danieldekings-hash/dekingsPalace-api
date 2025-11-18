import dotenv from "dotenv";
import mongoose from "mongoose";
import axios from "axios";
import connectDB from "../config/db";
import { checkAllWalletDeposits } from "../services/wallet-tracking.service";

dotenv.config();

async function main() {
  await connectDB();

  const originalGet = axios.get.bind(axios);
  const originalPost = axios.post.bind(axios);

  const mockNow = Date.now();

  (axios.get as any) = async (url: string, config?: any) => {
    if (url.includes("etherscan") || url.includes("bscscan")) {
      return {
        data: {
          status: "1",
          result: [
            {
              hash: `0xmockbep20${mockNow}`,
              from: "0xMockSenderBEP20",
              to: "0x5abee42c0ac408c15e70e5510e031c96b6d76a87",
              value: (125 * 1e18).toString(),
              timeStamp: Math.floor(mockNow / 1000).toString(),
            },
          ],
        },
      };
    }
    if (url.includes("trongrid") || url.includes("tronscan")) {
      return {
        data: {
          data: [
            {
              transaction_id: `mock-tron-${mockNow}`,
              from_address: "TMmockSenderAddress",
              to_address: "TMG5F5YTYShrMCZnZkDpGY2LhJwdHVwMMK",
              amount: (80 * 1e6).toString(),
              block_timestamp: mockNow,
            },
          ],
        },
      };
    }
    return originalGet(url, config);
  };

  (axios.post as any) = async (url: string, data?: any, config?: any) => {
    if (url.includes("solana")) {
      if (data?.method === "getSignaturesForAddress") {
        return {
          data: {
            result: [
              {
                signature: `mock-sol-${mockNow}`,
                blockTime: Math.floor(mockNow / 1000),
              },
            ],
          },
        };
      }
      if (data?.method === "getTransaction") {
        return {
          data: {
            result: {
              transaction: {
                message: {
                  instructions: [
                    {
                      parsed: {
                        type: "transferChecked",
                        info: {
                          destination: "7tn5v3dpUNKQepgoeuaWuexQSzhwkzaTEjiMzJnXUFay",
                          mint: "Es9vMFrzaCER9dEj7tn5MDuBiwGvNAd8kH1EMwMGL67y",
                          authority: "SoLMockSender11111111111111111111111111111",
                          tokenAmount: {
                            uiAmount: 42,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        };
      }
    }
    return originalPost(url, data, config);
  };

  try {
    await checkAllWalletDeposits();
  } finally {
    axios.get = originalGet;
    axios.post = originalPost;
    await mongoose.disconnect();
  }
}

main()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Mock wallet tracking run completed");
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Mock wallet tracking run failed", err);
    process.exitCode = 1;
  });


