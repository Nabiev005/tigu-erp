# ТигүүERP — иштеп чыгуу үчүн толук промпт

> Бул колдонуучу берген баштапкы техникалык тапшырма (2026-10-17), өзгөртүүсүз сакталды.
> Docker'сиз иштөө жана башка кабыл алынган чечимдер: [../CLAUDE.md](../CLAUDE.md).

> **Колдонуу:** төмөнкү текстти толугу менен AI-программистке (Claude Code, Cursor ж.б.) же иштеп чыгуучуга бериңиз. Дизайн-холсттон экрандардын скриншотторун (Share › Export) кошо тиркеңиз жана 2-бөлүмдөгү `[ШИЛТЕМЕ]` деген жерди алмаштырыңыз. Иш этап менен жүрөт: ар бир этаптан кийин натыйжаны текшерип, «улант» деп жазыңыз.

---

## 1. Сенин ролуң жана иштөө эрежелери

Сен — тажрыйбалуу full-stack иштеп чыгуучусуң (TypeScript, React, Node.js, PostgreSQL). Тигүү цехтери үчүн **ТигүүERP** деген ERP/MES системасын нөлдөн курасың.

Иштөө эрежелери:

1. **Этап менен иште.** 17-бөлүмдөгү этаптарды катары менен аткар. Ар бир этапты бүткөндө токто жана кыскача отчет бер: эмне жасалды, кайсы файлдар түзүлдү, кантип ишке киргизип текшерсе болот. Мен «улант» дегенче кийинки этапка өтпө.
2. **Код англисче, интерфейс кыргызча жана орусча.** Өзгөрмөлөр, функциялар, таблицалар жана комментарийлер англисче жазылат. Колдонуучу көргөн бардык тексттер `ky.json` жана `ru.json` файлдарында турат, коддун ичинде түз жазылбайт.
3. **TypeScript strict режиминде.** `any` колдонбо. Маалыматтын формасы бир жерде, `packages/shared` ичиндеги zod схемаларында аныкталат, ошол схема frontend менен backendде бирдей колдонулат.
4. **Акча бүтүн сан менен сакталат:** тыйын (1 сом = 100 тыйын), `Int` түрүндө. Float менен акча эсептөөгө болбойт.
5. **Ар бир маалымат tenant боюнча бөлүнөт** (13-бөлүмдү кара). Бир ишкана экинчисинин маалыматын эч качан көрбөшү керек.
6. **Ойлоп таппа.** ТТда же бул промптто жок нерсе керек болсо, адегенде менден сура. Жасалма маалымат seed файлында гана болот.
7. **Тесттер милдеттүү:** эмгек акы, даярдык пайызы, сканерлөөдөгү кайталоо жана tenant изоляциясы боюнча (16-бөлүм).
8. **Дизайнды так кайтала:** 10-бөлүмдөгү токендерди жана компоненттерди колдон. Түстү же өлчөмдү коддун ичинде түз жазба.

---

## 2. Долбоор жөнүндө

**ТигүүERP** — 10–200 кызматкери бар тигүү цехтери үчүн булут кызматы (SaaS). Ал буйрутмадан баштап даяр продукцияга чейинки бүт процессти башкарат. Колдонулган жери — Кыргызстан.

**Системанын өзөгү бир цикл:**
буйрутма → технологиялык карта → кесүү жана деталдарды пачкаларга бөлүү (ар бир пачкада QR-код) → тигүүчү ар бир операциядан кийин телефону менен QR сканерлейт → ошол скандын негизинде **эмгек акы** да, **буйрутманын даярдыгы** да автоматтык эсептелет → сапат текшерүү → таңгактоо → жөнөтүү.

**Максаттар:**

- сдельный эмгек акыны кол менен эсептөөнү толук жоюу;
- ар бир буйрутманын абалын реалдуу убакытта көрсөтүү;
- кездеме менен фурнитуранын чыгымын көзөмөлдөө;
- ар бир буюмдун чыныгы өздүк наркын эсептөө (2-этап);
- бракты жана анын булагын аныктоо.

**Дизайн:** 24 экрандын макети даяр: [ШИЛТЕМЕ]. Скриншоттор тиркелди. Ар бир экрандын номери (мисалы, 2.3) ушул промпттогу номерлерге дал келет.

---

## 3. Технологиялык стек

### Frontend (`apps/web`)

- **React 18 + TypeScript + Vite**
- **React Router v6** (`createBrowserRouter`)
- **TanStack Query v5**: серверден келген бардык маалымат ушул аркылуу жүрөт
- **Tailwind CSS v4** (`@theme` токендери, 10-бөлүм)
- **react-hook-form + zod** (`@hookform/resolvers`): формалар үчүн
- **i18next + react-i18next**: ky (негизги) жана ru
- **Dexie** (IndexedDB) жана **vite-plugin-pwa** (Workbox): офлайн режим жана PWA үчүн
- **@zxing/browser** же **html5-qrcode**: камера менен QR окуу
- **MSW**: backend даяр болгонго чейин жасалма API
- **Recharts**: отчеттордогу графиктер
- **@fontsource/ibm-plex-sans** жана **@fontsource/ibm-plex-mono**: шрифттер локалдуу жүктөлөт, ошондуктан офлайн да иштейт
- **Vitest + Testing Library + Playwright**

### Backend (`apps/api`)

- **Node.js 20 LTS + TypeScript**
- **Fastify 4**, schema валидациясы `fastify-type-provider-zod` аркылуу
- **Prisma + PostgreSQL 16**
- **Redis + BullMQ**: фондогу иштер (Telegram билдирүүлөрү, күндүк отчеттор, кечигүүнү текшерүү)
- **argon2**: сырсөз жана PIN хештөө үчүн
- **JWT** (`@fastify/jwt`): access token 15 мүнөт, refresh token httpOnly cookieде 30 күн, ар бир колдонулганда алмашат
- **grammY**: Telegram-бот
- **exceljs**: Excel импорт жана экспорт
- **pdfmake**: PDF (ведомость, этикеткалар). Кириллица жана кыргыз тамгалары (ң, ө, ү) үчүн IBM Plex Sans TTF шрифти кошулат.
- **qrcode**: QR сүрөтүн түзүү
- **S3 менен шайкеш файл сактагыч** (локалдуу иштөөдө MinIO)
- **pino**: логдор
- **Vitest + supertest**: тесттер

### Жалпы

- **pnpm workspaces** monorepo
- **packages/shared**: zod схемалары, enumдар, түрлөр жана таза эсептөө функциялары
- **Docker Compose**: postgres, redis, minio, api, web
- ESLint (flat config) + Prettier, Husky + lint-staged
- GitHub Actions: lint → typecheck → test → build

---

## 4. Репозиторийдин структурасы

```
tigu-erp/
├── apps/
│   ├── web/                      # Frontend (төмөндөгү структура)
│   └── api/                      # Backend
├── packages/
│   └── shared/
│       └── src/
│           ├── enums.ts          # Role, OrderStatus, BundleStatus ...
│           ├── schemas/          # zod: order.ts, techCard.ts, scan.ts, payroll.ts ...
│           ├── calc/             # orderProgress.ts, payroll.ts, lateness.ts (+ тесттер)
│           └── index.ts
├── docker-compose.yml
├── .env.example
├── pnpm-workspace.yaml
└── README.md
```

### `apps/web` — бул структура так сакталат

