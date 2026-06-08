import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  TabStopType,
} from 'docx'
import { db } from '../db/index.js'

const FONT = 'Times New Roman'
const MINISTRY = 'Министерство науки и высшего образования Российской Федерации'
const UNIVERSITY = 'Пермский национальный исследовательский политехнический университет'
const DEPARTMENT = 'Информационные технологии и автоматизированные системы'
const DEPARTMENT_SHORT = 'ИТАС'
const FACULTY = 'электротехнического факультета'

// half-points: 12pt=24, 10pt=20, 8pt=16
const SZ12 = 24
const SZ10 = 20
const SZ8 = 16

// Ширина текстовой области: A4(11906) − левое(1134) − правое(851) = 9921 twips
const TEXT_WIDTH = 9921
const UL = { type: UnderlineType.SINGLE }
const FIRST_LINE = { firstLine: 720 }
const JUST = AlignmentType.JUSTIFIED
const SINGLE = { before: 0, after: 0, line: 240, lineRule: 'auto' }

function r(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SZ12, ...opts })
}

function rSm(text, size = SZ8) {
  return new TextRun({ text, font: FONT, size, italics: true })
}

// Параграф с таб-стопом по правому краю — подчёркивание заполняет до правого поля
function fieldPara(prefixRuns, fieldText, opts = {}) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
    spacing: { ...SINGLE },
    ...opts,
    children: [
      ...prefixRuns,
      r(`_${fieldText || ''}`, { underline: UL }),
      r('\t', { underline: UL }),
    ],
  })
}

function line(children, opts = {}) {
  return new Paragraph({
    spacing: { ...SINGLE },
    ...opts,
    children: Array.isArray(children) ? children : [children],
  })
}

function buildCopy({
  reviewerFio,
  reviewerPhone,
  reviewerEmail,
  studentFio,
  directionName,
  topic,
  headShort,
}) {
  const contacts = [reviewerPhone, reviewerEmail].filter(Boolean).join(', ')

  return [
    // Шапка
    line([r(MINISTRY, { bold: true })], { alignment: AlignmentType.CENTER }),
    line([r(`«${UNIVERSITY}»`, { bold: true })], { alignment: AlignmentType.CENTER }),
    line([r('НАПРАВЛЕНИЕ', { bold: true })], { alignment: AlignmentType.CENTER }),
    line([r(' ')]), // пустая строка после НАПРАВЛЕНИЕ

    // Уважаемый + ФИО рецензента
    fieldPara([r('Уважаемый ')], reviewerFio, { indent: FIRST_LINE }),
    line([rSm('(фамилия, имя, отчество)')], { alignment: AlignmentType.CENTER }),
    // Контактные данные рецензента на отдельной строке
    ...(contacts ? [line([r(`(тел./e-mail: ${contacts})`)], { indent: FIRST_LINE })] : []),

    // Основной текст: университет направляет + ФИО студента
    new Paragraph({
      alignment: JUST,
      tabStops: [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }],
      spacing: { ...SINGLE },
      children: [
        r(
          `${UNIVERSITY}, кафедра «${DEPARTMENT}» направляет Вам на рецензию магистерскую диссертацию студента `,
        ),
        r(`_${studentFio}`, { underline: UL }),
        r('\t', { underline: UL }),
      ],
    }),
    line([rSm('(Ф.И.О.)')], { alignment: AlignmentType.CENTER }),

    // Факультет и направление
    fieldPara([r(`${FACULTY}, направление `)], directionName),

    // Тема
    fieldPara([r('Тема ')], topic),

    // Даты
    line([r('Рецензию просим предоставить в письменном виде к «___» __________ 20__ г.')], {
      indent: FIRST_LINE,
    }),
    line([
      r('Приглашаем Вас присутствовать на защите, которая состоится «___» _____________ 20__ г.'),
    ]),
    line([r('Оплата за рецензию будет произведена в установленном порядке.')]),

    // Требования к рецензии
    new Paragraph({
      alignment: JUST,
      indent: FIRST_LINE,
      spacing: { ...SINGLE },
      children: [
        new TextRun({ text: 'Текст рецензии', font: FONT, size: SZ10, bold: true }),
        new TextRun({
          font: FONT,
          size: SZ10,
          text:
            ' должен содержать: заключение об актуальности темы и степени соответствия выполненной ' +
            'выпускной квалификационной работы заданию; характеристику каждого раздела работы и степени ' +
            'использования выпускником современных достижений науки и техники; оценку качества ' +
            'пояснительной записки и графической части; перечень положительных свойств выпускной ' +
            'квалификационной работы и основных недостатков, оценку выпускной квалификационной работы, ' +
            'заключения о соответствии работы требованиям ФГОС ВПО, об уровне подготовленности ' +
            'выпускника и о возможности присвоения студенту соответствующей квалификации.',
        }),
      ],
    }),

    // Пустая строка перед подписью
    line([r(' ')]),

    // Подпись зав. кафедрой
    line(
      [
        r(`Заведующий кафедрой ${DEPARTMENT_SHORT} `),
        r('____________________', { underline: UL }),
        r(`(${headShort})`),
      ],
      { alignment: AlignmentType.RIGHT },
    ),

    // Пустая строка + дата подписи
    line([r(' ')]),
    line([r('«___» _______________ 20___ г.')]),
  ]
}

