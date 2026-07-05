-- CreateTable
CREATE TABLE "Ocorrencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "criticidade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Aberta',
    "localizacaoInterna" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "dataEnvio" DATETIME NOT NULL,
    "dataAprovacao" DATETIME,
    "dataResolucao" DATETIME,
    "aprovadaPelaEscola" BOOLEAN NOT NULL DEFAULT true,
    "criadoPorEmail" TEXT NOT NULL,
    "chatPendente" BOOLEAN NOT NULL DEFAULT false,
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "escolaId" TEXT NOT NULL,
    CONSTRAINT "Ocorrencia_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Interacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "origem" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ocorrenciaId" TEXT NOT NULL,
    CONSTRAINT "Interacao_ocorrenciaId_fkey" FOREIGN KEY ("ocorrenciaId") REFERENCES "Ocorrencia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Ocorrencia_protocolo_key" ON "Ocorrencia"("protocolo");
