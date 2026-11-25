/*
 * Vector anatomy polygons adapted from react-body-highlighter
 * Copyright (c) 2020 GV79 — MIT License (commercial & offline redistribution permitted).
 * Deltoid anterior/lateral split, bilingual muscle metadata, tempo bar, and all
 * biomechanical motion schematics are original code created for Trening 2026.
 */

export const MUSCLE_META = {
  quads: { pl: 'Czworogłowy uda', en: 'Quadriceps' },
  hamstrings: { pl: 'Kulszowo-goleniowe (tył uda)', en: 'Hamstrings' },
  glutes: { pl: 'Pośladki', en: 'Glutes' },
  adductors: { pl: 'Przywodziciele uda', en: 'Hip adductors' },
  abductors: { pl: 'Odwodziciele biodra (pośl. średni)', en: 'Hip abductors (glute medius)' },
  calves: { pl: 'Brzuchaty łydki', en: 'Gastrocnemius (calves)' },
  soleus: { pl: 'Płaszczkowaty łydki', en: 'Soleus' },
  chest: { pl: 'Klatka piersiowa', en: 'Chest (pectoralis major)' },
  lats: { pl: 'Najszerszy grzbietu i obły większy', en: 'Lats & teres major' },
  traps: { pl: 'Czworoboczny (kaptury i środek pleców)', en: 'Trapezius & mid-back' },
  'lower-back': { pl: 'Prostowniki grzbietu', en: 'Lower back (erector spinae)' },
  'front-delts': { pl: 'Przedni akton barku', en: 'Anterior deltoid' },
  'side-delts': { pl: 'Boczny akton barku', en: 'Lateral deltoid' },
  'rear-delts': { pl: 'Tylny akton barku', en: 'Posterior deltoid' },
  biceps: { pl: 'Biceps i mięsień ramienny', en: 'Biceps & brachialis' },
  triceps: { pl: 'Triceps (trójgłowy ramienia)', en: 'Triceps brachii' },
  forearms: { pl: 'Przedramiona i ramienno-promieniowy', en: 'Forearms & brachioradialis' },
  abs: { pl: 'Prosty brzucha', en: 'Rectus abdominis (abs)' },
  obliques: { pl: 'Skośne brzucha i głęboki core', en: 'Obliques & deep core' },
};

export function muscleLabel(slug, lang = 'pl') {
  const entry = MUSCLE_META[slug];
  if (!entry) return slug;
  return lang === 'en' ? entry.en : entry.pl;
}

