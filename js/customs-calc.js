/* ==========================================================================
   Ascend Trade & Logistics — Калькулятор таможенных платежей (Азербайджан)
   Для страницы U2 /gomruk-rusumu-kalkulyatoru

   ЧТО ЭТО. Самодостаточный клиентский модуль: считает ОРИЕНТИРОВОЧНЫЕ платежи
   государству при импорте в Азербайджан (пошлина + акциз + НДС 18 % + сборы ГТК).
   Зависимостей нет. Никаких сетевых запросов, никакой отправки данных,
   ничего не пишет в localStorage/cookie. Всё считается в браузере.

   НЕ СЧИТАЕТ и не должен: фрахт, услуги брокера, хранение, СВХ, услуги Ascend,
   маржу. Ограничение из docs/research/06-legal-risks.md §7.1 п.1.

   ИСТОЧНИК СТАВОК — internal rate research (составлен 24.08.2026).
   Каждая строка данных ниже помечена ссылкой на раздел документа. Ставки
   в коде НЕ выдумываются: если по категории в 07 однозначной ставки нет,
   категории здесь нет (см. отчёт backend'а: пробелы по гл. 48, 50–60, 68, 70, 72–73).

   ЛОГИКА (сверено с PROJECT-STATUS.md §3 и с 02_Ассистент-Знания/Ascend-Kalkulyator.xlsx,
   лист «Калькулятор», формулы C24/D25/D26/D27/D28/D30):
     CIF = товар + фрахт + страховка
     пошлина = CIF × ставка
     акциз   = CIF × ставка акциза (только подакцизные)
     НДС     = 18 % × (CIF + пошлина + акциз)
     сборы   = сбор за оформление по стоимостной шкале + 30 AZN за лист декларации
     ИТОГО   = пошлина + акциз + НДС + сборы
   Отличие от xlsx владельца: там «гомрук йыгымы» — ручной ввод (275 AZN, пометка
   «ПОДТВЕРДИТЬ у брокера»); здесь взята официальная шкала ПКМ АР № 168 (см. FEES).

   ПОДКЛЮЧЕНИЕ (порядок важен — модулю нужен window.I18N):
     <script src="/js/i18n.js"></script>
     <script src="/js/customs-calc.js" defer></script>
     <script src="/js/app.js" defer></script>
   Инициализация автоматическая по атрибуту data-customs-calc.
   Полный образец разметки и стилей — widget spec.

   ОБРАЗЕЦ РАЗМЕТКИ (рабочий, скопировать на страницу):

   <div class="calc form" data-customs-calc data-reveal>
     <form class="calc-form" data-calc-form>
       <div class="field">
         <label for="cc-cat" data-i18n="calc.f.category">Malın kateqoriyası</label>
         <!-- список строится здесь же, в JS (fillSelect перезаписывает содержимое);
              на странице U2 те же <option> продублированы статически — чтобы
              категории были видны без JS и попадали в индекс -->
         <select id="cc-cat" name="category" data-calc-field="category"></select>
         <p class="calc-hint" data-calc-hint hidden></p>
       </div>
       <div class="form-row">
         <div class="field">
           <label for="cc-goods" data-i18n="calc.f.goods">Malın dəyəri (invoys), USD</label>
           <input id="cc-goods" name="goods" type="text" inputmode="decimal"
                  autocomplete="off" data-calc-field="goods"
                  data-i18n-ph="calc.ph.goods" placeholder="30000">
         </div>
         <div class="field">
           <label for="cc-freight" data-i18n="calc.f.freight">Sərhədə qədər fraxt, USD</label>
           <input id="cc-freight" name="freight" type="text" inputmode="decimal"
                  autocomplete="off" data-calc-field="freight"
                  data-i18n-ph="calc.ph.zero" placeholder="0">
         </div>
       </div>
       <div class="form-row">
         <div class="field">
           <label for="cc-ins">
             <span data-i18n="calc.f.insurance">Sığorta, USD</span>
             <span class="calc-opt">(<span data-i18n="ct.optional">istəyə bağlı</span>)</span>
           </label>
           <input id="cc-ins" name="insurance" type="text" inputmode="decimal"
                  autocomplete="off" data-calc-field="insurance"
                  data-i18n-ph="calc.ph.zero" placeholder="0">
         </div>
         <div class="field">
           <label for="cc-fx">
             <span data-i18n="calc.f.fx">Məzənnə USD → AZN</span>
             <span class="calc-opt">(<span data-i18n="ct.optional">istəyə bağlı</span>)</span>
           </label>
           <input id="cc-fx" name="fx" type="text" inputmode="decimal"
                  autocomplete="off" data-calc-field="fx"
                  data-i18n-ph="calc.ph.fx" placeholder="1.70">
         </div>
       </div>
       <button type="submit" class="btn btn-primary"
               style="width:100%;justify-content:center" data-i18n="calc.btn">Ödənişləri hesabla</button>
     </form>

     <div class="calc-out" data-calc-out hidden aria-live="polite"></div>

     <p class="form-note calc-disclaimer" style="font-size:.82rem;margin-top:18px"
        data-i18n="calc.disclaimer"></p>
     <p class="form-note calc-source" style="font-size:.78rem;margin-top:10px" data-calc-source></p>
   </div>

   ========================================================================== */
