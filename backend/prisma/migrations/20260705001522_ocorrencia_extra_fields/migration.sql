-- AlterTable
ALTER TABLE "Interacao" ADD COLUMN "status" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ocorrencia" (
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
    "criadoPorNome" TEXT NOT NULL DEFAULT '',
    "chatPendente" BOOLEAN NOT NULL DEFAULT false,
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    "escolaId" TEXT NOT NULL,
    CONSTRAINT "Ocorrencia_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Ocorrencia" ("aprovadaPelaEscola", "atualizadoEm", "chatPendente", "criadoEm", "criadoPorEmail", "criticidade", "dataAprovacao", "dataEnvio", "dataResolucao", "descricao", "endereco", "escolaId", "fotos", "id", "localizacaoInterna", "protocolo", "status", "tipo", "titulo") SELECT "aprovadaPelaEscola", "atualizadoEm", "chatPendente", "criadoEm", "criadoPorEmail", "criticidade", "dataAprovacao", "dataEnvio", "dataResolucao", "descricao", "endereco", "escolaId", "fotos", "id", "localizacaoInterna", "protocolo", "status", "tipo", "titulo" FROM "Ocorrencia";
DROP TABLE "Ocorrencia";
ALTER TABLE "new_Ocorrencia" RENAME TO "Ocorrencia";
CREATE UNIQUE INDEX "Ocorrencia_protocolo_key" ON "Ocorrencia"("protocolo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