const ANTERIOR_REGIONS = [
  {
    slug: null,
    points: ['424 29 400 118 420 196 461 233 498 253 547 224 576 192 592 102 571 24 498 0'],
  },
  {
    slug: 'traps',
    points: [
      '555 237 506 335 506 392 616 400 706 449 694 367 633 351 584 306',
      '290 449 302 371 363 351 412 302 445 245 490 339 486 392 380 396',
    ],
  },
  {
    slug: 'chest',
    points: [
      '518 416 510 551 580 580 678 555 706 473 620 416',
      '298 465 314 555 408 580 482 551 478 420 376 420',
    ],
  },
  {
    slug: 'front-delts',
    points: [
      '748 495 759 380 710 363 722 429 714 473',
      '282 473 248 495 245 371 286 371 269 433',
    ],
  },
  {
    slug: 'side-delts',
    points: [
      '784 531 796 478 792 412 759 380 748 495',
      '248 495 212 531 200 478 204 408 245 371',
    ],
  },
  {
    slug: 'biceps',
    points: [
      '167 682 180 714 229 661 290 539 278 494 204 559',
      '714 494 702 547 763 661 816 718 829 690 788 555',
    ],
  },
  {
    slug: 'triceps',
    points: [
      '694 555 694 616 759 727 776 702 755 673',
      '224 694 298 555 298 608 229 731',
    ],
  },
  {
    slug: 'forearms',
    points: [
      '61 886 102 751 147 702 163 743 192 735 45 976 0 1000',
      '845 698 833 735 800 731 951 984 1000 1004 935 894 898 763',
      '776 722 776 776 804 841 853 898 922 1012 947 996',
      '69 1012 135 906 188 841 216 771 212 718 49 988',
    ],
  },
  {
    slug: 'abs',
    points: [
      '563 592 580 641 584 780 584 927 563 984 551 1041 514 1078 510 845 506 673 510 571',
      '437 588 486 571 490 673 486 845 482 1073 445 1037 408 914 408 784 412 645',
    ],
  },
  {
    slug: 'obliques',
    points: [
      '686 633 673 571 588 596 600 641 604 833 657 788 665 698',
      '339 784 331 718 310 633 322 571 408 592 392 633 392 837',
    ],
  },
  {
    slug: 'abductors',
    points: [
      '527 1102 543 1249 600 1102 620 1000 649 943 600 927 567 1045',
      '478 1106 449 1253 420 1159 404 1131 396 1073 380 1024 347 939 396 922 416 992 437 1053',
    ],
  },
  {
    slug: 'quads',
    points: [
      '347 988 371 1082 371 1278 343 1371 310 1327 294 1200 282 1114 294 1008 322 947',
      '633 1057 645 1000 669 947 702 1012 710 1118 682 1331 653 1376 624 1286 620 1114',
      '388 1294 384 1122 412 1184 445 1294 429 1351 400 1461 363 1465 355 1400',
      '596 1457 555 1290 608 1139 612 1302 641 1396 629 1465',
      '327 1384 265 1457 257 1367 257 1273 269 1143 294 1335',
      '718 1131 739 1241 739 1404 727 1457 665 1384 702 1335',
    ],
  },
  {
    slug: null,
    points: [
      '339 1400 347 1433 355 1473 363 1510 351 1567 298 1567 273 1527 273 1473 302 1441',
      '657 1400 722 1478 722 1522 698 1571 649 1567 629 1510',
    ],
  },
  {
    slug: 'calves',
    points: [
      '714 1604 735 1535 767 1612 796 1678 784 1878 796 1955 747 1955',
      '249 1947 278 1649 282 1604 261 1543 249 1576 224 1616 208 1678 220 1882 208 1955',
      '727 1951 698 1592 653 1584 641 1624 641 1653 657 1771',
      '355 1584 359 1624 359 1669 351 1722 351 1767 322 1820 306 1873 269 1947 273 1878 282 1804 286 1755 290 1698 298 1641 302 1588',
    ],
  },
];

const POSTERIOR_REGIONS = [
  {
    slug: null,
    points: ['506 0 460 9 409 55 404 128 451 200 557 200 591 136 596 47 557 13'],
  },
  {
    slug: 'traps',
    points: [
      '447 217 477 217 472 383 477 647 383 532 353 409 311 366 391 332 438 272',
      '523 217 557 217 566 272 609 328 689 366 647 404 617 532 523 647 532 383',
    ],
  },
  {
    slug: 'rear-delts',
    points: [
      '294 370 230 391 174 443 183 536 243 494 272 464',
      '711 370 783 396 826 447 817 536 749 489 723 451',
    ],
  },
  {
    slug: 'lats',
    points: [
      '311 387 281 489 285 553 340 753 472 711 472 664 366 540 336 413',
      '689 387 719 494 715 562 660 753 528 711 528 664 634 545 664 417',
    ],
  },
  {
    slug: 'triceps',
    points: [
      '268 498 179 557 145 723 166 817 217 638 268 557',
      '736 502 821 557 860 732 834 821 779 630 732 557',
      '268 583 268 685 230 753 191 774 226 655',
      '728 583 770 647 804 774 766 753 728 689',
    ],
  },
  {
    slug: 'lower-back',
    points: [
      '477 728 345 770 353 834 494 1021 468 830',
      '523 728 655 770 647 834 506 1021 532 838',
    ],
  },
  {
    slug: 'forearms',
    points: [
      '864 757 911 834 932 940 1000 1064 962 1043 881 894 843 838',
      '136 757 89 838 68 936 0 1064 38 1043 123 885 157 830',
      '813 796 774 779 791 847 911 1038 932 1089 945 1047',
      '187 796 221 779 209 843 94 1030 68 1085 51 1047',
    ],
  },
  {
    slug: 'glutes',
    points: [
      '447 996 302 1085 298 1187 315 1260 472 1213 494 1149',
      '553 991 511 1145 523 1209 681 1260 698 1191 694 1085',
    ],
  },
  {
    slug: 'adductors',
    points: [
      '481 1230 447 1230 413 1255 451 1443 485 1357 489 1294',
      '519 1226 557 1234 591 1260 549 1443 519 1362 511 1294',
    ],
  },
  {
    slug: 'hamstrings',
    points: [
      '289 1221 311 1294 366 1260 353 1353 345 1502 294 1583 289 1468 277 1413 272 1315',
      '715 1217 694 1289 638 1260 655 1366 664 1502 711 1583 715 1477 728 1421 736 1319',
      '387 1255 443 1460 404 1668 362 1528 370 1353',
      '617 1255 634 1362 643 1532 600 1668 562 1464',
    ],
  },
  {
    slug: null,
    points: [
      '345 1532 311 1591 336 1664 374 1626',
      '664 1536 630 1630 668 1664 694 1591',
    ],
  },
  {
    slug: 'calves',
    points: [
      '294 1604 285 1672 247 1796 238 1928 255 1970 285 1932 298 1800 319 1711 319 1668',
      '374 1651 353 1677 332 1719 311 1804 302 1919 340 2000 387 1906 391 1689',
      '630 1651 613 1685 617 1906 664 1996 706 1919 689 1796 668 1702',
      '706 1604 723 1685 757 1791 766 1928 745 1966 723 1936 706 1796 681 1681',
    ],
  },
  {
    slug: 'soleus',
    points: [
      '285 1957 302 1957 336 2017 306 2200 285 2136 268 1983',
      '698 1957 719 1957 736 1983 719 2132 702 2196 672 2021',
    ],
  },
];

