// Landing page copy – source of truth supplied by the client. Edit text here, not in components.
// Do not add promises, statistics or testimonials that the team cannot verify.

import { priceLabel, workshop } from "./workshop";

export const meta = {
  title: `${workshop.name} – Live 90-Minute Workshop for ${priceLabel}`,
  description:
    "Learn how to position your numerology services as premium offers, attract affluent clients and build an automated client acquisition system using Meta Ads. Live workshop, Sunday 11 AM IST.",
};

export const hero = {
  eyebrow: ["LIVE 90-MINUTE WORKSHOP", "SUNDAY, 11 AM"],
  headlineLead: "From Low-Ticket Readings to",
  headlineAccent: "High-Ticket Clients.",
  lead: "Learn how to position your numerology services as premium offers, attract affluent clients and build an automated client acquisition system using Meta Ads.",
  secondary: [
    "Stop competing for people looking for cheap readings.",
    "Learn how to position your expertise for clients who value personalised, premium services.",
  ],
  benefits: [
    { icon: "gem", text: "Create premium offers." },
    { icon: "users", text: "Attract affluent clients." },
    { icon: "megaphone", text: "Generate quality enquiries through Meta Ads." },
    { icon: "zap", text: "Build an automated client acquisition system." },
  ],
  priceKicker: "YOUR WORKSHOP ACCESS:",
  priceText: `JUST ${priceLabel}`,
  reassurance: "90 minutes. Practical strategies. A roadmap you can implement.",
} as const;

export const problem = {
  headline: "Being good at numerology doesn't automatically make you good at business.",
  intro: [
    "You might have years of experience and genuinely valuable knowledge.",
    "But are you attracting the kind of clients who recognise that value?",
  ],
  challenges: [
    { icon: "tag", text: "People constantly ask for free or discounted readings." },
    { icon: "trendingDown", text: "You're struggling to charge premium prices." },
    { icon: "users", text: "Most of your clients come through referrals." },
    { icon: "camera", text: "You spend too much time posting on Instagram without consistent enquiries." },
    { icon: "target", text: "You don't know how to reach affluent clients." },
    { icon: "megaphone", text: "You want to run ads but don't know where to start." },
  ],
  closing: "The problem might not be your expertise. It might be how you're positioning and selling it.",
} as const;

export const shift = {
  headline: "What if you stopped competing in the low-ticket market?",
  intro: "Imagine building a business where:",
  points: [
    "Your services are positioned as premium experiences.",
    "Your offers attract clients who value personalised attention.",
    "You're reaching affluent individuals, entrepreneurs and business owners.",
    "Your marketing brings enquiries without depending entirely on referrals.",
    "Your client acquisition process works through ads, funnels and automation.",
  ],
  emphasisLead: "You don't necessarily need more followers.",
  emphasis: ["a better offer", "better positioning", "a better system to reach the right people"],
} as const;

export const modules = {
  headline: "Inside The High-Ticket Numerology Blueprint",
  intro: "In this 90-minute workshop, we'll break down four important parts of building a premium numerology business.",
  items: [
    {
      number: "01",
      icon: "gem",
      title: "Premium Offer Creation",
      body: "Learn how to package your expertise into a premium service instead of selling individual readings.",
      points: [
        "Identify what makes your service valuable.",
        "Package your expertise into a compelling offer.",
        "Position your services for premium buyers.",
      ],
    },
    {
      number: "02",
      icon: "users",
      title: "Attracting Affluent Clients",
      body: "Learn how to position your business for an audience that values premium services.",
      points: [
        "Identify your ideal premium audience.",
        "Understand how to reach affluent prospects.",
        "Build messaging that speaks to premium buyers.",
      ],
    },
    {
      number: "03",
      icon: "megaphone",
      title: "Meta Ads That Generate Enquiries",
      body: "Discover how paid advertising can help you reach potential clients beyond your existing followers.",
      points: [
        "Understand the Meta Ads framework.",
        "Learn about audience targeting.",
        "Understand ad creatives and messaging.",
      ],
    },
    {
      number: "04",
      icon: "zap",
      title: "Automated Client Acquisition",
      body: "Learn how to connect your marketing into one simple system.",
      points: [
        "Build a simple lead-generation funnel.",
        "Connect ads with landing pages and WhatsApp.",
        "Understand how to follow up with interested prospects.",
        "Reduce dependence on manual client acquisition.",
      ],
    },
  ],
} as const;

export const bigPicture = {
  headline: "Your expertise deserves better positioning.",
  comparison: {
    from: "Selling a ₹500 reading",
    to: "Building a premium service designed around a client's needs",
  },
  body: [
    "There is a difference between selling a ₹500 reading and building a premium service designed around a client's needs.",
    "The opportunity isn't simply to increase your prices.",
  ],
  punchline: "It's to improve the entire business model.",
  sequence: ["Better positioning", "Better offers", "Better audience", "Better client acquisition"],
} as const;

