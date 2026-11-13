// Client results shown in the "Real clients. Real results." gallery.
// Figures are copied exactly from the original screenshots in public/images/testimonials/ – do not "fix" or round them.

export type ResultStage = {
  /** Column heading, e.g. "After 1 month". */
  label: string;
  leads: string;
  showUps: string;
  sales: string;
  coursePrice: string;
  revenue: string;
  profit: string;
  adSpend: string;
};

export type CaseStudy = {
  id: string;
  category: "Numerology coach" | "Tarot coach";
  image: string;
  alt: string;
  /** Natural width / height of the original image. Used to reserve space (no layout shift). Update if the files change. */
  width: number;
  height: number;
  stages: ResultStage[];
};

export const resultsSection = {
  kicker: "Client results & success stories",
  headline: "Real clients. Real results.",
  subheadline: "See how numerology and tarot coaches are turning their expertise into high-ticket clients.",
  description: "Real campaign results, real conversations and real business growth from coaches who implemented the system.",
  closing: {
    headline: "Your expertise deserves premium clients.",
    body: "Learn how to position your numerology services, attract high-value clients and build a predictable client acquisition system.",
    cta: "RESERVE YOUR SPOT",
  },
} as const;

export const caseStudies: CaseStudy[] = [
  {
    id: "numerology-coach-01",
    category: "Numerology coach",
    image: "/images/testimonials/numerology-coach-01.png",
    alt: "Instagram profile of a numerology coach",
    width: 1226,
    height: 1283,
    stages: [
      {
        label: "1 month",
        leads: "150",
        showUps: "65",
        sales: "10",
        coursePrice: "$390",
        revenue: "$3,892",
        profit: "$3,592",
        adSpend: "$200",
      },
    ],
  },
  {
    id: "tarot-coach-01",
    category: "Tarot coach",
    image: "/images/testimonials/tarot-coach-01.png",
    alt: "Instagram profile of a tarot coach",
    width: 1122,
    height: 1402,
    stages: [
      {
        label: "After 1 month",
        leads: "80",
        showUps: "40",
        sales: "15",
        coursePrice: "$233",
        revenue: "$3,500",
        profit: "$3,400",
        adSpend: "$110",
      },
      {
        label: "After 3 months",
        leads: "225",
        showUps: "100+",
        sales: "25",
        coursePrice: "$397",
        revenue: "$9,925",
        profit: "$9,625",
        adSpend: "$300",
      },
    ],
  },
  {
    id: "numerology-coach-02",
    category: "Numerology coach",
    image: "/images/testimonials/numerology-coach-02.png",
    alt: "Instagram profile of a second numerology coach",
    width: 1122,
    height: 1402,
    stages: [
      {
        label: "After 1 month",
        leads: "350",
        showUps: "150",
        sales: "6",
        coursePrice: "$455",
        revenue: "$2,835",
        profit: "$2,735",
        adSpend: "$100",
      },
      {
        label: "After 3 months",
        leads: "420",
        showUps: "130",
        sales: "14",
        coursePrice: "$455",
        revenue: "$6,382",
        profit: "$6,000",
        adSpend: "$300",
      },
    ],
  },
];

export const metricRows: { key: keyof Omit<ResultStage, "label">; label: string; highlight?: boolean }[] = [
  { key: "leads", label: "Leads generated" },
  { key: "showUps", label: "Show-ups" },
  { key: "sales", label: "Sales" },
  { key: "coursePrice", label: "Course price" },
  { key: "adSpend", label: "Ad spend" },
  { key: "revenue", label: "Revenue", highlight: true },
  { key: "profit", label: "Profit", highlight: true },
];
