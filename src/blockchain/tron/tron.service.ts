import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { TronWeb } from "tronweb";
import { utils } from 'ethers';
import { AppConfigService } from 'src/config/config.service';
import { AccountsService } from 'src/accounts/accounts.service';
import { CoinsService } from 'src/coins/coins.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NetworkType, TransactionType } from 'src/enums';
import { WebhookTransfer } from '../blockchain.controller';
import { TransactionData } from 'src/interfaces';

@Injectable()
export class TronService {
    private readonly logger = new Logger(TronService.name);
    private readonly tronRpc: string;
    private readonly adminAddress: string;
    private readonly adminPrivateKey: string;

    constructor(
        private configService: AppConfigService,
        @Inject(forwardRef(() => AccountsService)) private readonly accountsService: AccountsService,
        private readonly coinsService: CoinsService,
        @Inject(forwardRef(() => TransactionsService)) private readonly transactionsService: TransactionsService,
    ) {
        this.tronRpc = this.configService.tron.rpc;
        this.adminAddress = this.configService.tron.admin;
        this.adminPrivateKey = this.configService.tron.adminSk;
    }

    createWallet() {
        const tronWeb = new TronWeb({ fullHost: this.tronRpc });
        const account = tronWeb.utils.accounts.generateAccount();
        const address = account.address.base58;
        const privateKey = account.privateKey;
        return {
            address,
            privateKey,
        };
    }

    async tokenWithdraw(userAddress: string, tokenAddress: string, amount: number): Promise<TransactionData> {
        try {
            const tronWeb = new TronWeb({ fullHost: this.tronRpc, privateKey: this.adminPrivateKey });

            const adminDerivedAddress = tronWeb.address.fromPrivateKey(this.adminPrivateKey);
            if (!adminDerivedAddress) { throw new Error("Invalid admin private key"); }

            const tokenContract = await tronWeb.contract().at(tokenAddress);
            if (!tronWeb) throw new Error("Invalid admin private key");


            const decimals: bigint = await tokenContract.decimals().call();
            const amountInWei = utils.parseUnits(amount.toString(), decimals).toString();

            const { signedTxn, totalCost, balance } = await this.estimateAndCheckResources(
                tronWeb,
                adminDerivedAddress,
                tokenAddress,
                "transfer(address,uint256)",
                [
                    { type: 'address', value: userAddress },
                    { type: 'uint256', value: amountInWei }
                ]
            );

            if (balance < totalCost) {
                throw new Error("Insufficient TRX balance to cover bandwidth/energy cost");
            }

            const sendTx = await tronWeb.trx.sendRawTransaction(signedTxn);
            await tronWeb.trx.getTransaction(sendTx.txid);

            return {
                fromAddress: adminDerivedAddress,
                toAddress: userAddress,
                amount: amount,
                txHash: sendTx.txid,
                blockNumber: 0
            };
        } catch (error) {
            this.logger.error(`Token withdrawal failed: ${error.message ?? error}`);
            throw error
        }

    }

    async tronWithdraw(userAddress: string, amount: number): Promise<TransactionData> {
        try {
            const tronWeb = new TronWeb({ fullHost: this.tronRpc, privateKey: this.adminPrivateKey });
            const adminDerivedAddress = tronWeb.address.fromPrivateKey(this.adminPrivateKey);
            if (!adminDerivedAddress) { throw new Error("Invalid admin private key"); }

            const amountInSun = Number(tronWeb.toSun(amount));
            const adminBalance = await tronWeb.trx.getBalance(adminDerivedAddress);

            const resources = await tronWeb.trx.getAccountResources(adminDerivedAddress);
            const freeNetLimit = resources.freeNetLimit || 0;
            const freeNetUsed = resources.freeNetUsed || 0;
            const hasFreeBandwidth = freeNetLimit > freeNetUsed;
            const estimatedFeeSun = hasFreeBandwidth ? 0 : 100_000;

            if (adminBalance < amountInSun + estimatedFeeSun) {
                throw new Error("Insufficient TRX balance")
            }

            const tx = await tronWeb.transactionBuilder.sendTrx(userAddress, amountInSun, adminDerivedAddress);
            const signedTx = await tronWeb.trx.sign(tx, this.adminPrivateKey);
            const sendTx = await tronWeb.trx.sendRawTransaction(signedTx);
            await tronWeb.trx.getTransaction(sendTx.txid);

            return {
                fromAddress: adminDerivedAddress,
                toAddress: userAddress,
                amount: amount,
                txHash: sendTx.txid,
                blockNumber: 0
            };
        } catch (error) {
            this.logger.error(`TRX withdrawal failed: ${error.message ?? error}`);
            throw error
        }
    }

