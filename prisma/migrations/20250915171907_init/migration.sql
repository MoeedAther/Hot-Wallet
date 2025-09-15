-- CreateTable
CREATE TABLE `wallet_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `chain` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `privateKey` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wallet_accounts_userId_idx`(`userId`),
    INDEX `wallet_accounts_chain_idx`(`chain`),
    INDEX `wallet_accounts_address_idx`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_coins` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `symbol` VARCHAR(50) NOT NULL,
    `decimals` INTEGER NULL,
    `address` VARCHAR(255) NULL,
    `wrappedAddress` VARCHAR(255) NOT NULL,
    `withdrawFeeInUsd` DOUBLE NOT NULL,
    `chain` VARCHAR(50) NOT NULL,
    `isNative` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wallet_coins_address_idx`(`address`),
    INDEX `wallet_coins_chain_idx`(`chain`),
    UNIQUE INDEX `wallet_coins_symbol_chain_key`(`symbol`, `chain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `coinId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `chain` VARCHAR(191) NOT NULL,
    `value` DOUBLE NOT NULL,
    `fromAddress` VARCHAR(255) NOT NULL,
    `toAddress` VARCHAR(255) NOT NULL,
    `txHash` VARCHAR(191) NOT NULL,
    `blockNumber` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `wallet_transactions_txHash_key`(`txHash`),
    INDEX `wallet_transactions_fromAddress_idx`(`fromAddress`),
    INDEX `wallet_transactions_toAddress_idx`(`toAddress`),
    INDEX `wallet_transactions_txHash_idx`(`txHash`),
    INDEX `wallet_transactions_chain_idx`(`chain`),
    INDEX `wallet_transactions_blockNumber_idx`(`blockNumber`),
    INDEX `wallet_transactions_userId_idx`(`userId`),
    INDEX `wallet_transactions_accountId_idx`(`accountId`),
    INDEX `wallet_transactions_coinId_idx`(`coinId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wallet_balances` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `coinId` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `wallet_balances_userId_idx`(`userId`),
    INDEX `wallet_balances_accountId_idx`(`accountId`),
    INDEX `wallet_balances_coinId_idx`(`coinId`),
    UNIQUE INDEX `wallet_balances_userId_accountId_coinId_key`(`userId`, `accountId`, `coinId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `wallet_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_transactions` ADD CONSTRAINT `wallet_transactions_coinId_fkey` FOREIGN KEY (`coinId`) REFERENCES `wallet_coins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_balances` ADD CONSTRAINT `wallet_balances_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `wallet_accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wallet_balances` ADD CONSTRAINT `wallet_balances_coinId_fkey` FOREIGN KEY (`coinId`) REFERENCES `wallet_coins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

