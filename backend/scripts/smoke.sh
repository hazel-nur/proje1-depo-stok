#!/usr/bin/env bash
# Ana akışların curl ile doğrulanması. Önce `npm run seed` çalışmış ve sunucu ayakta olmalı.
# Kullanım:  BASE=http://localhost:3001 bash scripts/smoke.sh
BASE=${BASE:-http://localhost:3001}
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "  OK   $1"; }
bad()  { FAIL=$((FAIL+1)); echo "  FAIL $1 (beklenen: $2, gelen: $3)"; }
# req METHOD PATH TOKEN [JSON]  -> BODY ve CODE değişkenlerini doldurur
req() {
  local out; out=$(curl -s -w '\n%{http_code}' -X "$1" "$BASE$2" -H 'Content-Type: application/json' \
    ${3:+-H "Authorization: Bearer $3"} ${4:+-d "$4"})
  CODE=$(echo "$out" | tail -n1); BODY=$(echo "$out" | sed '$d')
}
expect() { [ "$CODE" = "$2" ] && ok "$1 -> $CODE" || bad "$1" "$2" "$CODE"; }
eq()     { [ "$2" = "$3" ] && ok "$1 = $2" || bad "$1" "$3" "$2"; }
login()  { req POST /auth/login "" "{\"email\":\"$1\",\"sifre\":\"$2\"}"; echo "$BODY" | jq -r .access_token; }

echo "== Giriş (4 rol)"
ADMIN=$(login admin@depo.com 'Admin123!'); SUBE=$(login sube@depo.com 'Sube123!')
SATIN=$(login satinalma@depo.com 'Satin123!'); DEPO=$(login depo@depo.com 'Depo123!')
[ -n "$ADMIN" ] && [ "$ADMIN" != null ] && ok "tokenlar alındı" || bad "login" "token" "yok"
req POST /auth/login "" '{"email":"admin@depo.com","sifre":"yanlis"}'; expect "yanlış şifre" 401
echo "$BODY" | jq -e '.error and .code' >/dev/null && ok "hata biçimi {error,code}" || bad "hata biçimi" "{error,code}" "$BODY"
req GET /products ""; expect "token yok" 401

echo "== Refresh / logout"
req POST /auth/login "" '{"email":"depo@depo.com","sifre":"Depo123!"}'; R1=$(echo "$BODY" | jq -r .refresh_token)
req POST /auth/refresh "" "{\"refresh_token\":\"$R1\"}"; expect "refresh" 200; R2=$(echo "$BODY" | jq -r .refresh_token); A2=$(echo "$BODY" | jq -r .access_token)
req POST /auth/refresh "" "{\"refresh_token\":\"$R1\"}"; expect "eski refresh token reddedilir (rotation)" 401
req POST /auth/refresh "" "{\"refresh_token\":\"$R2\"}"; expect "reuse sonrası oturum kapanır" 401
req POST /auth/login "" '{"email":"depo@depo.com","sifre":"Depo123!"}'; R3=$(echo "$BODY" | jq -r .refresh_token); A3=$(echo "$BODY" | jq -r .access_token)
req POST /auth/logout "$A3"; expect "logout" 200
req POST /auth/refresh "" "{\"refresh_token\":\"$R3\"}"; expect "logout sonrası refresh" 401
DEPO=$(login depo@depo.com 'Depo123!')

echo "== Rol matrisi"
req GET /users "$DEPO"; expect "Depo Personeli /users" 403
req GET /admin/stats "$SUBE"; expect "Şube Yöneticisi /admin/stats" 403
req GET /admin/stats "$ADMIN"; expect "Admin /admin/stats" 200
req POST /stock-movements/transfer "$DEPO" '{}'; expect "Depo doğrudan transfer" 403
req POST /purchase-requests "$DEPO" '{}'; expect "Depo satın alma oluşturma" 403
req POST /auth/register "" '{"ad":"X","email":"x'$RANDOM'@t.com","sifre":"123456","role":"Admin"}'; expect "register" 201
echo "$BODY" | jq -r .role | { read r; eq "register rolü zorlanır" "$r" "Depo Personeli"; }

