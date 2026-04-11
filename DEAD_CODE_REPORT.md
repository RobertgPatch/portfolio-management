# Dead Code Analysis Report

> **Generated:** 2026-04-11
> **Tools Used:** [knip](https://knip.dev/) (TypeScript equivalent of Python's vulture), ESLint (TypeScript equivalent of Python's ruff)
>
> ⚠️ **Note:** This project is a TypeScript/JavaScript NX monorepo. The Python tools `ruff` and `vulture` are not applicable here. This report uses the equivalent TypeScript ecosystem tools: **knip** for dead/unused code detection (like vulture) and **ESLint** for linting and code quality (like ruff).

---

## 1. Current Codebase Metrics (Before Any Removal)

### Overall Summary

| Metric | Count |
|--------|------:|
| **Total source files** (TS, JS, HTML, SCSS, CSS, JSON) | 1,184 |
| **Total lines of code** (source only, excl. blanks/comments) | 139,107 |
| **Total blank lines** | 11,017 |
| **Total comment lines** | 1,916 |
| **Total lines (all)** | 152,040 |

### By Language

| Language | Files | Code | Blank | Comment |
|----------|------:|-----:|------:|--------:|
| TypeScript | 884 | 84,212 | 9,918 | 1,745 |
| JSON | 55 | 28,069 | 1 | 0 |
| HTML | 156 | 23,087 | 444 | 103 |
| SCSS | 88 | 3,473 | 653 | 62 |
| CSS | 1 | 266 | 1 | 6 |

### By Project Area (TypeScript Only)

| Area | Files | Lines of Code |
|------|------:|-------------:|
| `apps/api` | 312 | 43,756 |
| `apps/client` | 242 | 22,746 |
| `libs/ui` | 147 | 11,285 |
| `libs/common` | 181 | 6,308 |
| **Total** | **882** | **84,095** |

---

## 2. Dead Code Summary — What Would Be Removed

### High-Level Impact

| Category | Count | Est. Lines Removable |
|----------|------:|--------------------:|
| **Entirely unused files** | 549 | 57,823 |
| **Unused exports** (in live files) | 171 | ~500 |
| **Unused types** (in live files) | 29 | ~150 |
| **Unused enum members** (in live files) | 40 | ~40 |
| **Unused dependencies** (`package.json`) | 37 | n/a |
| **Unused devDependencies** (`package.json`) | 23 | n/a |
| **Total estimated removable** | — | **~58,500 lines** |

### Key Ratios

| Metric | Value |
|--------|------:|
| Unused files / Total TS+JS files | **549 / 893 (61.5%)** |
| Removable LoC / Total TS+JS LoC | **~58,500 / 84,824 (~69%)** |
| Unused dependencies / Total deps | **37 production + 23 dev = 60 packages** |

---

## 3. Unused Files — Breakdown by Area

| Area | Unused Files | Total Files in Area | % Unused |
|------|------------:|-------------------:|--------:|
| `apps/client` | 242 | 242 | ~100% |
| `apps/api` | 229 | 312 | 73.4% |
| `libs/ui` | 68 | 147 | 46.3% |
| `libs/common` | 4 | 181 | 2.2% |
| Other (tools, specs, root) | 6 | 11 | 54.5% |
| **Total** | **549** | **893** | **61.5%** |

### Lines of Code in Unused Files

| Language | Files | Code | Blank | Comment |
|----------|------:|-----:|------:|--------:|
| TypeScript | 537 | 57,211 | 6,759 | 1,363 |
| JavaScript | 9 | 612 | 58 | 60 |
| **Total** | **546** | **57,823** | **6,817** | **1,423** |

---

## 4. Unused Exports in Live Files (171 total)

These are exported symbols that no other file imports. Removing them would slim down the remaining codebase.

### By File

| File | Unused Exports |
|------|---------------:|
| `libs/common/src/lib/interfaces/index.ts` | 73 |
| `libs/common/src/lib/config.ts` | 39 |
| `libs/common/src/lib/helper.ts` | 21 |
| `libs/common/src/lib/dtos/index.ts` | 18 |
| `libs/common/src/lib/enums/index.ts` | 7 |
| `libs/common/src/lib/permissions.ts` | 4 |
| `apps/api/src/helper/object.helper.ts` | 3 |
| `apps/api/src/decorators/has-permission.decorator.ts` | 1 |
| `apps/api/src/interceptors/performance-logging/performance-logging.interceptor.ts` | 1 |
| `libs/common/src/lib/chart-helper.ts` | 1 |
| `libs/common/src/lib/pipes/index.ts` | 1 |
| `libs/common/src/lib/validators/is-currency-code.ts` | 1 |
| `libs/ui/src/lib/notifications/notification.module.ts` | 1 |

<details>
<summary>Full list of 171 unused exports (click to expand)</summary>

**`libs/common/src/lib/interfaces/index.ts`** (73 exports):
`ActivityError`, `AdminMarketDataDetails`, `AdminMarketDataItem`, `AdminUser`, `AssertionCredentialJSON`, `AssetClassSelectorOption`, `AttestationCredentialJSON`, `Coupon`, `DataEnhancerHealthResponse`, `DataProviderGhostfolioAssetProfileResponse`, `DividendsResponse`, `IDistribution`, `IDistributionListResponse`, `IDistributionSummary`, `IEntity`, `IEntityMembership`, `IEntityPortfolio`, `IEntityWithRelations`, `IActivityDetail`, `IActivityRow`, `IAssetClassPerformanceRow`, `IAssetClassSummary`, `IEntityPerformanceRow`, `IFamilyOfficeDashboard`, `IFamilyOfficeReport`, `IKDocument`, `IKDocumentAllocation`, `IOwnership`, `K1AggregationResult`, `K1BoxDataType`, `K1BoxDefinition`, `K1BoxDefinitionResolved`, `K1BoxOverride`, `K1BoxSection`, `K1ConfirmationRequest`, `K1ExtractionResult`, `K1ExtractedField`, `K1ImportSessionSummary`, `K1LineItem`, `K1LineItemAggregationResult`, `K1LineItemWithDefinition`, `K1PartnershipYearSummary`, `K1SourceCoordinates`, `K1SupersedeResult`, `K1UnmappedItem`, `CreateK1BoxOverrideDto`, `CreateK1LineItemDto`, `IPartnership`, `IPartnershipAsset`, `IPartnershipDetail`, `IPartnershipMembership`, `IPartnershipPerformance`, `IPartnershipValuation`, `IPerformanceMetrics`, `IPerformanceRow`, `IPortfolioSummary`, `FilterGroup`, `FireWealth`, `HistoricalResponse`, `HoldingWithParents`, `InfoResponse`, `PortfolioChart`, `PortfolioPerformance`, `PortfolioReportRule`, `Product`, `PublicKeyCredentialCreationOptionsJSON`, `PublicKeyCredentialRequestOptionsJSON`, `QuotesResponse`, `RuleSettings`, `Statistics`, `SystemMessage`, `TabConfiguration`, `K1Data`

**`libs/common/src/lib/config.ts`** (39 exports):
`ghostfolioFearAndGreedIndexDataSourceCryptocurrencies`, `ghostfolioFearAndGreedIndexDataSourceStocks`, `ghostfolioFearAndGreedIndexSymbol`, `ghostfolioFearAndGreedIndexSymbolCryptocurrencies`, `ghostfolioFearAndGreedIndexSymbolStocks`, `primaryColorHex`, `secondaryColorHex`, `warnColorHex`, `warnColorRgb`, `ASSET_CLASS_MAPPING`, `BULL_BOARD_COOKIE_NAME`, `BULL_BOARD_ROUTE`, `PLAID_SYNC_QUEUE`, `DEFAULT_DATE_FORMAT_MONTH_YEAR`, `DEFAULT_LANGUAGE_CODE`, `HEADER_KEY_IMPERSONATION`, `HEADER_KEY_TIMEZONE`, `MAX_TOP_HOLDINGS`, `NUMERICAL_PRECISION_THRESHOLD_3_FIGURES`, `NUMERICAL_PRECISION_THRESHOLD_5_FIGURES`, `NUMERICAL_PRECISION_THRESHOLD_6_FIGURES`, `PROPERTY_API_KEY_OPENROUTER`, `PROPERTY_BETTER_UPTIME_MONITOR_ID`, `PROPERTY_COUNTRIES_OF_SUBSCRIBERS`, `PROPERTY_COUPONS`, `PROPERTY_DATA_SOURCES_GHOSTFOLIO_DATA_PROVIDER_MAX_REQUESTS`, `PROPERTY_DEMO_ACCOUNT_ID`, `PROPERTY_DEMO_USER_ID`, `PROPERTY_IS_DATA_GATHERING_ENABLED`, `PROPERTY_IS_READ_ONLY_MODE`, `PROPERTY_OPENROUTER_MODEL`, `PROPERTY_SLACK_COMMUNITY_USERS`, `PROPERTY_STRIPE_CONFIG`, `PROPERTY_SYSTEM_MESSAGE`, `QUEUE_JOB_STATUS_LIST`, `STORYBOOK_PATH`, `SUPPORTED_LANGUAGE_CODES`, `TAG_ID_EMERGENCY_FUND`, `TAG_ID_DEMO`

**`libs/common/src/lib/helper.ts`** (21 exports):
`FAMILY_OFFICE_ASSET_TYPE_LABELS`, `getFamilyOfficeAssetTypeLabel`, `calculateMovingAverage`, `capitalize`, `decodeDataSource`, `downloadAsFile`, `encodeDataSource`, `getAllActivityTypes`, `getCssVariable`, `getDateFnsLocale`, `getDateWithTimeFormatString`, `getEmojiFlag`, `getNumberFormatDecimal`, `getToday`, `getUtc`, `groupBy`, `interpolate`, `isRootCurrency`, `parseSymbol`, `resolveFearAndGreedIndex`, `resolveMarketCondition`

**`libs/common/src/lib/dtos/index.ts`** (18 exports):
`AuthDeviceDto`, `ConfirmK1ImportDto`, `CreateAssetProfileDto`, `CreateDistributionDto`, `CreateEntityDto`, `CreateK1ImportDto`, `CreateKDocumentDto`, `CreateOwnershipDto`, `CreatePartnershipAssetDto`, `CreatePartnershipDto`, `CreatePartnershipMembershipDto`, `CreatePartnershipValuationDto`, `K1ExtractedFieldDto`, `K1UnmappedItemDto`, `UpdateEntityDto`, `UpdateKDocumentDto`, `UpdatePartnershipDto`, `VerifyK1ImportDto`

**`libs/common/src/lib/enums/index.ts`** (7 exports):
`DistributionType`, `DocumentType`, `EntityType`, `KDocumentStatus`, `KDocumentType`, `PartnershipType`, `ValuationSource`

**`libs/common/src/lib/permissions.ts`** (4 exports):
`getPermissions`, `hasReadRestrictedAccessPermission`, `hasRole`, `isRestrictedView`

**`apps/api/src/helper/object.helper.ts`** (3 exports):
`hasNotDefinedValuesInObject`, `nullifyValuesInObject`, `nullifyValuesInObjects`

**Other files** (1 export each):
`HasPermission` (decorator), `PerformanceLoggingInterceptor`, `formatGroupedDate`, `GfAccountingNumberPipe`, `IsExtendedCurrencyConstraint`, `GfNotificationModule`

</details>

---

## 5. Unused Types (29 total)

| File | Unused Types |
|------|-------------|
| `libs/common/src/lib/interfaces/simplewebauthn.interface.ts` | 24 types (entire WebAuthn type definitions) |
| `libs/common/src/lib/types/index.ts` | 5 types: `AccessWithGranteeUser`, `FearAndGreedIndexMode`, `HoldingType`, `MarketDataPreset`, `SubscriptionOfferKey` |

---

## 6. Unused Enum Members (40 total)

| File | Unused Members |
|------|---------------|
| `libs/common/src/lib/enums/family-office.ts` | 37 members across multiple enums (`EntityType`, `PartnershipType`, `DistributionType`, etc.) |
| `libs/common/src/lib/enums/subscription-type.type.ts` | 2 members: `Basic`, `Premium` |
| `libs/common/src/lib/enums/confirmation-dialog.type.ts` | 1 member: `Accent` |

---

## 7. Unused Dependencies (60 packages)

### Production Dependencies (37)

| Package | Category |
|---------|----------|
| `@azure/ai-form-recognizer` | AI/ML |
| `@bull-board/api` | Queue management |
| `@bull-board/express` | Queue management |
| `@bull-board/nestjs` | Queue management |
| `@codewithdan/observable-store` | State management |
| `@keyv/redis` | Caching |
| `@nestjs/jwt` | Authentication |
| `@nestjs/passport` | Authentication |
| `@nestjs/schedule` | Scheduling |
| `@nestjs/serve-static` | Server |
| `@openrouter/ai-sdk-provider` | AI |
| `@simplewebauthn/browser` | WebAuthn |
| `@simplewebauthn/server` | WebAuthn |
| `ai` | AI |
| `alphavantage` | Financial data |
| `bootstrap` | CSS framework |
| `chartjs-plugin-annotation` | Charts |
| `cheerio` | HTML parsing |
| `cookie-parser` | HTTP |
| `countries-and-timezones` | Utilities |
| `countup.js` | Animation |
| `fuse.js` | Search |
| `google-spreadsheet` | Google API |
| `helmet` | Security |
| `marked` | Markdown |
| `ngx-markdown` | Markdown (Angular) |
| `passport` | Authentication |
| `passport-google-oauth20` | Auth strategy |
| `passport-headerapikey` | Auth strategy |
| `passport-jwt` | Auth strategy |
| `passport-openidconnect` | Auth strategy |
| `pdf-parse` | PDF parsing |
| `plaid` | Financial API |
| `stripe` | Payments |
| `tablemark` | Markdown tables |
| `tesseract.js` | OCR |
| `twitter-api-v2` | Social media |

### Dev Dependencies (23)

| Package | Category |
|---------|----------|
| `@angular-eslint/eslint-plugin` | Linting |
| `@angular-eslint/eslint-plugin-template` | Linting |
| `@angular-eslint/template-parser` | Linting |
| `@angular/language-service` | IDE |
| `@angular/pwa` | PWA |
| `@nestjs/schematics` | Code generation |
| `@nx/module-federation` | Build |
| `@nx/node` | Build |
| `@nx/storybook` | Storybook |
| `@nx/workspace` | Build |
| `@storybook/addon-docs` | Storybook |
| `@types/cookie-parser` | Types |
| `@types/google-spreadsheet` | Types |
| `@types/passport-google-oauth20` | Types |
| `@types/passport-openidconnect` | Types |
| `@types/pdf-parse` | Types |
| `@typescript-eslint/eslint-plugin` | Linting |
| `eslint-plugin-import` | Linting |
| `jest-preset-angular` | Testing |
| `react` | UI (unused) |
| `react-dom` | UI (unused) |
| `ts-jest` | Testing |
| `tslib` | TypeScript utils |

---

## 8. ESLint Warnings Summary (ruff equivalent)

Total ESLint issues found: **1,117 warnings, 91 errors** across the codebase.

### Top Issue Categories

| Rule | Count | Description |
|------|------:|-------------|
| `@typescript-eslint/prefer-nullish-coalescing` | 377 | Use `??` instead of `\|\|` |
| `@typescript-eslint/no-unsafe-member-access` | 130 | Unsafe `any` member access |
| `@typescript-eslint/no-unsafe-assignment` | 130 | Unsafe `any` assignment |
| `@typescript-eslint/member-ordering` | 128 | Class member ordering |
| `@typescript-eslint/no-explicit-any` | 70 | Explicit `any` type usage |
| `@typescript-eslint/no-floating-promises` | 69 | Unhandled promises |
| `@typescript-eslint/no-unsafe-argument` | 38 | Unsafe `any` arguments |
| `@typescript-eslint/no-unsafe-return` | 34 | Unsafe `any` returns |
| `@typescript-eslint/no-shadow` | 16 | Variable shadowing |
| `@typescript-eslint/no-unsafe-call` | 12 | Unsafe `any` calls |
| `@typescript-eslint/no-redundant-type-constituents` | 10 | Redundant types |
| `@typescript-eslint/no-inferrable-types` | 10 | Unnecessary type annotations |
| Other rules | ~93 | Various |

---

## 9. Recommendations

### Immediate Wins (High Impact, Low Risk)

1. **Remove 549 unused files** → eliminates **57,823 lines** (~69% of TS/JS code)
   - These files are not imported or referenced anywhere in the project
   - Most are inherited from the upstream Ghostfolio project and are not used in this fork

2. **Remove 60 unused npm packages** → reduces install time and bundle size
   - 37 production dependencies and 23 dev dependencies are not referenced

3. **Clean up 171 unused exports** → simplifies the public API surface of shared libraries

### Medium-Term Improvements

4. **Address 377 `prefer-nullish-coalescing` warnings** → can be auto-fixed with `eslint --fix`
5. **Reduce `any` usage** (130+ unsafe member access, 130+ unsafe assignments) → improves type safety
6. **Handle floating promises** (69 warnings) → prevents silent failures

### Tools to Run the Cleanup

```bash
# Detect all dead code (what this report used)
npx knip

# Auto-fix ESLint issues where possible
npx nx run-many --target=lint --all -- --fix

# Remove unused dependencies
npx knip --fix  # (use with caution, review changes)
```

---

## 10. Caveat

> **Important:** knip's analysis is based on static import/export resolution. Some files flagged as "unused" may be:
> - Dynamically imported (e.g., lazy-loaded Angular modules)
> - Referenced in configuration files (e.g., NestJS modules using `forRoot()`)
> - Used by the framework at runtime (e.g., NestJS decorators, Angular component selectors in HTML templates)
> - Used in build/deploy scripts not analyzed by knip
>
> **Always review and test before bulk-deleting files.** Start with the most obvious candidates (tools, specs, standalone utilities) before touching framework modules.
