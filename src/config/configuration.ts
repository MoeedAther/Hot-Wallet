import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  ENCRYPTION_KEY: Joi.string().required(),
  ALCHEMY_URL: Joi.string().uri().required(),
  QUICK_NODE_API_KEY: Joi.string().required(),

  // EVM ENV
  EVM_ADMIN: Joi.string().required(),
  EVM_ADMIN_SK: Joi.string().required(),
  ETHEREUM_RPC: Joi.string().uri().required(),
  POLYGON_RPC: Joi.string().uri().required(),
  BSC_RPC: Joi.string().uri().required(),

  // SOLANA ENV
  SOLANA_RPC: Joi.string().uri().required(),
  SOLANA_ADMIN: Joi.string().required(),
  SOLANA_ADMIN_SK: Joi.string().required(),

  // TRON ENV
  TRON_RPC: Joi.string().uri().required(),
  TRON_ADMIN: Joi.string().required(),
  TRON_ADMIN_SK: Joi.string().required(),

  // XRPL ENV
  XRPL_WS: Joi.string().uri().required(),
  XRPL_ADMIN: Joi.string().required(),
  XRPL_ADMIN_SK: Joi.string().required(),

  // BTC ENV
  BTC_ADMIN: Joi.string().required(),
  BTC_ADMIN_SK: Joi.string().required(),
  BTC_RPC: Joi.string().uri().required(),
});

export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL!,
  encryptionKey: process.env.ENCRYPTION_KEY!,
  alchemyUrl: process.env.ALCHEMY_URL!,
  quickNodeApiKey: process.env.QUICK_NODE_API_KEY!,

  evm: {
    admin: process.env.EVM_ADMIN!,
    adminSk: process.env.EVM_ADMIN_SK!,
    rpc: {
      ethereum: process.env.ETHEREUM_RPC!,
      polygon: process.env.POLYGON_RPC!,
      bsc: process.env.BSC_RPC!,
    }
  },

  solana: {
    rpc: process.env.SOLANA_RPC!,
    admin: process.env.SOLANA_ADMIN!,
    adminSk: process.env.SOLANA_ADMIN_SK!,
  },

  tron: {
    rpc: process.env.TRON_RPC!,
    admin: process.env.TRON_ADMIN!,
    adminSk: process.env.TRON_ADMIN_SK!,
  },

  xrpl: {
    ws: process.env.XRPL_WS!,
    admin: process.env.XRPL_ADMIN!,
    adminSk: process.env.XRPL_ADMIN_SK!,
  },

  btc: {
    admin: process.env.BTC_ADMIN!,
    adminSk: process.env.BTC_ADMIN_SK!,
    rpc:process.env.BTC_RPC!
  },
});

export type AppConfig = ReturnType<typeof import('./configuration').default>;