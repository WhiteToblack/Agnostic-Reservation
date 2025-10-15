# Mobile Runtime Troubleshooting

Bu not, Expo/React Native mobil uygulamasını çalıştırırken alınabilecek `TurboModuleRegistry.getEnforcing('PlatformConstants')` hatasını çözmek için izlenebilecek adımları açıklar. Hata genellikle JavaScript tarafındaki React Native sürümü ile cihazdaki native runtime (Expo Go veya prebuild edilmiş binary) birbirini tutmadığında görülür.

## 1. Sürüm uyumluluğunu doğrulayın

1. Depoda tanımlı Expo SDK sürümünü kontrol edin:
   ```bash
   cat apps/mobile/package.json | jq '.dependencies.expo'
   ```
2. Kullanılan Expo Go uygulamasının (veya bare build'in) aynı ana sürümü desteklediğinden emin olun. Örneğin `expo@~54.x` kullanıyorsanız cihazınızdaki Expo Go uygulamasının mağazadaki en güncel sürüm olduğundan emin olun.
3. Native binary (EAS build, `expo run:android`, `expo run:ios` vb.) ürettiyseniz, JavaScript tarafında sürüm yükselttiğinizde aynı adımları tekrar çalıştırarak yeni runtime'ı paketleyin.

## 2. Kilit dosyalarını sıfırlayıp bağımlılıkları yeniden kurun

Expo, bağımlılık sürümlerini eşitlemek için `expo install` komutunun kullanılmasını önerir.

```bash
cd apps/mobile
rm -rf node_modules package-lock.json
npx expo install
```

Bu adım Expo SDK sürümünüzle uyumlu React Native ve native modül sürümlerini yükler.

## 3. Metro önbelleğini ve Expo istemcisini temizleyin

```bash
npx expo start --clear
```

Cihazınızdan Expo Go uygulamasını tamamen kapatın. Eğer hata devam ediyorsa Expo Go uygulamasını kaldırıp yeniden yükleyin.

## 4. Bare/Custom build kullanıyorsanız native projeyi yeniden üretin

Prebuild edilmiş bir proje üzerinde çalışıyorsanız aşağıdaki adımları uygulayın:

```bash
cd apps/mobile
npx expo prebuild
# veya yalnızca ilgili platform için
npx expo prebuild -p android
npx expo prebuild -p ios
```

Ardından Android Studio ya da Xcode üzerinde projeyi tekrar derleyin. JavaScript tarafındaki sürüm artışları native proje dosyalarına yansıtılmadığında söz konusu hata oluşabilir.

## 5. Otomatik doğrulama çalıştırın

Expo, paket sürümlerinin desteklenen aralıkta olup olmadığını görmek için `expo doctor` komutunu sağlar.

```bash
cd apps/mobile
npx expo doctor
```

Komut, sürümü uyumsuz bağımlılıkları listeler. `expo install <paket-adı>` ile önerilen sürümlere geçin.

---

Yukarıdaki adımlar sonrasında hâlâ aynı hata görülüyorsa, CI/CD cache'lerinin temizlendiğinden ve cihazda eski bir binary kalmadığından emin olun. Gerekirse `adb uninstall <paket-adı>` (Android) veya Xcode üzerinden ilgili uygulamayı kaldırıp yeniden yükleyin.
