-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `accounts` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `chain` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `privateKey` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `accounts_userId_idx`(`userId`),
    INDEX `accounts_chain_idx`(`chain`),
    INDEX `accounts_address_idx`(`address`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coins` (
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

    INDEX `coins_address_idx`(`address`),
    INDEX `coins_chain_idx`(`chain`),
    UNIQUE INDEX `coins_symbol_chain_key`(`symbol`, `chain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
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

    UNIQUE INDEX `transactions_txHash_key`(`txHash`),
    INDEX `transactions_fromAddress_idx`(`fromAddress`),
    INDEX `transactions_toAddress_idx`(`toAddress`),
    INDEX `transactions_txHash_idx`(`txHash`),
    INDEX `transactions_chain_idx`(`chain`),
    INDEX `transactions_blockNumber_idx`(`blockNumber`),
    INDEX `transactions_userId_idx`(`userId`),
    INDEX `transactions_accountId_idx`(`accountId`),
    INDEX `transactions_coinId_idx`(`coinId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `balances` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `coinId` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `balances_userId_idx`(`userId`),
    INDEX `balances_accountId_idx`(`accountId`),
    INDEX `balances_coinId_idx`(`coinId`),
    UNIQUE INDEX `balances_userId_accountId_coinId_key`(`userId`, `accountId`, `coinId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_coinId_fkey` FOREIGN KEY (`coinId`) REFERENCES `coins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `balances` ADD CONSTRAINT `balances_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `balances` ADD CONSTRAINT `balances_coinId_fkey` FOREIGN KEY (`coinId`) REFERENCES `coins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `balances` ADD CONSTRAINT `balances_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
