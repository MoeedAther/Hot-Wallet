import { AppConfigService } from 'src/config/config.service';
import { Contract, providers, utils, Wallet } from 'ethers';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { NetworkType, TransactionType } from 'src/enums';
import { erc20ABI } from 'src/abis';
import { TransactionData } from 'src/interfaces';
import { WebhookTransfer } from '../blockchain.controller';
import { AccountsService } from 'src/accounts/accounts.service';
import { CoinsService } from 'src/coins/coins.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class EvmService {
    private readonly logger = new Logger(EvmService.name);
    private readonly adminAddress: string;
    private readonly adminPrivateKey: string;

    constructor(
        private configService: AppConfigService,
        @Inject(forwardRef(() => AccountsService)) private readonly accountsService: AccountsService,
        private readonly coinsService: CoinsService,
        @Inject(forwardRef(() => TransactionsService)) private readonly transactionsService: TransactionsService,
    ) {
        this.adminAddress = this.configService.evm.admin;
        this.adminPrivateKey = this.configService.evm.adminSk;
    }

    createWallet() {
        const wallet: Wallet = Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey
        };
    }

    async tokenWithdraw(
        userAddress: string,
        tokenAddress: string,
        amount: number,
        chain: NetworkType
    ): Promise<TransactionData> {
        this.logger.log(`Token withdrawal initiated for ${userAddress} on ${chain}`);
        try {
            const provider = new providers.JsonRpcProvider(this.getRpcUrl(chain));
            const adminWallet = new Wallet(this.adminPrivateKey, provider);
            const tokenContract = new Contract(tokenAddress, erc20ABI, adminWallet);
            const decimals = await tokenContract.decimals();
            const tokenAmountInWei = utils.parseUnits(amount.toString(), decimals);
            
            const [feeData, estimateGas, adminEthBalance, adminTokenBalance] = await Promise.all([
                provider.getFeeData(),
                tokenContract.estimateGas.transfer(userAddress, tokenAmountInWei),
                provider.getBalance(adminWallet.address),
                tokenContract.balanceOf(adminWallet.address)
            ]);
            
            if (adminTokenBalance.lt(tokenAmountInWei)) {
                throw new Error('Insufficient admin token balance');
            }
            
            const gasPrice = feeData.maxFeePerGas ?? await provider.getGasPrice();
            const baseFee = estimateGas.mul(gasPrice);
            const fee = baseFee.mul(110).div(100); // Add 10% buffer to fee

            if (adminEthBalance.lt(fee)) {
                throw new Error('Insufficient admin balance for gas fees');
            }

            const tx = await tokenContract.transfer(userAddress, tokenAmountInWei);
            const receipt = await tx.wait();

            return {
                fromAddress: adminWallet.address,
                toAddress: userAddress,
                amount: amount,
                txHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            this.logger.error(`Token withdrawal failed: ${error.message}`);
            throw error
        }

    }

    async ethWithdraw(
        userAddress: string,
        amount: number,
        chain: NetworkType
    ): Promise<TransactionData> {
        this.logger.log(`ETH withdrawal initiated for ${userAddress} on ${chain}`);
        try {
            const provider = new providers.JsonRpcProvider(this.getRpcUrl(chain));
            const adminWallet = new Wallet(this.adminPrivateKey, provider);

            const amountInWei = utils.parseEther(amount.toString());

            const [feeData, estimateGas, adminBalance] = await Promise.all([
                provider.getFeeData(),
                adminWallet.estimateGas({ to: userAddress, value: amountInWei }),
                provider.getBalance(adminWallet.address)
            ]);

            const gasPrice = feeData.maxFeePerGas ?? await provider.getGasPrice();
            const baseFee = estimateGas.mul(gasPrice);
            const fee = baseFee.mul(110).div(100); // Add 10% buffer to fee

            if (adminBalance.lt(amountInWei.add(fee))) {
                throw new Error('Insufficient admin balance');
            }

            const tx = await adminWallet.sendTransaction({ to: userAddress, value: amountInWei });
            const receipt = await tx.wait();
            return {
                fromAddress: adminWallet.address,
                toAddress: userAddress,
                amount: amount,
                txHash: receipt.transactionHash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            this.logger.error(`ETH withdrawal failed: ${error.message}`);
            throw error
        }
    }

    async tokenTransfer(
        senderPrivateKey: string,
        tokenAddress: string,
        chain: NetworkType
    ): Promise<void> {
        try {
            const provider = new providers.JsonRpcProvider(this.getRpcUrl(chain));
            const senderWallet = new Wallet(senderPrivateKey, provider);
            const adminWallet = new Wallet(this.adminPrivateKey, provider);

            const tokenContract = new Contract(tokenAddress, erc20ABI, senderWallet);
            const senderTokenBalance = await tokenContract.balanceOf(senderWallet.address);

            if (senderTokenBalance.lte(0)) {
                this.logger.log('Account already swept');
                return
            }
            
            const [feeData, estimatedGas, senderEthBalance] = await Promise.all([
                provider.getFeeData(),
                tokenContract.estimateGas.transfer(adminWallet.address, senderTokenBalance),
                provider.getBalance(senderWallet.address)
            ]);
    
            const gasPrice = feeData.maxFeePerGas ?? await provider.getGasPrice();
            const baseFee = estimatedGas.mul(gasPrice);
            const fee = baseFee.mul(110).div(100);
           
            if (senderEthBalance.lt(fee)) {
                const topUpTx = await adminWallet.sendTransaction({
                    to: senderWallet.address,
                    value: fee
                });
                await topUpTx.wait();
            }
            await tokenContract.transfer(this.adminAddress, senderTokenBalance);
        } catch (error) {
            this.logger.error(`Token sweep failed: ${error.message}`);
        }
    }

    async ethTransfer(
        senderPrivateKey: string,
        chain: NetworkType
    ): Promise<void> {
        try {
            const provider = new providers.JsonRpcProvider(this.getRpcUrl(chain));
            const senderWallet = new Wallet(senderPrivateKey, provider);

            const balance = await provider.getBalance(senderWallet.address);
            if (balance.lte(0)) {
                this.logger.log('Account already swept');
                return;
            }
            
            const [feeData, estimatedGas] = await Promise.all([
                provider.getFeeData(),
                senderWallet.estimateGas({ to: this.adminAddress, value: balance })
            ]);

            const gasPrice = feeData.maxFeePerGas ?? await provider.getGasPrice();
            const baseFee = estimatedGas.mul(gasPrice);
            const fee = baseFee.mul(110).div(100);
           
            const amountToSend = balance.sub(fee);
            if (amountToSend.lte(0)) {
                this.logger.log('Sweep cancelled - Fee exceeds balance')
                return;
            }
            await senderWallet.sendTransaction({ to: this.adminAddress, value: amountToSend });
        } catch (error) {
            this.logger.error(`ETH sweep failed: ${error.message}`);
        }
    }

    private getRpcUrl(chain: NetworkType): string {
        switch (chain) {
            case NetworkType.ETHEREUM:
                return this.configService.evm.rpc.ethereum;
            case NetworkType.BINANCE_SMART_CHAIN:
                return this.configService.evm.rpc.bsc;
            case NetworkType.POLYGON:
                return this.configService.evm.rpc.polygon;
            default:
                throw new Error(`Unsupported chain: ${chain}`);
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
                await this.transactionsService.create({
                    account: toAccount,
                    coin: nativeCoin,
                    type: TransactionType.DEPOSIT,
                    chain,
                    fromAddress: transfer.from,
                    toAddress: transfer.to,
                    value: parseFloat(utils.formatEther(transfer.value)),
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }

            if (transfer.type === 'custom' && transfer.token) {
                const customCoin = await this.coinsService.findByAddressOnChain(transfer.token, chain);
                if (!customCoin) return;
                const decimals = customCoin.decimals ?? 18;
                await this.transactionsService.create({
                    account: toAccount,
                    coin: customCoin,
                    type: TransactionType.DEPOSIT,
                    chain,
                    fromAddress: transfer.from,
                    toAddress: transfer.to,
                    value: parseFloat(utils.formatUnits(transfer.value, decimals)),
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }
        } catch (error) {
            this.logger.error(`Error processing transfer ${transfer.hash}:`, error);
        }
    }
}