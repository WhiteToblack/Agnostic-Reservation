# Dashboard Özelleştirme Rehberi

Bu doküman, kullanıcı bazlı pano (dashboard) deneyimini nasıl yöneteceğinizi ve yeni uç noktaları nasıl kullanacağınızı açıklar.

## Özelleştirme Modeli

* Varsayılan düzenler hâlâ rol bazlıdır (`UserId` sütunu `NULL`).
* Her kullanıcı için kişiselleştirilmiş panolar `DashboardDefinitions` tablosunda `UserId` ve `LayoutConfigJson` alanları ile saklanır.
* Widget sıraları ve bireysel ayarlar `DashboardWidgets` tablosundaki `Order` ve `ConfigJson` alanlarında tutulur.
* Yeni `IX_DashboardDefinitions_Tenant_Role_User` index'i tenant, rol ve kullanıcı düzeyinde tekil pano garantisi verir.

## REST API Uç Noktaları

| Metot | Yol | Açıklama |
|-------|-----|----------|
| `GET` | `/api/dashboard?tenantId=&roleId=` | Rol bazlı varsayılan panoyu döner. |
| `GET` | `/api/dashboard/user?tenantId=&roleId=&userId=` | Kullanıcıya özel panoyu oluşturur veya mevcutsa döner. |
| `PUT` | `/api/dashboard/user/{dashboardId}` | `LayoutConfig` ve widget sıralarını günceller. |

### `PUT /api/dashboard/user/{dashboardId}` İstek Gövdesi

```json
{
  "layoutConfig": "{\"accent\":\"midnight\",\"density\":\"compact\"}",
  "widgets": [
    { "id": "f8c1...", "order": 1, "configJson": "{\"title\":\"Bugün\"}" },
    { "id": "d9aa...", "order": 2, "configJson": null }
  ]
}
```

## Uygulama Notları

* `DashboardService.GetForUserAsync` kullanıcı panosu yoksa varsayılan rol panosundan widget'ları kopyalar ve aksiyonu loglar.
* `UpdateUserLayoutAsync` hem pano düzenini hem widget güncellemelerini idempotent bir şekilde işleyip loglamaktadır.
* Seed betikleri örnek olarak tenant yöneticisi için rol ve kullanıcı panoları oluşturur.

## UI Davranışı

* Web arayüzü, üst navigasyon çubuğu ve profil menüsü ile yeni tasarıma uyarlanmıştır.
* "Düzeni Düzenle" ekranı kullanıcıların widget sıralarını sürükle-bırak olmadan butonlarla değiştirmesine, görünürlüğü yönetmesine ve değişiklikleri kaydetmesine olanak tanır.
* Kaydetme işlemi, arka uçtaki yeni `PUT` uç noktasına istekte bulunur ve başarılı olduğunda kullanıcıya bildirim gösterir.

## Loglama

* `DashboardController` kullanıcı panosu okuma ve güncelleme isteklerini `ILogger` aracılığıyla kaydeder.
* `DashboardService` varsayılan/kullanıcı panosu oluşturma ve güncelleme eylemlerinde bilgi & debug seviyelerinde log üretir.

Bu rehber, yeni pano özelleştirme yeteneklerini devreye alırken geliştiricilere referans olması amacıyla hazırlanmıştır.