    async tokenTransfer(senderPrivateKey: string, tokenAddress: string) {
        try {
            const tronWebSender = new TronWeb({ fullHost: this.tronRpc, privateKey: senderPrivateKey });
            const tronWebAdmin = new TronWeb({ fullHost: this.tronRpc, privateKey: this.adminPrivateKey });
            const senderAddress = tronWebSender.address.fromPrivateKey(senderPrivateKey);
            const adminAddress = tronWebAdmin.address.fromPrivateKey(this.adminPrivateKey);
            const contractSender = await tronWebSender.contract().at(tokenAddress);

            if (!senderAddress || !adminAddress) {
                this.logger.error('Invalid private key');
                return;
            };

            const senderTokenBalance: bigint = await contractSender.balanceOf(senderAddress).call();

            if (senderTokenBalance <= 0) {
                this.logger.log('Account already swept');
                return;
            }

            const { signedTxn, totalCost, balance } = await this.estimateAndCheckResources(
                tronWebSender,
                senderAddress,
                tokenAddress,
                "transfer(address,uint256)",
                [
                    { type: 'address', value: adminAddress },
                    { type: 'uint256', value: senderTokenBalance.toString() }
                ]
            );

            if (balance < totalCost) {
                const adminBalance = await tronWebAdmin.trx.getBalance(adminAddress);
                if (adminBalance < totalCost) {
                    this.logger.error('Insufficient admin balance');
                    return;
                }
                const sendFundsTx = await tronWebAdmin.transactionBuilder.sendTrx(senderAddress, totalCost, adminAddress);
                const signedFundsTx = await tronWebAdmin.trx.sign(sendFundsTx, this.adminPrivateKey);
                const fundsTxResult = await tronWebAdmin.trx.sendRawTransaction(signedFundsTx);
                await tronWebAdmin.trx.getTransaction(fundsTxResult.txid);
            }
            await tronWebSender.trx.sendRawTransaction(signedTxn);
        } catch (error: any) {
            this.logger.error(`Token transfer failed: ${error.message ?? error}`);
        }
    }

    async tronTransfer(senderPrivateKey: string) {
        try {
            const tronWeb = new TronWeb({ fullHost: this.tronRpc, privateKey: senderPrivateKey });
            const senderAddress = tronWeb.address.fromPrivateKey(senderPrivateKey);
            if (!senderAddress) {
                this.logger.error('Invalid sender private key');
                return;
            }

            const senderBalance = await tronWeb.trx.getBalance(senderAddress);
            if (senderBalance <= 0) {
                this.logger.log('Account already swept');
                return;
            }

            const resources = await tronWeb.trx.getAccountResources(senderAddress);
            const freeNetLimit = resources.freeNetLimit || 0;
            const freeNetUsed = resources.freeNetUsed || 0;
            const hasFreeBandwidth = freeNetLimit > freeNetUsed;
            const estimatedFeeSun = hasFreeBandwidth ? 0 : 100_000;
            const amountToSend = senderBalance - estimatedFeeSun;

            if (amountToSend <= 0) {
                this.logger.error('Gas cost exceeds balance');
                return;
            };

            const transaction = await tronWeb.transactionBuilder.sendTrx(this.adminAddress, amountToSend, senderAddress);
            const signedTransaction = await tronWeb.trx.sign(transaction, senderPrivateKey);
            await tronWeb.trx.sendRawTransaction(signedTransaction);
        } catch (error: any) {
            this.logger.error(`TRX transfer failed: ${error.message ?? error}`);
        }
    }