function spaceBetweenCopies() {
  return [line([r(' ')]), line([r(' ')])]
}

export const getReviewDirection = async (req, res) => {
  try {
    const { studentId } = req.params

    const { rows, rowCount } = await db.query(
      `SELECT s.last_name, s.first_name, s.middle_name,
              v.topic,
              d.code AS direction_code, d.name AS direction_name,
              rv.last_name   AS reviewer_last_name,
              rv.first_name  AS reviewer_first_name,
              rv.middle_name AS reviewer_middle_name,
              rv.email AS reviewer_email,
              rv.phone AS reviewer_phone
       FROM students s
       LEFT JOIN vkr v        ON v.student_id = s.id
       LEFT JOIN groups g     ON g.id = s.group_id
       LEFT JOIN directions d ON d.id = g.direction_id
       LEFT JOIN reviewers rv ON rv.id = s.reviewer_id
       WHERE s.id = $1`,
      [studentId],
    )

    if (rowCount === 0) return res.status(404).json({ message: 'Студент не найден' })
    const row = rows[0]
    if (!row.reviewer_last_name) return res.status(400).json({ message: 'Рецензент не назначен' })

    const headRows = await db.query(
      `SELECT u.last_name, u.first_name, u.middle_name
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       WHERE ur.role = 'HEAD_OF_DEPARTMENT'
       ORDER BY u.id LIMIT 1`,
    )
    const head = headRows.rows[0]
    const headShort = head
      ? `${head.first_name?.[0] ?? ''}.${head.middle_name?.[0] ?? ''}. ${head.last_name}`
      : '___'

    const studentFio = [row.last_name, row.first_name, row.middle_name].filter(Boolean).join(' ')
    const reviewerFio = [row.reviewer_last_name, row.reviewer_first_name, row.reviewer_middle_name]
      .filter(Boolean)
      .join(' ')

    const copyData = {
      reviewerFio,
      reviewerPhone: row.reviewer_phone || '',
      reviewerEmail: row.reviewer_email || '',
      studentFio,
      directionName: row.direction_name || '',
      topic: row.topic || '',
      headShort,
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            // top=1cm(567), bottom=1cm(567), left=2cm(1134), right=1.5cm(851)
            page: { margin: { top: 567, right: 851, bottom: 567, left: 1134 } },
          },
          children: [...buildCopy(copyData), ...spaceBetweenCopies(), ...buildCopy(copyData)],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)

    const nameSlug = `${row.last_name}${row.first_name?.[0] ?? ''}${row.middle_name?.[0] ?? ''}`
    const filename = `Направление_${nameSlug}.docx`

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    )
    res.send(buffer)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Ошибка формирования документа' })
  }
}
