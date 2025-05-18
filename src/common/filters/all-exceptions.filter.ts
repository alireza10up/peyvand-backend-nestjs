import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status =
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

    response.status(status).json({
      ...responseBody,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
