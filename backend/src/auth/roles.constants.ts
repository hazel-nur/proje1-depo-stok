export const DEPO = 'Depo Personeli';
export const SATINALMA = 'Satın Alma Sorumlusu';
export const SUBE = 'Şube Yöneticisi';
export const ADMIN = 'Admin';

export const ROLLER = [DEPO, SATINALMA, SUBE, ADMIN];

export type AuthRequest = {
  user: { sub: string; email: string; role: string };
};
