-- Estrutura do Banco de Dados - Entregadores67
-- Este arquivo é para referência da estrutura de dados

-- Coleção: users
-- Documento: {uid}
{
  email: string,
  name: string,
  role: 'admin' | 'entregador',
  profileCompleted: boolean,
  createdAt: timestamp,
  lastLogin: timestamp
}

-- Coleção: entregadores  
-- Documento: {autoId}
{
  userId: string, // Referência ao users/{uid}
  userEmail: string,
  nome: string,
  cpf: string,
  telefone: string,
  veiculo: string,
  endereco: string,
  cidade: string,
  estado: string,
  cep: string,
  disponibilidade: string,
  possuiCnh: boolean,
  cnh: string | null,
  dataCadastro: timestamp,
  status: 'pendente' | 'aprovado' | 'rejeitado',
  verificado: boolean,
  ativo: boolean,
  dataAprovacao: timestamp | null
}

-- Coleção: pedidos
-- Documento: {autoId}
{
  description: string,
  quantity: number,
  status: 'pendente' | 'aceito' | 'em_rota' | 'entregue' | 'cancelado',
  createdBy: string, // userId do admin
  createdByName: string,
  acceptedBy: string | null, // userId do entregador
  acceptedByName: string | null,
  createdAt: timestamp,
  acceptedAt: timestamp | null,
  updatedAt: timestamp
}