export const caseStudies = {
  headline: "Don't just take our word for it.",
  intro: "We've worked with multiple numerology experts to help them build and grow their businesses.",
  claim: "One of our case studies includes a numerology expert who generated ₹1 crore in revenue within three months.",
  teamNote: "[TEAM: INSERT VERIFIED CASE STUDIES, CLIENT PHOTOS, TESTIMONIALS AND SUPPORTING RESULTS HERE.]",
  claimNote: "[TEAM: Publish the ₹1 crore result only with the client's verified evidence and consent.]",
} as const;

export const host = {
  headline: "Meet Melroy",
  designation: "Performance Marketing Expert | Business Growth Strategist",
  bio: [
    "Melroy works with brands and coaching businesses to build scalable growth systems through performance marketing, premium positioning and client acquisition.",
    "Over the last two years, he has helped scale coaching businesses beyond ₹30 crore in combined business growth.",
    "He has also worked with multiple numerology experts to help them position their services, attract premium audiences and grow through paid advertising.",
  ],
  focusLead: "His focus is simple:",
  focus:
    "Helping experts turn their knowledge into a business with better positioning, better clients and scalable acquisition systems.",
  highlights: [
    { value: "₹30 Cr+", label: "Combined business growth for coaching businesses in the last two years" },
    { value: "Numerology", label: "Has worked with multiple numerology experts on positioning and paid ads" },
    { value: "Meta Ads", label: "Performance marketing, premium positioning and client acquisition" },
  ],
  /** Set to e.g. "/images/melroy.jpg" once a real photo is added to /public/images. */
  photo: null as string | null,
  photoNote: "[TEAM: INSERT MELROY'S PROFESSIONAL PORTRAIT]",
  achievementsNote: "[TEAM: ADD VERIFIED SUPPORTING ACHIEVEMENTS – e.g. brand logos, press, certifications]",
};

export const audience = {
  forYou: {
    title: "THIS WORKSHOP IS FOR YOU IF:",
    points: [
      "You're already practising numerology.",
      "You want to attract premium-paying clients.",
      "You're tired of depending entirely on referrals.",
      "You want to learn how to use Meta Ads.",
      "You're serious about building a proper business around your expertise.",
    ],
  },
  notForYou: {
    title: "THIS WORKSHOP IS NOT FOR YOU IF:",
    points: [
      "You're looking to learn numerology from scratch.",
      "You're not serious about growing your business.",
      "You're unwilling to invest in marketing.",
      "You expect instant results without taking action.",
    ],
  },
} as const;

export const details = {
  headline: "Your next step towards building a premium numerology business.",
  workshopLabel: "THE HIGH-TICKET NUMEROLOGY BLUEPRINT",
  rows: [
    { icon: "video", label: "Format", value: "Live online workshop" },
    { icon: "clock", label: "Duration", value: "90 minutes" },
    { icon: "calendar", label: "Day", value: workshop.day },
    { icon: "clock", label: "Time", value: workshop.time },
    { icon: "rupee", label: "Workshop access", value: priceLabel },
  ],
  note: "Your registration gives you access to the live workshop and the WhatsApp group for session updates.",
} as const;

export const faqs = [
  {
    q: "Is this a numerology training workshop?",
    a: "No. This workshop focuses on the business side of numerology: premium positioning, offer creation, advertising and client acquisition.",
  },
  {
    q: "Do I need to know how to run Facebook ads?",
    a: "No. We'll introduce the core concepts and explain how the system works.",
  },
  {
    q: "Is this suitable for beginners?",
    a: "This workshop is designed primarily for people already practising numerology or running numerology businesses.",
  },
  { q: "How much does it cost?", a: `The workshop registration fee is just ${priceLabel}.` },
  {
    q: "How do I access the workshop?",
    a: "After successful payment, you'll be redirected to the WhatsApp group where you'll receive the workshop updates and joining details.",
  },
  {
    q: "Will I get clients immediately?",
    a: "No specific client or revenue result is guaranteed. The workshop teaches strategies and frameworks that you can implement in your business.",
  },
] as const;

export const finalCta = {
  headline: "Stop selling your expertise like an ordinary service.",
  body: [
    "Start thinking about how to position it, package it and reach people who value it.",
    "Join The High-Ticket Numerology Blueprint and discover a smarter approach to building your numerology business.",
  ],
  badges: ["90-MINUTE LIVE WORKSHOP", `ONLY ${priceLabel} TO REGISTER`],
  closing: "Your next step starts here.",
} as const;