(function () {
  "use strict";

  var VERSION = "1.0.0";

  /* ------------------------------------------------------------------------
     1. КУРС. Обновлять руками вместе с датой.
     [ФАКТ] ЦБ Азербайджана (cbar.az), бюллетень официальных курсов
     на 25.08.2026: 1 ABŞ dolları = 1.7000 AZN — курс подтверждён pm 25.08.2026,
     значение не изменилось с бюллетеня за 24.08.2026. Сходится со значением
     в CLAUDE.md §0 и в Ascend-Kalkulyator.xlsx (C7 = 1.7).
     maxAgeDays: по CLAUDE.md §5 тариф старше 3 месяцев считается неактуальным.
     Просрочен — модуль НЕ показывает манаты и не считает сборы ГТК
     (шкала сборов в AZN, без курса диапазон не определить), а честно пишет
     «уточняется» и просит ввести свой курс.
     ------------------------------------------------------------------------ */
  var FX = {
    perUsd: 1.70,
    date: "2026-08-25",
    maxAgeDays: 90,
    source: "cbar.az"
  };

  /* ------------------------------------------------------------------------
     2. НДС.
     [ФАКТ] 18 % от (таможенная стоимость + пошлина + акциз).
     НК АР ст. 162, 173. Источник: 07-customs-barriers.md §0, §1.2. На 24.08.2026.
     ------------------------------------------------------------------------ */
  var VAT_RATE = 0.18;

  /* ------------------------------------------------------------------------
     3. ТАМОЖЕННЫЕ СБОРЫ (gömrük yığımı).
     [ФАКТ] ПКМ АР № 168 от 26.04.2016 «Gömrük yığımlarının məbləğləri»,
     файл на сайте ГТК обновлён 06.02.2026.
     Источник: 07-customs-barriers.md §1.4. На 24.08.2026.
     Шкала берётся от ТАМОЖЕННОЙ СТОИМОСТИ в манатах (не от суммы платежей) —
     подтверждено примером расчёта в 07 §2: CIF 51 000 AZN → 200 AZN.
     Плюс 30 AZN за каждый лист декларации (электронная таможенная услуга).
     Модуль считает ОДИН лист: многопозиционная партия потребует добавочных
     листов — это отдельная строка, её здесь нет (см. отчёт backend'а).
     Границы диапазонов в ПКМ заданы как «1 000 – 10 000» без указания,
     куда относится ровно граничное значение; взято «включительно к нижнему
     диапазону» (<=). На практике роли не играет.
     ------------------------------------------------------------------------ */
  var FEES = {
    checkedOn: "2026-08-24",
    perSheetAzn: 30,
    sheets: 1,
    brackets: [
      { upToAzn: 1000,    azn: 15 },
      { upToAzn: 10000,   azn: 60 },
      { upToAzn: 50000,   azn: 120 },
      { upToAzn: 100000,  azn: 200 },
      { upToAzn: 500000,  azn: 300 },
      { upToAzn: 1000000, azn: 600 },
      { upToAzn: null,    azn: 1000 }
    ],
    source: "ПКМ АР № 168 от 26.04.2016 (файл ГТК 06.02.2026)"
  };

  /* ------------------------------------------------------------------------
     4. КАТЕГОРИИ.
     Все ставки — из internal rate research, дата документа 24.08.2026,
     первоисточник ставок — ПКМ АР № 500 от 17.11.2017 с изменениями.
     ОГОВОРКА ИЗ ИСТОЧНИКА (07 §1.1 и §14 п.1): разбор сделан по редакции
     ПКМ № 500 примерно 2021 года; картина «какая ставка доминирует по главе»
     достоверна, конкретную подсубпозицию перед сделкой нужно проверять.
     Поэтому у смешанных глав стоит флаг "rate".

     Поля:
       id            — стабильный ключ (в i18n: calc.cat.<id>)
       chapter       — наиболее вероятные главы/позиции ТН ВЭД, для подписи
       duty          — ставка ввозной пошлины (0 / 0.05 / 0.15)
       exciseRate    — адвалорный акциз от таможенной стоимости (0, если нет)
       flags         — "rate"   — ставка внутри группы неоднородна, нужен код
                       "permit" — вероятны сертификация/разрешение
                       "excise" — товар подакцизный
                       "note"   — требование лежит ВНЕ таможни: режим перевозки
                                  груза либо допуск товара к применению. На сумму
                                  платежей не влияет, на сделку влияет.
                                  Заведён отдельно от "permit" сознательно:
                                  "permit" утверждает, что могут потребоваться
                                  сертификат или разрешение ПРИ ВВОЗЕ, а по 8507
                                  и 9028 это как раз отрицательный результат
                                  проверки (09 §B.2, §B.4, §C.2) — такого
                                  требования на границе не обнаружено.
       warn          — необязательный ПОЛНЫЙ ключ i18n: предупреждение самой
                       категории, а не типа оговорки (текст flags общий для всех
                       категорий с этим флагом, текст warn — только для этой).
                       Идёт в подсказку под селектом и в результат по тому же
                       каналу, что и warnings калькулятора.
     ------------------------------------------------------------------------ */
  var CATEGORIES = [
    // 07 §1.1 + §2: все 147 подсубпозиций гл. 61 и все 194 гл. 62 — 15 %. Однозначно.
    { id: "apparel",     chapter: "61, 62",           duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §2: гл. 64 — 70 позиций по 15 %, 8 позиций (6406, части обуви) по 5 %.
    // Консервативно взята бо́льшая — 15 %; флаг "rate" из-за 6406.
    { id: "footwear",    chapter: "64",               duty: 0.15, exciseRate: 0, flags: ["rate"] },

    // 07 §2: гл. 42 — 37 из 38 подсубпозиций по 15 % (4202 сумки, чемоданы; 4203).
    { id: "bags",        chapter: "4202, 4203",       duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §2 + §11: гл. 63 — 76 из 79 по 15 % (6302 постельное/столовое бельё,
    // 6303–6304 шторы). В §11 помечена как самая простая подгруппа корзины 1.
    { id: "hometextile", chapter: "63",               duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §4 + §11: гл. 94 — 79 из 85 по 15 %; проверенный пример 9403 20 20 00 — 15 %.
    { id: "furniture",   chapter: "9401, 9403, 9404", duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §4: 9405 — 25 из 27 позиций 15 %.
    // 07 §11: «электробезопасность: наиболее вероятный кандидат на требование сертификата».
    // ДОПОЛНЕНИЕ 09 §D.3 и §E: сами светильники 9405 запретом НЕ затронуты — ставка и флаги
    // не меняются. Но соседняя группа 8539 (лампы накаливания для сети переменного тока)
    // ЗАПРЕЩЕНА к ввозу: ≥ 60 Вт с 01.01.2026, 25–60 Вт с 01.07.2026 — раздел 4 перечня ГТК
    // (ред. 05.08.2026, стр. 70), Закон АР «Об эффективном использовании энергетических
    // ресурсов и энергоэффективности». Практический вывод для K3: лампы накаливания
    // в догрузку светильников брать нельзя. Подсказку по калькулятору сюда не вешаем —
    // запрет касается ламп, а не светильников.
    { id: "lighting",    chapter: "9405",             duty: 0.15, exciseRate: 0, flags: ["permit"] },

    // 07 §4: 6911 10 00 00 (фарфоровая посуда) — 15 %; гл. 69 — 38 из 48 по 15 %.
    { id: "tableware",   chapter: "6911–6913",        duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §4 + §11: керамическая плитка 6907 — 15 %, но исторически имела
    // специфическую надбавку «не менее 2 USD за м²», помеченную в редакции
    // как действовавшую до 31.12.2021; в действующей редакции требует проверки.
    // Поэтому флаг "rate": расчёт может быть занижен на величину надбавки.
    { id: "tiles",       chapter: "6907",             duty: 0.15, exciseRate: 0, flags: ["rate"] },

    // 07 §4: 3924 10 00 00 (посуда), 3926 40 00 00 (декор) — 15 %.
    // Гл. 39 расщеплена: полимеры-сырьё 0 %, готовые изделия 15 % — здесь только готовые.
    // ДОПОЛНЕНИЕ 09 §E: ЧАСТЬ АССОРТИМЕНТА ЭТОЙ ГРУППЫ ЗАПРЕЩЕНА К ВВОЗУ — раздел 3
    // перечня ГТК (ред. 05.08.2026, стр. 69), Закон АР «Об охране окружающей среды»:
    // одноразовые пластиковые мешалки, вилки, ложки, ножи, тарелки и стаканы
    // (3924 10 0000-dan) и полиэтиленовые пакеты толщиной до 15 микрон (3923 21 0000-dan).
    // Ставку не трогаем: остальной ассортимент группы ввозится и считается как прежде.
    // Отсюда warn — предупреждение самой категории, а не оговорка о ставке.
    { id: "plastics",    chapter: "3923, 3924, 3926", duty: 0.15, exciseRate: 0, flags: [],
      warn: "calc.warn.banned" },

    // 07 §4 + §11: гл. 95 — 63 из 64 по 15 %; 9503 00 70 00 (наборы игрушек) — 15 %.
    // Только НЕэлектронные: игрушки с Wi-Fi/Bluetooth уходят под режим
    // ограниченного оборота (07 §6.1) и в калькуляторе не считаются.
    { id: "toys",        chapter: "9503",             duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §4: 9504 50 00 00 (игровые консоли) — 15 %; гл. 95 в целом 63 из 64 по 15 %.
    { id: "sportgoods",  chapter: "9504, 9506",       duty: 0.15, exciseRate: 0, flags: [] },

    // 07 §3: гл. 85 смешанная — 305 позиций 15 %, 166 — 5 %, 120 — 0 %.
    // Проверенные примеры по бытовой технике и аудио: 8508 11 00 00 (пылесосы) — 15 %,
    // 8516 60 10 10/90 (электроплиты) — 15 %, 8518 30 95 00 (наушники) — 15 %,
    // 8507 60 000 9 (Li-ion аккумуляторы) — 15 %, 8528 72 10 00 — 15 %.
    // Консервативно 15 % + флаг "rate". Только БЕЗ радиомодуля: Wi-Fi/Bluetooth —
    // отдельный режим разрешений RİNN (07 §6).
    { id: "appliances",  chapter: "8508, 8516, 8518, 8528", duty: 0.15, exciseRate: 0, flags: ["rate"] },

    // 07 §3 + §11 (🟢): 8471 30 000 0 (ноутбуки) — 5 %, 8443 32 10 00 (принтеры) — 5 %,
    // 8504 40 30 00 (блоки питания) — 5 %. Прямые проверенные примеры.
    { id: "computers",   chapter: "8471, 8443, 8504", duty: 0.05, exciseRate: 0, flags: [] },

    // 07 §3 + §11 (🟢): «8467 (электро- и пневмоинструмент) — все 21 позиция 5 %».
    { id: "powertools",  chapter: "8467",             duty: 0.05, exciseRate: 0, flags: [] },

    // 07 §3: гл. 82 — 98 позиций 15 %, 3 по 5 %, 1 по 0 %; 8207 — 32 позиции 15 %
    // и 3 по 5 % (8207 19 10 00 с алмазной рабочей частью — 5 %).
    // Консервативно 15 % + флаг "rate" (07 §11: «спор по коду стоит 10 п.п.»).
    { id: "handtools",   chapter: "82 (8205, 8207)",  duty: 0.15, exciseRate: 0, flags: ["rate"] },

    // 07 §1.1: гл. 84 — 613 подсубпозиций 0 %, 237 — 5 %, 104 — 15 %; «доминирует 0 %».
    // ВНИМАНИЕ: это единственная категория, где взята НЕ бо́льшая ставка.
    // Причина: 0 % — доминирующая с перевесом 6:1, и показ 15 % для средств
    // производства исказил бы расчёт в разы. Флаг "rate" обязателен.
    // Код-уровневого примера 0 % документ 07 не приводит — решение вынесено
    // в отчёт backend'а на подтверждение pm/владельцу.
    { id: "machinery",   chapter: "84",               duty: 0.00, exciseRate: 0, flags: ["rate"] },

    // ДОПОЛНЕНИЕ 09 §B: 8507 60 000 9 (литий-ионные аккумуляторы, кроме авиационных) — 15 %
    // (07 §3, извлечено из консолидированного текста ПКМ АР № 500 от 17.11.2017,
    //  frameworks.e-qanun.az/37/c_f_37035.html, редакция с изм. примерно по 2021 г.).
    // Остальные подсубпозиции 8507 построчно не проверялись → флаг "rate".
    // Флаг "permit" здесь означает НЕ разрешение таможни, а допуски на перевозку
    // опасного груза класса 9: UN 38.3 + MSDS от фабрики, ПКМ АР № 10 от 27.01.2000,
    // ДОПОГ (АЗ — сторона с 28.09.2000). Текст под калькулятором на K2 обязан это пояснить.
    // ОТСТУПЛЕНИЕ ОТ §F: вместо "permit" ставим "note". Текст calc.flag.permit говорит
    // «может потребоваться сертификат или разрешение» — то есть про границу, а по 8507
    // разрешительных требований при ввозе как раз НЕ обнаружено (09 §B.2, §B.4).
    { id: "batteries",   chapter: "8507",              duty: 0.15, exciseRate: 0, flags: ["rate", "note"] },

    // ДОПОЛНЕНИЕ 09 §C: 9028 20 00 00 (счётчики жидкости) — 15 % (07 §3, тот же источник).
    // 9028 10 (газ), 9028 30 (электричество), 9028 90 (части) построчно не проверялись → "rate".
    // Флаг "permit": утверждение типа + государственный реестр + поверка —
    // Закон АР № 686-IVQ от 13.06.2013 (ст. 2.2, 9.1, 11, 12), ПКМ АР № 393 от 16.12.2014, раздел 9.
    // Это требование к ПРИМЕНЕНИЮ прибора, не к выпуску на таможне.
    // ОТСТУПЛЕНИЕ ОТ §F: по той же причине, что и у 8507, — "note" вместо "permit".
    // Счётчик таможню пройдёт; без утверждённого типа и поверки его нельзя применять
    // в коммунальном учёте (09 §C.3). Утверждать обратное запрещено 09 §C.5.
    { id: "meters",      chapter: "9028",              duty: 0.15, exciseRate: 0, flags: ["rate", "note"] },

    // ДОПОЛНЕНИЕ 09 §D: 8512 20 000 9 (приборы освещения и визуальной сигнализации,
    // кроме используемых для промышленной сборки) — 15 % (07 §3, тот же источник).
    // Подсубпозиция 8512 20 000 1 (промсборка) не подтверждена, 8512 30/40/90 не проверялись → "rate".
    // "permit" НЕ ставим: обязательная сертификация автокомпонентов первичным источником
    // не подтверждена (09 §D.2). Ставить флаг без основания — обещание требования, которого нет.
    { id: "autolight",   chapter: "8512",              duty: 0.15, exciseRate: 0, flags: ["rate"] },

    // 07 §1.1: гл. 33 — все 48 подсубпозиций по 15 %. Однозначно.
    // 07 §11: «вероятны санитарные требования» + товарные знаки P&G, Beiersdorf,
    // Henkel в таможенном реестре ИС — флаг "permit".
    { id: "cosmetics",   chapter: "33",               duty: 0.15, exciseRate: 0, flags: ["permit"] },

    // 07 §2 + §1.3 + §11 (🔴): гл. 43, изделия из натурального меха.
    // Пошлина 15 %; акциз 10 % таможенной стоимости, НО «не ниже оптовой
    // рыночной цены» (ст. 190.4.5 НК АР) — значит расчёт даёт МИНИМУМ,
    // фактический акциз может быть выше. Отсюда флаги "excise" + "permit".
    { id: "fur",         chapter: "43",               duty: 0.15, exciseRate: 0.10, flags: ["excise", "permit"] }
  ];

  /* Категории, СОЗНАТЕЛЬНО не включённые (нужен вход, которого в этой форме нет,
     либо в 07 нет ставки) — перечислены в widget spec:
       мобильные устройства (акциз 20 AZN/шт — нужен ввод количества),
       вейпы и жидкости — ДОПОЛНЕНИЕ 09 §E: причина не в акцизе (2 AZN/шт, 100 AZN/л),
         а в том, что ввоз и вывоз электронных сигарет и их компонентов ЗАПРЕЩЁН
         (раздел 5 перечня ГТК ред. 05.08.2026, стр. 71; Закон АР № 138-IIQ
         от 08.06.2001) — категории не должно быть ни в каком виде,
       легковые авто (пошлина и акциз по см³ — нужен объём двигателя),
       ткани (гл. 50–60), канцтовары (гл. 48, 96), стройматериалы
       (гл. 68, 70, 72, 73), автозапчасти (8708) — по этим главам ставок в 07 нет. */

  var MAX_AMOUNT = 1e9;   // защита от мусора и от переполнения вёрстки
  var MIN_FX     = 0.5;   // нижняя граница «своего курса»: ниже — заведомо опечатка
  var MAX_FX     = 100;   // верхняя граница; за ней курс тоже опечатка, а не курс
  var MIN_GOODS  = 1;     // партия дешевле 1 USD — опечатка, а не коммерческий импорт

  /* ---------------------------- вспомогательное ---------------------------- */

  function round2(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  function daysSince(isoDate, now) {
    var t = Date.parse(isoDate + "T00:00:00Z");
    if (isNaN(t)) return Infinity;
    return Math.floor(((now || Date.now()) - t) / 86400000);
  }

  /* Приведение «1 234,56» / «1.234.567» / «1,234.56» к машинному «1234.56».
     Правила однозначные, догадок нет — иначе «10,000» тихо превращалось
     в 10, а «1.500» — в 1,5:
       • есть и точка, и запятая — последний из них десятичный, прочие тысячные;
       • один и тот же разделитель встречается несколько раз — все они тысячные;
       • разделитель один и после него 1–2 или 4+ цифр — десятичный;
       • разделитель один, после него РОВНО 3 цифры, а до — 1–3: по вводу не понять,
         тысячи это или дробь → ошибка calc.err.separator, угадывать нельзя.
     Группы тысячных обязаны быть по 3 цифры, иначе это мусор («1.2.3»). */
  function normalizeSeparators(s) {
    var lastDot = s.lastIndexOf("."), lastComma = s.lastIndexOf(",");
    if (lastDot === -1 && lastComma === -1) return { value: s };

    var dec = null;                       // десятичный разделитель (null — его нет)
    var group;                            // разделитель тысяч
    if (lastDot !== -1 && lastComma !== -1) {
      dec   = lastDot > lastComma ? "." : ",";
      group = dec === "." ? "," : ".";
    } else {
      var sep = lastDot !== -1 ? "." : ",";
      if (s.indexOf(sep) !== s.lastIndexOf(sep)) {
        group = sep;                      // «1.234.567» / «1,234,567» — только тысячные
      } else {
        var tail = s.slice(s.lastIndexOf(sep) + 1);
        var head = s.slice(0, s.indexOf(sep));
        if (tail.length === 3 && /^\d{1,3}$/.test(head)) return { error: "calc.err.separator" };
        dec = sep;
        group = dec === "." ? "," : ".";   // второго символа в строке нет
      }
    }

    var intPart = s, frac = "";
    if (dec !== null) {
      var at = s.lastIndexOf(dec);
      intPart = s.slice(0, at);
      frac = s.slice(at + 1);
      if (!/^\d+$/.test(frac)) return { error: "calc.err.number" };
    }
    if (intPart.indexOf(group) !== -1) {
      if (!new RegExp("^\\d{1,3}(\\" + group + "\\d{3})+$").test(intPart)) return { error: "calc.err.number" };
      intPart = intPart.split(group).join("");
    }
    return { value: dec === null ? intPart : intPart + "." + frac };
  }

  /* Разбор пользовательской суммы. Возвращает {value} или {error:<ключ i18n>}. */
  function parseAmount(raw, opts) {
    opts = opts || {};
    if (raw === undefined || raw === null) raw = "";
    var s = String(raw).replace(/[\s\u00A0\u202F\u2009]/g, "");
    if (s === "") {
      if (opts.required) return { error: "calc.err.required" };
      return { value: 0 };
    }
    if (s.charAt(0) === "-") return { error: "calc.err.negative" };
    var norm = normalizeSeparators(s);
    if (norm.error) return { error: norm.error };
    s = norm.value;
    if (!/^\d+(\.\d+)?$/.test(s)) return { error: "calc.err.number" };
    var v = parseFloat(s);
    if (!isFinite(v)) return { error: "calc.err.number" };
    if (opts.required && v <= 0) return { error: "calc.err.positive" };
    if (opts.min !== undefined && v < opts.min) return { error: "calc.err.min" };
    if (v > (opts.max || MAX_AMOUNT)) return { error: "calc.err.toobig" };
    return { value: v };
  }

  function findCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function feeForCustomsValueAzn(azn) {
    for (var i = 0; i < FEES.brackets.length; i++) {
      var b = FEES.brackets[i];
      if (b.upToAzn === null || azn <= b.upToAzn) return b.azn;
    }
    return FEES.brackets[FEES.brackets.length - 1].azn;
  }

  /* ------------------------------- расчёт --------------------------------- */

  /**
   * @param {Object} input {category, goods, freight, insurance, fx, now}
   * @returns {Object} {ok:false, errors:[{field,key}]} | {ok:true, ...разбивка}
   */
  function calculate(input) {
    input = input || {};
    var errors = [];

    var cat = findCategory(input.category);
    if (!cat) errors.push({ field: "category", key: "calc.err.category" });

    var goods = parseAmount(input.goods, { required: true, min: MIN_GOODS });
    if (goods.error) errors.push({ field: "goods", key: goods.error });

    var freight = parseAmount(input.freight);
    if (freight.error) errors.push({ field: "freight", key: freight.error });

    var insurance = parseAmount(input.insurance);
    if (insurance.error) errors.push({ field: "insurance", key: insurance.error });

    /* курс: свой (если введён) или официальный с проверкой срока годности */
    var fxValue = FX.perUsd;
    var fxSource = "official";
    var fxStale = daysSince(FX.date, input.now) > FX.maxAgeDays;

    var rawFx = input.fx;
    if (rawFx !== undefined && rawFx !== null && String(rawFx).trim() !== "") {
      var fx = parseAmount(rawFx, { required: true, max: MAX_FX });
      if (fx.error) {
        errors.push({ field: "fx", key: fx.error === "calc.err.toobig" ? "calc.err.fx" : fx.error });
      } else if (fx.value < MIN_FX) {
        /* курс ниже 0,5 AZN за доллар — опечатка (например, «0,17» вместо «1,70») */
        errors.push({ field: "fx", key: "calc.err.fx" });
      } else {
        fxValue = fx.value;
        fxSource = "user";
        fxStale = false;
      }
    }

    if (errors.length) return { ok: false, errors: errors };

    var warnings = [];
    /* предупреждение самой категории (например, часть ассортимента запрещена
       к ввозу) — первым: оно важнее оговорок о фрахте, курсе и сроке ставок */
    if (cat.warn) warnings.push(cat.warn);
    if (freight.value === 0) warnings.push("calc.warn.nofreight");
    if (fxStale) warnings.push("calc.warn.fx");
    if (daysSince(FEES.checkedOn, input.now) > 365) warnings.push("calc.warn.rates");

    /* CIF в USD — таможенная стоимость */
    var cifUsd = round2(goods.value + freight.value + insurance.value);

    var lines = [];
    var toAzn = function (usd) { return fxStale ? null : round2(usd * fxValue); };
    var toUsd = function (azn) { return round2(azn / fxValue); };

    lines.push({ key: "calc.row.goods",     kind: "base",     usd: round2(goods.value),     azn: toAzn(goods.value) });
    lines.push({ key: "calc.row.freight",   kind: "base",     usd: round2(freight.value),   azn: toAzn(freight.value) });
    lines.push({ key: "calc.row.insurance", kind: "base",     usd: round2(insurance.value), azn: toAzn(insurance.value) });
    lines.push({ key: "calc.row.cif",       kind: "subtotal", usd: cifUsd,                  azn: toAzn(cifUsd) });

    /* пошлина / акциз / НДС считаются в манатах — как в декларации и в xlsx владельца.
       Без курса считаем в долларах, а манаты помечаем «уточняется». */
    var base   = fxStale ? cifUsd : round2(cifUsd * fxValue);
    var duty   = round2(base * cat.duty);
    var excise = round2(base * cat.exciseRate);
    var vatBase = round2(base + duty + excise);
    var vat    = round2(vatBase * VAT_RATE);

    var pack = function (amount) {
      return fxStale
        ? { usd: round2(amount), azn: null }
        : { usd: toUsd(amount), azn: round2(amount) };
    };

    var dutyLine = pack(duty);
    dutyLine.key = "calc.row.duty";
    dutyLine.kind = "payment";
    dutyLine.rate = cat.duty;
    lines.push(dutyLine);

    if (cat.exciseRate > 0) {
      var exLine = pack(excise);
      exLine.key = "calc.row.excise";
      exLine.kind = "payment";
      exLine.rate = cat.exciseRate;
      exLine.minimum = true; // база акциза может быть выше таможенной стоимости
      lines.push(exLine);
    }

    var vbLine = pack(vatBase);
    vbLine.key = "calc.row.vatbase";
    vbLine.kind = "subtotal";
    lines.push(vbLine);

    var vatLine = pack(vat);
    vatLine.key = "calc.row.vat";
    vatLine.kind = "payment";
    vatLine.rate = VAT_RATE;
    lines.push(vatLine);

    /* Сборы ГТК — шкала в манатах, без курса диапазон не определяется. */
    var feeAzn = null, sheetAzn = null;
    if (fxStale) {
      lines.push({ key: "calc.row.fee",   kind: "payment", usd: null, azn: null, pending: true });
      lines.push({ key: "calc.row.sheet", kind: "payment", usd: null, azn: null, pending: true });
    } else {
      feeAzn = feeForCustomsValueAzn(base);
      sheetAzn = round2(FEES.perSheetAzn * FEES.sheets);
      lines.push({ key: "calc.row.fee",   kind: "payment", usd: toUsd(feeAzn),   azn: feeAzn });
      lines.push({ key: "calc.row.sheet", kind: "payment", usd: toUsd(sheetAzn), azn: sheetAzn, sheets: FEES.sheets });
    }

    var totalAzn = fxStale ? null : round2(duty + excise + vat + feeAzn + sheetAzn);
    var totalUsd = fxStale ? round2(duty + excise + vat) : toUsd(totalAzn);

    return {
      ok: true,
      version: VERSION,
      category: { id: cat.id, chapter: cat.chapter, duty: cat.duty, exciseRate: cat.exciseRate, flags: cat.flags.slice() },
      fx: { value: fxValue, source: fxSource, date: FX.date, stale: fxStale },
      lines: lines,
      total: {
        usd: totalUsd,
        azn: totalAzn,
        partial: fxStale        // без сборов ГТК — курс просрочен
      },
      warnings: warnings,
      flags: cat.flags.slice()
    };
  }

  /* ------------------------------- i18n ----------------------------------- */

  function currentLang() {
    var l = document.documentElement.getAttribute("lang");
    if (!l) { try { l = localStorage.getItem("ascend_lang"); } catch (e) { l = null; } }
    if (l !== "az" && l !== "ru" && l !== "en") l = "az";
    return l;
  }

  function t(key, params) {
    var dict = (window.I18N && (window.I18N[currentLang()] || window.I18N.az)) || {};
    var s = dict[key];
    if (s === undefined && window.I18N && window.I18N.az) s = window.I18N.az[key];
    if (s === undefined) s = key;
    if (params) {
      s = String(s).replace(/\{(\w+)\}/g, function (m, k) {
        return params[k] !== undefined ? params[k] : m;
      });
    }
    return s;
  }

  var LOCALES = { az: "az-AZ", ru: "ru-RU", en: "en-US" };

  function fmt(n, digits) {
    if (n === null || n === undefined) return t("calc.pending");
    var d = digits === undefined ? 2 : digits;
    try {
      return new Intl.NumberFormat(LOCALES[currentLang()] || "az-AZ", {
        minimumFractionDigits: d, maximumFractionDigits: d
      }).format(n);
    } catch (e) {
      return n.toFixed(d);
    }
  }

  function fmtDate(iso) {
    var p = String(iso).split("-");
    return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : String(iso);
  }

  function pct(rate) {
    var v = round2(rate * 100);
    return fmt(v, v % 1 === 0 ? 0 : 1) + " %";
  }

  /* ------------------------------- UI ------------------------------------- */

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function init(root) {
    if (typeof root === "string") root = document.querySelector(root);
    if (!root || root.__ccBound) return null;
    root.__ccBound = true;

    var form  = root.querySelector("[data-calc-form]");
    var out   = root.querySelector("[data-calc-out]");
    var hint  = root.querySelector("[data-calc-hint]");
    var srcEl = root.querySelector("[data-calc-source]");
    var select = root.querySelector('[data-calc-field="category"]');
    if (!form || !out || !select) return null;

    form.setAttribute("novalidate", "novalidate");

    var field = function (name) { return root.querySelector('[data-calc-field="' + name + '"]'); };
    var lastResult = null;   // последний УСПЕШНЫЙ расчёт — для перерисовки при смене языка
    var live = false;        // пользователь уже жал «рассчитать» → пересчитываем на лету

    /* --- select: список категорий строится из CATEGORIES, а не из разметки --- */
    function fillSelect() {
      var keep = select.value;
      clear(select);
      var ph = el("option", null, t("calc.select"));
      ph.value = "";
      select.appendChild(ph);
      CATEGORIES.forEach(function (c) {
        var o = el("option", null, t("calc.cat." + c.id) + " · " + c.chapter);
        o.value = c.id;
        select.appendChild(o);
      });
      if (keep) select.value = keep;
    }

    function showHint() {
      if (!hint) return;
      var cat = findCategory(select.value);
      var msgs = cat ? cat.flags.map(function (f) { return t("calc.flag." + f); }) : [];
      /* warn категории — впереди флагов: человек должен увидеть запрет до того,
         как дочитает оговорку про код и ставку */
      if (cat && cat.warn) msgs.unshift(t(cat.warn));
      if (!msgs.length) { hint.hidden = true; hint.textContent = ""; return; }
      hint.hidden = false;
      hint.textContent = msgs.join(" ");
    }

    function showSource() {
      if (!srcEl) return;
      srcEl.textContent = t("calc.src.fx", { rate: fmt(FX.perUsd), date: fmtDate(FX.date) }) +
                          " " + t("calc.src.rates", { date: fmtDate(FEES.checkedOn) });
    }

    function clearErrors() {
      root.querySelectorAll("[data-calc-error]").forEach(function (n) { n.remove(); });
      root.querySelectorAll("[data-calc-field]").forEach(function (n) {
        n.removeAttribute("aria-invalid");
        if ((n.getAttribute("aria-describedby") || "").indexOf("cc-err-") === 0) {
          n.removeAttribute("aria-describedby");
        }
      });
    }

    /* submit=true — пользователь нажал «рассчитать»: тогда и только тогда
       уводим фокус на первое невалидное поле и дублируем сводку ошибок
       в aria-live-область. При живом пересчёте по input фокус не воруем
       и экранный диктор не перебиваем — человек ещё печатает. */
    function showErrors(errors, submit) {
      clearErrors();
      errors.forEach(function (e) {
        var input = field(e.field);
        if (!input) return;
        input.setAttribute("aria-invalid", "true");
        var p = el("p", "calc-error", t(e.key));
        p.setAttribute("data-calc-error", "");
        p.id = "cc-err-" + e.field;
        input.setAttribute("aria-describedby", p.id);
        (input.parentNode || root).appendChild(p);
      });
      if (!submit) return;
      var sum = el("p", "calc-error calc-errsum", errors.map(function (e) { return t(e.key); }).join(" "));
      sum.setAttribute("data-calc-error", "");
      out.appendChild(sum);
      var first = root.querySelector('[aria-invalid="true"]');
      if (first && typeof first.focus === "function") first.focus();
    }

    function render(res) {
      clear(out);
      out.hidden = false;

      var table = el("div", "calc-table");
      var head = el("div", "calc-row calc-row-head");
      head.appendChild(el("span", "calc-cell-name", t("calc.col.item")));
      head.appendChild(el("span", "calc-cell-num", t("calc.col.usd")));
      head.appendChild(el("span", "calc-cell-num", t("calc.col.azn")));
      table.appendChild(head);

      res.lines.forEach(function (l) {
        var row = el("div", "calc-row calc-row-" + l.kind);
        var name = t(l.key);
        if (l.rate !== undefined) name += " · " + pct(l.rate);
        if (l.sheets) name += " · " + l.sheets + " × " + fmt(FEES.perSheetAzn, 0) + " AZN";
        row.appendChild(el("span", "calc-cell-name", name));
        row.appendChild(el("span", "calc-cell-num", l.pending ? t("calc.pending") : fmt(l.usd)));
        row.appendChild(el("span", "calc-cell-num", l.pending || l.azn === null ? t("calc.pending") : fmt(l.azn)));
        table.appendChild(row);
      });

      var total = el("div", "calc-row calc-row-total");
      total.appendChild(el("span", "calc-cell-name",
        t("calc.row.total") + (res.total.partial ? " " + t("calc.total.partial") : "")));
      total.appendChild(el("span", "calc-cell-num", fmt(res.total.usd)));
      total.appendChild(el("span", "calc-cell-num", res.total.azn === null ? t("calc.pending") : fmt(res.total.azn)));
      table.appendChild(total);

      out.appendChild(table);

      res.warnings.forEach(function (w) {
        var p = el("p", "calc-warn", t(w));
        out.appendChild(p);
      });
      res.flags.forEach(function (f) {
        out.appendChild(el("p", "calc-warn calc-warn-flag", t("calc.flag." + f)));
      });
    }

    function run(submit) {
      var res = calculate({
        category: select.value,
        goods: field("goods") ? field("goods").value : "",
        freight: field("freight") ? field("freight").value : "",
        insurance: field("insurance") ? field("insurance").value : "",
        fx: field("fx") ? field("fx").value : ""
      });
      if (!res.ok) {
        /* при живом пересчёте таблицу не сносим: человек стирает цифру,
           чтобы ввести новую, — результат не должен прыгать под курсором */
        if (submit) { lastResult = null; clear(out); out.hidden = false; }
        showErrors(res.errors, submit);
        return;
      }
      clearErrors();
      lastResult = res;
      render(res);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();   // ничего никуда не отправляем
      live = true;
      run(true);
    });
    select.addEventListener("change", function () {
      showHint();
      if (live) run(false);
    });
    root.querySelectorAll("[data-calc-field]").forEach(function (n) {
      if (n === select) return;
      n.addEventListener("input", function () { if (live) run(false); });
    });

    /* перерисовка при смене языка: app.js меняет <html lang> */
    var obs = new MutationObserver(function () {
      fillSelect();
      showHint();
      showSource();
      if (lastResult) render(lastResult);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

    fillSelect();
    /* предвыбор категории: атрибут на блоке (категорийные лендинги K1–K3)
       или ?cat= в адресе (ссылка «полный калькулятор» с этих же лендингов).
       findCategory — обязательная защита: мусорный параметр игнорируется,
       селект остаётся на плейсхолдере. category-pages-plan.md §3.4 */
    var search = (typeof location !== "undefined" && location.search) || "";
    var preset = root.getAttribute("data-calc-preset") ||
                 (/[?&]cat=([a-z]+)/.exec(search) || [])[1];
    if (preset && findCategory(preset)) select.value = preset;
    showHint();
    showSource();
    return { run: run, root: root };
  }

  function autoInit() {
    document.querySelectorAll("[data-customs-calc]").forEach(function (n) { init(n); });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", autoInit);
    } else {
      autoInit();
    }
  }

  /* ------------------------------- экспорт -------------------------------- */

  var API = {
    version: VERSION,
    VAT_RATE: VAT_RATE,
    FX: FX,
    FEES: FEES,
    CATEGORIES: CATEGORIES,
    calculate: calculate,
    feeForCustomsValueAzn: feeForCustomsValueAzn,
    parseAmount: parseAmount,
    round2: round2,
    init: init
  };

  if (typeof window !== "undefined") window.CustomsCalc = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;  // для node-тестов
})();