```
apps/web/
├── public/ (icons/, favicon.svg)
├── src/
│   ├── app/
│   │   ├── providers/            # QueryClient, i18n, Auth, Theme
│   │   ├── router/
│   │   │   ├── routes.tsx        # Бардык маршруттар (9-бөлүм)
│   │   │   └── guards.tsx        # RequireAuth, RequireRole
│   │   ├── layouts/
│   │   │   ├── PublicLayout.tsx  # Сайт: хедер + футер
│   │   │   ├── AdminLayout.tsx   # Сайдбар + header
│   │   │   ├── WorkerLayout.tsx  # Мобилдик, ылдыйда навигация
│   │   │   └── PortalLayout.tsx
│   │   └── App.tsx
│   ├── pages/                    # Беттер features'терди гана бириктирет, логика жок
│   │   ├── public/               # LandingPage, RegisterPage
│   │   ├── auth/                 # LoginPage, PinPage
│   │   ├── admin/                # dashboard, orders, models, cutting, production,
│   │   │                         # payroll, warehouse, quality, reports, settings
│   │   ├── worker/               # ScanPage, ScanOperationPage, ScanDonePage,
│   │   │                         # EarningsPage, HistoryPage
│   │   └── portal/               # OrdersPage, OrderPage
│   ├── features/                 # Бизнес-модулдар
│   │   ├── auth/  orders/  tech-cards/  cutting/  scanning/
│   │   ├── production/  payroll/  warehouse/  quality/  reports/  settings/
│   │   │   └── (ар бири) api/ components/ hooks/ model/ index.ts
│   ├── shared/
│   │   ├── ui/                   # Button, Input, Select, Modal, Table, Badge, Card,
│   │   │                         # StatCard, ProgressBar, StatusBadge, Alert, Tabs,
│   │   │                         # EmptyState, Skeleton, Toast, FileDrop
│   │   ├── api/  client.ts  types.ts
│   │   ├── offline/  db.ts  syncQueue.ts
│   │   ├── i18n/  ky.json  ru.json
│   │   ├── lib/   cn.ts  formatMoney.ts  formatDate.ts  vibrate.ts
│   │   ├── hooks/ useDebounce, useOnlineStatus, useMediaQuery
│   │   └── config/ env.ts  roles.ts  routes.ts
│   ├── mocks/  handlers/  data/  browser.ts
│   ├── styles/index.css
│   └── main.tsx
```

Эреже: бир `feature` экинчисинин ички файлдарына кирбейт, анын `index.ts` аркылуу экспорттолгон нерселерин гана колдонот. `pages` ичинде бизнес-логика жок.

### `apps/api`

```
apps/api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                   # Демо-ишкана жана демо-маалымат
└── src/
    ├── server.ts  app.ts
    ├── config/env.ts             # zod менен текшерилген env
    ├── plugins/                  # prisma, auth, tenant, errors, rateLimit, cors, multipart
    ├── modules/
    │   ├── auth/  users/  customers/  models/  tech-cards/  orders/
    │   ├── cutting/  scanning/  production/  payroll/  reports/
    │   ├── files/  audit/  notifications/ (telegram, sms)
    │   ├── warehouse/  quality/  portal/          # 2-этап
    │   └── (ар бири) routes.ts  service.ts  service.test.ts
    ├── jobs/                     # dailySummary, latenessCheck, lowStockCheck
    └── lib/                      # money.ts, dates.ts, excel.ts, pdf.ts, qr.ts
```

---

## 5. Ролдор жана укуктар

| Роль (`Role`)  | Милдети               | Эмнени көрөт жана кыла алат                                                       | Түзмөк             |
| -------------- | --------------------- | --------------------------------------------------------------------------------- | ------------------ |
| `OWNER`        | Ишкананы башкаруу     | Баары: финансы, аналитика, колдонуучулар жана укуктар                             | Компьютер, телефон |
| `TECHNOLOGIST` | Өндүрүштү уюштуруу    | Моделдер, тех. карталар, буйрутмалар, MES, сапат                                  | Компьютер, планшет |
| `FOREMAN`      | Линияны башкаруу      | Өз бригадасынын пачкалары жана тапшырмалары, операцияларды бекитүү, бракты каттоо | Телефон, планшет   |
| `CUTTER`       | Кесүү                 | Кесүү тапшырмалары, пачкалар, QR-этикеткалар                                      | Планшет, принтер   |
| `SEWER`        | Операцияларды аткаруу | QR сканерлөө, өзү аткарган иштер жана өзүнүн айлыгы гана                          | Телефон            |
| `STOREKEEPER`  | Кампа                 | Кирим, чыгым, калдыктар, инвентаризация                                           | Компьютер, телефон |
| `ACCOUNTANT`   | Эсеп-кысап            | Эмгек акы ведомосттору, аванстар, отчеттор, Excel                                 | Компьютер          |
| `CLIENT`       | Буйрутманы көзөмөлдөө | Өз буйрутмаларынын абалы гана (портал)                                            | Браузер            |

**Укуктар боюнча эрежелер:**

- Тигүүчү башка кызматкерлердин айлыгын көрбөйт.
- Операциялардын баасын жана өздүк наркты `OWNER` жана ал уруксат берген адамдар гана көрөт. Уруксаттар `permissions` аркылуу берилет: `canSeePrices`, `canSeeCost`.
- Маанилүү өзгөртүүлөр `AuditLog` журналына жазылат: ким, качан, эмне болчу (`before`) жана эмне болду (`after`). Буга операциянын баасы, бекитилген ведомость, колдонуучунун ролу жана жокко чыгарылган скан кирет.
- Укуктар backendде текшерилет, frontend аларды жөн гана жашырат. Ар бир маршрутта `requireRole([...])` жана `requirePermission(...)` болот.
- Ролдун укуктары `packages/shared/src/permissions.ts` файлында бир матрица катары жазылат. Frontend да, backend да ушул матрицаны колдонот.

---

## 6. Маалымат базасынын модели (Prisma)

Төмөнкү схема — негиз. Аны толуктап, индекстерди кошсоң болот, бирок маанисин өзгөртпө.

