-- CreateTable
CREATE TABLE `Escola` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `role` ENUM('SEDUC', 'DIRETOR', 'EXTERNO') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `escolaId` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ocorrencia` (
    `id` VARCHAR(191) NOT NULL,
    `protocolo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `criticidade` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Aberta',
    `localizacaoInterna` VARCHAR(191) NOT NULL,
    `endereco` VARCHAR(191) NOT NULL,
    `dataEnvio` DATETIME(3) NOT NULL,
    `dataAprovacao` DATETIME(3) NULL,
    `dataResolucao` DATETIME(3) NULL,
    `aprovadaPelaEscola` BOOLEAN NOT NULL DEFAULT true,
    `criadoPorEmail` VARCHAR(191) NOT NULL,
    `criadoPorNome` VARCHAR(191) NOT NULL DEFAULT '',
    `chatPendente` BOOLEAN NOT NULL DEFAULT false,
    `fotos` TEXT NOT NULL DEFAULT '[]',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `escolaId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Ocorrencia_protocolo_key`(`protocolo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interacao` (
    `id` VARCHAR(191) NOT NULL,
    `origem` VARCHAR(191) NOT NULL,
    `autor` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `status` VARCHAR(191) NULL,
    `anexos` TEXT NOT NULL DEFAULT '[]',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ocorrenciaId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogAuditoria` (
    `id` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `entidade` VARCHAR(191) NOT NULL,
    `entidadeId` VARCHAR(191) NULL,
    `descricao` TEXT NOT NULL,
    `usuarioEmail` VARCHAR(191) NULL,
    `usuarioNome` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `escolaId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `Escola`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ocorrencia` ADD CONSTRAINT `Ocorrencia_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `Escola`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interacao` ADD CONSTRAINT `Interacao_ocorrenciaId_fkey` FOREIGN KEY (`ocorrenciaId`) REFERENCES `Ocorrencia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAuditoria` ADD CONSTRAINT `LogAuditoria_escolaId_fkey` FOREIGN KEY (`escolaId`) REFERENCES `Escola`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
