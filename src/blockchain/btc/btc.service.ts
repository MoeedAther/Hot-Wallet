import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory, ECPairInterface } from 'ecpair';
import { Utxo } from './btc.interface';
import { AppConfigService } from 'src/config/config.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { CoinsService } from 'src/coins/coins.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NetworkType, TransactionType } from 'src/enums';
import { WebhookTransfer } from '../blockchain.controller';
import { TransactionData } from 'src/interfaces';

@Injectable()
export class BtcService {
    private readonly logger = new Logger(BtcService.name);
    private readonly blockstreamClient: string;
    private readonly blockstreamSecret: string;
    private readonly adminAddress: string;
    private readonly adminPrivateKey: string;
    private readonly network = bitcoin.networks.bitcoin;
    private readonly ECPair = ECPairFactory(ecc);
    private readonly btcRpc: string;
    

    constructor(
        private configService: AppConfigService,
        @Inject(forwardRef(() => AccountsService)) private readonly accountsService: AccountsService,
        private readonly coinsService: CoinsService,
        @Inject(forwardRef(() => TransactionsService)) private readonly transactionsService: TransactionsService,
    ) {
        this.adminAddress = this.configService.btc.admin;
        this.adminPrivateKey = this.configService.btc.adminSk;
        this.blockstreamClient = this.configService.btc.blockstreamClient;
        this.blockstreamSecret = this.configService.btc.blockstreamSecret;
        this.btcRpc = this.configService.btc.rpc;
    }

    createWallet() {
        const keyPair = this.ECPair.makeRandom({ network: this.network });
        const publicKeyBuffer = Buffer.from(keyPair.publicKey);
        const address = bitcoin.payments.p2wpkh({ pubkey: publicKeyBuffer, network: this.network }).address!;
        return {
            address,
            privateKey: keyPair.toWIF()
        }
    }