function polygonRole(slug, primarySet, secondarySet, selectedMuscle) {
  if (!slug) return 'neutral';
  if (selectedMuscle && slug === selectedMuscle) return 'primary';
  if (primarySet.has(slug)) return 'primary';
  if (secondarySet.has(slug)) return 'secondary';
  return 'idle';
}

function BodyFigure({ view, regions, label, primarySet, secondarySet, selectedMuscle, onSelectMuscle, lang }) {
  const interactive = typeof onSelectMuscle === 'function';
  return (
    <div className="atlas-body-col">
      <div className="atlas-body-caption">{label}</div>
      <svg
        className={`atlas-body-svg${interactive ? ' interactive' : ''}`}
        viewBox="0 -20 1000 2240"
        role="img"
        aria-label={label}
        data-testid={`body-map-${view}`}
      >
        {regions.map((region, rIdx) =>
          region.points.map((pts, pIdx) => {
            const role = polygonRole(region.slug, primarySet, secondarySet, selectedMuscle);
            const clickable = interactive && Boolean(region.slug);
            return (
              <polygon
                key={`${view}-${rIdx}-${pIdx}`}
                points={pts}
                data-muscle={region.slug || 'frame'}
                data-role={role}
                className={`atlas-muscle-poly role-${role}${clickable ? ' clickable' : ''}`}
                onClick={clickable ? () => onSelectMuscle(region.slug) : undefined}
              >
                {region.slug && <title>{muscleLabel(region.slug, lang)}</title>}
              </polygon>
            );
          })
        )}
      </svg>
    </div>
  );
}

export function BodyMuscleMap({
  primaryMuscles = [],
  secondaryMuscles = [],
  selectedMuscle = null,
  onSelectMuscle = null,
  frontLabel = 'Przód',
  backLabel = 'Tył',
  lang = 'pl',
  compact = false,
}) {
  const primarySet = new Set(primaryMuscles);
  const secondarySet = new Set(secondaryMuscles.filter(m => !primarySet.has(m)));
  return (
    <div className={`atlas-body-map${compact ? ' compact' : ''}`} data-testid="atlas-body-map">
      <BodyFigure
        view="front"
        regions={ANTERIOR_REGIONS}
        label={frontLabel}
        primarySet={primarySet}
        secondarySet={secondarySet}
        selectedMuscle={selectedMuscle}
        onSelectMuscle={onSelectMuscle}
        lang={lang}
      />
      <BodyFigure
        view="back"
        regions={POSTERIOR_REGIONS}
        label={backLabel}
        primarySet={primarySet}
        secondarySet={secondarySet}
        selectedMuscle={selectedMuscle}
        onSelectMuscle={onSelectMuscle}
        lang={lang}
      />
    </div>
  );
}

// Parse 4-digit tempo string (e.g. '3010' -> [3, 0, 1, 0]).
export function parseTempoDigits(tempo) {
  const raw = String(tempo || '2010').trim();
  const digits = raw.match(/\d/g);
  if (!digits || digits.length < 4) return [2, 0, 1, 0];
  return digits.slice(0, 4).map(d => Number(d));
}

