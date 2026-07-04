import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const escolasSeed = [
  {
    id: 'esc-001',
    nome: 'EMEF Professor Alberto Souza',
    bairro: 'Centro',
    endereco: 'Rua das Palmeiras, 245',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    id: 'esc-002',
    nome: 'EMEI Jardim das Flores',
    bairro: 'Jardim das Flores',
    endereco: 'Av. Brasil, 1120',
    latitude: -23.562,
    longitude: -46.654,
  },
  {
    id: 'esc-003',
    nome: 'EMEF Vereador Joao Martins',
    bairro: 'Vila Nova',
    endereco: 'Rua Sete de Setembro, 88',
    latitude: -23.5789,
    longitude: -46.6412,
  },
]

async function main() {
  for (const escola of escolasSeed) {
    await prisma.escola.upsert({ where: { id: escola.id }, update: escola, create: escola })
  }

  const senhaHash = await bcrypt.hash('123456', 10)

  const usuarios = [
    { email: 'seduc@escola.gov.br', nome: 'Administrador SEDUC', role: 'SEDUC', escolaId: null },
    { email: 'diretor@escola.gov.br', nome: 'Diretora Alberto Souza', role: 'DIRETOR', escolaId: 'esc-001' },
    { email: 'professor@escola.gov.br', nome: 'Professor Alberto Souza', role: 'PROFESSOR', escolaId: 'esc-001' },
    { email: 'aluno@escola.gov.br', nome: 'Aluno Alberto Souza', role: 'ALUNO', escolaId: 'esc-001' },
  ]

  for (const usuario of usuarios) {
    await prisma.user.upsert({
      where: { email: usuario.email },
      update: usuario,
      create: { ...usuario, senha: senhaHash },
    })
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