```prisma
enum Role { OWNER TECHNOLOGIST FOREMAN CUTTER SEWER STOREKEEPER ACCOUNTANT CLIENT }
enum PayType { PIECE SALARY }
enum Currency { KGS RUB KZT USD }
enum OrderStatus { NEW CUTTING SEWING QC PACKING SHIPPED CANCELLED }
enum BundleStatus { CUT SEWING SEWN QC_PASSED REWORK PACKED }
enum PayrollStatus { DRAFT APPROVED }
enum AdjustmentType { ADVANCE BONUS DEFECT_DEDUCTION }
enum Locale { ky ru }

model Tenant {
  id        String   @id @default(uuid())
  name      String
  city      String?
  plan      String   @default("start")
  timezone  String   @default("Asia/Bishkek")
  createdAt DateTime @default(now())
}

model User {
  id               String   @id @default(uuid())
  tenantId         String
  fullName         String
  phone            String                  // E.164: +996555123456
  passwordHash     String?                 // жетекчилер үчүн
  pinHash          String?                 // тигүүчүлөр үчүн (4 сан)
  role             Role
  permissions      Json     @default("{}") // { canSeePrices: true, ... }
  brigadeId        String?
  payType          PayType  @default(PIECE)
  monthlySalary    Int?                    // тыйын, SALARY үчүн
  telegramChatId   String?
  locale           Locale   @default(ky)
  twoFactorEnabled Boolean  @default(false)
  isActive         Boolean  @default(true)
  failedPinCount   Int      @default(0)
  lockedUntil      DateTime?
  createdAt        DateTime @default(now())
  @@unique([tenantId, phone])
  @@index([tenantId, role])
}

model Brigade      { id String @id @default(uuid()) tenantId String  name String  foremanId String? }

model Customer {
  id         String  @id @default(uuid())
  tenantId   String
  name       String
  country    String  @default("KG")
  phone      String?
  email      String?
  note       String?
  portalUserId String?                       // CLIENT ролундагы User
}

model OperationRef {                           // кайталанган операциялардын маалымдамасы
  id String @id @default(uuid())  tenantId String  name String  equipment String?
  @@unique([tenantId, name])
}

model Model {
  id        String   @id @default(uuid())
  tenantId  String
  article   String
  name      String
  photoUrl  String?
  sizes     String[]                         // ["S","M","L","XL"]
  createdAt DateTime @default(now())
  @@unique([tenantId, article])
}

model TechCard {
  id         String   @id @default(uuid())
  tenantId   String
  modelId    String
  version    Int      @default(1)
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())
  operations TechCardOperation[]
  bom        BomItem[]
}

model TechCardOperation {
  id          String  @id @default(uuid())
  techCardId  String
  seq         Int                            // аткаруу тартиби: 1, 2, 3...
  name        String
  equipment   String?
  priceTiyin  Int                            // 800 = 8.00 сом
  normSeconds Int
  @@unique([techCardId, seq])
}

model BomItem {
  id String @id @default(uuid())  techCardId String  materialId String?
  name String  qty Decimal @db.Decimal(12,3)  unit String       // "м", "даана", "бобина"
}

model Order {
  id             String      @id @default(uuid())
  tenantId       String
  number         String                      // "Б-0142", tenant ичинде ырааттуу
  customerId     String
  modelId        String
  techCardId     String                      // буйрутма түзүлгөндөгү версия бекитилет
  unitPriceMinor Int
  currency       Currency    @default(KGS)
  deadline       DateTime    @db.Date
  status         OrderStatus @default(NEW)
  createdById    String
  createdAt      DateTime    @default(now())
  lines          OrderLine[]
  @@unique([tenantId, number])
  @@index([tenantId, status, deadline])
}

model OrderLine { id String @id @default(uuid())  orderId String  size String  color String  qty Int
  @@unique([orderId, size, color]) }

model OrderFile { id String @id @default(uuid())  orderId String  name String  url String  sizeBytes Int  mime String  createdAt DateTime @default(now()) }

model OrderStatusHistory { id String @id @default(uuid())  orderId String  from OrderStatus?  to OrderStatus  byUserId String  at DateTime @default(now()) }

model CuttingTask {
  id String @id @default(uuid())  tenantId String  orderId String  number String
  fabricUsedM Decimal? @db.Decimal(10,2)  fabricLeftM Decimal? @db.Decimal(10,2)
  createdById String  createdAt DateTime @default(now())
}

model Bundle {
  id            String       @id @default(uuid())
  tenantId      String
  orderId       String
  cuttingTaskId String
  number        Int                          // #0457, tenant ичинде ырааттуу
  size          String
  color         String
  qty           Int
  qrToken       String       @unique         // кокустук, 16+ белги, болжолдонбойт
  status        BundleStatus @default(CUT)
  labelPrintedAt DateTime?
  @@unique([tenantId, number])
  @@index([orderId])
}

model WorkRecord {                              // бир скан = бир жазуу
  id                  String    @id            // UUID, КЛИЕНТТЕ түзүлөт (офлайн үчүн)
  tenantId            String
  bundleId            String
  techCardOperationId String
  workerId            String
  qty                 Int                      // көбүнчө bundle.qty
  priceTiyin          Int                      // скан учурундагы баа (snapshot)
  amountTiyin         Int                      // qty * priceTiyin
  normSeconds         Int                      // snapshot
  scannedAt           DateTime                 // телефондогу убакыт
  receivedAt          DateTime  @default(now())
  cancelledAt         DateTime?
  cancelledById       String?
  @@index([tenantId, workerId, scannedAt])
  @@index([bundleId])
}
// МИЛДЕТТҮҮ: migrationдо partial unique index кошулат:
// CREATE UNIQUE INDEX work_record_once ON "WorkRecord"("bundleId","techCardOperationId")
//   WHERE "cancelledAt" IS NULL;

model PayrollPeriod {
  id String @id @default(uuid())  tenantId String  from DateTime @db.Date  to DateTime @db.Date
  status PayrollStatus @default(DRAFT)  approvedById String?  approvedAt DateTime?
  lines PayrollLine[]
}

model PayrollLine {
  id String @id @default(uuid())  periodId String  userId String
  pieces Int  accruedTiyin Int  bonusTiyin Int  advanceTiyin Int  deductionTiyin Int  totalTiyin Int
  @@unique([periodId, userId])
}

model PayrollAdjustment {
  id String @id @default(uuid())  tenantId String  userId String  periodId String?
  type AdjustmentType  amountTiyin Int  reason String  createdById String  createdAt DateTime @default(now())
}

model AuditLog {
  id String @id @default(uuid())  tenantId String  userId String
  action String  entity String  entityId String  before Json?  after Json?  createdAt DateTime @default(now())
  @@index([tenantId, entity, entityId])
}

model OtpCode { id String @id @default(uuid())  phone String  codeHash String  channel String  expiresAt DateTime  attempts Int @default(0) }
model RefreshToken { id String @id @default(uuid())  userId String  tokenHash String @unique  expiresAt DateTime  revokedAt DateTime?  userAgent String? }

// ---------- 2-этап ----------
model Material      { id String @id @default(uuid())  tenantId String  kind String  name String  color String?  composition String?  widthCm Int?  unit String  minStock Decimal @db.Decimal(12,3)  priceTiyin Int }
model Supplier      { id String @id @default(uuid())  tenantId String  name String  phone String? }
model StockMovement { id String @id @default(uuid())  tenantId String  materialId String  type String /* IN | OUT | ADJUST */  qty Decimal @db.Decimal(12,3)  priceTiyin Int?  supplierId String?  orderId String?  cuttingTaskId String?  note String?  createdById String  createdAt DateTime @default(now()) }
model Defect        { id String @id @default(uuid())  tenantId String  bundleId String  workRecordId String  workerId String  type String  qty Int  photoUrls String[]  status String /* REWORK | FIXED | ACCEPTED */  createdById String  createdAt DateTime @default(now()) }
```

---

## 7. Бизнес-эрежелер жана эсептөөлөр

Бул функциялар `packages/shared/src/calc/` ичинде таза функциялар болуп жазылат жана ар бирине unit-тест болот.

### 7.1. Сканерлөө (эң маанилүү)

1. Тигүүчү пачканын QR-кодун сканерлейт → `GET /scan/bundles/:qrToken` пачканы, буйрутманы жана тех. картадагы операцияларды кайтарат. Ар бир операция үчүн абалы көрсөтүлөт: `available`, `doneBy: { name, at }` же `doneByMe`.
2. Тигүүчү операцияны тандайт → `POST /scan/work-records`. Сурамда `{ id: uuid, qrToken, techCardOperationId, scannedAt }` жөнөтүлөт.
3. **Бир пачкадагы бир операция бир гана жолу катталат** (partial unique index). Кайталанса, сервер `409` кайтарат: `{ code: "ALREADY_DONE", doneBy: "Айгүл Токтогулова", at }`. Экранда «бул операция мурда Айгүл тарабынан аткарылган» деген эскертүү чыгат.
4. **Идемпотенттүүлүк:** эгер ошол эле `id` экинчи жолу келсе (офлайн кайра жөнөтүү), сервер `200` жана мурдагы жазууну кайтарат, ката бербейт.
5. Баа жана норма скан учурунда **көчүрүлүп жазылат** (`priceTiyin`, `normSeconds`). Кийин тех. картадагы баа өзгөрсө да, мурдагы эмгек акы өзгөрбөйт.
6. **Жокко чыгаруу:** тигүүчү өз сканын `receivedAt` убактысынан тартып 10 секунддун ичинде жокко чыгара алат. Андан кийин сканды `FOREMAN` же `OWNER` гана жокко чыгарат, бул учурда себеп милдеттүү жана аракет журналга жазылат. Бекитилген ведомосттун мезгилине кирген сканды жокко чыгарууга болбойт.
7. Пачканын статусу: биринчи скандан кийин `SEWING`, тех. картадагы бардык операциялар аткарылганда `SEWN`.
8. Буйрутманын статусу: биринчи пачка кесилгенде `NEW → CUTTING`, биринчи скандан кийин `SEWING`. Калган өтүүлөрдү (`QC`, `PACKING`, `SHIPPED`) жетекчи кол менен жасайт. Ар бир өтүү `OrderStatusHistory` таблицасына жазылат.
9. Скандын жообу 300 мсден ашпашы керек (p95).

### 7.2. Буйрутманын даярдык пайызы

Даярдык операциялардын нормалык убактысы боюнча салмакталып эсептелет:

```
total = Σ(order.lines.qty) × Σ(techCard.operations.normSeconds)
done  = Σ(workRecord.qty × workRecord.normSeconds)   // cancelledAt IS NULL
progress = round(done / total × 100)
```

Өлчөм жана түс боюнча даярдык (2.4-экрандагы матрица) ар бир ячейка үчүн ушундай эле формула менен эсептелет. Мында ячейкадагы толук бүткөн даана саны деп акыркы операциясы аткарылган пачкалардагы даана саны алынат.

### 7.3. Кечигүү (кызыл жана сары белги)

