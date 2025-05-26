import { Injectable } from '@nestjs/common';
import * as chalk from 'chalk';

@Injectable()
export class LogFormatService {
  /**
   * Formats error logs with appropriate styling and colors
   */
  formatErrorLog(
    level: 'error' | 'warn' | 'info',
    message: string,
    meta: any,
  ): string {
    const timestamp = new Date().toISOString();
    const formattedTimestamp = chalk.gray(`[${timestamp}]`);

    let levelBadge;
    switch (level) {
      case 'error':
        levelBadge = chalk.bgRed.white(' CRITICAL ERROR ');
        break;
      case 'warn':
        levelBadge = chalk.bgYellow.black(' WARNING ');
        break;
      case 'info':
        levelBadge = chalk.bgBlue.white(' INFO ');
        break;
    }

    const userInfo = meta?.userId
      ? chalk.cyan(`User: ${meta.userId}`)
      : chalk.gray('User: Guest');

    const pathInfo = meta?.path ? chalk.green(`Path: ${meta.path}`) : '';

    const methodInfo = meta?.method
      ? chalk.yellow(`Method: ${meta.method}`)
      : '';

    const errorMessage = message ? chalk.white(message) : '';

    // Additional information with beautiful formatting
    let additionalInfo = '';
    if (meta?.errorId) {
      additionalInfo += `\n${chalk.gray('┌')}${chalk.gray('─────────────── ADDITIONAL ERROR DETAILS ─────────────────')}`;
      additionalInfo += `\n${chalk.gray('│')} ${chalk.bold('Error ID:')} ${chalk.red(meta.errorId)}`;

      if (meta.errorName) {
        additionalInfo += `\n${chalk.gray('│')} ${chalk.bold('Error Type:')} ${chalk.red(meta.errorName)}`;
      }

      if (meta.ip) {
        additionalInfo += `\n${chalk.gray('│')} ${chalk.bold('IP Address:')} ${chalk.yellow(meta.ip)}`;
      }

      if (meta.userAgent) {
        additionalInfo += `\n${chalk.gray('│')} ${chalk.bold('User Agent:')} ${chalk.blue(meta.userAgent)}`;
      }

      additionalInfo += `\n${chalk.gray('└────────────────────────────────────────────────────')}`;
    }

    return `${formattedTimestamp} ${levelBadge} ${userInfo} ${pathInfo} ${methodInfo} ${errorMessage}${additionalInfo}`;
  }
}