echo "== Kategori / ürün / depo / tedarikçi"
S=$RANDOM
req POST /categories "$SUBE" "{\"ad\":\"Test Kat $S\"}"; expect "kategori oluştur" 201; CAT=$(echo "$BODY" | jq -r .id)
req POST /products "$SUBE" "{\"ad\":\"Test Ürün\",\"sku\":\"T-$S\",\"fiyat\":100,\"minStokSeviyesi\":10,\"categoryId\":\"$CAT\",\"stokMiktari\":999}"; expect "ürün oluştur" 201; P=$(echo "$BODY" | jq -r .id)
eq "stokMiktari body'den yok sayılır" "$(echo "$BODY" | jq -r .stokMiktari)" 0
req POST /warehouses "$SUBE" "{\"ad\":\"Depo A $S\"}"; expect "depo A" 201; WA=$(echo "$BODY" | jq -r .id)
req POST /warehouses "$SUBE" "{\"ad\":\"Depo B $S\"}"; expect "depo B" 201; WB=$(echo "$BODY" | jq -r .id)
req POST /suppliers "$SATIN" "{\"ad\":\"Tedarikçi $S\"}"; expect "tedarikçi" 201; SUP=$(echo "$BODY" | jq -r .id)

echo "== Stok hareketi (giriş/çıkış/transfer)"
req POST /stock-movements/entry "$DEPO" "{\"productId\":\"$P\",\"warehouseId\":\"$WA\",\"miktar\":50}"; expect "giriş 50" 201
req POST /stock-movements/exit "$DEPO" "{\"productId\":\"$P\",\"warehouseId\":\"$WA\",\"miktar\":999}"; expect "yetersiz stok çıkışı" 409
req POST /stock-movements/exit "$DEPO" "{\"productId\":\"$P\",\"warehouseId\":\"$WA\",\"miktar\":5}"; expect "çıkış 5" 201
req POST /stock-movements/transfer "$SUBE" "{\"productId\":\"$P\",\"sourceWarehouseId\":\"$WA\",\"targetWarehouseId\":\"$WA\",\"miktar\":1}"; expect "aynı depoya transfer" 400
req POST /stock-movements/transfer "$SUBE" "{\"productId\":\"$P\",\"sourceWarehouseId\":\"$WA\",\"targetWarehouseId\":\"$WB\",\"miktar\":10}"; expect "transfer 10" 201
req GET "/warehouse-stocks?productId=$P" "$DEPO"
eq "A deposu" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WA\")][0].miktar")" 35
eq "B deposu" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WB\")][0].miktar")" 10
req GET "/products/$P" "$DEPO"; eq "ürün toplam stok" "$(echo "$BODY" | jq .stokMiktari)" 45

echo "== Düşük stok"
req POST /products "$SUBE" "{\"ad\":\"Az Stok\",\"sku\":\"L-$S\",\"fiyat\":10,\"minStokSeviyesi\":100,\"categoryId\":\"$CAT\"}"; LOWP=$(echo "$BODY" | jq -r .id)
req GET /warehouse-stocks/low "$DEPO"; expect "düşük stok" 200
eq "düşük stok listesinde" "$(echo "$BODY" | jq "[.[]|select(.id==\"$LOWP\")]|length")" 1

echo "== Transfer talebi (onay akışı)"
req POST /transfer-requests "$DEPO" "{\"productId\":\"$P\",\"sourceWarehouseId\":\"$WA\",\"targetWarehouseId\":\"$WB\",\"miktar\":5}"; expect "talep aç" 201; TR=$(echo "$BODY" | jq -r .id)
req PATCH "/transfer-requests/$TR/approve" "$DEPO"; expect "Depo onaylayamaz" 403
req PATCH "/transfer-requests/$TR/approve" "$SUBE"; expect "Şube onaylar" 200
eq "durum" "$(echo "$BODY" | jq -r .durum)" ONAYLANDI
req PATCH "/transfer-requests/$TR/approve" "$SUBE"; expect "ikinci onay" 409
req GET "/warehouse-stocks?productId=$P" "$DEPO"
eq "A (onay sonrası)" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WA\")][0].miktar")" 30
eq "B (onay sonrası)" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WB\")][0].miktar")" 15
req POST /transfer-requests "$DEPO" "{\"productId\":\"$P\",\"sourceWarehouseId\":\"$WA\",\"targetWarehouseId\":\"$WB\",\"miktar\":500}"; TR2=$(echo "$BODY" | jq -r .id)
req PATCH "/transfer-requests/$TR2/approve" "$ADMIN"; expect "yetersiz stokla onay" 409
req GET "/transfer-requests/$TR2" "$ADMIN"; eq "başarısız onay geri alındı (BEKLIYOR)" "$(echo "$BODY" | jq -r .durum)" BEKLIYOR
req PATCH "/transfer-requests/$TR2/reject" "$SUBE" '{"redNedeni":"Stok yok"}'; expect "reddet" 200