// Original kinematic vector schematics showing start posture (dashed), peak contraction (solid),
// equipment support, and animated concentric/eccentric trajectory path synced to tempo.
const SCHEMATICS = {
  squat: {
    equip: ['M42,126 L198,126', 'M92,24 L92,126'],
    start: ['M118,30 L118,74 L118,104 L118,124', 'M104,36 L132,36'],
    end: ['M114,56 L92,88 L124,96 L118,124', 'M100,62 L128,62'],
    joints: [[114, 56], [92, 88], [124, 96]],
    motionPath: 'M154,96 L154,36',
    isDownFirst: true,
  },
  'leg-press': {
    equip: ['M36,118 L94,118 L120,92', 'M86,104 L182,36'],
    start: ['M78,112 L98,108 L138,68', 'M132,58 L146,76'],
    end: ['M78,112 L98,108 L108,76 L116,84', 'M110,72 L124,90'],
    joints: [[98, 108], [118, 74]],
    motionPath: 'M122,82 L162,52',
    isDownFirst: true,
  },
  lunge: {
    equip: ['M36,126 L204,126'],
    start: ['M120,28 L120,70 L96,98 L92,124', 'M120,70 L146,98 L156,124'],
    end: ['M120,48 L120,86 L88,88 L88,124', 'M120,86 L146,114 L166,124'],
    joints: [[120, 48], [120, 86], [88, 88], [146, 114]],
    motionPath: 'M182,92 L182,42',
    isDownFirst: true,
  },
  hinge: {
    equip: ['M42,126 L198,126'],
    start: ['M122,28 L120,68 L118,100 L118,124', 'M120,42 L122,74'],
    end: ['M150,56 L96,74 L112,102 L118,124', 'M138,60 L138,98'],
    joints: [[150, 56], [96, 74], [112, 102]],
    motionPath: 'M162,98 L162,48',
    isDownFirst: true,
  },
  'knee-ext': {
    equip: ['M56,82 L106,82 L106,126', 'M62,44 L68,82'],
    start: ['M74,48 L78,80 L108,80 L108,118'],
    end: ['M74,48 L78,80 L108,80 L156,78'],
    joints: [[78, 80], [108, 80]],
    motionPath: 'M116,118 Q148,112 158,78',
  },
  'knee-flex': {
    equip: ['M50,86 L142,86', 'M64,86 L64,124', 'M132,86 L132,124'],
    start: ['M62,78 L108,78 L144,78 L182,80'],
    end: ['M62,78 L108,78 L144,78 L132,42'],
    joints: [[108, 78], [144, 78]],
    motionPath: 'M182,78 Q174,46 136,40',
  },
  'hip-thrust': {
    equip: ['M42,124 L198,124', 'M48,82 L84,82 L84,124'],
    start: ['M72,76 L112,112 L144,86 L148,124'],
    end: ['M72,76 L114,80 L148,80 L148,124'],
    joints: [[72, 76], [114, 80], [148, 80]],
    motionPath: 'M114,114 L114,72',
  },
  abduction: {
    equip: ['M76,104 L164,104', 'M120,104 L120,128'],
    start: ['M120,38 L120,78', 'M112,78 L112,116', 'M128,78 L128,116'],
    end: ['M120,38 L120,78', 'M112,78 L80,108', 'M128,78 L160,108'],
    joints: [[112, 78], [128, 78]],
    motionPath: 'M134,108 Q152,108 168,98',
  },
  'calf-raise': {
    equip: ['M62,122 L134,122 L134,130 L62,130 Z'],
    start: ['M114,28 L114,76 L114,112 L134,126'],
    end: ['M114,18 L114,66 L114,100 L128,120'],
    joints: [[114, 66], [114, 100], [128, 120]],
    motionPath: 'M162,116 L162,56',
  },
  'horiz-press': {
    equip: ['M50,94 L164,94', 'M68,94 L68,126', 'M148,94 L148,126'],
    start: ['M66,86 L132,86 L154,102 L158,124', 'M92,86 L104,104 L96,82'],
    end: ['M66,86 L132,86 L154,102 L158,124', 'M92,86 L92,40'],
    joints: [[92, 86], [92, 40]],
    motionPath: 'M100,82 Q98,60 92,38',
  },
  'incline-press': {
    equip: ['M58,112 L120,62', 'M118,112 L148,112', 'M92,86 L92,126'],
    start: ['M114,68 L84,96 L100,114', 'M104,78 L114,96 L108,72'],
    end: ['M114,68 L84,96 L100,114', 'M104,78 L104,32'],
    joints: [[104, 78], [104, 32]],
    motionPath: 'M116,76 L106,30',
  },
  fly: {
    equip: ['M96,118 L144,118'],
    start: ['M120,76 m-16,0 a16,10 0 1,0 32,0 a16,10 0 1,0 -32,0', 'M104,76 L54,84', 'M136,76 L186,84'],
    end: ['M104,76 Q96,46 114,34', 'M136,76 Q144,46 126,34'],
    joints: [[104, 76], [136, 76]],
    motionPath: 'M184,80 Q176,42 130,32',
  },
  dip: {
    equip: ['M72,74 L168,74', 'M82,74 L82,126', 'M158,74 L158,126'],
    start: ['M120,44 L112,86 L104,116', 'M116,58 L98,74 L114,74'],
    end: ['M120,24 L116,66 L112,100', 'M118,38 L114,74'],
    joints: [[118, 38], [114, 74]],
    motionPath: 'M148,88 L148,36',
    isDownFirst: true,
  },
  'vert-pull': {
    equip: ['M64,20 L176,20', 'M120,12 L120,20'],
    start: ['M120,56 L120,104 L120,126', 'M108,62 L88,22', 'M132,62 L152,22'],
    end: ['M120,44 L120,92 L120,124', 'M108,52 L88,68 L96,42', 'M132,52 L152,68 L144,42'],
    joints: [[108, 52], [88, 68], [132, 52], [152, 68]],
    motionPath: 'M172,26 L172,72',
  },
  'horiz-row': {
    equip: ['M44,72 L78,72', 'M44,42 L44,124'],
    start: ['M142,40 L132,88 L102,94 L98,124', 'M138,54 L82,72'],
    end: ['M142,40 L132,88 L102,94 L98,124', 'M138,54 L156,74 L124,74'],
    joints: [[138, 54], [156, 74], [132, 88]],
    motionPath: 'M80,72 L134,72',
  },
  pullover: {
    equip: ['M54,22 L54,126', 'M46,22 L74,22'],
    start: ['M138,44 L126,86 L128,124', 'M134,54 L76,30'],
    end: ['M138,44 L126,86 L128,124', 'M134,54 L122,92'],
    joints: [[134, 54], [126, 86]],
    motionPath: 'M76,32 Q82,78 120,94',
  },
  shrug: {
    equip: ['M48,126 L192,126'],
    start: ['M120,30 L120,96', 'M92,56 L120,54 L148,56', 'M92,56 L90,98', 'M148,56 L150,98'],
    end: ['M120,30 L120,96', 'M92,42 L120,46 L148,42', 'M92,42 L90,84', 'M148,42 L150,84'],
    joints: [[92, 42], [148, 42]],
    motionPath: 'M172,92 L172,48',
  },
  ohp: {
    equip: ['M48,126 L192,126'],
    start: ['M120,46 L120,94 L120,124', 'M106,56 L94,74 L104,52', 'M134,56 L146,74 L136,52'],
    end: ['M120,46 L120,94 L120,124', 'M106,56 L108,18', 'M134,56 L132,18'],
    joints: [[106, 56], [134, 56], [120, 18]],
    motionPath: 'M168,64 L168,18',
  },
  'lat-raise': {
    equip: ['M56,126 L184,126'],
    start: ['M120,36 L120,92 L120,124', 'M106,48 L98,92', 'M134,48 L142,92'],
    end: ['M120,36 L120,92 L120,124', 'M106,48 L56,48', 'M134,48 L184,48'],
    joints: [[106, 48], [134, 48]],
    motionPath: 'M148,92 Q178,80 186,48',
  },
  curl: {
    equip: ['M56,126 L184,126'],
    start: ['M108,32 L108,88 L108,124', 'M108,46 L112,78 L118,108'],
    end: ['M108,32 L108,88 L108,124', 'M108,46 L112,78 L140,52'],
    joints: [[108, 46], [112, 78]],
    motionPath: 'M122,108 Q154,94 144,52',
  },
  'triceps-ext': {
    equip: ['M162,18 L162,126', 'M146,18 L176,18'],
    start: ['M98,34 L98,88 L98,124', 'M98,48 L106,78 L138,58'],
    end: ['M98,34 L98,88 L98,124', 'M98,48 L106,78 L128,108'],
    joints: [[98, 48], [106, 78]],
    motionPath: 'M140,58 Q148,86 130,108',
  },
  'skull-crusher': {
    equip: ['M48,98 L168,98', 'M68,98 L68,126', 'M150,98 L150,126'],
    start: ['M64,90 L138,90', 'M86,90 L82,52 L56,68'],
    end: ['M64,90 L138,90', 'M86,90 L82,52 L82,22'],
    joints: [[86, 90], [82, 52]],
    motionPath: 'M56,66 Q58,32 82,22',
  },
  'core-flex': {
    equip: ['M44,122 L196,122', 'M76,18 L76,122'],
    start: ['M76,28 L104,76 L112,120'],
    end: ['M76,28 L124,56 L92,88 L112,120'],
    joints: [[124, 56], [92, 88]],
    motionPath: 'M146,44 Q152,78 124,96',
  },
  'leg-raise': {
    equip: ['M76,18 L164,18', 'M92,18 L92,128'],
    start: ['M120,20 L120,56 L120,86 L120,122'],
    end: ['M120,20 L120,56 L124,82 L166,68'],
    joints: [[120, 56], [124, 82]],
    motionPath: 'M126,120 Q162,110 168,68',
  },
  plank: {
    equip: ['M36,118 L204,118'],
    start: ['M68,86 L124,96 L176,114'],
    end: ['M64,78 L122,90 L176,114', 'M68,78 L62,116 L82,116'],
    joints: [[68, 78], [122, 90], [176, 114]],
    motionPath: 'M122,74 L122,90',
    isIsometric: true,
  },
  pushup: {
    equip: ['M36,120 L204,120'],
    start: ['M114,26 L114,50', 'M114,50 L86,86', 'M86,86 L60,116', 'M114,50 L142,86 L176,116'],
    end: ['M114,26 L114,54', 'M114,54 L98,82', 'M98,82 L86,118', 'M114,54 L136,80 L178,112'],
    joints: [[114, 54], [98, 82]],
    motionPath: 'M92,84 Q92,60 104,52',
    isDownFirst: true,
  },
  'rev-fly': {
    equip: ['M96,64 L92,64 L92,120', 'M144,64 L148,64 L148,120'],
    start: ['M120,34 L116,82 L112,122', 'M116,58 L94,72', 'M120,34 L124,82 L128,122', 'M124,58 L146,72'],
    end: ['M120,34 L116,82 L112,122', 'M116,58 L64,52', 'M120,34 L124,82 L128,122', 'M124,58 L176,52'],
    joints: [[116, 58], [124, 58]],
    motionPath: 'M140,78 Q168,76 180,54',
  },
  'face-pull': {
    equip: ['M176,20 L176,64'],
    start: ['M112,72 L86,96 L102,104 L112,122', 'M112,84 L168,58'],
    end: ['M112,72 L86,96 L102,104 L112,122', 'M112,86 L142,64 L136,44', 'M112,86 L142,64 L152,96'],
    joints: [[112, 86], [142, 64]],
    motionPath: 'M166,58 Q142,66 140,88',
  },
  rollout: {
    equip: ['M36,120 L204,120'],
    start: ['M84,52 L84,88 L110,98 L104,120', 'M84,60 L110,70'],
    end: ['M76,54 L104,72', 'M76,58 L110,64', 'M104,64 L134,106', 'M134,106 L160,120', 'M104,64 L104,120'],
    joints: [[104, 72], [104, 64]],
    motionPath: 'M118,96 Q148,108 164,116',
    isDownFirst: false,
  },
};

