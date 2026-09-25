/**
 * The aroma quiz. All weights live in the database (editable from admin later);
 * this seed only provides a sensible starting point. Copy describes moments
 * and preferences — never health outcomes.
 */
import type { ProductType, QuizQuestionType } from "../../../src/generated/prisma/enums";

type W = Array<[slug: string, weight: number]>;

export type SeedAnswer = {
  key: string;
  text: string;
  needs?: W;
  aromas?: W;
  tags?: W;
  productTypes?: Array<[ProductType, number]>;
  maxPrice?: number;
};

export type SeedQuestion = {
  key: string;
  text: string;
  helpText?: string;
  type: QuizQuestionType;
  required: boolean;
  answers: SeedAnswer[];
};

export const quiz = {
  slug: "quiz-aromatic",
  title: "Quiz aromatic",
  description:
    "Câteva întrebări simple despre preferințele tale — și îți arătăm de unde să începi.",
};

export const quizQuestions: SeedQuestion[] = [
  {
    key: "cauti",
    text: "Ce cauți în primul rând?",
    helpText: "Poți alege mai multe variante.",
    type: "MULTIPLE_CHOICE",
    required: true,
    answers: [
      { key: "relaxare", text: "Relaxare", needs: [["relaxare", 3]] },
      {
        key: "seara",
        text: "Somn / seară",
        needs: [
          ["seara", 3],
          ["relaxare", 1],
        ],
      },
      { key: "concentrare", text: "Concentrare", needs: [["concentrare", 3]] },
      { key: "energie", text: "Energie", needs: [["energie", 3]] },
      {
        key: "casa",
        text: "Atmosferă pentru casă",
        needs: [["casa", 3]],
        tags: [["pentru-difuzor", 1]],
      },
      { key: "ingrijire", text: "Îngrijire personală", needs: [["ingrijire-personala", 3]] },
      { key: "prospetime", text: "Prospețime", needs: [["prospetime", 3]] },
      {
        key: "zero",
        text: "Încep de la zero",
        needs: [["incepator", 3]],
        productTypes: [["KIT", 2]],
      },
      { key: "altceva", text: "Altceva" },
    ],
  },
  {
    key: "arome",
    text: "Ce arome te atrag?",
    helpText: "Alege oricâte vrei.",
    type: "MULTIPLE_CHOICE",
    required: false,
    answers: [
      { key: "citric", text: "Citrice, luminoase", aromas: [["citric", 3]] },
      { key: "floral", text: "Florale, delicate", aromas: [["floral", 3]] },
      { key: "mentolat", text: "Mentolate, răcoroase", aromas: [["mentolat", 3]] },
      { key: "lemnos", text: "Lemnoase, calde", aromas: [["lemnos", 3]] },
      { key: "pamantiu", text: "Pământii, profunde", aromas: [["pamantiu", 3]] },
      { key: "proaspat", text: "Verzi, proaspete", aromas: [["proaspat", 3]] },
      { key: "dulce", text: "Dulci, învăluitoare", aromas: [["dulce", 3]] },
      { key: "condimentat", text: "Condimentate", aromas: [["condimentat", 3]] },
      { key: "nu-stiu", text: "Nu știu încă" },
    ],
  },
  {
    key: "experienta",
    text: "Cât de familiare îți sunt uleiurile esențiale?",
    type: "SINGLE_CHOICE",
    required: true,
    answers: [
      {
        key: "inceput",
        text: "Sunt la început",
        needs: [["incepator", 2]],
        productTypes: [["KIT", 1]],
      },
      {
        key: "cateva",
        text: "Am încercat câteva",
        productTypes: [
          ["INDIVIDUAL_OIL", 1],
          ["BLEND", 1],
        ],
      },
      {
        key: "des",
        text: "Le folosesc des",
        productTypes: [
          ["INDIVIDUAL_OIL", 1],
          ["BLEND", 1],
        ],
        tags: [["nou", 1]],
      },
    ],
  },
  {
    key: "tip",
    text: "Ce fel de produs ți-ar plăcea?",
    type: "SINGLE_CHOICE",
    required: true,
    answers: [
      { key: "ulei", text: "Un ulei individual", productTypes: [["INDIVIDUAL_OIL", 3]] },
      { key: "amestec", text: "Un amestec gata făcut", productTypes: [["BLEND", 3]] },
      { key: "kit", text: "Un set pentru început", productTypes: [["KIT", 3]] },
      { key: "difuzor", text: "Un difuzor", productTypes: [["DIFFUSER", 3]] },
      { key: "accesorii", text: "Accesorii", productTypes: [["ACCESSORY", 3]] },
      { key: "oricare", text: "Nu contează" },
    ],
  },
  {
    key: "moment",
    text: "Când ai vrea să le folosești?",
    type: "SINGLE_CHOICE",
    required: true,
    answers: [
      {
        key: "dimineata",
        text: "Dimineața",
        needs: [
          ["energie", 2],
          ["prospetime", 1],
        ],
      },
      { key: "zi", text: "În timpul zilei", needs: [["concentrare", 2]] },
      {
        key: "seara",
        text: "Seara",
        needs: [
          ["seara", 2],
          ["relaxare", 1],
        ],
      },
      { key: "oricand", text: "Oricând" },
    ],
  },
  {
    key: "buget",
    text: "Ce buget ai în minte?",
    type: "SINGLE_CHOICE",
    required: true,
    answers: [
      { key: "sub-60", text: "Până în 60 lei", maxPrice: 6000 },
      { key: "60-150", text: "Între 60 și 150 lei", maxPrice: 15000 },
      {
        key: "peste-150",
        text: "Peste 150 lei",
        productTypes: [
          ["KIT", 1],
          ["DIFFUSER", 1],
        ],
      },
      { key: "nu-conteaza", text: "Nu contează" },
    ],
  },
  {
    key: "frecventa",
    text: "Cât de des crezi că le vei folosi?",
    type: "SINGLE_CHOICE",
    required: false,
    answers: [
      {
        key: "zilnic",
        text: "Zilnic, în rutina mea",
        productTypes: [
          ["DIFFUSER", 1],
          ["KIT", 1],
        ],
      },
      { key: "saptamanal", text: "De câteva ori pe săptămână", productTypes: [["BLEND", 1]] },
      { key: "ocazional", text: "Ocazional", productTypes: [["INDIVIDUAL_OIL", 1]] },
    ],
  },
  {
    key: "detii",
    text: "Ce ai deja acasă?",
    helpText: "Ca să nu-ți recomandăm ce ai deja.",
    type: "MULTIPLE_CHOICE",
    required: false,
    answers: [
      { key: "difuzor", text: "Un difuzor", productTypes: [["DIFFUSER", -6]] },
      {
        key: "uleiuri",
        text: "Câteva uleiuri individuale",
        productTypes: [
          ["KIT", -2],
          ["BLEND", 1],
        ],
      },
      { key: "kit", text: "Un kit de început", productTypes: [["KIT", -4]] },
      {
        key: "nimic",
        text: "Nimic încă",
        needs: [["incepator", 1]],
        productTypes: [["DIFFUSER", 1]],
      },
    ],
  },
];