```
remaining      = total − done
dailyRate      = акыркы 3 жумуш күнүндөгү done'дун орточосу (норма-секунд/күн)
forecastDate   = today + ceil(remaining / dailyRate) жумуш күнү   // dailyRate = 0 болсо → белгисиз
danger  (кызыл) = deadline < today  ЖЕ  forecastDate > deadline
warning (сары)  = (deadline − today) ≤ 5 күн  жана danger эмес
```

Жумуш күнү дүйшөмбүдөн ишембиге чейин. Ишкананын жөндөөлөрүнөн өзгөртсө болот.

### 7.4. Тыгын (bottleneck)

Ар бир операция (`seq = n`) үчүн «күтүп жаткан пачкалар» саналат: бул мурунку операциясы (`seq = n−1`) аткарылган, бирок ушул операциясы аткарыла элек пачкалар. Биринчи операция үчүн кесилген бардык пачкалар эсептелет. Эң көп пачка күткөн операция же 10дон ашык пачка күткөн ар бир операция «тыгын» деп белгиленет.

### 7.5. Өндүрүмдүүлүк

```
productivity(worker, day) = Σ(qty × normSeconds) / (8 × 3600) × 100%
```

Сменанын узундугу ишкананын жөндөөлөрүндө (демейки 8 саат).

### 7.6. Эмгек акы

- **Сдельный (`PIECE`):** `accrued = Σ amountTiyin` (мезгил ичинде, жокко чыгарылбаган скандар).
- **Айлык маяна (`SALARY`):** `accrued = monthlySalary`, мезгил толук ай болбосо жумуш күндөрүнө пропорционалдуу.
- `total = accrued + bonus − advance − defectDeduction`.
- Брак үчүн кармап калуу = бракка чыккан даана × ошол операциянын баасы (2-этап, сапат модулу). MVPде кол менен киргизилет.
- **Ведомость:** бухгалтер мезгилди тандайт → система `DRAFT` ведомостту түзөт (кайра эсептесе болот) → `OWNER` бекитет (`APPROVED`). Бекитилгенден кийин ведомость, андагы скандар жана түзөтүүлөр өзгөрбөйт: backend бул аракеттерди `423 LOCKED` менен четке кагат.
- Excel жана PDF экспорт. Сумма `1 240,00` форматында (сом).
- Тест: таблицадагы сап суммаларынын жыйындысы «Жалпы» сабына так барабар болушу керек.

### 7.7. Номерлер

Буйрутма `Б-0001`, кесүү тапшырмасы `КТ-0001`, пачка `#0001`. Номерлер tenant ичинде ырааттуу берилет жана транзакция ичинде түзүлөт (`SELECT ... FOR UPDATE` же өзүнчө counter таблица аркылуу).

---

## 8. API (REST, `/api/v1`)

Жалпы эрежелер:

- Ката форматы: `{ error: { code: "ALREADY_DONE", message: "...", details?: {} } }`. Ката коддору frontendде i18n аркылуу которулат.
- Барактоо: `?page=1&pageSize=20` → `{ items, total, page, pageSize }`.
- Датанын форматы ISO 8601. Сервер UTC менен иштейт, экранда ишкананын убакыт алкагы (`Asia/Bishkek`) колдонулат.
- Ар бир сурам JWT аркылуу текшерилет, `tenantId` токенден алынат. Аны URLден же сурамдын body бөлүгүнөн алууга болбойт.

