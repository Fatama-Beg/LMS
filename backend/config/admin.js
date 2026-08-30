module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'adminJwtSecretEduCoreKey123'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'apiTokenSaltEduCore123'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'transferTokenSalt123'),
    },
  },
});