    private estimateBandwidth(signedTxn: any) {
        const DATA_HEX_PROTOBUF_EXTRA = 3;
        const MAX_RESULT_SIZE_IN_TX = 64;
        const A_SIGNATURE = 67;
        let len = signedTxn.raw_data_hex.length / 2 + DATA_HEX_PROTOBUF_EXTRA + MAX_RESULT_SIZE_IN_TX;
        const signatureListSize = signedTxn.signature.length;
        for (let i = 0; i < signatureListSize; i++) {
            len += A_SIGNATURE;
        }
        return len;
    }

    private async estimateAndCheckResources(
        tronWeb: TronWeb,
        address: string,
        tokenAddress: string,
        functionSelector: string,
        parameters: any[]
    ): Promise<{ signedTxn: any; totalCost: number; balance: number }> {
        try {
            const estimateEnergy = await tronWeb.transactionBuilder.estimateEnergy(
                tokenAddress,
                functionSelector,
                {},
                parameters,
                address
            );
            if (!estimateEnergy.result.result) {
                throw new Error(`Energy estimation for ${functionSelector} failed.`);
            }

            const transactionWrap = await tronWeb.transactionBuilder.triggerSmartContract(
                tokenAddress,
                functionSelector,
                {},
                parameters,
                address
            );
            if (!transactionWrap.result.result) {
                throw new Error(`Smart contract trigger for ${functionSelector} failed.`);
            }

            const signedTxn = await tronWeb.trx.sign(transactionWrap.transaction);
            const bandwidthRequired = this.estimateBandwidth(signedTxn);
            const energyRequired = estimateEnergy.energy_required;

            const resources = await tronWeb.trx.getAccountResources(address);
            const availableBandwidth = (resources.freeNetLimit || 0) - (resources.freeNetUsed || 0);
            const availableEnergy = (resources.EnergyLimit || 0) - (resources.EnergyUsed || 0);
            const chainParams: any[] = await tronWeb.trx.getChainParameters();
            const sunPerEnergy = chainParams.find(param => param.key === 'getEnergyFee')?.value ?? 0;
            const sunPerBandwidth = chainParams.find(param => param.key === 'getTransactionFee')?.value ?? 0;

            let energyCost = 0;
            let bandwidthCost = 0;

            if (energyRequired > availableEnergy) {
                energyCost = (energyRequired - availableEnergy) * sunPerEnergy;
            }
            if (bandwidthRequired > availableBandwidth) {
                bandwidthCost = (bandwidthRequired - availableBandwidth) * sunPerBandwidth;
            }

            const balance = await tronWeb.trx.getBalance(address);
            const totalCost = energyCost + bandwidthCost;

            return { signedTxn, totalCost, balance };
        } catch (error) {
            this.logger.error(`Error in estimateAndCheckResources: ${error.message ?? error}`);
            throw error;
        }
    }

    async processTransfers(transfer: WebhookTransfer, chain: NetworkType) {
        try {
            const toAccount = await this.accountsService.findByAddressOnChain(transfer.to, chain);
            if (!toAccount) return;

            if (transfer.type === 'native') {
                const nativeCoin = await this.coinsService.findNative(chain, true);
                const isFromAdmin = transfer.from.toLowerCase() === this.adminAddress.toLowerCase()
                if (!nativeCoin || isFromAdmin) return;
                const valueTrx = parseFloat((Number(transfer.value) / 1_000_000).toString());
                await this.transactionsService.create({
                    account: toAccount,
                    coin: nativeCoin,
                    type: TransactionType.DEPOSIT,
                    chain,
                    fromAddress: transfer.from,
                    toAddress: transfer.to,
                    value: valueTrx,
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }

            if (transfer.type === 'custom' && transfer.token) {
                const customCoin = await this.coinsService.findByAddressOnChain(transfer.token, chain);
                if (!customCoin) return;
                const decimals = customCoin.decimals ?? 6;
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
            this.logger.error(`Error processing TRON transfer ${transfer.hash}:`, error as any);
        }
    }
}