| Модуль     | Endpointтер                                                                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| auth       | `POST /auth/register` (ишкана + ээси) · `POST /auth/login` (телефон + сырсөз) · `POST /auth/2fa/verify` · `POST /auth/pin` (телефон + PIN) · `POST /auth/otp/send` · `POST /auth/otp/verify` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me`                               |
| users      | `GET/POST /users` · `PATCH /users/:id` · `POST /users/:id/reset-pin` · `GET /brigades` · `POST /brigades`                                                                                                                                                                                |
| customers  | `GET/POST /customers` · `GET/PATCH /customers/:id`                                                                                                                                                                                                                                       |
| models     | `GET/POST /models` · `GET/PATCH /models/:id` · `POST /models/import` (xlsx)                                                                                                                                                                                                              |
| tech-cards | `GET /models/:id/tech-cards` · `POST /tech-cards` · `PATCH /tech-cards/:id` · `POST /tech-cards/:id/approve` · `POST /tech-cards/:id/copy` · `GET/POST /operation-refs`                                                                                                                  |
| orders     | `GET /orders?status=&q=` · `POST /orders` · `GET /orders/:id` (+ progress, matrix, forecast) · `PATCH /orders/:id` · `POST /orders/:id/status` · `POST /orders/:id/files` · `GET /orders/:id/events`                                                                                     |
| cutting    | `GET/POST /cutting-tasks` · `GET /cutting-tasks/:id` · `POST /cutting-tasks/:id/bundles` (автоматтык бөлүү: пачканын көлөмү) · `PATCH /cutting-tasks/:id` (кездеме) · `GET /cutting-tasks/:id/labels.pdf?format=58                                                                       | 80   | a4&bundleIds=`                |
| scanning   | `GET /scan/bundles/:qrToken` · `POST /scan/work-records` · `POST /scan/work-records/batch` (офлайн синхрондоо, 200 жазууга чейин, ар бирине өзүнчө натыйжа) · `DELETE /scan/work-records/:id` · `GET /scan/prefetch` (бригаданын активдүү пачкалары жана тех. карталары офлайн кэш үчүн) |
| production | `GET /production/orders/:id/operations` · `GET /production/productivity?date=&brigadeId=` · `GET /production/recent-scans` · `GET /production/bottlenecks`                                                                                                                               |
| payroll    | `GET /payroll/periods` · `POST /payroll/periods` (түзүү/кайра эсептөө) · `GET /payroll/periods/:id` · `POST /payroll/periods/:id/approve` · `GET /payroll/periods/:id/export.xlsx` · `GET /payroll/periods/:id/export.pdf` · `POST /payroll/adjustments` · `GET /me/earnings?range=day   | week | month`·`GET /me/work-records` |
| reports    | `GET /reports/dashboard` · `GET /reports/daily-production?from=&to=` · `GET /reports/orders-status` · `GET /reports/payroll-summary` · `…/export.xlsx`                                                                                                                                   |
| settings   | `GET/PATCH /tenant` · `GET /audit-log?entity=&entityId=` · `POST /telegram/link-code`                                                                                                                                                                                                    |
| 2-этап     | `materials`, `stock-movements`, `suppliers`, `inventory` · `quality/defects` · `portal/orders`, `portal/orders/:id/messages`                                                                                                                                                             |

Swagger/OpenAPI документациясы `/api/docs` дарегинде автоматтык түзүлөт.

---

## 9. Frontend: маршруттар жана экрандар

Ар бир экран дизайн-холсттогу ушундай эле номердеги макетке дал келет.

| №    | Маршрут                                      | Бет                                                   | Layout | Ролдор                       | Этап   |
| ---- | -------------------------------------------- | ----------------------------------------------------- | ------ | ---------------------------- | ------ |
| 6.1  | `/`                                          | LandingPage                                           | Public | баары                        | MVP    |
| 6.2  | `/register`                                  | RegisterPage                                          | Public | баары                        | MVP    |
| 1.1  | `/login`                                     | LoginPage                                             | —      | баары                        | MVP    |
| 1.2  | `/pin`                                       | PinPage                                               | —      | SEWER                        | MVP    |
| 2.1  | `/admin`                                     | DashboardPage                                         | Admin  | OWNER, TECHNOLOGIST          | MVP    |
| 2.2  | `/admin/orders`                              | OrdersListPage                                        | Admin  | OWNER, TECHNOLOGIST, FOREMAN | MVP    |
| 2.3  | `/admin/orders/new`                          | OrderCreatePage                                       | Admin  | OWNER, TECHNOLOGIST          | MVP    |
| 2.4  | `/admin/orders/:id`                          | OrderDetailsPage                                      | Admin  | OWNER, TECHNOLOGIST, FOREMAN | MVP    |
| 2.5  | `/admin/models`, `/admin/models/:id`         | ModelsPage, TechCardPage                              | Admin  | OWNER, TECHNOLOGIST          | MVP    |
| 2.6  | `/admin/cutting`, `/admin/cutting/:id`       | CuttingPage                                           | Admin  | CUTTER, TECHNOLOGIST, OWNER  | MVP    |
| 2.7  | `/admin/production`                          | ProductionPage                                        | Admin  | OWNER, TECHNOLOGIST, FOREMAN | MVP    |
| 2.8  | `/admin/payroll`, `/admin/payroll/:periodId` | PayrollPage                                           | Admin  | OWNER, ACCOUNTANT            | MVP    |
| 2.9  | `/admin/reports`                             | ReportsPage                                           | Admin  | OWNER, ACCOUNTANT            | MVP    |
| 2.10 | `/admin/settings/*`                          | SettingsPage (users, roles, company, telegram, audit) | Admin  | OWNER                        | MVP    |
| 3.1  | `/w/scan`                                    | ScanPage                                              | Worker | SEWER, FOREMAN               | MVP    |
| 3.2  | `/w/scan/:qrToken`                           | ScanOperationPage                                     | Worker | SEWER, FOREMAN               | MVP    |
| 3.3  | `/w/scan/:qrToken/done`                      | ScanDonePage                                          | Worker | SEWER, FOREMAN               | MVP    |
| 3.4  | `/w/earnings`                                | EarningsPage                                          | Worker | SEWER                        | MVP    |
| 3.5  | `/w/history`                                 | HistoryPage                                           | Worker | SEWER                        | MVP    |
| 4.1  | `/admin/warehouse`                           | WarehousePage                                         | Admin  | STOREKEEPER, OWNER           | 2-этап |
| 4.2  | `/admin/quality`                             | QualityPage                                           | Admin  | TECHNOLOGIST, FOREMAN        | 2-этап |
| 5.1  | `/portal`, `/portal/orders/:id`              | Portal OrdersPage                                     | Portal | CLIENT                       | 2-этап |

Киргенден кийин колдонуучу ролуна жараша багытталат: `SEWER` → `/w/scan`, `CLIENT` → `/portal`, `CUTTER` → `/admin/cutting`, `STOREKEEPER` → `/admin/warehouse`, калгандары → `/admin`. Сайдбарда колдонуучунун ролуна уруксат берилген пункттар гана көрүнөт. 2-этаптын модулдары «2-этап» деген боз белги менен көрсөтүлөт же feature-flag аркылуу жашырылат.

### Экрандардын мазмуну

**6.1 Сайттын башкы бети.** Беттин бөлүмдөрү жогорудан ылдый:

- хедер: логотип, меню (Башкы бет, Мүмкүнчүлүктөр, Кантип иштейт, Тарифтер, Биз жөнүндө, Байланыш), KG/RU тил тандоо, «Кирүү» жана «Катталуу» баскычтары;
- hero: «Буйрутмадан айлыкка чейин — бүт цех бир системада» деген аталыш, эки CTA жана башкаруу панели менен телефондун кичине макети;
- «Кандай маселени чечет»: 4 көйгөй жана ар биринин чечими;
- «Кантип иштейт»: 5 кадам;
- 10 модул, андан кийин ролдор боюнча пайдасы;
- ТТдан алынган сандар: < 2 сек, 8 саат офлайн, 10 мүн үйрөнүү, 300 тигүүчү, 99,5%;
- жөнөкөйлүк жана коопсуздук, интеграциялар;
- 3 тариф (баалары `[БААСЫ]`);
- «Биз жөнүндө», FAQ (`<details>`);
- өтүнмө формасы (аты, телефон, кызматкерлердин саны) жана футер.

Өтүнмө `POST /leads` аркылуу жөнөтүлөт жана админге Telegram билдирүүсү келет. Сайт SEO үчүн `<title>`, meta description жана Open Graph тегдерин камтыйт.

**6.2 Катталуу.** 3 кадамдык мастер: (1) ишкананын аталышы, кызматкерлердин саны, шаар, ээсинин аты-жөнү, телефон, сырсөз жана шарттарга макулдук; (2) телефонду SMS же Telegram коду менен тастыктоо; (3) биринчи моделди жана кызматкерлерди кошуу (Excel жүктөөгө да болот) же бул кадамды «Кийинчерээк» деп өткөрүп жиберүү.

**1.1 Кирүү.** Эки өтмөк бар:

- «Жетекчи / кызматкер»: телефон, сырсөз, андан кийин 6 орундуу 2FA коду (Telegram);
- «Тигүүчү (PIN)»: телефон → `/pin` бетине өтөт.

Мындан тышкары «Сырсөздү унуттуңузбу?» жана «Кардар катары кирүү» шилтемелери бар.

**1.2 PIN.** Экранда 4 чекит жана чоң сан баскычтары (72px) турат. 5 жолу туура эмес терилсе, кирүү 15 мүнөткө бөгөттөлөт. Ошол эле экранда «Telegram коду менен кирүү» деген альтернатива бар.

**2.1 Башкы панель.** Төрт KPI: бүгүн тигилген даана, активдүү буйрутмалар, кечигүү коркунучу (кызыл карта) жана бүгүнкү эмгек акы. Андан тышкары көзөмөлдөгү буйрутмалардын таблицасы (даярдык, мөөнөт, статус), тыгындар жана жуманын өндүрүшү (бар-чарт) көрсөтүлөт.

**2.2 Буйрутмалар.** Статус боюнча чиптер (санагычы менен), издөө (№, кардар, модель) жана таблица (№, кардар, модель, саны, даярдык, мөөнөт, статус). Кечигип жаткан саптар кызыл фон жана кызыл сол чек менен белгиленет. Барактын жогорусунда «Excel экспорт» жана «+ Жаңы буйрутма» баскычтары бар.

**2.3 Жаңы буйрутма.** Форма үч бөлүктөн турат:

1. Кардар, модель, мөөнөт, баа жана валюта (KGS, RUB, KZT, USD).
2. Өлчөм-түс матрицасы (`SizeColorMatrix`): өлчөм же түс кошсо болот, саптар менен мамычалардын жыйынтыгы автоматтык эсептелет.
3. Файлдар (drag & drop; PDF, JPG, PNG, DXF; 20 МБга чейин).

Оң жактагы жыйынтык панелинде жалпы саны, суммасы, пачкалардын саны, тех. картанын абалы жана кездеменин болжолдуу чыгымы (BOM × саны) көрсөтүлөт. Мөөнөт тууралуу эскертүү 7.3-бөлүмдөгү эрежеге негизделет.

**2.4 Буйрутманын барагы.** Аталыштын жанында статустун жана коркунучтун белгилери турат. Андан ылдый 6 этаптуу прогресс сызыгы жана өтмөктөр бар: Жалпы, Пачкалар, Операциялар, Файлдар, Өзгөртүүлөр журналы. «Жалпы» өтмөгүндө өлчөм-түс боюнча даярдык көрсөтүлөт; мөөнөткө жетишпей турган болсо, болжолдонгон бүтүү күнү менен Alert чыгат. Мындан тышкары акыркы окуялар, маалымат панели жана файлдар бар.

**2.5 Технологиялык карта.** Моделдин карточкасы жана операциялар таблицасы: №, операция, жабдык, норма (сек), баа (сом). Таблицаны сап боюнча түздөн-түз түзөтсө болот, саптардын тартибин drag аркылуу алмаштырса болот, аягында жыйынтык сап турат. Беттин жанында BOM жана бир буюмдун эмгек акысы көрсөтүлөт. Мындан тышкары «Окшош моделге көчүрүү» жана «Excelден жүктөө» баскычтары бар. Бааны `canSeePrices` уруксаты бар колдонуучулар гана көрөт.

**2.6 Кесүү.** Төрт KPI: кесилди, пачкалар, кездеменин чыгымы (нормага салыштырмалуу) жана калдык. Пачкалардын таблицасы чекбокстор менен, андан тышкары этикетканын алдын ала көрүнүшү бар: QR-код, пачканын номери, буйрутма, артикул, өлчөм, түс, саны жана дата; форматы 58 мм, 80 мм же A4 (24 даана). Беттин аягында кездемени каттоо формасы турат.

**2.7 Өндүрүш (MES).** Барактын жогорусунда буйрутманы жана бригаданы тандоо фильтрлери, андан ылдый 4 KPI бар. Негизги блокто операциялардын тизмеси `seq` боюнча прогресс менен көрсөтүлөт, тыгын кызыл белги менен белгиленет. Жанында өндүрүмдүүлүк (кызматкер, учурдагы операциясы, бүгүнкү сумма, ченемге карата %) жана акыркы сканерлөөлөр турат. Маалымат 15 секунд сайын жаңыланат (`refetchInterval`).

**2.8 Эмгек акы.** Мезгилди тандоо жана ведомосттун статусу. Жыйынтык карталары: эсептелди, аванстар, бонус/кармоо, төлөөгө. Таблицада ар бир кызматкер үчүн төлөм түрү, даана, эсептелди, бонус, аванс, брак үчүн кармоо жана төлөөгө деген мамычалар бар, аягында «Жалпы» сабы турат. Баскычтар: «+ Аванс / бонус / кармоо», Excel, PDF жана «Бекитүү». Ведомость бекитилгенден кийин бардык баскычтар өчөт жана кулпу белгиси менен эскертүү чыгат.

**2.9 Отчеттор.** Сол жакта отчеттордун тизмеси (MVP жана 2-этап). Жогоруда мезгил фильтри жана «Excel экспорт» баскычы. Андан ылдый KPI, күндөр боюнча өндүрүштүн бар-чарты жана таблица.

**2.10 Жөндөөлөр.** Өтмөктөр: Колдонуучулар, Ролдор жана укуктар (матрица), Ишкана, Telegram-бот, Өзгөртүүлөр журналы. Колдонуучуну кошуу формасында төмөнкү талаалар бар: аты-жөнү, телефон, роль, бригада, төлөм түрү жана айлык маяна. Тигүүчү кошулганда PIN автоматтык түзүлүп, SMS же Telegram аркылуу жөнөтүлөт.

**3.1 Сканерлөө.** Тигүүчүнүн негизги экраны: саламдашуу, офлайн белгиси (кезектеги скандардын саны менен), бүгүнкү киреше жана экрандын ортосундагы 240px тегерек «Сканерлөө» баскычы. Баскыч басылганда камера толук экранда ачылат. Төмөндө навигация турат: Скан, Киреше, Тарых.

**3.2 Операция тандоо.** Экрандын жогорусунда пачканын карточкасы. Андан ылдый операциялар радио баскычтар менен көрсөтүлөт, ар биринин бийиктиги ≥ 64px. Аткарылган операциялар өчүк жана сызылган болуп көрүнөт, ким аткарганы жазылат. Ар бир операциянын жанында «баа × даана = сумма» турат. Кайталанган операция тандалганда кызыл Alert чыгат. Төмөндөгү чоң баскыч «Ырастоо · 160 сом» деп жазылат.

**3.3 Жазылды.** Чоң жашыл белги, «Жазылды!» деген жазуу, операциянын аталышы × саны, «+160 сом» жана бүгүнкү жалпы киреше. Экранда эки баскыч бар: «Кийинки пачканы сканерлөө» жана «Жаңылыштык болду — жокко чыгаруу (10 сек)», экинчисинде секунддар артка саналат. Ушул учурда телефон титиреп (`navigator.vibrate(200)`), кыска үн чыгат.

**3.4 Киреше.** Бүгүн / жума / ай өтмөктөрү, кара карточкада сумма жана бүгүн аткарылган иштердин тизмеси. Жөнөтүлө элек скандар сары түс менен, брак үчүн кармоо кызыл түс менен көрсөтүлөт.

**3.5 Тарых.** Офлайн кезек тууралуу баннер, анда «Азыр жөнөтүү» баскычы бар. Скандар күндөр боюнча топтолуп көрсөтүлөт жана ар биринин статусу бар: кезекте, жөнөтүлдү же кабыл алынган жок (себеби менен).

**4.1 Кампа (2-этап).** Өтмөктөр: Материалдар, Кирим-чыгым, Даяр продукция, Жеткирүүчүлөр. Материалдар минималдык запастан аз калганда Alert чыгат. Материалдардын таблицасы статустары менен көрсөтүлөт (жетиштүү, аз калды, түгөнүүдө). Жанында акыркы кыймылдар бар. Кесүү тапшырмасы сакталганда материал кампадан автоматтык чыгым болуп эсептен чыгат.

**4.2 Сапат (2-этап).** Пачканы сканерлөө жана брак формасы: брактын түрү, саны, операция жана сүрөттөр. Брак кайсы тигүүчүгө байланышканы автоматтык көрсөтүлөт, андан кийин «Оңдоого кайтаруу» же «Кабыл алуу» тандалат. Беттин жанында брактын статистикасы жана оңдоодогу пачкалар бар.

**5.1 Кардар порталы (2-этап).** Хедер жана буйрутмалардын карточкалары: 6 этаптуу прогресс, даярдык, жөнөтүү күнү, документтер жана цехке билдирүү жөнөтүү формасы. Буйрутманын баасы жана тигүүчүлөр тууралуу маалымат кардарга көрүнбөйт.

**Ар бир экранда** жүктөлүү абалы (Skeleton), бош абал (EmptyState жана аракетке чакыруу), ката абалы («Кайра аракет кылуу» баскычы менен) жана телефондун туурасындагы көрүнүшү болушу керек.

---

## 10. Дизайн-система

### `styles/index.css`

```css
@import 'tailwindcss';

@theme {
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --color-ink: #17171a; /* текст, сайдбар, кара карталар */
  --color-ink-2: #2a2a30; /* сайдбардагы активдүү пункт */
  --color-paper: #f5f3ef; /* беттин фону */
  --color-surface: #ffffff; /* карточкалар */
  --color-line: #e2ded6; /* чектер */
  --color-line-soft: #efece6; /* таблицанын саптары, прогресс фону */
  --color-muted: #5e5a53; /* кошумча текст */
  --color-body-2: #3f3c37;

  --color-primary: #2346b8;
  --color-primary-dark: #1a3590;
  --color-primary-soft: #e8ecfa;
  --color-primary-ring: #dde3f7;

  --color-success: #15803d;
  --color-success-text: #146c33;
  --color-success-soft: #e6f4ea;
  --color-warning: #b45309;
  --color-warning-text: #8a4006;
  --color-warning-soft: #fdf1e3;
  --color-danger: #b42318;
  --color-danger-text: #8f1d14;
  --color-danger-soft: #fff4f2;

  --radius-control: 10px;
  --radius-card: 12px;
  --radius-phone-card: 16px;
}
```

### Типография

| Токен             | Өлчөм / салмак                        | Колдонулушу                         |
| ----------------- | ------------------------------------- | ----------------------------------- |
| h1                | 28 / 700, letter-spacing −0.02em      | Беттин аталышы                      |
| h2                | 16 / 600                              | Блоктун аталышы                     |
| body              | 14 / 400                              | Таблица, форма                      |
| caption           | 12 / 400, muted                       | Түшүндүрмө                          |
| сандар            | Plex Mono 600                         | Бардык суммалар, даана, %, номерлер |
| тигүүчүнүн экраны | негизги текст 16–17px, аталыш 24–30px |                                     |

### Компоненттер (`shared/ui`)

- **Button:** `variant`: `primary | secondary | success | danger | ghost`; `size`: `sm` (36px), `md` (44px), `xl` (64px, тигүүчүнүн экраны үчүн). Ар бир баскычта `loading` абалы бар (spinner көрсөтүп, баскычты өчүрөт).
- **Input, Select, Textarea:** бийиктиги 44px. Фокус абалында 2px primary чек, ката абалында danger чек жана талаанын астында ката тексти. Ар бир талаада `<label>` милдеттүү.
- **StatusBadge** (OrderStatus боюнча):
  - `NEW`: ак фон, боз чек;
  - `CUTTING`: `#EFECE6` фон;
  - `SEWING`: primary-soft фон, primary-dark текст;
  - `QC`: warning-soft фон, warning-text текст;
  - `PACKING`: success-soft фон, success-text текст;
  - `SHIPPED`: ink фон, ак текст.
