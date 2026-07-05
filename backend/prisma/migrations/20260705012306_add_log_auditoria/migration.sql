-- CreateTable
CREATE TABLE "LogAuditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "descricao" TEXT NOT NULL,
    "usuarioEmail" TEXT,
    "usuarioNome" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "escolaId" TEXT,
    CONSTRAINT "LogAuditoria_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "Escola" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
