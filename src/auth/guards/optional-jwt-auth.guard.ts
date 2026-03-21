import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Retorna nulo se o token for invalido ou nao existir, ao inves de jogar erro 401
    if (err || !user) {
      return null;
    }
    return user;
  }
}