- **StatCard, ProgressBar** (`tone`: `primary | warning | danger | success`), **Alert** (`danger | warning | success | info`), **Tabs, Table** (тар экранда горизонталдык сыдырылат), **Modal, Toast, EmptyState, Skeleton, FileDrop**.
- **Тигүүчү үчүн:** `ScanButton` (240px тегерек, 14px ring), `OperationOption`, `OfflineBadge`, `PinPad`.
- **AdminLayout:** сол жакта 220px кара сайдбар. Экрандын туурасы < 900px болгондо сайдбар үстүнө чыгат жана бургер менюга айланат.

### Эрежелер

- Аралыктар 4, 8, 12, 16, 24, 32 px шкаласынан алынат.
- Басылуучу элементтердин аянты ≥ 44px, тигүүчүнүн экранында ≥ 56px.
- Тексттин фонго карата контрасты ≥ 4.5:1.
- Сөлөкөттөр сызыктуу (Lucide), эмодзи колдонулбайт.
- Акча `formatMoney(1240_00)` → `"1 240 сом"` (миңдиктердин ортосунда бош орун). Дата `08.10.2026`, убакыт `14:32`.

---

## 11. Офлайн режим жана сканерлөө (тигүүчүнүн тиркемеси)

1. **PWA:** `vite-plugin-pwa` колдонулат: manifest, сөлөкөттөр жана «башкы экранга кошуу» мүмкүнчүлүгү. App shell, шрифттер жана i18n файлдары кэштелет.
2. **Prefetch:** тигүүчү киргенде жана андан кийин ар 15 мүнөт сайын `GET /scan/prefetch` чакырылат. Ал бригаданын активдүү буйрутмаларындагы пачкаларды (`qrToken → bundle`), тех. карталарды жана аткарылган операцияларды кайтарат. Бул маалымат Dexie базасына сакталат.
3. **Офлайн скан:** интернет жок болсо, пачка жана операциялар кэштен алынат. Скан `syncQueue` таблицасына `{ id: uuid, ..., status: 'pending' }` болуп жазылат жана тигүүчүгө «Жазылды» экраны дароо көрсөтүлөт (сумма кэштеги баа боюнча эсептелет). Кэштин өзүндө эле кайталоо текшерилет.
4. **Синхрондоо:** интернет калыбына келгенде (`online` окуясы), ар 30 секунд сайын жана «Азыр жөнөтүү» баскычы басылганда `POST /scan/work-records/batch` чакырылат. Ар бир жазуу үчүн сервер өзүнчө натыйжа кайтарат: `ok`, `duplicate` (ошол эле id), `conflict` (башка адам аткарган) же `error`. Натыйжа «Тарых» экранына чыгат. Конфликт болсо, тигүүчүгө жана бригадирге билдирүү барат.
5. **8 саат:** кезек кеминде 8 саат иштегенде топтолгон скандарды (≈ 500 жазуу) жоготпой сакташы керек. Телефон кайра жүктөлсө да, маалымат IndexedDBде калат.
6. **QR:** камера арткы камерадан (`facingMode: environment`) ачылат. QRдин ичинде `https://<домен>/w/scan/<qrToken>` шилтемеси жазылат: ошондуктан кадимки камера менен сканерлесе да тиркеме ачылат. Окуу 1 секунддан тез болушу керек. Жарык аз болсо, фонарь (torch) баскычы колдонулат.
7. **Тастыктоо:** ийгиликтүү скандан кийин титирөө жана кыска үн, ката болсо эки жолу титирейт.