// Valid movement-pattern keys (used by tests to keep data and schematics in sync).
export const SCHEMATIC_PATTERNS = Object.keys(SCHEMATICS);

export function MotionSchematic({ pattern = 'squat', tempo = '2010', lang = 'pl' }) {
  const spec = SCHEMATICS[pattern] || SCHEMATICS.squat;
  const [ecc, bot, con, top] = parseTempoDigits(tempo);
  const cDur = Math.max(con, 0.55);
  const tDur = Math.max(top, 0.08);
  const eDur = Math.max(ecc, 0.55);
  const bDur = Math.max(bot, 0.08);
  const total = cDur + tDur + eDur + bDur;
  const t1 = (cDur / total).toFixed(3);
  const t2 = ((cDur + tDur) / total).toFixed(3);
  const t3 = ((cDur + tDur + eDur) / total).toFixed(3);
  const keyTimes = `0;${t1};${t2};${t3};1`;
  const keyPoints = spec.isDownFirst ? '1;1;0;0;1' : '0;1;1;0;0';

  const labelStart = lang === 'en' ? 'Start / stretch' : 'Start / rozciągnięcie';
  const labelPeak = lang === 'en' ? 'Peak contraction' : 'Szczyt napięcia';
  const labelPath = spec.isIsometric
    ? (lang === 'en' ? 'Isometric anti-extension hold' : 'Izometria — utrzymanie linii ciała')
    : (lang === 'en' ? 'Bar / limb trajectory' : 'Tor ruchu i rytm tempa');

  return (
    <div className="atlas-schematic-card" data-testid="atlas-motion-schematic">
      <div className="atlas-schematic-header">
        <span className="atlas-schematic-title">📐 {labelPath}</span>
        <span className="atlas-schematic-tempo-pill">{tempo || '2010'}</span>
      </div>
      <svg className="atlas-schematic-svg" viewBox="0 0 240 140" role="img" aria-label={labelPath}>
        <defs>
          <marker id={`atlas-arrow-${pattern}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>
        <line x1="16" y1="126" x2="224" y2="126" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        {spec.equip.map((d, idx) => (
          <path key={`eq-${idx}`} d={d} fill="none" stroke="rgba(159,195,214,0.35)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {spec.start.map((d, idx) => (
          <path key={`st-${idx}`} d={d} fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="3.2" strokeDasharray="4 4" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {spec.end.map((d, idx) => (
          <path key={`en-${idx}`} d={d} fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {spec.joints.map(([cx, cy], idx) => (
          <circle key={`jt-${idx}`} cx={cx} cy={cy} r="3.6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.4" />
        ))}
        <path
          d={spec.motionPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.8"
          strokeLinecap="round"
          markerEnd={`url(#atlas-arrow-${pattern})`}
        />
        {!spec.isIsometric && (
          <circle r="5" fill="#ffd700" stroke="#ef4444" strokeWidth="2">
            <animateMotion
              dur={`${total.toFixed(2)}s`}
              repeatCount="indefinite"
              calcMode="linear"
              keyPoints={keyPoints}
              keyTimes={keyTimes}
              path={spec.motionPath}
            />
          </circle>
        )}
      </svg>
      <div className="atlas-schematic-legend">
        <span><i className="legend-line dashed" /> {labelStart}</span>
        <span><i className="legend-line solid" /> {labelPeak}</span>
      </div>
    </div>
  );
}

export function TempoBar({ tempo = '2010', isIsometric = false, lang = 'pl' }) {
  const [ecc, bot, con, top] = parseTempoDigits(tempo);
  const steps = lang === 'en'
    ? [
        { code: ecc, icon: '↓', label: 'Lowering', sub: 'Eccentric' },
        { code: bot, icon: '⏸', label: 'Bottom', sub: 'Stretch pause' },
        { code: con, icon: '↑', label: 'Lifting', sub: 'Concentric' },
        { code: top, icon: '⚡', label: 'Top', sub: 'Peak squeeze' },
      ]
    : [
        { code: ecc, icon: '↓', label: 'Opuszczanie', sub: 'Ekscentryka' },
        { code: bot, icon: '⏸', label: 'Dół ruchu', sub: 'Pauza w rozciąg.' },
        { code: con, icon: '↑', label: 'Ruch główny', sub: 'Koncentryka' },
        { code: top, icon: '⚡', label: 'Szczyt', sub: 'Dopięcie mięśnia' },
      ];

  return (
    <div className="atlas-tempo-box" data-testid="atlas-tempo-bar">
      <div className="atlas-tempo-grid">
        {steps.map((step, idx) => (
          <div className="atlas-tempo-cell" key={idx}>
            <span className="atlas-tempo-digit">{step.icon} {step.code}s</span>
            <strong className="atlas-tempo-lbl">{step.label}</strong>
            <span className="atlas-tempo-sub">{step.sub}</span>
          </div>
        ))}
      </div>
      {isIsometric && (
        <p className="atlas-tempo-iso-note">
          {lang === 'en'
            ? 'Isometric exercise: maintain continuous full-body tension for the target time in seconds.'
            : 'Ćwiczenie izometryczne: utrzymuj stałe napięcie całego brzucha i pośladków przez zadany czas w sekundach.'}
        </p>
      )}
    </div>
  );
}
