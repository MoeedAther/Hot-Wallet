import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { NetworkType } from 'src/enums';
import { EvmService } from './evm/evm.service';
import { SolanaService } from './solana/solana.service';
import { TronService } from './tron/tron.service';
import { XrplService } from './xrpl/xrpl.service';
import { BtcService } from './btc/btc.service';


export interface WebhookTransfer {
    type: 'native' | 'custom';
    hash: string;
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp: number;
    token?: string;
}

export interface WebhookPayload {
    transfers: Array<WebhookTransfer>;
    metadata: any;
}

@Controller('webhook')
export class BlockchainController {
    private readonly logger = new Logger(BlockchainController.name);

    constructor(
        private readonly evmService: EvmService,
        private readonly solanaService: SolanaService,
        private readonly tronService: TronService,
        private readonly xrplService: XrplService,
        private readonly btcService: BtcService,
    ) {}


    @Post(NetworkType.ETHEREUM)
    @HttpCode(200)
    async handleEthereum(@Body() payload: WebhookPayload) {
        this.logger.log('Received webhook for ETHEREUM', JSON.stringify(payload.transfers, null, 2));
        if (Array.isArray(payload.transfers) && payload.transfers.length > 0) {
            for (const transfer of payload.transfers) {
                await this.evmService.processTransfers(transfer, NetworkType.ETHEREUM);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.POLYGON)
    @HttpCode(200)
    async handlePolygon(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.POLYGON}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.evmService.processTransfers(transfer, NetworkType.POLYGON);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.BINANCE_SMART_CHAIN)
    @HttpCode(200)
    async handleBinanceSmartChain(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.BINANCE_SMART_CHAIN}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.evmService.processTransfers(transfer, NetworkType.BINANCE_SMART_CHAIN);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.SOLANA)
    @HttpCode(200)
    async handleSolana(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.SOLANA}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.solanaService.processTransfers(transfer, NetworkType.SOLANA);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.TRON)
    @HttpCode(200)
    async handleTron(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.TRON}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.tronService.processTransfers(transfer, NetworkType.TRON);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.XRP)
    @HttpCode(200)
    async handleXrp(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.XRP}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.xrplService.processTransfers(transfer, NetworkType.XRP);
            }
        }
        return { ok: true };
    }

    @Post(NetworkType.BITCOIN)
    @HttpCode(200)
    async handleBitcoin(@Body() body: WebhookPayload) {
        this.logger.log(`Received webhook for ${NetworkType.BITCOIN}`, JSON.stringify(body.transfers, null, 2));
        if (Array.isArray(body.transfers) && body.transfers.length > 0) {
            for (const transfer of body.transfers) {
                await this.btcService.processTransfers(transfer, NetworkType.BITCOIN);
            }
        }
        return { ok: true };
    }
}