---

## 12. Тилдер (i18n)

- `ky` (негизги) жана `ru`, кийинчерээк `en` кошулат. Тилди колдонуучу өзү тандайт, тандоосу `User.locale` талаасына жана localStorageге сакталат.
- Ачкычтар модулдар боюнча топтолот: `orders.status.SEWING`, `scan.alreadyDone`, `errors.ALREADY_DONE`.
- Сандардын, даталардын жана көптүк сандын формалары `Intl` аркылуу форматталат.
- Telegram билдирүүлөрү жана PDF документтер да колдонуучунун тилинде түзүлөт.

---

## 13. Коопсуздук

- **Multi-tenancy:**
  - Prisma client extension ар бир суроого `where: { tenantId }` шартын автоматтык кошот, ал эми `create` учурунда `tenantId` автоматтык коюлат.
  - Мындан тышкары PostgreSQL Row Level Security күйгүзүлөт: `app.tenant_id` сессиянын өзгөрмөсү аркылуу.
  - Тест: A ишканасынын токени менен B ишканасынын буйрутмасын сураганда `404` кайтышы керек.
- Бардык байланыш HTTPS (TLS 1.2+) аркылуу жүрөт. Cookie параметрлери: `httpOnly`, `secure`, `sameSite=lax`.
- **Аутентификация:**
  - Жетекчилер сырсөз (argon2, кеминде 8 белги) жана 2FA (Telegram же SMS коду) менен кирет.
  - Тигүүчүлөр телефон жана PIN менен же OTP аркылуу кирет.
  - OTP 5 мүнөттөн кийин жараксыз болот жана ага 5 гана аракет берилет.
- **Rate limit:** login, PIN жана OTP үчүн IP + телефон боюнча 5 аракет 15 мүнөттө.
- Бардык кирүүчү маалымат zod аркылуу текшерилет. Файлдар MIME түрү жана өлчөмү боюнча текшерилип, S3га кокустук ат менен сакталат жана кол коюлган убактылуу URL аркылуу берилет.
- QR токендери кокустук болот (`nanoid(16)`). Ички IDлер QRге жазылбайт.
- Маалымат базасынын резервдик көчүрмөсү күн сайын (`pg_dump`) алынат жана 30 күн сакталат. Калыбына келтирүү тартиби README файлында жазылат.
- Жеке маалыматтар КРдин «Жеке мүнөздөгү маалымат жөнүндө» мыйзамына ылайык иштетилет. Телефон номерлери тизмелерде маскаланып көрсөтүлөт: `+996 555 •• •• 56`.

---

## 14. Интеграциялар

| Интеграция                                   | Эмне үчүн                                                                                                     | Этап                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Telegram Bot API (grammY)                    | Аккаунтту байлоо (`/start <код>`), кирүү коддору, билдирүүлөр, күндүк отчет                                   | MVP                                                                         |
| Excel (exceljs)                              | Ведомость жана отчеттордун экспорту, моделдерди, операцияларды жана кызматкерлерди импорттоо (шаблон берилет) | MVP                                                                         |
| SMS-шлюз                                     | Кирүү коддору. `SmsProvider` интерфейси жазылат; dev режиминде код консолго чыгат                             | MVP                                                                         |
| Термопринтерлер                              | 58/80 мм өлчөмүндөгү PDF браузерден басылат; ZPL кийин                                                        | MVP                                                                         |
| 1С, ЭЛКАРТ / Мбанк / О!Деньги, ЭСФ, ачык API | —                                                                                                             | 2–3-этап (азыр жасалбайт, архитектура кийин кошууга мүмкүндүк бериши керек) |

**Билдирүүлөр (BullMQ жумуштары):**

- `latenessCheck`: күнүнө 2 жолу. Буйрутма кечигүү коркунучуна кирсе, `OWNER` жана `TECHNOLOGIST` билдирүү алат.
- `dailySummary`: 19:00 (Asia/Bishkek). Ар бир тигүүчүгө «Бүгүн 1 240 сом таптыңыз» деген билдирүү, ээсине күндүн кыскача отчету жөнөтүлөт.
- Ведомость бекитилгенде бухгалтер жана ээси билдирүү алат.
- Материал түгөнүп баратканда (2-этап) кампачы жана ээси билдирүү алат.

---

## 15. Функционалдык эмес талаптар

