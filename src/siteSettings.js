export const DEFAULT_SITE_SETTINGS = {
  colors: {
    forest: "#072f1b",
    forest2: "#0c4728",
    leaf: "#4cc46f",
    lime: "#b6e650",
    cream: "#f4f2e9",
    ink: "#122019",
  },
  tickerText: "اپنی مدد آپ، اجتماعی تعاون اور خدمتِ خلق | صاف گاؤں، سرسبز گاؤں، مثالی گاؤں — ہماری مشترکہ پہچان۔ 🌱",
  introTitle: "کلین اینڈ گرین سنگراں",
  introSubtitle: "ایک مشن، ایک عہد، ایک مثالی گاؤں",
  introSummary: "ہم سب اہلیانِ سنگراں کا مشترکہ عزم ہے کہ صفائی، شجرکاری، خوبصورتی، نظم و ضبط اور باہمی تعاون کے ذریعے اپنے گاؤں کو علاقے کا سب سے منفرد، سرسبز اور مثالی گاؤں بنائیں۔",
};

export function mergeSiteSettings(value = {}) {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...value,
    colors: {
      ...DEFAULT_SITE_SETTINGS.colors,
      ...(value.colors || {}),
    },
  };
}
