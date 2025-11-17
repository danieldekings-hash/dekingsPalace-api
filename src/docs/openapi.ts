const openapi: any = {
  openapi: "3.0.3",
  info: {
    title: "DeKingsPalace API",
    version: "1.0.0",
    description: "API documentation for DeKingsPalace backend",
  },
  servers: [
    { url: "http://localhost:{port}", variables: { port: { default: "5500" } } },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      AuthLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
      AuthRegisterRequest: {
        type: "object",
        required: ["fullName", "email", "phoneNumber", "password", "confirmPassword"],
        properties: {
          fullName: { type: "string" },
          email: { type: "string", format: "email" },
          phoneNumber: { type: "string" },
          password: { type: "string", minLength: 8 },
          confirmPassword: { type: "string", minLength: 8 },
          referralCode: { type: "string" },
        },
      },
      Plan: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          tier: { type: "string" },
          minAmount: { type: "number" },
          maxAmount: { type: "number" },
          percentage: { type: "number" },
          duration: { type: "number" },
          isActive: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthLoginRequest" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterRequest" } } },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/plans": {
      get: {
        tags: ["Plans"],
        responses: { "200": { description: "List of active plans" } },
      },
      post: {
        tags: ["Plans"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Plan created" } },
      },
    },
    "/api/plans/{id}": {
      get: { tags: ["Plans"], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": { description: "OK" } } },
      put: { tags: ["Plans"], security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": { description: "Updated" } } },
      delete: { tags: ["Plans"], security: [{ bearerAuth: [] }], parameters: [{ name: "id", in: "path", required: true }], responses: { "200": { description: "Deactivated" } } },
    },
    "/api/wallet": { get: { tags: ["Wallet"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/wallet/addresses": { get: { tags: ["Wallet"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/wallet/tracking/deposits": { get: { tags: ["Wallet"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/wallet/tracking/deposits/public": {
      get: {
        tags: ["Wallet"],
        responses: { "200": { description: "Wallet tracker summary (public)" } },
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
            description: "Number of recent transactions to return",
          },
        ],
      },
    },
    "/api/wallet/deposit": { post: { tags: ["Wallet"], security: [{ bearerAuth: [] }], responses: { "201": { description: "Created" } } } },
    "/api/wallet/withdraw": { post: { tags: ["Wallet"], security: [{ bearerAuth: [] }], responses: { "201": { description: "Requested" } } } },
    "/api/transactions": { get: { tags: ["Transactions"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/transactions/export": { get: { tags: ["Transactions"], security: [{ bearerAuth: [] }], responses: { "200": { description: "CSV" } } } },
    "/api/referrals": { get: { tags: ["Referrals"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/referrals/list": { get: { tags: ["Referrals"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
    "/api/referrals/earnings": { get: { tags: ["Referrals"], security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } } },
  },
};

export default openapi;


