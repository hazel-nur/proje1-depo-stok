import { Injectable } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private repository: AdminRepository) {}

  async stats() {
    const d = await this.repository.collect();
    const tip = (t: string) => d.hareketler7gun.find((h) => h.tip === t);
    return {
      kullanicilar: {
        aktif: d.kullanici,
        silinmis: d.kullaniciSilinmis,
        rolDagilimi: Object.fromEntries(d.roller.map((r) => [r.role, r._count._all])),
      },
      sayilar: {
        urun: d.urun,
        kategori: d.kategori,
        depo: d.depo,
        tedarikci: d.tedarikci,
        stokHareketi: d.hareketToplam,
      },
      silinenler: {
        kullanici: d.kullaniciSilinmis,
        urun: d.urunSilinmis,
        kategori: d.kategoriSilinmis,
        depo: d.depoSilinmis,
        tedarikci: d.tedarikciSilinmis,
        transferTalebi: d.transferSilinmis,
        satinAlmaTalebi: d.satinAlmaSilinmis,
        sayim: d.sayimSilinmis,
        toplam:
          d.kullaniciSilinmis + d.urunSilinmis + d.kategoriSilinmis + d.depoSilinmis +
          d.tedarikciSilinmis + d.transferSilinmis + d.satinAlmaSilinmis + d.sayimSilinmis,
      },
      bekleyenIsler: {
        transferTalebi: d.bekleyenTransfer,
        satinAlmaOnayBekleyen: d.bekleyenSatinAlma,
        satinAlmaTeslimBekleyen: d.onayliSatinAlma,
        acikSayim: d.acikSayim,
      },
      stok: {
        toplamAdet: d.toplamStokAdedi,
        toplamDeger: d.toplamStokDegeri,
        dusukStokUrunSayisi: d.dusukStokUrunSayisi,
      },
      son7Gun: {
        giris: { adet: tip('GIRIS')?._count._all ?? 0, miktar: tip('GIRIS')?._sum.miktar ?? 0 },
        cikis: { adet: tip('CIKIS')?._count._all ?? 0, miktar: tip('CIKIS')?._sum.miktar ?? 0 },
        transfer: { adet: tip('TRANSFER')?._count._all ?? 0, miktar: tip('TRANSFER')?._sum.miktar ?? 0 },
      },
      sonHareketler: d.sonHareketler,
    };
  }
}
