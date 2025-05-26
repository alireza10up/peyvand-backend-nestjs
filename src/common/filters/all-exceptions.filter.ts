import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let responseBody: any =
      exception instanceof HttpException ? exception.getResponse() : exception;

    if (typeof responseBody === 'string') {
      responseBody = { message: [responseBody] };
    } else if (typeof responseBody === 'object' && responseBody !== null) {
      if (typeof responseBody.message === 'string') {
        responseBody.message = [responseBody.message];
      } else if (!responseBody.message) {
        responseBody.message = ['خطایی رخ داده است'];
      }
    } else {
      responseBody = { message: ['خطایی رخ داده است'] };
    }

    if (status === HttpStatus.UNAUTHORIZED) {
      responseBody.message = ['دسترسی غیرمجاز، لطفا وارد شوید'];
    }

    const errorLog = {
      timestamp: new Date().toISOString(),
      status,
      path: request.url,
      method: request.method,
      ip: request.ip,
      userId: request.user?.id || 'Guest',
      userAgent: request.headers['user-agent'],
      errorMessage: responseBody.message,
      errorStack: exception instanceof Error ? exception.stack : undefined,
      errorName: exception instanceof Error ? exception.name : 'Unknown',
      requestBody: this.sanitizeRequestBody(request.body),
      requestParams: request.params,
      requestQuery: request.query,
      headers: this.sanitizeHeaders(request.headers),
    };

    if (status >= 500) {
      this.logger.error(
        `🔴 Critical Error - ${errorLog.path} - ${errorLog.errorMessage}`,
        {
          error: errorLog,
          trace: exception instanceof Error ? exception.stack : undefined,
        },
      );
    } else if (status >= 400 && status < 500) {
      this.logger.warn(
        `🟠 User Error - ${errorLog.path} - ${errorLog.errorMessage}`,
        {
          error: errorLog,
        },
      );
    } else {
      this.logger.log(
        `🟡 Error Info - ${errorLog.path} - ${errorLog.errorMessage}`,
        {
          error: errorLog,
        },
      );
    }

    response.status(status).json({
      ...responseBody,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      errorId: this.generateErrorId(),
    });
  }

  private generateErrorId(): string {
    return `ERR-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };

    const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[Filter Security Field]';
      }
    });

    return sanitized;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return {};

    const sanitized = { ...body };

    const sensitiveFields = [
      'password',
      'passwordConfirmation',
      'token',
      'refreshToken',
      'credit_card',
    ];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[Filter Security Field]';
      }
    });

    return sanitized;
  }
}
