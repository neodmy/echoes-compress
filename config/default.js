module.exports = {
  server: {
    host: '0.0.0.0',
    port: 4000,
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE,
    initialSync: process.env.INITIAL_SYNC,
  },
  controller: {
    opendataPath: '/opendata',
    localPath: '/echoes',
    deleteOffset: process.env.DELETE_OFFSET || 15,
  },
  routes: {
    admin: {
      swaggerOptions: {
        swaggerDefinition: {
          info: {
            description: 'Documentation for echoes-compress',
            title: 'echoes-compress',
            version: '1.0.0',
          },
          host: process.env.SERVICE_ENV || 'localhost:4000',
          basePath: '/v1',
          produces: ['application/json'],
          schemes: ['http'],
          securityDefinitions: {
            JWT: {
              type: 'apiKey',
              in: 'header',
              name: 'Authorization',
              description: '',
            },
          },
        },
      },
    },
  },
  logger: {
    transport: 'console',
    include: [
      'tracer',
      'timestamp',
      'level',
      'message',
      'error.message',
      'error.code',
      'error.stack',
      'request.url',
      'request.headers',
      'request.params',
      'request.method',
      'response.statusCode',
      'response.headers',
      'response.time',
      'process',
      'system',
      'package.name',
      'service',
    ],
    exclude: ['password', 'secret', 'token', 'request.headers.cookie', 'dependencies', 'devDependencies'],
  },
};
