import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

const KODLAR: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

// Tüm hataları tek biçime çevirir: { error: "mesaj", code: "KOD" }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Beklenmeyen bir hata oluştu.';
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        error = body;
      } else if (body && typeof body === 'object') {
        const m = (body as any).message;
        error = Array.isArray(m) ? m.join('; ') : (m ?? exception.message);
        if (Array.isArray(m)) code = 'VALIDATION_ERROR';
      }
      if (status === 429) error = 'Çok fazla istek. Lütfen biraz bekleyin.';
    } else if (this.prismaKodu(exception)) {
      const k = this.prismaKodu(exception)!;
      if (k === 'P2002') {
        status = HttpStatus.CONFLICT;
        error = 'Bu kayıt zaten mevcut (benzersiz alan çakışması).';
      } else if (k === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        error = 'Kayıt bulunamadı.';
      } else if (k === 'P2003') {
        status = HttpStatus.CONFLICT;
        error = 'İlişkili kayıtlar nedeniyle işlem yapılamadı.';
      } else {
        this.logger.error(exception);
      }
    } else {
      this.logger.error(exception);
    }

    res.status(status).json({ error, code: code ?? KODLAR[status] ?? 'ERROR' });
  }

  private prismaKodu(e: unknown): string | null {
    if (e && typeof e === 'object' && 'code' in e) {
      const c = (e as any).code;
      if (typeof c === 'string' && /^P\d{4}$/.test(c)) return c;
    }
    return null;
  }
}
