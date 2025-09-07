import { BadRequestException, Injectable } from '@nestjs/common';
import { EvmService } from './evm/evm.service';
import { TronService } from './tron/tron.service';
import { SolanaService } from './solana/solana.service';
import { BtcService as BtcService } from './btc/btc.service';
import { XrplService } from './xrpl/xrpl.service';
import { NetworkType } from 'src/enums';

@Injectable()
export class BlockchainService {
    constructor(
        private evmService: EvmService,
        private tronService: TronService,
        private solanaService: SolanaService,
        private btcService: BtcService,
        private xrplService: XrplService,
    ) { }

    createWallets() {
        const evmWallet = this.evmService.createWallet();
        const tronWallet = this.tronService.createWallet();
        const solanaWallet = this.solanaService.createWallet();
        const xrplWallet = this.xrplService.createWallet();
        const btcWallet = this.btcService.createWallet();
        return {
            [NetworkType.ETHEREUM]: evmWallet,
            [NetworkType.SEPOLIA]: evmWallet,
            [NetworkType.POLYGON]: evmWallet,
            [NetworkType.BINANCE_SMART_CHAIN]: evmWallet,
            [NetworkType.TRON]: tronWallet,
            [NetworkType.SOLANA]: solanaWallet,
            [NetworkType.XRP]: xrplWallet,
            [NetworkType.BITCOIN]: btcWallet,
        };
    }

    async nativeWithdraw(userAddress: string, amount: number, chain: NetworkType) {
        switch (chain) {
            case NetworkType.ETHEREUM:
            case NetworkType.SEPOLIA:
            case NetworkType.POLYGON:
            case NetworkType.BINANCE_SMART_CHAIN:
                return this.evmService.ethWithdraw(userAddress, amount, chain);
            case NetworkType.TRON:
                return this.tronService.tronWithdraw(userAddress, amount);
            case NetworkType.SOLANA:
                return this.solanaService.solWithdraw(userAddress, amount);
            case NetworkType.XRP:
                return this.xrplService.xrpWithdraw(userAddress, amount);
            case NetworkType.BITCOIN:
                return this.btcService.btcWithdraw(userAddress, amount);
            default:
                throw new BadRequestException(`Unsupported chain: ${chain}`);
        }
    }

    async tokenWithdraw(userAddress: string, tokenAddress: string, amount: number, chain: NetworkType) {
        switch (chain) {
            case NetworkType.ETHEREUM:
            case NetworkType.SEPOLIA:
            case NetworkType.POLYGON:
            case NetworkType.BINANCE_SMART_CHAIN:
                return this.evmService.tokenWithdraw(userAddress, tokenAddress, amount, chain);
            case NetworkType.TRON:
                return this.tronService.tokenWithdraw(userAddress, tokenAddress, amount);
            case NetworkType.SOLANA:
                return this.solanaService.tokenWithdraw(userAddress, tokenAddress, amount);
            default:
                throw new BadRequestException(`Unsupported chain: ${chain}`);
        }
    }


    async sweepNativeFunds(senderPrivateKey: string, amount: number, chain: NetworkType) {
        switch (chain) {
            case NetworkType.ETHEREUM:
            case NetworkType.SEPOLIA:
            case NetworkType.POLYGON:
            case NetworkType.BINANCE_SMART_CHAIN:
                return this.evmService.ethTransfer(senderPrivateKey, chain);
            case NetworkType.TRON:
                return this.tronService.tronTransfer(senderPrivateKey);
            case NetworkType.SOLANA:
                return this.solanaService.solTransfer(senderPrivateKey);
            case NetworkType.XRP:
                return this.xrplService.xrpTransfer(senderPrivateKey);
            case NetworkType.BITCOIN:
                return this.btcService.btcTransfer(senderPrivateKey, amount);
            default:
                throw new BadRequestException(`Unsupported chain: ${chain}`);
        }
    }

    async sweepTokenFunds(senderPrivateKey: string, tokenAddress: string, amount: number, chain: NetworkType) {
        switch (chain) {
            case NetworkType.ETHEREUM:
            case NetworkType.SEPOLIA:
            case NetworkType.POLYGON:
            case NetworkType.BINANCE_SMART_CHAIN:
                return this.evmService.tokenTransfer(senderPrivateKey, tokenAddress, chain);
            case NetworkType.TRON:
                return this.tronService.tokenTransfer(senderPrivateKey, tokenAddress);
            case NetworkType.SOLANA:
                return this.solanaService.tokenTransfer(senderPrivateKey, tokenAddress);
            default:
                throw new BadRequestException(`Unsupported chain: ${chain}`);
        }
    }

}
