interface UtxoStatus {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
}

export interface Utxo {
    txid: string;
    vout: number;
    status: UtxoStatus;
    value: number;
}