    async btcWithdraw(userAddress: string, amount: number): Promise<TransactionData> {
        try {
            const adminKeyPair: ECPairInterface = this.ECPair.fromWIF(this.adminPrivateKey, this.network);
            const adminPublicKeyBuffer = Buffer.from(adminKeyPair.publicKey);
            const adminDerivedAddress = bitcoin.payments.p2wpkh({ pubkey: adminPublicKeyBuffer, network: this.network }).address;
            if (!adminDerivedAddress) {
                throw new Error("Invalid sender address")
            };

            const amountInSatoshi = Math.floor(amount * 1e8);
            console.log("amountInSatoshi:", amountInSatoshi)

            const adminBalance = await this.getBalance(adminDerivedAddress);
            console.log("balance:", adminBalance)

            if (adminBalance < amountInSatoshi) {
                throw new Error('Insufficient balance')
            };

            const psbt = new bitcoin.Psbt({ network: this.network });
            const utxos = await this.getUtxos(adminDerivedAddress);

            let inputSum = 0;
            for (const utxo of utxos) {
                const txHex = await this.getRawTransaction(utxo.txid);
                const tx = bitcoin.Transaction.fromHex(txHex);
                const output = tx.outs[utxo.vout];
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: output.script,
                        value: output.value,
                    },
                });
                inputSum += output.value;
                if (inputSum >= amountInSatoshi + 1000) break;
            }


            console.log("inputSum:", inputSum)
            if (inputSum < amountInSatoshi + 1000) {
                throw new Error('Insufficient btc admin balance')
            };

            psbt.addOutput({
                address: userAddress,
                value: amountInSatoshi,
            });

            const change = inputSum - amountInSatoshi - 1000;

            if (change > 0) {
                psbt.addOutput({
                    address: adminDerivedAddress,
                    value: change,
                });
            }

            const signer: bitcoin.Signer = {
                publicKey: adminPublicKeyBuffer,
                sign(hash: Buffer, lowR?: boolean): Buffer {
                    const sig = adminKeyPair.sign(hash);
                    return Buffer.from(sig);
                },
            };

            psbt.signInput(0, signer);

            const validator = (pubkey: Uint8Array, msghash: Uint8Array, signature: Uint8Array): boolean => this.ECPair.fromPublicKey(pubkey).verify(msghash, signature);
            if (!psbt.validateSignaturesOfInput(0, validator)) {
                throw new Error('Signature validation failed');
            }

            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            const txId = tx.getId();
            await this.broadcastTransaction(txHex);
            console.log(`Transaction broadcasted: ${txId}`);
            return {
                fromAddress: adminDerivedAddress,
                toAddress: userAddress,
                amount: amount,
                txHash: txId,
                blockNumber: 0
            };
        } catch (error) {
            console.log("Error in btcWithdraw:", error)
            throw error
        }
    }



    async btcTransfer(senderPrivateKey: string, amount: number): Promise<bitcoin.Transaction> {
        try {
            const keyPair: ECPairInterface = this.ECPair.fromWIF(senderPrivateKey, this.network);

            const publicKeyBuffer = Buffer.from(keyPair.publicKey);
            const senderAddress = bitcoin.payments.p2wpkh({ pubkey: publicKeyBuffer, network: this.network }).address;
            if (!senderAddress) throw new Error("Invalid sender address");

            const amountInSatoshi = Math.floor(amount * 1e8);
            console.log("amountInSatoshi:", amountInSatoshi)

            const balance = await this.getBalance(senderAddress);
            console.log("balance:", balance)

            if (balance < amountInSatoshi) throw new Error('Insufficient balance');

            const psbt = new bitcoin.Psbt({ network: this.network });
            const utxos = await this.getUtxos(senderAddress);

            let inputSum = 0;
            for (const utxo of utxos) {
                const txHex = await this.getRawTransaction(utxo.txid);
                const tx = bitcoin.Transaction.fromHex(txHex);
                const output = tx.outs[utxo.vout];
                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: output.script,
                        value: output.value,
                    },
                });
                inputSum += output.value;
                if (inputSum >= amountInSatoshi + 1000) break;
            }


            console.log("inputSum:", inputSum)
            if (inputSum < amountInSatoshi + 1000) throw new Error('Insufficient balance');

            psbt.addOutput({
                address: this.adminAddress,
                value: amountInSatoshi,
            });

            const change = inputSum - amountInSatoshi - 1000;

            if (change > 0) {
                psbt.addOutput({
                    address: senderAddress,
                    value: change,
                });
            }

            const signer: bitcoin.Signer = {
                publicKey: publicKeyBuffer,
                sign(hash: Buffer, lowR?: boolean): Buffer {
                    const sig = keyPair.sign(hash);
                    return Buffer.from(sig);
                },
            };

            psbt.signInput(0, signer);

            const validator = (pubkey: Uint8Array, msghash: Uint8Array, signature: Uint8Array): boolean => this.ECPair.fromPublicKey(pubkey).verify(msghash, signature);
            if (!psbt.validateSignaturesOfInput(0, validator)) {
                throw new Error('Signature validation failed');
            }

            // psbt.signAllInputs(keyPair as any);
            psbt.finalizeAllInputs();
            const tx = psbt.extractTransaction();
            const txHex = tx.toHex();
            await this.broadcastTransaction(txHex);
            console.log(`Transaction broadcasted: ${tx.getId()}`);
            return tx;
        } catch (error) {
            console.log("Error in btcTransfer:", error)
            throw error;
        }
    }





    private async getAccessToken(): Promise<string> {
        try {
            const tokenUrl = 'https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token';
            const params = new URLSearchParams();
            params.append('client_id', this.blockstreamClient);
            params.append('client_secret', this.blockstreamSecret);
            params.append('grant_type', 'client_credentials');
            params.append('scope', 'openid');

            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Token request failed: ${errorText}`);
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error in getAccessToken:', error);
            throw error;
        }
    }


    private async getBalance(address: string): Promise<number> {
        try {
            const token = await this.getAccessToken();
            const url = `https://enterprise.blockstream.info/testnet/api/address/${address}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Balance fetch failed: ${errorText}`);
            }

            const data = await response.json();
            const confirmed = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
            const unconfirmed = data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;
            const total = confirmed + unconfirmed;
            return total;
        } catch (error) {
            console.error('Error in getBalance:', error);
            throw error;
        }
    }

    private async getEstimatedFee(numInputs: number = 1, numOutputs: number = 2): Promise<number> {
        try {
            const token = await this.getAccessToken();
            const url = 'https://enterprise.blockstream.info/testnet/api/fee-estimates';

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Fee rate fetch failed: ${errorText}`);
            }

            const data = await response.json();

            const satPerByte = data['6'] ?? data['1'];
            const txSize = 10 + (numInputs * 68) + (numOutputs * 31);
            return Math.ceil(satPerByte * txSize);
        } catch (error) {
            console.error('Error in getEstimatedFee:', error);
            throw error;
        }
    }

    private async getUtxos(address: string): Promise<Utxo[]> {
        try {
            const token = await this.getAccessToken();
            const url = `https://enterprise.blockstream.info/testnet/api/address/${address}/utxo`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`UTXO fetch failed: ${errorText}`);
            }

            const data: Utxo[] = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getUtxos:', error);
            throw error;
        }
    }

    private async getRawTransaction(txid: string): Promise<string> {
        try {
            const token = await this.getAccessToken();
            const url = `https://enterprise.blockstream.info/testnet/api/tx/${txid}/hex`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Raw transaction fetch failed: ${errorText}`);
            }

            return response.text();
        } catch (error) {
            console.error('Error in getRawTransaction:', error);
            throw error;
        }
    }


    private async broadcastTransaction(txHex: string): Promise<void> {
        try {
            const token = await this.getAccessToken();
            const url = 'https://enterprise.blockstream.info/testnet/api/tx';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'text/plain',
                },
                body: txHex,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Transaction broadcast failed: ${errorText}`);
            }
        } catch (error) {
            console.error('Error in broadcastTransaction:', error);
            throw error;
        }
    }

    async processTransfers(transfer: WebhookTransfer, chain: NetworkType) {
        try {
            const toAccount = await this.accountsService.findByAddressOnChain(transfer.to, chain);
            if (!toAccount) return;

            const nativeCoin = await this.coinsService.findNative(chain, true);
            if (!nativeCoin) return;
            const valueBtc = Number(transfer.value) / 1e8;
            await this.transactionsService.create({
                account: toAccount,
                coin: nativeCoin,
                type: TransactionType.DEPOSIT,
                chain,
                fromAddress: transfer.from,
                toAddress: transfer.to,
                value: parseFloat(valueBtc.toString()),
                txHash: transfer.hash,
                blockNumber: transfer.blockNumber,
            });
        } catch (error) {
            this.logger.error(`Error processing BTC transfer ${transfer.hash}:`, error as any);
        }
    }
}
