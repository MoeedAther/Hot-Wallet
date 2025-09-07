import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { createTransferInstruction, getMint, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { AppConfigService } from 'src/config/config.service';
import bs58 from "bs58";
import { AccountsService } from 'src/accounts/accounts.service';
import { CoinsService } from 'src/coins/coins.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NetworkType, TransactionType } from 'src/enums';
import { WebhookTransfer } from '../blockchain.controller';
import { TransactionData } from 'src/interfaces';

@Injectable()
export class SolanaService {
    private readonly logger = new Logger(SolanaService.name);
    private readonly solanaRpc: string;
    private readonly connection: Connection;
    private readonly adminAddress: string;
    private readonly adminPrivateKey: string;

    constructor(
        private configService: AppConfigService,
        private readonly accountsService: AccountsService,
        private readonly coinsService: CoinsService,
        @Inject(forwardRef(() => TransactionsService)) private readonly transactionsService: TransactionsService,
    ) {
        this.solanaRpc = this.configService.solana.rpc;
        this.adminAddress = this.configService.solana.admin;
        this.adminPrivateKey = this.configService.solana.adminSk;
        this.connection = new Connection(this.solanaRpc, "confirmed");
    }

    createWallet() {
        const keypair = Keypair.generate();
        const address = keypair.publicKey.toBase58();
        const privateKey = bs58.encode(keypair.secretKey);
        return {
            address,
            privateKey,
        };
    }

    async tokenWithdraw(userAddress: string, tokenAddress: string, amount: number): Promise<TransactionData> {
        try {
            const adminKeypair = Keypair.fromSecretKey(bs58.decode(this.adminPrivateKey));
            const userPubkey = new PublicKey(userAddress);

            const mint = new PublicKey(tokenAddress);
            const mintInfo = await getMint(this.connection, mint);
            const tokenAmountInLamports = BigInt(amount * Math.pow(10, mintInfo.decimals));

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                adminKeypair,
                mint,
                adminKeypair.publicKey
            );

            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                adminKeypair,
                mint,
                userPubkey
            );

            const transaction = new Transaction().add(
                createTransferInstruction(
                    adminTokenAccount.address,
                    userTokenAccount.address,
                    adminKeypair.publicKey,
                    tokenAmountInLamports
                )
            );

            transaction.feePayer = adminKeypair.publicKey;
            transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
            const fee = BigInt((await this.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value ?? 0);

            const adminSolBalance = await this.connection.getBalance(adminKeypair.publicKey);
            if (adminSolBalance < fee) {
                throw new Error("Admin has insufficient SOL balance for fee");
            }

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [adminKeypair]
            );

            const txInfo = await this.connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 } as any);
            const blockNumber = txInfo?.slot ?? 0;
            return {
                fromAddress: adminKeypair.publicKey.toBase58(),
                toAddress: userAddress,
                amount: amount,
                txHash: signature,
                blockNumber: blockNumber
            };
        } catch (error) {
            console.log("Error in tokenWithdraw:", error)
            throw error
        }
    }

    async solWithdraw(userAddress: string, amount: number): Promise<TransactionData> {
        try {
            const adminKeypair = Keypair.fromSecretKey(bs58.decode(this.adminPrivateKey));
            const userPubkey = new PublicKey(userAddress);

            const amountInLamports = BigInt(amount * LAMPORTS_PER_SOL);

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: adminKeypair.publicKey,
                    toPubkey: userPubkey,
                    lamports: amountInLamports,
                })
            );
            transaction.feePayer = adminKeypair.publicKey;
            transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
            const fee = BigInt((await this.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value ?? 0);

            const adminSolBalance = await this.connection.getBalance(adminKeypair.publicKey);
            if (adminSolBalance < fee + amountInLamports) {
                throw new Error("Admin has insufficient SOL balance for transfer and fee");
            }

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [adminKeypair]
            );

            const txInfo = await this.connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 } as any);
            const blockNumber = txInfo?.slot ?? 0;
            return {
                fromAddress: adminKeypair.publicKey.toBase58(),
                toAddress: userAddress,
                amount: amount,
                txHash: signature,
                blockNumber: blockNumber
            };
        } catch (error) {
            console.log("Error in solWithdraw:", error)
            throw error
        }
    }



    async tokenTransfer(senderPrivateKey: string, tokenAddress: string) {
        try {
            const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderPrivateKey));
            const adminKeypair = Keypair.fromSecretKey(bs58.decode(this.adminPrivateKey));
            const adminPubkey = new PublicKey(this.adminAddress);

            const mint = new PublicKey(tokenAddress);

            const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                senderKeypair,
                mint,
                senderKeypair.publicKey
            );

            const adminTokenAccount = await getOrCreateAssociatedTokenAccount(
                this.connection,
                adminKeypair,
                mint,
                adminPubkey
            );

            const balanceInfo = await this.connection.getTokenAccountBalance(senderTokenAccount.address);
            const tokenAmountInLamports = BigInt(balanceInfo.value.amount);

            if (tokenAmountInLamports <= BigInt(0)) {
                this.logger.log('Account already swept - no tokens to transfer');
                return;
            }

            const transaction = new Transaction().add(
                createTransferInstruction(
                    senderTokenAccount.address,
                    adminTokenAccount.address,
                    senderKeypair.publicKey,
                    tokenAmountInLamports
                )
            );

            transaction.feePayer = adminKeypair.publicKey;
            transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;

            const fee = (await this.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value ?? 0;

            const adminBalance = await this.connection.getBalance(adminKeypair.publicKey);
            if (adminBalance < fee) {
               this.logger.error("Admin has insufficient SOL balance for fee");
               return;
            }

            await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [senderKeypair, adminKeypair]
            );
        } catch (error) {
            this.logger.error(`Token transfer failed: ${error.message}`);
        }
    }
    async solTransfer(senderPrivateKey: string): Promise<void> {
        try {
            const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderPrivateKey));
            const adminPubkey = new PublicKey(this.adminAddress);

            const senderBalance = BigInt(await this.connection.getBalance(senderKeypair.publicKey));
            if (senderBalance <= BigInt(0)) {
                this.logger.error('Account already swept');
                return;
            }

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: adminPubkey,
                    lamports: BigInt(1),
                })
            );

            transaction.feePayer = senderKeypair.publicKey;
            transaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
            const fee = BigInt((await this.connection.getFeeForMessage(transaction.compileMessage(), 'confirmed')).value ?? 0);

            const amountToSend = senderBalance - fee;
            if (amountToSend <= BigInt(0)) {
                this.logger.error('Gas cost exceeds balance');
                return;
            }

            transaction.instructions = [
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: adminPubkey,
                    lamports: amountToSend,
                })
            ];

            await sendAndConfirmTransaction(this.connection, transaction, [senderKeypair]);
        } catch (error) {
            this.logger.error(`SOL sweep failed: ${(error as any).message}`);
        }
    }

    async processTransfers(transfer: WebhookTransfer, chain: NetworkType) {
        try {
            const toAccount = await this.accountsService.findByAddressOnChain(transfer.to, chain);
            if (!toAccount) return;

            if (transfer.type === 'native') {
                const nativeCoin = await this.coinsService.findNative(chain, true);
                if (!nativeCoin) return;
                await this.transactionsService.create({
                    account: toAccount,
                    coin: nativeCoin,
                    type: TransactionType.DEPOSIT,
                    chain,
                    fromAddress: transfer.from,
                    toAddress: transfer.to,
                    value: parseFloat((Number(transfer.value) / LAMPORTS_PER_SOL).toString()),
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }

            if (transfer.type === 'custom' && transfer.token) {
                const customCoin = await this.coinsService.findByAddressOnChain(transfer.token, chain);
                if (!customCoin) return;
                const decimals = customCoin.decimals ?? 9;
                const value = Number(transfer.value) / Math.pow(10, decimals);
                await this.transactionsService.create({
                    account: toAccount,
                    coin: customCoin,
                    type: TransactionType.DEPOSIT,
                    chain,
                    fromAddress: transfer.from,
                    toAddress: transfer.to,
                    value: parseFloat(value.toString()),
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }
        } catch (error) {
            this.logger.error(`Error processing SOL transfer ${transfer.hash}:`, error as any);
        }
    }
}
