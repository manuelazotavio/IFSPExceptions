-- CreateTable
CREATE TABLE `Comodo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `escolaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Comodo` ADD CONSTRAINT `Comodo_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `Escola`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
