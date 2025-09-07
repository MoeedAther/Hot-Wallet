import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database with coins...');

    const coins = [
        {
            "name": "Ethereum",
            "symbol": "ETH",
            "decimals": 18,
            "chain": "ethereum",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            "address": null
        },
        {
            "name": "Tether",
            "symbol": "USDT",
            "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "decimals": 6,
            "chain": "ethereum",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "USD Coin",
            "symbol": "USDC",
            "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "decimals": 6,
            "chain": "ethereum",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        {
            "name": "BNB",
            "symbol": "BNB",
            "decimals": 18,
            "chain": "bsc",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
            "address": null
        },
        {
            "name": "Tether",
            "symbol": "USDT",
            "address": "0x55d398326f99059fF775485246999027B3197955",
            "decimals": 18,
            "chain": "bsc",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "USD Coin",
            "symbol": "USDC",
            "address": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            "decimals": 18,
            "chain": "bsc",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        {
            "name": "MATIC",
            "symbol": "MATIC",
            "decimals": 18,
            "address": null,
            "chain": "polygon",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0x7c9f4c87d911613fe9ca58b579f737911aad2d43"
        },
        {
            "name": "Tether",
            "symbol": "USDT",
            "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
            "chain": "polygon",
            "isNative": false,
            "decimals": 6,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "USD Coin",
            "symbol": "USDC",
            "address": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
            "chain": "polygon",
            "isNative": false,
            "decimals": 6,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        {
            "name": "Tron",
            "symbol": "TRX",
            "decimals": 6,
            "chain": "tron",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "address": null,
            "wrappedAddress": "0x39fBBABf11738317a448031930706cd3e612e1B9"
        },
        {
            "name": "Tether",
            "symbol": "USDT",
            "address": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
            "decimals": 6,
            "chain": "tron",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "USD Coin",
            "symbol": "USDC",
            "address": "TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8",
            "decimals": 6,
            "chain": "tron",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        {
            "name": "Solana",
            "symbol": "SOL",
            "decimals": 9,
            "chain": "solana",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
            "address": null
        },
        {
            "name": "Tether",
            "symbol": "USDT",
            "address": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            "decimals": 6,
            "chain": "solana",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "USD Coin",
            "symbol": "USDC",
            "address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "decimals": 6,
            "chain": "solana",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
        },
        {
            "name": "Bitcoin",
            "symbol": "BTC",
            "chain": "bitcoin",
            "isNative": true,
            "decimals": 8,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
            "address": null
        },
        {
            "name": "XRP",
            "symbol": "XRP",
            "decimals": 6,
            "chain": "ripple",
            "isNative": true,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "address": null
        },
        {
            "name": "My Token",
            "symbol": "MTK",
            "address": "0x504C56184d8f955a65795203F65c9254bc002009",
            "decimals": 18,
            "chain": "ethereum",
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "SPL Token",
            "symbol": "STK",
            "address": "EnjYJeypYfV2fMUfhuFC39zF5ZxLgHsDNWQTuaExhPyk",
            "chain": "solana",
            "decimals": 9,
            "isNative": false,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        },
        {
            "name": "My Token",
            "symbol": "MTK",
            "address": "TEeKum6U5NAX1t95G7kFdqeRnnKfYFCxmu",
            "chain": "tron",
            "isNative": false,
            "decimals": 18,
            "withdrawFeeInUsd": 0.0002,
            "wrappedAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
        }
    ]

    for (const coin of coins) {
        try {
            await prisma.coin.upsert({
                where: {
                    symbol_chain: {
                        symbol: coin.symbol,
                        chain: coin.chain,
                    },
                },
                update: coin,
                create: coin,
            });
            console.log(`✅ Added/Updated coin: ${coin.symbol} on ${coin.chain}`);
        } catch (error) {
            console.error(`❌ Error adding coin ${coin.symbol} on ${coin.chain}:`, error);
        }
    }

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