| Талап                  | Көрсөткүч                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Сканерлөөнүн ылдамдыгы | QR окулгандан тартып жазылганга чейин < 2 сек (скандардын 95%ы)                                            |
| Беттин жүктөлүшү       | 3G интернетте < 3 сек. Тигүүчүнүн бундлунун көлөмү ≤ 250 КБ (gzip); админ панелиндеги беттер lazy жүктөлөт |
| Жүктөм                 | Бир ишканада 300 тигүүчүгө чейин, бүт системада 10 000ге чейин                                             |
| Иштеп туруу            | Айына 99,5%тен кем эмес. `/health` жана `/ready` endpointтери болот                                        |
| Офлайн                 | Тигүүчүнүн тиркемеси 8 саатка чейин интернетсиз иштейт                                                     |
| Түзмөктөр              | Android 8+, iOS 14+, Chrome, Safari жана Edge браузерлеринин акыркы 2 версиясы                             |
| Тилдер                 | Кыргызча жана орусча                                                                                       |
| Валюта                 | Сом (KGS); экспорттук буйрутмалар үчүн RUB, KZT, USD                                                       |
| Жөнөкөйлүк             | Жаңы тигүүчү 10 мүнөттүк түшүндүрмөдөн кийин системаны колдоно алат                                        |

---

## 16. Тестирлөө

- **Unit (Vitest):** `calc/` ичиндеги бардык функциялар — даярдык пайызы, кечигүүнүн болжолу, тыгындар, эмгек акы жана жыйынтыктардын туура кошулушу.
- **Integration (API + тест үчүн өзүнчө PostgreSQL):**
  - бир операцияны экинчи жолу скандоо `409` кайтарат;
  - ошол эле `id` менен кайра жөнөтүү `200` кайтарат;
  - batch синхрондоодо ар бир жазуу үчүн туура натыйжа кайтарылат;
  - бекитилген ведомостту өзгөртүү `423` кайтарат;
  - tenant изоляциясы: башка ишкананын маалыматы `404` кайтарат;
  - ролдор: `SEWER` башка кызматкерлердин айлыгын ала албайт (`403`);
  - баа өзгөргөндө мурдагы скандардын суммасы өзгөрбөйт.
- **E2E (Playwright):**
  - буйрутмадан ведомостко чейинки толук цикл: буйрутма → тех. карта → кесүү → 3 тигүүчү сканерлейт → даярдык % → ведомость → бекитүү → Excel;
  - офлайн сценарий: `context.setOffline(true)` абалында 20 скан жасалат, андан кийин интернет кайра күйгүзүлөт жана 20 скан тең серверде пайда болушу керек.
- **Жүктөм тести (k6):** 300 виртуалдык тигүүчү 1 саатта 10 000 скан жасайт. Каталар < 0,1% болушу керек, скан endpointинин p95 көрсөткүчү < 300 мс.
- **Seed:** `pnpm db:seed` командасы «Демо цех» ишканасын түзөт. Анда ар бир ролго бирден колдонуучу (сырсөздөрү README файлында), 3 модель тех. карталары менен, 5 буйрутма ар кандай статуста, 60 пачка жана 2 жумалык скандар болот.

---

## 17. Иштөө тартиби (этаптар)

Ар бир этаптын аягында токто жана отчет бер. Этап бүттү деп эсептелиши үчүн lint, typecheck жана тесттер ийгиликтүү өтүшү керек.

| №   | Этап                     | Эмне жасалат                                                                                                                                              | Даяр болду дегенибиз                                                                  |
| --- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 0   | Каркас                   | pnpm monorepo, docker-compose (postgres, redis, minio), ESLint/Prettier, CI, `.env.example`, README                                                       | `pnpm dev` жазганда web менен api ишке кирет, `/health` → ok                          |
| 1   | Дизайн-система жана сайт | `@theme`, шрифттер, `shared/ui` компоненттеринин баары, 4 layout, i18n, `routes.tsx` + guards, MSW. 6.1, 6.2, 1.1 жана 1.2 экрандары (азырынча MSW менен) | Бардык компоненттер `/dev/ui` демо барагында көрүнөт; сайт телефондо да туура көрүнөт |
| 2   | Auth жана tenancy        | Prisma схемасы жана миграциялар, катталуу, login, 2FA, PIN, OTP, refresh, tenant extension жана RLS, ролдор жана укуктар, 2.10 Жөндөөлөр, audit log       | Изоляция жана ролдор боюнча тесттер өтөт                                              |
| 3   | Технология               | Кардарлар, моделдер, тех. карталар, BOM, операциялардын маалымдамасы, көчүрүү, Excel импорт, 2.5 экраны                                                   | Тех. картаны түзүп, бекитип, көчүрсө болот                                            |
| 4   | Буйрутмалар              | CRUD, өлчөм-түс матрицасы, файлдар, статустар жана алардын тарыхы, даярдык пайызы, кечигүү, 2.2, 2.3 жана 2.4 экрандары                                   | Даярдык жана кечигүү боюнча unit-тесттер өтөт                                         |
| 5   | Кесүү                    | Кесүү тапшырмасы, пачкаларга автоматтык бөлүү, QR токендер, этикеткалар PDF түрүндө (58/80/A4), кездемени каттоо, 2.6 экраны                              | Басылган QR телефондун камерасы менен ачылат                                          |
| 6   | Тигүүчүнүн тиркемеси     | PWA, скан API (бир жолу каттоо, идемпотенттүүлүк, жокко чыгаруу), prefetch, Dexie кезеги, batch синхрондоо, 3.1–3.5 экрандары                             | Офлайн E2E тести өтөт; кайталоо мүмкүн эмес                                           |
| 7   | MES                      | Операциялар боюнча аткарылыш, тыгындар, өндүрүмдүүлүк, акыркы скандар, 2.7 экраны                                                                         | Тыгын туура аныкталат                                                                 |
| 8   | Эмгек акы                | Мезгилдер, эсептөө, түзөтүүлөр, бекитүү жана кулпулоо, Excel жана PDF, «Менин кирешем», 2.8 экраны                                                        | Ведомосттун суммалары жана кулпу боюнча тесттер өтөт                                  |
| 9   | Отчеттор жана Telegram   | Dashboard (2.1), отчеттор (2.9), Excel экспорт, бот, билдирүүлөр, cron жумуштары, `/leads`                                                                | Күндүк билдирүү келет                                                                 |
| 10  | Сапатты текшерүү         | Seed маалыматы, k6 жүктөм тести, жеткиликтүүлүк (axe), 3G режиминде Lighthouse, документация (архитектура, API, орнотуу, колдонуучунун кыскача нускамасы) | 18-бөлүмдөгү критерийлер аткарылат                                                    |
| 11  | 2-этап                   | Кампа (4.1), Сапат (4.2) жана брактын тигүүчүгө байланышы, брак үчүн кармоо, Кардар порталы (5.1), өздүк нарк                                             | Өзүнчө макулдашылат                                                                   |

---

## 18. MVPни кабыл алуу критерийлери

- [ ] Буйрутмадан баштап эмгек акы ведомостуна чейинки толук цикл системада аткарылат.
- [ ] Пилоттук цехтин 2 жумалык эмгек акысы кол менен жасалган эсепке 100% дал келет.
- [ ] Тигүүчүлөрдүн 90%ы окутуудан кийин өз алдынча сканерлей алат.
- [ ] Бир пачкадагы бир операцияны эки жолу каттоо мүмкүн эмес.
- [ ] Сканерлөөлөрдүн 95%ы 2 секунддан тез жазылат.
- [ ] Интернет 4 саатка өчүрүлгөндө бир дагы сканерлөө жоголбойт.
- [ ] Маанилүү (critical) каталар жок.

---

## 19. Эмнени кылбоо керек

- Акчаны `float` же `number` бөлчөгү менен сактоо же эсептөө.
- `tenantId`ди сурамдан (URL, body) алуу.
- Бекитилген ведомостту же андагы скандарды өзгөртүү.
- Тигүүчүгө башка кызматкерлердин маалыматын же операциялардын баасын (өзүнүкүнөн тышкары) көрсөтүү.
- Коддун ичине кыргызча же орусча тексттерди түз жазуу.
- Дизайн-токендерден тышкаркы түстөрдү же өлчөмдөрдү колдонуу.
- 2-этаптын модулдарын MVPнин ичинде мен сурамайынча жасоо.
- Тесттерсиз «даяр» деп отчет берүү.

**Биринчи кадам:** 0-этаптан башта. Адегенде иштин планын жана структураны кыскача көрсөт, андан кийин гана кодго өт.