echo "== Satın alma (oluştur/onayla/teslim al)"
req POST /purchase-requests "$SATIN" "{\"supplierId\":\"$SUP\",\"warehouseId\":\"$WB\",\"items\":[{\"productId\":\"$P\",\"miktar\":20,\"birimFiyat\":50}]}"; expect "talep oluştur" 201; PR=$(echo "$BODY" | jq -r .id)
eq "toplam tutar" "$(echo "$BODY" | jq .toplamTutar)" 1000
req PATCH "/purchase-requests/$PR/receive" "$DEPO"; expect "onaysız teslim" 409
req PATCH "/purchase-requests/$PR/approve" "$SATIN"; expect "Satın Alma onaylayamaz" 403
req PATCH "/purchase-requests/$PR/approve" "$SUBE"; expect "onayla" 200
req PATCH "/purchase-requests/$PR/receive" "$DEPO"; expect "teslim al" 200
eq "durum" "$(echo "$BODY" | jq -r .durum)" TESLIM_ALINDI
req GET "/warehouse-stocks?productId=$P" "$DEPO"
eq "B (teslim sonrası)" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WB\")][0].miktar")" 35
req PATCH "/purchase-requests/$PR/receive" "$DEPO"; expect "ikinci teslim" 409

echo "== Sayım"
req POST /inventory-counts "$DEPO" "{\"warehouseId\":\"$WA\",\"items\":[{\"productId\":\"$P\",\"sayilanMiktar\":28}]}"; expect "sayım oluştur" 201; IC=$(echo "$BODY" | jq -r .id)
eq "beklenen" "$(echo "$BODY" | jq '.items[0].beklenenMiktar')" 30
eq "fark = gerçek-beklenen" "$(echo "$BODY" | jq '.items[0].fark')" -2
req PATCH "/inventory-counts/$IC/apply" "$DEPO"; expect "Depo uygulayamaz" 403
req PATCH "/inventory-counts/$IC/apply" "$SUBE"; expect "uygula" 200
req GET "/warehouse-stocks?productId=$P" "$DEPO"
eq "A (sayım sonrası)" "$(echo "$BODY" | jq "[.[]|select(.warehouseId==\"$WA\")][0].miktar")" 28
req GET "/products/$P" "$DEPO"; eq "ürün toplam (sayım sonrası)" "$(echo "$BODY" | jq .stokMiktari)" 63
req PATCH "/inventory-counts/$IC/apply" "$SUBE"; expect "ikinci uygulama" 409

echo "== Soft / hard delete"
req DELETE "/products/$LOWP" "$SUBE"; expect "soft delete" 200
req GET "/products/$LOWP" "$SUBE"; expect "silinmiş ürün 404" 404
req GET /products/deleted "$SUBE"; expect "Şube silinenleri göremez" 403
req GET /products/deleted "$ADMIN"; expect "Admin silinenleri görür" 200
eq "silinen listede" "$(echo "$BODY" | jq "[.[]|select(.id==\"$LOWP\")]|length")" 1
req PATCH "/products/$LOWP/restore" "$SUBE"; expect "Şube restore edemez" 403
req PATCH "/products/$LOWP/restore" "$ADMIN"; expect "restore" 200
req DELETE "/products/$LOWP/hard" "$SUBE"; expect "Şube hard delete edemez" 403
req DELETE "/products/$LOWP/hard" "$ADMIN"; expect "hard delete" 200
req DELETE "/warehouses/$WA/hard" "$ADMIN"; expect "hareketli depo hard delete engellenir" 409

echo "== Doğrulama / throttle"
req POST /categories "$ADMIN" '{"ad":""}'; expect "boş ad" 400
echo "$BODY" | jq -r .code | { read c; eq "doğrulama kodu" "$c" VALIDATION_ERROR; }
req GET /admin/stats "$ADMIN"; echo "$BODY" | jq -e '.stok.toplamAdet >= 0' >/dev/null && ok "stats gövdesi" || bad stats "json" "$BODY"

echo; echo "SONUÇ: $PASS başarılı, $FAIL başarısız"; [ $FAIL -eq 0 ]
