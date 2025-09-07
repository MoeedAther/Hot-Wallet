import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AppConfigService } from 'src/config/config.service';
import { Client, dropsToXrp, Payment, Wallet, xrpToDrops } from 'xrpl';
import { TransactionData } from 'src/interfaces';
import { AccountsService } from 'src/accounts/accounts.service';
import { CoinsService } from 'src/coins/coins.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { NetworkType, TransactionType } from 'src/enums';
import { WebhookTransfer } from '../blockchain.controller';

@Injectable()
export class XrplService {
    private readonly logger = new Logger(XrplService.name);
    private readonly client: Client;
    private readonly xrplWs: string;
    private readonly adminAddress: string;
    private readonly adminPrivateKey: string;

    constructor(
        private configService: AppConfigService,
        @Inject(forwardRef(() => AccountsService)) private readonly accountsService: AccountsService,
        private readonly coinsService: CoinsService,
        @Inject(forwardRef(() => TransactionsService)) private readonly transactionsService: TransactionsService,
    ) {
        this.xrplWs = this.configService.xrpl.ws;
        this.adminAddress = this.configService.xrpl.admin;
        this.adminPrivateKey = this.configService.xrpl.adminSk;
        this.client = new Client(this.xrplWs)
    }

    createWallet() {
        const wallet = Wallet.generate();
        return {
            address: wallet.classicAddress,
            privateKey: wallet.seed ?? wallet.privateKey,
        };
    }


    async xrpWithdraw(userAddress: string, amount: number): Promise<TransactionData> {
        try {
            await this.client.connect()
            const adminWallet = Wallet.fromSeed(this.adminPrivateKey)
            const serverInfo = await this.client.request({ command: "server_info" })
            if (!serverInfo.result.info.validated_ledger) throw new Error("Server not ready")
            const reserveBase = serverInfo.result.info.validated_ledger.reserve_base_xrp

            const accountInfo = await this.client.request({
                command: "account_info",
                account: adminWallet.address,
                ledger_index: "validated"
            })

            const balance = dropsToXrp(accountInfo.result.account_data.Balance)

            const payment: Payment = {
                TransactionType: "Payment",
                Account: adminWallet.address,
                Amount: xrpToDrops(amount),
                Destination: userAddress,
            }

            const prepared = await this.client.autofill(payment)
            const fee = dropsToXrp(prepared.Fee!)

            if (balance < (amount + reserveBase + fee)) throw new Error("Insufficient balance")
            const signed = adminWallet.sign(prepared)
            const result = await this.client.submitAndWait(signed.tx_blob);
            return {
                fromAddress: adminWallet.address,
                toAddress: userAddress,
                amount: amount,
                txHash: result.result.hash,
                blockNumber: result.result.ledger_index || 0
            };
        } catch (error) {
            throw error;
        } finally {
            await this.client.disconnect()
        }
    }

    async xrpTransfer(senderPrivateKey: string): Promise<void> {
        try {
            await this.client.connect()
            const senderWallet = Wallet.fromSeed(senderPrivateKey);
            const serverInfo = await this.client.request({ command: "server_info" })
            if (!serverInfo.result.info.validated_ledger) throw new Error("Server not ready")
            const reserveBase = serverInfo.result.info.validated_ledger.reserve_base_xrp

            const accountInfo = await this.client.request({
                command: "account_info",
                account: senderWallet.address,
                ledger_index: "validated"
            })

            const balance = dropsToXrp(accountInfo.result.account_data.Balance)

            const transferableBalance = balance - reserveBase
            if (transferableBalance <= 0) {
                this.logger.log('Account already swept');
                return
            }

            const payment: Payment = {
                TransactionType: "Payment",
                Account: senderWallet.address,
                Amount: xrpToDrops(transferableBalance),
                Destination: this.adminAddress,
            }

            const prepared = await this.client.autofill(payment)
            const fee = dropsToXrp(prepared.Fee!)

            const amountAfterFee = transferableBalance - fee
            if (amountAfterFee <= 0) {
                this.logger.log('Sweep cancelled - Fee exceeds balance')
                return
            }

            const adjustedPayment: Payment = { ...prepared, Amount: xrpToDrops(amountAfterFee) }
            const signed = senderWallet.sign(adjustedPayment)
            await this.client.submit(signed.tx_blob)
            this.logger.log('XRP sweep successful')
        } catch (error) {
            this.logger.error('XRP sweep failed', error)
        } finally {
            await this.client.disconnect()
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
                    value: parseFloat(dropsToXrp(transfer.value).toString()),
                    txHash: transfer.hash,
                    blockNumber: transfer.blockNumber,
                });
                return;
            }
        } catch (error) {
            this.logger.error(`Error processing XRP transfer ${transfer.hash}:`, error as any);
        }
    }
}
