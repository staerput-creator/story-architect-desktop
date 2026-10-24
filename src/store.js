import { getConditions, normalizeEdges } from './graph/conditions';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { temporal } from 'zundo';
import { assetStorage } from './services/assetStorage';
import {
  storageService,
  idbGet,
  idbSet,
  STORAGE_KEY,
  buildStandaloneGameHtml
} from './services/storage';

export { idbGet, idbSet, STORAGE_KEY, assetStorage, storageService };
export function generateStandaloneGameHtml(projectData) {
  return buildStandaloneGameHtml(projectData);
}

// --- ЭТАП 2. РАСШИРЕННЫЕ СЮЖЕТНЫЕ ШАБЛОНЫ ---

// 1. Расширенный квест «Тайна Старого Замка» (12 сцен, 4 персонажа, 5 переменных, 3 финала)
export const createFantasyCastleState = () => ({
  projectMeta: {
    id: 'canvas-fantasy-castle',
    title: 'Тайна Старого Замка',
    description: 'Нелинейный фэнтези-квест с дипломатией, взломом, катакомбами и тремя концовками (12 сцен)',
    driveFileId: null,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString()
  },
  nodes: [
    {
      id: 'start-scene',
      type: 'storyNode',
      position: { x: 60, y: 300 },
      data: {
        label: 'У ворот Старого Замка',
        type: 'start',
        notes: 'Полночь. Туман окутывает ров древней цитадели. Главные ворота охраняет вооружённый караул, неподалёку мерцает фонарь контрабандиста и темнеет решётка сточных катакомб.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'hero-1', text: 'Артефакт Королей спрятан в цитадели. У меня в кошеле всего 5 золотых, но есть верный клинок и смекалка.' },
          { charId: 'guard-1', text: 'Караул, держать строй! По приказу Лорда замка ни одна душа не войдёт без дозволения!' }
        ]
      }
    },
    {
      id: 'scene-smuggler',
      type: 'storyNode',
      position: { x: 420, y: 60 },
      data: {
        label: 'Тайник Торговца контрабандой',
        type: 'scene',
        notes: 'В руинах старой часовни Рейнджер Эрик встречает давнего знакомого из гильдии теней.',
        imageId: null,
        effects: [
          { id: 'ef-smug-picks', varId: 'var-lockpicks', action: 'set', value: true },
          { id: 'ef-smug-gold', varId: 'var-gold', action: 'add', value: 15 },
          { id: 'ef-smug-rep', varId: 'var-rep', action: 'add', value: 10 }
        ],
        dialogue: [
          { charId: 'merchant-1', text: 'Эрик! Давно не виделись. Говорят, ты за Сердцем Королей? Держи воровские отмычки, 15 золотых авансом и моё рекомендательное кольцо.' },
          { charId: 'hero-1', text: 'Спасибо, дружище. Теперь я могу либо подкупить караул, либо вскрыть боковую дверь башни.' }
        ]
      }
    },
    {
      id: 'scene-guardhouse',
      type: 'storyNode',
      position: { x: 420, y: 280 },
      data: {
        label: 'Караулка у внешней стены',
        type: 'scene',
        notes: 'Пока сменный часовой клюёт носом у жаровни, герой бесшумно проскальзывает в тень арки.',
        imageId: null,
        effects: [
          { id: 'ef-gh-key', varId: 'var-key', action: 'set', value: true },
          { id: 'ef-gh-gold', varId: 'var-gold', action: 'add', value: 10 }
        ],
        dialogue: [
          { charId: 'guard-1', text: 'Хрр-пфф... Ещё пять минут, и сменюсь с поста...' },
          { charId: 'hero-1', text: 'Тихо... Связка ключей стражника и мешочек с 10 золотыми перекочевали ко мне на пояс.' }
        ]
      }
    },
    {
      id: 'scene-catacombs',
      type: 'storyNode',
      position: { x: 420, y: 520 },
      data: {
        label: 'Скрытый проход через катакомбы',
        type: 'scene',
        notes: 'Сырые подземные галереи под замком. Под ногой срабатывает нажимная плита древней ловушки с дротиками!',
        imageId: null,
        effects: [
          { id: 'ef-cat-hp', varId: 'var-hp', action: 'sub', value: 30 },
          { id: 'ef-cat-gold', varId: 'var-gold', action: 'add', value: 10 }
        ],
        dialogue: [
          { charId: 'hero-1', text: 'Проклятье, каменная ловушка задела плечо! Зато у скелета древнего рыцаря нашлось 10 золотых монет.' }
        ]
      }
    },
    {
      id: 'decision-gate',
      type: 'storyNode',
      position: { x: 800, y: 120 },
      data: {
        label: 'Переговоры со стражником у ворот',
        type: 'decision',
        notes: 'Начальник стражи выходит вперёд с алебардой. Как преодолеть главный пост?',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'guard-1', text: 'Стой, путник! Назови своё имя и цель визита, или пеняй на себя!' },
          { charId: 'hero-1', text: 'Нужно действовать наверняка: убедить его, заплатить звонкой монетой или обойти через башню.' }
        ],
        className: 'decision-node'
      },
      className: 'decision-node'
    },
    {
      id: 'decision-sidedoor',
      type: 'storyNode',
      position: { x: 800, y: 340 },
      data: {
        label: 'Взлом боковой двери башни',
        type: 'decision',
        notes: 'Узкая кованая дверь восточной башни ведёт прямо во внутреннюю галерею замка.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'hero-1', text: 'Замок сложный, но с отмычками или украденным ключом стражника я открою его за минуту.' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'decision-catacombs-trap',
      type: 'storyNode',
      position: { x: 800, y: 550 },
      data: {
        label: 'Обвал подземного моста',
        type: 'decision',
        notes: 'Каменный свод катакомб рушится! Чтобы перепрыгнуть пропасть и выбраться во двор, нужен запас сил (Здоровье >= 50).',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'hero-1', text: 'Мост уходит из-под ног! Если хватит здоровья и выносливости — допрыгну до уступа.' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'scene-courtyard',
      type: 'storyNode',
      position: { x: 1180, y: 260 },
      data: {
        label: 'Внутренний двор и Галерея',
        type: 'scene',
        notes: 'Эрик внутри крепости! Факелы освещают вход в Тронный зал и винтовой спуск к сокровищнице.',
        imageId: null,
        effects: [
          { id: 'ef-cy-rep', varId: 'var-rep', action: 'add', value: 10 }
        ],
        dialogue: [
          { charId: 'hero-1', text: 'Внешний периметр позади. Впереди — Тронный зал, где ждёт сам Лорд замка.' },
          { charId: 'lord-1', text: '(Голос из-за дверей зала) Стража доложила о госте. Входи же, Рейнджер Эрик!' }
        ]
      }
    },
    {
      id: 'decision-throne',
      type: 'storyNode',
      position: { x: 1540, y: 260 },
      data: {
        label: 'Выбор в Тронном зале',
        type: 'decision',
        notes: 'Кульминация квеста. Лорд замка стоит у пьедестала с древней реликвией.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'lord-1', text: 'Ты прошёл сквозь мою стражу, Эрик. Зачем ты явился: за войной, за сделкой или за королевским союзом?' },
          { charId: 'hero-1', text: 'Всё зависит от моего авторитета, снаряжения и принятого решения.' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'ending-victory',
      type: 'storyNode',
      position: { x: 1920, y: 80 },
      data: {
        label: 'Триумф королей (Победа)',
        type: 'ending',
        notes: 'Благородный финал! Благодаря высокой репутации Рейнджер Эрик убеждает Лорда замка объединить земли и вернуть корону законному наследнику.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'lord-1', text: 'Твоя честь безупречна, Эрик. Я передаю тебе Артефакт Королей и присягаю союзу!' },
          { charId: 'hero-1', text: 'Мир восстановлен без лишней крови. Старый Замок снова станет оплотом королевства!' }
        ]
      }
    },
    {
      id: 'ending-escape',
      type: 'storyNode',
      position: { x: 1920, y: 280 },
      data: {
        label: 'Тайный побег с артефактом',
        type: 'ending',
        notes: 'Хитроумный финал! Пока стража отвлечена, Эрик вскрывает витрину реликвии и ускользает по крышам в предрассветный туман.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'merchant-1', text: 'Невероятно! Ты вынес реликвию прямо из-под носа Лорда замка! Лодки уже ждут у пристани.' },
          { charId: 'hero-1', text: 'Артефакт у нас. Пусть ищут ветра в поле!' }
        ]
      }
    },
    {
      id: 'ending-dungeon',
      type: 'storyNode',
      position: { x: 1920, y: 490 },
      data: {
        label: 'Поражение в темнице',
        type: 'ending',
        notes: 'Мрачный финал. Лишённый поддержки и сил, герой попадает в окружение алебардщиков и оказывается в подземном каземате.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'guard-1', text: 'Бросить лазутчика в каземат! Отсюда ты уже не выберешься без чуда.' },
          { charId: 'hero-1', text: 'Я недооценил гарнизон крепости... В следующий раз подготовлюсь лучше.' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'e-start-smuggler',
      source: 'start-scene',
      target: 'scene-smuggler',
      label: 'Навестить Торговца контрабандой',
      data: { conditions: [], effects: [] }
    },
    {
      id: 'e-start-guardhouse',
      source: 'start-scene',
      target: 'scene-guardhouse',
      label: 'Прокрасться к спящему караульному',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-start-gate',
      source: 'start-scene',
      target: 'decision-gate',
      label: 'Выйти к главным воротам напрямую',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-start-catacombs',
      source: 'start-scene',
      target: 'scene-catacombs',
      label: 'Спуститься в катакомбы замка',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-smuggler-gate',
      source: 'scene-smuggler',
      target: 'decision-gate',
      label: 'Пойти к главным воротам для переговоров',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-smuggler-sidedoor',
      source: 'scene-smuggler',
      target: 'decision-sidedoor',
      label: 'Направиться к боковой двери башни',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-guardhouse-sidedoor',
      source: 'scene-guardhouse',
      target: 'decision-sidedoor',
      label: 'Использовать проход у боковой двери',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-guardhouse-gate',
      source: 'scene-guardhouse',
      target: 'decision-gate',
      label: 'Вернуться к главным воротам',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-catacombs-trap',
      source: 'scene-catacombs',
      target: 'decision-catacombs-trap',
      label: 'Двигаться по подземному мосту',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-gate-bribe',
      source: 'decision-gate',
      target: 'scene-courtyard',
      label: 'Подкупить стражника золотом [🔒 Золото >= 15]',
      data: {
        condition: { varId: 'var-gold', operator: '>=', value: 15 },
        effects: [{ id: 'ef-pay-15', varId: 'var-gold', action: 'sub', value: 15 }]
      }
    },
    {
      id: 'e-gate-persuade',
      source: 'decision-gate',
      target: 'scene-courtyard',
      label: 'Убедить стражу именем ордена [🔒 Репутация >= 10]',
      data: {
        condition: { varId: 'var-rep', operator: '>=', value: 10 },
        effects: []
      }
    },
    {
      id: 'e-gate-retreat-side',
      source: 'decision-gate',
      target: 'decision-sidedoor',
      label: 'Отойти в тень к боковой двери',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-gate-storm-fail',
      source: 'decision-gate',
      target: 'ending-dungeon',
      label: 'Пойти на прямой прорыв без подготовки',
      data: {
        condition: null,
        effects: [{ id: 'ef-storm-dmg', varId: 'var-hp', action: 'sub', value: 60 }]
      }
    },
    {
      id: 'e-side-key',
      source: 'decision-sidedoor',
      target: 'scene-courtyard',
      label: 'Открыть дверь ключом [🔒 Ключ стражника]',
      data: {
        condition: { varId: 'var-key', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-side-lockpicks',
      source: 'decision-sidedoor',
      target: 'scene-courtyard',
      label: 'Взломать замок отмычками [🔒 Отмычки]',
      data: {
        condition: { varId: 'var-lockpicks', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-side-to-catacombs',
      source: 'decision-sidedoor',
      target: 'scene-catacombs',
      label: 'Искать обход через катакомбы',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-trap-survive',
      source: 'decision-catacombs-trap',
      target: 'scene-courtyard',
      label: 'Перепрыгнуть разлом на рывке [🔒 Здоровье >= 50]',
      data: {
        condition: { varId: 'var-hp', operator: '>=', value: 50 },
        effects: []
      }
    },
    {
      id: 'e-trap-fall',
      source: 'decision-catacombs-trap',
      target: 'ending-dungeon',
      label: 'Сорваться в решётку нижнего каземата',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-courtyard-throne',
      source: 'scene-courtyard',
      target: 'decision-throne',
      label: 'Войти в Тронный зал к Лорду замка',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-throne-victory',
      source: 'decision-throne',
      target: 'ending-victory',
      label: 'Заключить королевский союз [🔒 Репутация >= 15]',
      data: {
        condition: { varId: 'var-rep', operator: '>=', value: 15 },
        effects: []
      }
    },
    {
      id: 'e-throne-steal',
      source: 'decision-throne',
      target: 'ending-escape',
      label: 'Выкрасть реликвию и уйти по крышам [🔒 Отмычки]',
      data: {
        condition: { varId: 'var-lockpicks', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-throne-key-escape',
      source: 'decision-throne',
      target: 'ending-escape',
      label: 'Отпереть запасной ход ключом [🔒 Ключ стражника]',
      data: {
        condition: { varId: 'var-key', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-throne-defeat',
      source: 'decision-throne',
      target: 'ending-dungeon',
      label: 'Бросить открытый вызов гвардии Лорда',
      data: { condition: null, effects: [] }
    }
  ],
  groups: [
    { id: 'default', name: 'Герои и союзники' },
    { id: 'guards', name: 'Гарнизон замка' },
    { id: 'shadows', name: 'Теневой рынок' },
    { id: 'nobles', name: 'Владыки крепости' }
  ],
  characters: [
    { id: 'hero-1', name: 'Рейнджер Эрик', color: '#2563eb', groupId: 'default' },
    { id: 'guard-1', name: 'Начальник стражи', color: '#dc2626', groupId: 'guards' },
    { id: 'merchant-1', name: 'Торговец контрабандой', color: '#d97706', groupId: 'shadows' },
    { id: 'lord-1', name: 'Лорд замка', color: '#9333ea', groupId: 'nobles' }
  ],
  variables: [
    { id: 'var-key', name: 'Ключ стражника', type: 'boolean', initialValue: false },
    { id: 'var-lockpicks', name: 'Отмычки', type: 'boolean', initialValue: false },
    { id: 'var-gold', name: 'Золото', type: 'number', initialValue: 5 },
    { id: 'var-hp', name: 'Здоровье', type: 'number', initialValue: 100 },
    { id: 'var-rep', name: 'Репутация', type: 'number', initialValue: 0 }
  ],
  regions: [
    {
      id: 'region-act-1',
      title: 'Акт I: Подступы к Старому Замку',
      order: 1,
      color: '#3b82f6',
      x: 20,
      y: 20,
      width: 680,
      height: 700,
      notes: 'Разведка у главных ворот, встречи с контрабандистом и часовым.'
    },
    {
      id: 'region-act-2',
      title: 'Акт II: Проникновение и ловушки',
      order: 2,
      color: '#10b981',
      x: 750,
      y: 60,
      width: 700,
      height: 680,
      notes: 'Испытания у ворот, боковой башни и подземного моста.'
    },
    {
      id: 'region-act-3',
      title: 'Финал: Тронный зал и Развязка',
      order: 3,
      color: '#8b5cf6',
      x: 1500,
      y: 20,
      width: 720,
      height: 680,
      notes: 'Кульминация у Лорда замка и три концовки истории.'
    }
  ],
  stashedNodes: [],
  currentTheme: 'dark'
});

// 2. Второй шаблон (Sci-Fi): «Сигнал с орбитальной станции» (10 сцен)
export const createSciFiOrbitalState = () => ({
  projectMeta: {
    id: 'canvas-scifi-orbital',
    title: 'Сигнал с орбитальной станции',
    description: 'Научно-фантастический квест: исследование заброшенного челнока, перезапуск реактора или эвакуация в капсуле',
    driveFileId: null,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString()
  },
  nodes: [
    {
      id: 'sci-start',
      type: 'storyNode',
      position: { x: 60, y: 260 },
      data: {
        label: 'Стыковочный шлюз «Кронос-9»',
        type: 'start',
        notes: 'Разведывательный челнок пристыковался к замолчавшей орбитальной станции. Аварийные огни мигают багровым светом.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-nova', text: 'Шлюз открыт. Гравитация нестабильна, заряд станции на минимуме — всего 20%.' },
          { charId: 'sci-ai', text: 'Внимание: обнаружено падение мощности главного реактора. Рекомендуется диагностика или немедленная эвакуация.' }
        ]
      }
    },
    {
      id: 'sci-shuttle-bay',
      type: 'storyNode',
      position: { x: 420, y: 100 },
      data: {
        label: 'Отсек заброшенного челнока',
        type: 'scene',
        notes: 'Внутри соседнего исследовательского челнока парят контейнеры со снаряжением и резервный плазменный блок.',
        imageId: null,
        effects: [
          { id: 'ef-sci-cell', varId: 'var-cell', action: 'set', value: true },
          { id: 'ef-sci-oxy1', varId: 'var-oxygen', action: 'sub', value: 15 }
        ],
        dialogue: [
          { charId: 'sci-cortez', text: 'Капитан, я нашёл целую плазменную Энергоячейку в обшивке челнока!' },
          { charId: 'sci-nova', text: 'Отлично, забираем. С ней мы сможем перезапустить ядро реактора.' }
        ]
      }
    },
    {
      id: 'sci-bridge',
      type: 'storyNode',
      position: { x: 420, y: 420 },
      data: {
        label: 'Командная рубка станции',
        type: 'scene',
        notes: 'Голографические экраны хранят последнюю запись вахтенного офицера и криптоключ управления.',
        imageId: null,
        effects: [
          { id: 'ef-sci-code', varId: 'var-code', action: 'set', value: true },
          { id: 'ef-sci-en1', varId: 'var-energy', action: 'add', value: 30 }
        ],
        dialogue: [
          { charId: 'sci-ai', text: 'Криптоключ принят. Резервные конденсаторы переключены на шину (+30 к заряду реактора).' },
          { charId: 'sci-nova', text: 'Теперь у нас есть Код допуска ИИ и дополнительная энергия.' }
        ]
      }
    },
    {
      id: 'sci-decision-hub',
      type: 'storyNode',
      position: { x: 800, y: 260 },
      data: {
        label: 'Центральный узел: Реактор или Капсула?',
        type: 'decision',
        notes: 'Ключевая развилка миссии: попытаться восстановить энергию реактора станции или прорываться к спасательным капсулам.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-cortez', text: 'Капитан Нова, обшивка трещит! Идём в реакторный сектор спасать станцию или к спасательным капсулам?' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'sci-reactor-hall',
      type: 'storyNode',
      position: { x: 1160, y: 120 },
      data: {
        label: 'Инженерный сектор реактора',
        type: 'scene',
        notes: 'Магнитные катушки гудят в полумраке. Температура растёт, расходуя запас кислорода скафандра.',
        imageId: null,
        effects: [
          { id: 'ef-sci-en2', varId: 'var-energy', action: 'add', value: 20 },
          { id: 'ef-sci-oxy2', varId: 'var-oxygen', action: 'sub', value: 20 }
        ],
        dialogue: [
          { charId: 'sci-ai', text: 'Готовность к инъекции плазмы. Требуется Энергоячейка или Заряд реактора >= 50%.' }
        ]
      }
    },
    {
      id: 'sci-decision-reactor',
      type: 'storyNode',
      position: { x: 1520, y: 120 },
      data: {
        label: 'Терминал запуска реактора',
        type: 'decision',
        notes: 'Выберите способ стабилизации термоядерного ядра.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-nova', text: 'Вводим плазменную ячейку или запускаем форсаж через командный код!' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'sci-decision-pod',
      type: 'storyNode',
      position: { x: 1160, y: 430 },
      data: {
        label: 'Шлюз спасательных капсул',
        type: 'decision',
        notes: 'Автоматика капсулы требует либо Код допуска ИИ, либо достаточный запас кислорода для ручной разгерметизации.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-cortez', text: 'Капсула «Орион-3» на старте! Нужно активировать катапульту!' }
        ]
      },
      className: 'decision-node'
    },
    {
      id: 'sci-end-reactor-win',
      type: 'storyNode',
      position: { x: 1900, y: 60 },
      data: {
        label: 'Станция спасена: Энергия восстановлена',
        type: 'ending',
        notes: 'Триумфальная концовка! Реактор «Кронос-9» выходит на 100% мощности, системы жизнеобеспечения и маяк связи полностью восстановлены.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-ai', text: 'Термоядерный цикл стабилен. Орбита скорректирована. Спасибо, экипаж!' },
          { charId: 'sci-nova', text: 'Мы удержали станцию и сохранили все научные архивы экспедиции!' }
        ]
      }
    },
    {
      id: 'sci-end-pod-escape',
      type: 'storyNode',
      position: { x: 1900, y: 270 },
      data: {
        label: 'Эвакуация через спасательную капсулу',
        type: 'ending',
        notes: 'Успешная эвакуация. Спасательная капсула отстреливается от станции и ложится на курс к кораблю-носителю.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-cortez', text: 'Отстыковка прошла штатно! Мы унесли бортовой журнал с данными сигнала.' },
          { charId: 'sci-nova', text: 'Главное — экипаж жив. Флот разберётся с тем, что осталось на орбите.' }
        ]
      }
    },
    {
      id: 'sci-end-void',
      type: 'storyNode',
      position: { x: 1900, y: 480 },
      data: {
        label: 'Дрейф в открытом космосе (Поражение)',
        type: 'ending',
        notes: 'Трагический финал. Без энергоячейки и кодов доступа системы блокируются, оставляя челнок в холодном безмолвии орбиты.',
        imageId: null,
        effects: [],
        dialogue: [
          { charId: 'sci-ai', text: 'Критическое падение энергии... Переход в режим глубокой консервации...' },
          { charId: 'sci-nova', text: 'Нам не хватило ресурсов для перезапуска. Передаю последний маяк...' }
        ]
      }
    }
  ],
  edges: [
    {
      id: 'e-sci-1',
      source: 'sci-start',
      target: 'sci-shuttle-bay',
      label: 'Обыскать заброшенный челнок',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-2',
      source: 'sci-start',
      target: 'sci-bridge',
      label: 'Подняться в командную рубку',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-3',
      source: 'sci-start',
      target: 'sci-decision-hub',
      label: 'Сразу пройти к центральному распределителю',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-4',
      source: 'sci-shuttle-bay',
      target: 'sci-bridge',
      label: 'Перейти из челнока в командную рубку',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-5',
      source: 'sci-shuttle-bay',
      target: 'sci-decision-hub',
      label: 'Двигаться к центральному узлу',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-6',
      source: 'sci-bridge',
      target: 'sci-decision-hub',
      label: 'Спуститься к центральному узлу выбора',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-7',
      source: 'sci-decision-hub',
      target: 'sci-reactor-hall',
      label: 'Направиться к реактору для восстановления энергии',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-8',
      source: 'sci-decision-hub',
      target: 'sci-decision-pod',
      label: 'Эвакуироваться к спасательным капсулам',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-9',
      source: 'sci-reactor-hall',
      target: 'sci-decision-reactor',
      label: 'Подойти к пульту управления ядром',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-10',
      source: 'sci-decision-reactor',
      target: 'sci-end-reactor-win',
      label: 'Установить плазменную ячейку [🔒 Энергоячейка]',
      data: {
        condition: { varId: 'var-cell', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-sci-11',
      source: 'sci-decision-reactor',
      target: 'sci-end-reactor-win',
      label: 'Форсировать шину реактора [🔒 Заряд реактора >= 50]',
      data: {
        condition: { varId: 'var-energy', operator: '>=', value: 50 },
        effects: []
      }
    },
    {
      id: 'e-sci-12',
      source: 'sci-decision-reactor',
      target: 'sci-decision-pod',
      label: 'Аварийное отступление к спасательным капсулам',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-13',
      source: 'sci-decision-reactor',
      target: 'sci-end-void',
      label: 'Попытаться замкнуть контур вручную без защиты',
      data: { condition: null, effects: [] }
    },
    {
      id: 'e-sci-14',
      source: 'sci-decision-pod',
      target: 'sci-end-pod-escape',
      label: 'Запустить капсулу кодом ИИ [🔒 Код допуска ИИ]',
      data: {
        condition: { varId: 'var-code', operator: '==', value: true },
        effects: []
      }
    },
    {
      id: 'e-sci-15',
      source: 'sci-decision-pod',
      target: 'sci-end-pod-escape',
      label: 'Ручной отстрел шлюза [🔒 Кислород >= 70]',
      data: {
        condition: { varId: 'var-oxygen', operator: '>=', value: 70 },
        effects: []
      }
    },
    {
      id: 'e-sci-16',
      source: 'sci-decision-pod',
      target: 'sci-end-void',
      label: 'Остаться в заблокированном шлюзе',
      data: { condition: null, effects: [] }
    }
  ],
  groups: [
    { id: 'default', name: 'Экипаж разведки' },
    { id: 'station-ai', name: 'Системы станции' }
  ],
  characters: [
    { id: 'sci-nova', name: 'Капитан Нова', color: '#0ea5e9', groupId: 'default' },
    { id: 'sci-cortez', name: 'Инженер Кортес', color: '#f59e0b', groupId: 'default' },
    { id: 'sci-ai', name: 'Бортовой ИИ «Гелиос»', color: '#10b981', groupId: 'station-ai' }
  ],
  variables: [
    { id: 'var-cell', name: 'Энергоячейка', type: 'boolean', initialValue: false },
    { id: 'var-code', name: 'Код допуска ИИ', type: 'boolean', initialValue: false },
    { id: 'var-energy', name: 'Заряд реактора', type: 'number', initialValue: 20 },
    { id: 'var-oxygen', name: 'Кислород', type: 'number', initialValue: 100 }
  ],
  regions: [
    {
      id: 'region-sci-1',
      title: 'Глава 1: Стыковка и Разведка',
      order: 1,
      color: '#3b82f6',
      x: 20,
      y: 40,
      width: 680,
      height: 580,
      notes: 'Прибытие на орбитальную станцию «Кронос-9».'
    },
    {
      id: 'region-sci-2',
      title: 'Глава 2: Реактор или Эвакуация',
      order: 2,
      color: '#f59e0b',
      x: 750,
      y: 60,
      width: 1050,
      height: 570,
      notes: 'Критический выбор маршрута спасения.'
    },
    {
      id: 'region-sci-3',
      title: 'Глава 3: Развязка на орбите',
      order: 3,
      color: '#8b5cf6',
      x: 1850,
      y: 20,
      width: 340,
      height: 660,
      notes: 'Финалы научно-фантастической экспедиции.'
    }
  ],
  stashedNodes: [],
  currentTheme: 'dark'
});

export const createStarterState = () => createFantasyCastleState();

export const createBlankState = () => ({
  projectMeta: {
    id: `canvas-${Date.now()}`,
    title: 'Новое полотно истории',
    description: '',
    driveFileId: null,
    lastSyncedAt: null,
    updatedAt: new Date().toISOString()
  },
  nodes: [
    {
      id: 'start-scene',
      type: 'storyNode',
      position: { x: 180, y: 180 },
      data: {
        label: 'Начало истории',
        type: 'start',
        notes: 'Опишите стартовую локацию...',
        imageId: null,
        effects: [],
        dialogue: []
      }
    }
  ],
  edges: [],
  groups: [{ id: 'default', name: 'Общие' }],
  characters: [{ id: 'hero-1', name: 'Главный герой', color: '#2563eb', groupId: 'default' }],
  variables: [],
  regions: [],
  stashedNodes: [],
  currentTheme: 'dark'
});

const DEFAULT_REGION_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const normalizeRegions = (regions = [], rawNodes = []) => {
  const fromNodes = (Array.isArray(rawNodes) ? rawNodes : [])
    .filter((n) => n && n.type === 'regionNode')
    .map((n, idx) => ({
      id: n.id || `region-${uuidv4()}`,
      title: n.data?.title || n.data?.label || `Глава ${idx + 1}`,
      order: Number.isFinite(n.data?.order) ? Number(n.data.order) : idx + 1,
      color: n.data?.color || DEFAULT_REGION_PALETTE[idx % DEFAULT_REGION_PALETTE.length],
      x: Number.isFinite(n.position?.x) ? Math.round(n.position.x) : 100,
      y: Number.isFinite(n.position?.y) ? Math.round(n.position.y) : 100,
      width: Math.max(300, Number(n.style?.width || n.width || n.data?.width) || 560),
      height: Math.max(200, Number(n.style?.height || n.height || n.data?.height) || 380),
      notes: n.data?.notes || ''
    }));

  const explicit = (Array.isArray(regions) ? regions : [])
    .filter(Boolean)
    .map((r, idx) => ({
      id: r.id || `region-${uuidv4()}`,
      title: r.title || r.label || `Глава ${idx + 1}`,
      order: Number.isFinite(r.order) ? Number(r.order) : idx + 1,
      color: r.color || DEFAULT_REGION_PALETTE[idx % DEFAULT_REGION_PALETTE.length],
      x: Number.isFinite(r.x) ? Math.round(r.x) : Number.isFinite(r.position?.x) ? Math.round(r.position.x) : 100,
      y: Number.isFinite(r.y) ? Math.round(r.y) : Number.isFinite(r.position?.y) ? Math.round(r.position.y) : 100,
      width: Math.max(300, Number(r.width) || 560),
      height: Math.max(200, Number(r.height) || 380),
      notes: r.notes || ''
    }));

  const merged = [...explicit];
  for (const item of fromNodes) {
    if (!merged.some((r) => r.id === item.id)) merged.push(item);
  }
  return merged
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((r, i) => ({ ...r, order: i + 1 }));
};

// 1.4. Нормализация узлов: перенос любых Base64 картинок в пул `assetStorage` и хранение только `imageId`
const normalizeNodes = (nodes = []) =>
  (Array.isArray(nodes) ? nodes : [])
    .filter((n) => n && n.type !== 'regionNode')
    .map((n, idx) => {
      let imageId = n.data?.imageId || null;
      if (!imageId && n.data?.image && typeof n.data.image === 'string') {
        imageId = assetStorage.registerAsset(n.data.image);
      }
      return {
        ...n,
        type: 'storyNode',
        data: {
          label: n.data?.label || 'Сцена',
          type: n.data?.type || (idx === 0 ? 'start' : 'scene'),
          notes: n.data?.notes || '',
          imageId,
          choices: Array.isArray(n.data?.choices) ? n.data.choices : [],
          dialogue: Array.isArray(n.data?.dialogue) ? n.data.dialogue : [],
          effects: Array.isArray(n.data?.effects) ? n.data.effects : []
        },
        className: n.data?.type === 'decision' ? 'decision-node' : ''
      };
    });

let toastTimer = null;

export const useStoryStore = create(
  temporal(
    (set, get) => ({
      ...createFantasyCastleState(),
      edges: normalizeEdges(createFantasyCastleState().edges),
      user: null,
      toast: null,

      showToast: (text, type = 'info') => {
        if (toastTimer) clearTimeout(toastTimer);
        const id = Date.now() + Math.random();
        set({ toast: { text, type, id } });
        toastTimer = setTimeout(() => {
          if (get().toast?.id === id) {
            set({ toast: null });
          }
        }, 3200);
      },

      clearToast: () => set({ toast: null }),

      updateProjectMeta: (patch) =>
        set((state) => ({
          projectMeta: {
            ...state.projectMeta,
            ...patch,
            updatedAt: new Date().toISOString()
          }
        })),

      loadProject: async () => {
        try {
          await assetStorage.initFromStorage();


          const parsed = await storageService.loadProject();

          if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            assetStorage.hydrateFromProject(parsed);
            const theme = parsed.currentTheme || 'dark';
            set({
              projectMeta: parsed.projectMeta || {
                id: 'canvas-loaded',
                title: 'Моё полотно',
                description: '',
                driveFileId: null,
                lastSyncedAt: null,
                updatedAt: parsed.updatedAt || new Date().toISOString()
              },
              nodes: normalizeNodes(parsed.nodes),
              edges: normalizeEdges(parsed.edges || []),
              regions: normalizeRegions(parsed.regions, parsed.nodes),
              stashedNodes: normalizeNodes(parsed.stashedNodes || []),
              groups: Array.isArray(parsed.groups) && parsed.groups.length > 0 ? parsed.groups : [{ id: 'default', name: 'Общие' }],
              characters: Array.isArray(parsed.characters) ? parsed.characters : [],
              variables: Array.isArray(parsed.variables) ? parsed.variables : [],
              currentTheme: theme
            });
            document.body.className = `theme-${theme}`;
            useStoryStore.temporal.getState().clear();
          } else {
            document.body.className = `theme-${get().currentTheme}`;
            useStoryStore.temporal.getState().clear();
          }
        } catch (e) {
          console.error(e);
          get().showToast('Ошибка чтения сохранённого проекта', 'error');
        }
      },

      setTheme: (theme) => {
        set({ currentTheme: theme });
        document.body.className = `theme-${theme}`;
      },

      onNodesChange: (changes) => {
        const currentRegions = get().regions || [];
        const regionIds = new Set(currentRegions.map((r) => r.id));
        const regionChanges = changes.filter((c) => regionIds.has(c.id));
        const nodeChanges = changes.filter((c) => !regionIds.has(c.id));

        let nextRegions = currentRegions;
        if (regionChanges.length > 0) {
          const removedRegionIds = new Set(
            regionChanges.filter((c) => c.type === 'remove').map((c) => c.id)
          );
          nextRegions = currentRegions
            .filter((r) => !removedRegionIds.has(r.id))
            .map((r) => {
              let updated = r;
              for (const ch of regionChanges) {
                if (ch.id !== r.id) continue;
                if (ch.type === 'position' && ch.position) {
                  updated = {
                    ...updated,
                    x: Math.round(ch.position.x),
                    y: Math.round(ch.position.y),
                    dragging: Boolean(ch.dragging)
                  };
                } else if (ch.type === 'position' && typeof ch.dragging === 'boolean') {
                  updated = { ...updated, dragging: ch.dragging };
                } else if (ch.type === 'dimensions' && ch.dimensions) {
                  updated = {
                    ...updated,
                    width: Math.max(300, Math.round(ch.dimensions.width)),
                    height: Math.max(200, Math.round(ch.dimensions.height)),
                    resizing: Boolean(ch.resizing)
                  };
                } else if (ch.type === 'select') {
                  updated = { ...updated, selected: Boolean(ch.selected) };
                }
              }
              return updated;
            });
        }

        const removedIds = nodeChanges.filter((c) => c.type === 'remove').map((c) => c.id);
        const nextNodes = nodeChanges.length > 0 ? applyNodeChanges(nodeChanges, get().nodes) : get().nodes;
        if (removedIds.length > 0) {
          const nextEdges = get().edges.filter(
            (e) => !removedIds.includes(e.source) && !removedIds.includes(e.target)
          );
          set({ nodes: nextNodes, edges: nextEdges, regions: nextRegions });
        } else {
          set({ nodes: nextNodes, regions: nextRegions });
        }
      },

      onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),

      onConnect: (connection) => {
        const choiceId = connection.sourceHandle === 'choice-add'
          ? `choice-${uuidv4()}`
          : connection.sourceHandle || `choice-${uuidv4()}`;
        const sourceNode = get().nodes.find((node) => node.id === connection.source);
        const choices = Array.isArray(sourceNode?.data?.choices) ? sourceNode.data.choices : [];
        const createdChoice = connection.sourceHandle === 'choice-add' || !choices.some((choice) => choice.id === choiceId);
        const existingLabel = choices.find((choice) => choice.id === choiceId)?.label;
        const choiceLabel = existingLabel || `Новый выбор ${choices.length + 1}`;
        const edge = {
          ...connection,
          sourceHandle: choiceId,
          id: `edge-${connection.source}-${choiceId}-${connection.target}-${Date.now()}-${uuidv4().slice(0, 8)}`,
          label: choiceLabel,
          data: { choiceId, conditions: [], effects: [] }
        };
        set((state) => ({
          nodes: createdChoice ? state.nodes.map((node) => node.id === connection.source
            ? { ...node, data: { ...node.data, choices: [...(Array.isArray(node.data?.choices) ? node.data.choices : []), { id: choiceId, label: choiceLabel }] } }
            : node) : state.nodes,
          edges: [...state.edges, edge]
        }));
      },

      addNode: (type = 'scene', customPos = null) => {
        const existingNodes = get().nodes;
        const labels = {
          start: 'Начало истории',
          scene: `Сцена ${existingNodes.length + 1}`,
          decision: 'Развилка сюжета?',
          ending: 'Финал истории'
        };
        const newNode = {
          id: uuidv4(),
          type: 'storyNode',
          position: customPos || {
            x: Math.round(180 + (existingNodes.length % 4) * 320 + Math.random() * 40),
            y: Math.round(140 + Math.floor(existingNodes.length / 4) * 220 + Math.random() * 40)
          },
          data: {
            label: labels[type] || 'Новая сцена',
            type,
            notes: '',
            imageId: null,
            dialogue: [],
            effects: []
          },
          className: type === 'decision' ? 'decision-node' : ''
        };
        set({ nodes: [...existingNodes, newNode] });
        return newNode.id;
      },

      addConnectedScene: (sourceNodeId, choiceLabel = 'Новый выбор', targetType = 'scene') => {
        const sourceNode = get().nodes.find((n) => n.id === sourceNodeId);
        const pos = sourceNode
          ? { x: sourceNode.position.x + 340, y: sourceNode.position.y + Math.round((Math.random() - 0.5) * 180) }
          : null;
        const newTargetId = get().addNode(targetType, pos);
        const choiceId = `choice-${uuidv4()}`;
        const choice = { id: choiceId, label: choiceLabel };
        const newEdge = {
          id: `edge-${sourceNodeId}-${choiceId}-${newTargetId}-${Date.now()}`,
          source: sourceNodeId,
          sourceHandle: choiceId,
          target: newTargetId,
          label: choiceLabel,
          data: { choiceId, conditions: [], effects: [] }
        };
        set((state) => ({
          nodes: state.nodes.map((node) => node.id === sourceNodeId
            ? { ...node, data: { ...node.data, choices: [...(node.data?.choices || []), choice] } }
            : node),
          edges: [...state.edges, newEdge]
        }));
        return newTargetId;
      },

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
        })),

      deleteEdge: (edgeId) =>
        set((state) => {
          const deletedEdge = state.edges.find((edge) => edge.id === edgeId);
          const edges = state.edges.filter((edge) => edge.id !== edgeId);
          const choiceId = deletedEdge?.sourceHandle || deletedEdge?.data?.choiceId;
          const choiceStillConnected = choiceId && edges.some((edge) =>
            edge.source === deletedEdge.source && (edge.sourceHandle || edge.data?.choiceId) === choiceId
          );
          return {
            edges,
            nodes: choiceId && !choiceStillConnected
              ? state.nodes.map((node) => node.id === deletedEdge.source
                ? { ...node, data: { ...node.data, choices: (node.data?.choices || []).filter((choice) => choice.id !== choiceId) } }
                : node)
              : state.nodes
          };
        }),

      updateNodeData: (nodeId, newData) =>
        set((state) => ({

          nodes: state.nodes.map((n) => {
            if (n.id !== nodeId) return n;
            const patch = { ...newData };
            if ('image' in patch) {
              if (patch.image && typeof patch.image === 'string') {
                patch.imageId = assetStorage.registerAsset(patch.image);
              } else if (patch.image === null && !('imageId' in patch)) {
                patch.imageId = null;
              }
              delete patch.image;
            }
            const mergedData = { ...n.data, ...patch };
            delete mergedData.image;
            return {
              ...n,
              data: mergedData,
              className: mergedData.type === 'decision' ? 'decision-node' : ''
            };
          })
        })),

      updateEdgeData: (edgeId, label, condition, effects = null) =>
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === edgeId
              ? {
                  ...e,
                  label,
                  data: {
                    ...e.data,
                    conditions: Array.isArray(condition) ? condition : condition ? [condition] : [],
                    effects: effects !== null ? effects : e.data?.effects || []
                  }
                }
              : e
          )
        })),

      updateEdgeOffset: (edgeId, customOffset = null) =>
        set((state) => ({
          edges: state.edges.map((e) =>
            e.id === edgeId
              ? {
                  ...e,
                  data: {
                    ...e.data,
                    customOffset:
                      customOffset &&
                      Number.isFinite(customOffset.x) &&
                      Number.isFinite(customOffset.y)
                        ? { x: Math.round(customOffset.x), y: Math.round(customOffset.y) }
                        : null
                  }
                }
              : e
          )
        })),

      setEdgeCustomOffset: (edgeId, customOffset = null) =>
        get().updateEdgeOffset(edgeId, customOffset),

      stashNode: (nodeId) => {
        const state = get();
        const target = state.nodes.find((n) => n.id === nodeId);
        if (!target) return false;
        const remainingNodes = state.nodes.filter((n) => n.id !== nodeId);
        const remainingEdges = state.edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        );
        const stashedCopy = {
          ...target,
          selected: false,
          dragging: false,
          stashedAt: new Date().toISOString()
        };
        set({
          nodes: remainingNodes,
          edges: remainingEdges,
          stashedNodes: [...(state.stashedNodes || []), stashedCopy]
        });
        get().showToast(`Сцена «${target.data?.label || 'Сцена'}» убрана в карман`, 'info');
        return true;
      },

      unstashNode: (nodeId, customPos = null) => {
        const state = get();
        const stashedList = state.stashedNodes || [];
        const item = stashedList.find((n) => n.id === nodeId);
        if (!item) return null;
        const restoredNode = {
          ...item,
          type: 'storyNode',
          position:
            customPos && Number.isFinite(customPos.x) && Number.isFinite(customPos.y)
              ? { x: Math.round(customPos.x), y: Math.round(customPos.y) }
              : item.position || { x: 220, y: 200 },
          selected: false,
          dragging: false
        };
        delete restoredNode.stashedAt;
        set({
          nodes: [...state.nodes, restoredNode],
          stashedNodes: stashedList.filter((n) => n.id !== nodeId)
        });
        get().showToast(`Сцена «${restoredNode.data?.label || 'Сцена'}» возвращена на холст`, 'success');
        return restoredNode.id;
      },

      deleteStashedNode: (nodeId) =>
        set((state) => ({
          stashedNodes: (state.stashedNodes || []).filter((n) => n.id !== nodeId)
        })),

      addRegion: (customPos = null, preset = {}) => {
        const state = get();
        const existing = state.regions || [];
        const order = existing.length + 1;
        const color =
          preset.color || DEFAULT_REGION_PALETTE[(order - 1) % DEFAULT_REGION_PALETTE.length];
        const newRegion = {
          id: `region-${uuidv4()}`,
          title: preset.title || `Глава ${order}: Новая область`,
          order,
          color,
          x:
            customPos && Number.isFinite(customPos.x)
              ? Math.round(customPos.x)
              : 120 + ((order - 1) % 3) * 420,
          y:
            customPos && Number.isFinite(customPos.y)
              ? Math.round(customPos.y)
              : 100 + Math.floor((order - 1) / 3) * 320,
          width: Math.max(300, Number(preset.width) || 560),
          height: Math.max(200, Number(preset.height) || 380),
          notes: preset.notes || ''
        };
        set({ regions: [...existing, newRegion] });
        get().showToast(`Создана сюжетная область «${newRegion.title}»`, 'success');
        return newRegion.id;
      },

      updateRegion: (regionId, patch = {}) =>
        set((state) => ({
          regions: (state.regions || []).map((r) =>
            r.id === regionId
              ? {
                  ...r,
                  ...patch,
                  width:
                    patch.width !== undefined
                      ? Math.max(300, Math.round(Number(patch.width) || 300))
                      : r.width,
                  height:
                    patch.height !== undefined
                      ? Math.max(200, Math.round(Number(patch.height) || 200))
                      : r.height
                }
              : r
          )
        })),

      deleteRegion: (regionId) =>
        set((state) => {
          const filtered = (state.regions || [])
            .filter((r) => r.id !== regionId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((r, idx) => ({ ...r, order: idx + 1 }));
          return { regions: filtered };
        }),

      reorderRegions: (fromIndex, toIndex) =>
        set((state) => {
          const sorted = [...(state.regions || [])].sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          );
          if (
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= sorted.length ||
            toIndex >= sorted.length
          ) {
            return state;
          }
          const [moved] = sorted.splice(fromIndex, 1);
          sorted.splice(toIndex, 0, moved);
          return {
            regions: sorted.map((r, idx) => ({ ...r, order: idx + 1 }))
          };
        }),

      autoLayout: (direction = 'LR') => {
        const { nodes, edges } = get();
        if (nodes.length === 0) return;

        const startNode = nodes.find((n) => n.data?.type === 'start') || nodes[0];
        const levels = {};
        const visited = new Set();
        const queue = [{ id: startNode.id, level: 0 }];
        visited.add(startNode.id);

        while (queue.length > 0) {
          const { id, level } = queue.shift();
          if (!levels[level]) levels[level] = [];
          levels[level].push(id);

          edges
            .filter((e) => e.source === id)
            .forEach((e) => {
              if (!visited.has(e.target)) {
                visited.add(e.target);
                queue.push({ id: e.target, level: level + 1 });
              }
            });
        }

        const maxLevel = Math.max(0, ...Object.keys(levels).map(Number));
        nodes.forEach((n) => {
          if (!visited.has(n.id)) {
            const orphanLevel = maxLevel + 1;
            if (!levels[orphanLevel]) levels[orphanLevel] = [];
            levels[orphanLevel].push(n.id);
          }
        });

        const posMap = {};
        Object.entries(levels).forEach(([lvlStr, ids]) => {
          const lvl = Number(lvlStr);
          ids.forEach((id, idx) => {
            if (direction === 'LR') {
              posMap[id] = { x: 80 + lvl * 360, y: 80 + idx * 230 };
            } else {
              posMap[id] = { x: 80 + idx * 340, y: 80 + lvl * 240 };
            }
          });
        });

        set({
          nodes: nodes.map((n) => ({
            ...n,
            position: posMap[n.id] || n.position
          }))
        });
        get().showToast('Граф автоматически выровнен', 'success');
      },

      validateStory: (customNodes = null, customEdges = null) => {
        const nodes = Array.isArray(customNodes) ? customNodes : get().nodes;
        const edges = Array.isArray(customEdges) ? customEdges : get().edges;
        const issues = [];

        const startNodes = nodes.filter((n) => n.data?.type === 'start');
        if (startNodes.length === 0) {
          issues.push({ type: 'warning', text: 'Не назначена стартовая сцена (тип «Старт»). Игра начнётся с первой сцены в списке.' });
        } else if (startNodes.length > 1) {
          issues.push({ type: 'warning', text: `Найдено несколько стартовых сцен (${startNodes.length}). Рекомендуется оставить одну.` });
        }

        const startId = startNodes[0]?.id || nodes[0]?.id;
        const reachable = new Set();
        if (startId) {
          const q = [startId];
          reachable.add(startId);
          while (q.length > 0) {
            const cur = q.shift();
            edges
              .filter((e) => e.source === cur)
              .forEach((e) => {
                if (!reachable.has(e.target)) {
                  reachable.add(e.target);
                  q.push(e.target);
                }
              });
          }
        }

        nodes.forEach((n) => {
          if (startId && !reachable.has(n.id)) {
            issues.push({
              type: 'error',
              nodeId: n.id,
              text: `Сцена «${n.data?.label}» недостижима со старта (нет входящих путей).`
            });
          }
          const out = edges.filter((e) => e.source === n.id);
          if (out.length === 0 && n.data?.type !== 'ending') {
            issues.push({
              type: 'warning',
              nodeId: n.id,
              text: `Сцена «${n.data?.label}» не имеет выходов и не помечена как «Финал».`
            });
          }
          if ((!n.data?.dialogue || n.data.dialogue.length === 0) && !n.data?.notes?.trim()) {
            issues.push({
              type: 'info',
              nodeId: n.id,
              text: `Сцена «${n.data?.label}» пуста (нет ни описания, ни реплик).`
            });
          }
        });

        return issues;
      },

      addGroup: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({ groups: [...state.groups, { id: uuidv4(), name: trimmed }] }));
      },

      renameGroup: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          groups: state.groups.map((g) => (g.id === id ? { ...g, name: trimmed } : g))
        }));
      },

      deleteGroup: (id) =>
        set((state) => {
          if (id === 'default') return state;
          return {
            groups: state.groups.filter((g) => g.id !== id),
            characters: state.characters.map((c) => (c.groupId === id ? { ...c, groupId: 'default' } : c))
          };
        }),

      addCharacter: (name, groupId = 'default', color = '#2563eb') => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          characters: [...state.characters, { id: uuidv4(), name: trimmed, color, groupId }]
        }));
      },

      updateCharacter: (id, field, value) =>
        set((state) => ({
          characters: state.characters.map((c) => (c.id === id ? { ...c, [field]: value } : c))
        })),

      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          nodes: state.nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              dialogue: (n.data?.dialogue || []).map((line) =>
                line.charId === id ? { ...line, charId: '' } : line
              )
            }
          }))
        })),

      moveCharacterToGroup: (charId, groupId) =>
        set((state) => ({
          characters: state.characters.map((c) => (c.id === charId ? { ...c, groupId } : c))
        })),

      addVariable: (name, type = 'boolean', initialValue = false) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) => ({
          variables: [...state.variables, { id: uuidv4(), name: trimmed, type, initialValue }]
        }));
      },

      updateVariable: (id, field, value) =>
        set((state) => ({
          variables: state.variables.map((v) => {
            if (v.id !== id) return v;
            const updated = { ...v, [field]: value };
            if (field === 'type') {
              updated.initialValue = value === 'boolean' ? false : 0;
            }
            return updated;
          })
        })),

      deleteVariable: (id) =>
        set((state) => {
          const deletedVar = state.variables.find((v) => v.id === id);
          return {
            variables: state.variables.filter((v) => v.id !== id),
            nodes: state.nodes.map((n) => ({
              ...n,
              data: {
                ...n.data,
                effects: (n.data?.effects || []).filter((ef) => ef.varId !== id)
              }
            })),
            edges: state.edges.map((e) => {
              const hadCond = e.data?.condition?.varId === id;
              let nextLabel = e.label || '';
              if (hadCond && deletedVar) {
                nextLabel = nextLabel.replace(/\s*\[🔒[^\]]*\]/g, '').trim();
              }
              return {
                ...e,
                label: nextLabel,
                data: {
                  ...e.data,
                  conditions: getConditions(e.data).filter((c) => c.varId !== id),
                  effects: (e.data?.effects || []).filter((ef) => ef.varId !== id)
                }
              };
            })
          };
        }),

      getSerializableData: () => {
        const state = get();
        const { projectMeta, nodes, edges, regions, stashedNodes, groups, characters, variables, currentTheme } = state;
        const assets = {
          ...assetStorage.exportAssetsForNodes(nodes),
          ...assetStorage.exportAssetsForNodes(stashedNodes || [])
        };
        return {
          version: '4.0',
          appName: 'Story Architect',
          updatedAt: new Date().toISOString(),
          projectMeta: {
            ...projectMeta,
            updatedAt: new Date().toISOString()
          },
          nodes,
          edges: normalizeEdges(edges),
          regions: normalizeRegions(regions),
          stashedNodes: normalizeNodes(stashedNodes || []),
          groups,
          characters,
          variables,
          assetsMap: assets,
          currentTheme
        };
      },

      saveProject: async (silent = false) => {
        const data = get().getSerializableData();
        const result = await storageService.saveProject(data);
        if (result.success) {
          if (result.id) set((state) => ({projectMeta:{...state.projectMeta,id:result.id,revision:result.revision,storageType:result.storageType,sizeBytes:result.sizeBytes}}));
          if (!silent) get().showToast('Полотно сохранено', 'success');
          return true;
        } else {
          get().showToast(result.error || 'Ошибка сохранения файла.', 'error');
          return false;
        }
      },

      importProject: async (data, persist = true) => {
        if (!data || typeof data !== 'object') {
          get().showToast('Некорректный формат файла проекта', 'error');
          return false;
        }
        try {
          assetStorage.hydrateFromProject(data);
          const nodes = normalizeNodes(Array.isArray(data.nodes) ? data.nodes : []);
          const edges = normalizeEdges(data.edges || []);
          const regions = normalizeRegions(data.regions, data.nodes);
          const stashedNodes = normalizeNodes(Array.isArray(data.stashedNodes) ? data.stashedNodes : []);
          const groups =
            Array.isArray(data.groups) && data.groups.length > 0
              ? data.groups
              : [{ id: 'default', name: 'Общие' }];
          const characters = Array.isArray(data.characters) ? data.characters : [];
          const variables = Array.isArray(data.variables) ? data.variables : [];
          const currentTheme = data.currentTheme || get().currentTheme || 'dark';
          const projectMeta = data.projectMeta || {
            id: `canvas-${Date.now()}`,
            title: data.title || 'Импортированное полотно',
            description: data.description || '',
            driveFileId: data.driveFileId || null,
            lastSyncedAt: data.lastSyncedAt || null,
            updatedAt: new Date().toISOString()
          };

          set({ projectMeta, nodes, edges, regions, stashedNodes, groups, characters, variables, currentTheme });
          document.body.className = `theme-${currentTheme}`;
          useStoryStore.temporal.getState().clear();

          if (persist) await storageService.saveProject(get().getSerializableData());
          get().showToast(`Полотно «${projectMeta.title}» загружено (${nodes.length} сцен)`, 'success');
          return true;
        } catch (e) {
          console.error(e);
          get().showToast('Ошибка при загрузке полотна', 'error');
          return false;
        }
      },

      resetProject: async (templateMode = 'blank', persist = true) => {
        let next;
        let toastMsg;
        if (templateMode === 'scifi') {
          next = createSciFiOrbitalState();
          toastMsg = 'Загружен шаблон «Sci-Fi: Сигнал с орбитальной станции»';
        } else if (templateMode === true || templateMode === 'demo' || templateMode === 'fantasy') {
          next = createFantasyCastleState();
          toastMsg = 'Загружен шаблон «Фэнтези: Тайна Старого Замка»';
        } else {
          next = createBlankState();
          toastMsg = 'Создано новое чистое полотно';
        }
        next.edges = normalizeEdges(next.edges);
        next.currentTheme = get().currentTheme;
        set(next);
        useStoryStore.temporal.getState().clear();
        if (persist) await storageService.saveProject(get().getSerializableData());
        get().showToast(toastMsg, 'info');
      }
    }),
    {
      limit: 50,
      // 1.4. В историю Zundo сохраняется исключительно облегчённый граф с `imageId` без дублирования Base64-бинарников
      partialize: (state) => ({
        nodes: state.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            label: n.data?.label || '',
            type: n.data?.type || 'scene',
            notes: n.data?.notes || '',
            imageId: n.data?.imageId || null,
            choices: n.data?.choices || [],
            dialogue: n.data?.dialogue || [],
            effects: n.data?.effects || []
          },
          className: n.className
        })),
        edges: state.edges,
        regions: (state.regions || []).map((r) => ({
          id: r.id,
          title: r.title,
          order: r.order,
          color: r.color,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          notes: r.notes || ''
        })),
        stashedNodes: (state.stashedNodes || []).map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: {
            label: n.data?.label || '',
            type: n.data?.type || 'scene',
            notes: n.data?.notes || '',
            imageId: n.data?.imageId || null,
            choices: n.data?.choices || [],
            dialogue: n.data?.dialogue || [],
            effects: n.data?.effects || []
          },
          className: n.className
        })),
        groups: state.groups,
        characters: state.characters,
        variables: state.variables
      }),
      equality: (pastState, currentState) => {
        const storeState = useStoryStore.getState();
        if (storeState.nodes.some((n) => n.dragging)) {
          return true;
        }
        if ((storeState.regions || []).some((r) => r.dragging || r.resizing)) {
          return true;
        }
        return JSON.stringify(pastState) === JSON.stringify(currentState);
      }
    }
  )
);
