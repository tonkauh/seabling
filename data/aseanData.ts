export type Workshop = {
  id: string;
  title: string;
  time: string;
  location: string;
  description: string;
};

export type AseanCountry = {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  coordinates: [longitude: number, latitude: number];
  cultureOverview: string;
  artHighlights: string[];
  workshops: Workshop[];
};

export const aseanCountries: AseanCountry[] = [
  {
    id: "thailand",
    name: "Thailand",
    nativeName: "ประเทศไทย",
    flag: "🇹🇭",
    coordinates: [100.5018, 13.7563],
    cultureOverview:
      "A living blend of graceful tradition and joyful everyday life, Thailand's creative spirit shines through its craft, cuisine, and celebration.",
    artHighlights: ["Khon mask making", "Benjarong ceramics", "Lanna textiles"],
    workshops: [
      {
        id: "thai-mask",
        title: "Paint a Khon Mask",
        time: "10:30 AM · 60 min",
        location: "Craft Pavilion",
        description:
          "Discover the characters of Thai classical dance and paint your own miniature mask.",
      },
      {
        id: "thai-fruit",
        title: "Carve & Create",
        time: "2:00 PM · 45 min",
        location: "Kitchen Studio",
        description:
          "Learn the delicate art of fruit carving with a local culinary artist.",
      },
    ],
  },
  {
    id: "indonesia",
    name: "Indonesia",
    nativeName: "Indonesia",
    flag: "🇮🇩",
    coordinates: [118, -2.5],
    cultureOverview:
      "Paint your own batik-inspired pattern and discover the color and craft behind Indonesia's iconic textiles.",
    artHighlights: ["Drop-in activity", "All materials provided", "Take your artwork home"],
    workshops: [
      {
        id: "indo-batik",
        title: "Batik Painting",
        time: "Drop in anytime",
        location: "Indonesia booth",
        description:
          "Choose your colors and create a one-of-a-kind batik-inspired artwork to take home.",
      },
    ],
  },
  {
    id: "vietnam",
    name: "Vietnam",
    nativeName: "Việt Nam",
    flag: "🇻🇳",
    coordinates: [108.2022, 16.0544],
    cultureOverview:
      "Try a traditional Vietnamese conical hat with a festive costume, then capture a keepsake from your visit.",
    artHighlights: ["Try-on experience", "Costumes provided", "Photo-friendly booth"],
    workshops: [
      {
        id: "viet-lacquer",
        title: "Vietnamese Hat & Costume",
        time: "Drop in anytime",
        location: "Vietnam booth",
        description:
          "Try on a Vietnamese conical hat and costume, and take a photo to remember the festival.",
      },
    ],
  },
  {
    id: "philippines",
    name: "Philippines",
    nativeName: "Pilipinas",
    flag: "🇵🇭",
    coordinates: [121.774, 12.8797],
    cultureOverview:
      "Design and decorate a colorful mask of your own in this hands-on craft workshop for all ages.",
    artHighlights: ["Make your own design", "All materials provided", "Fun for all ages"],
    workshops: [
      {
        id: "ph-parol",
        title: "Mask Making",
        time: "Drop in anytime",
        location: "Philippines booth",
        description:
          "Choose your colors, decorate a mask, and explore Filipino-inspired festive craft.",
      },
    ],
  },
  {
    id: "malaysia",
    name: "Malaysia",
    nativeName: "Malaysia",
    flag: "🇲🇾",
    coordinates: [101.9758, 4.2105],
    cultureOverview:
      "A meeting place of Malay, Chinese, Indian, and Indigenous traditions, Malaysia celebrates the beauty that emerges when cultures share a table.",
    artHighlights: ["Songket weaving", "Batik canting", "Wau bulan kites"],
    workshops: [
      {
        id: "malay-songket",
        title: "A Little Songket",
        time: "11:30 AM · 60 min",
        location: "Textile House",
        description:
          "Weave shimmering patterns inspired by Malaysia's celebrated songket cloth.",
      },
      {
        id: "malay-kite",
        title: "Fly a Wau",
        time: "3:00 PM · 45 min",
        location: "Open Lawn",
        description:
          "Decorate a crescent-shaped kite and learn the stories behind its sweeping form.",
      },
    ],
  },
  {
    id: "singapore",
    name: "Singapore",
    nativeName: "Singapura · 新加坡",
    flag: "🇸🇬",
    coordinates: [103.8198, 1.3521],
    cultureOverview:
      "Small in size and expansive in spirit, Singapore's living heritage is a vibrant conversation among communities, generations, and new ideas.",
    artHighlights: ["Peranakan beadwork", "Kampong stories", "Lion dance"],
    workshops: [
      {
        id: "sg-beadwork",
        title: "Peranakan Bead Magic",
        time: "9:30 AM · 45 min",
        location: "Craft Pavilion",
        description:
          "Create a tiny beadwork motif inspired by the color and detail of Peranakan design.",
      },
      {
        id: "sg-lion",
        title: "Lion Dance Moves",
        time: "2:30 PM · 40 min",
        location: "Festival Stage",
        description:
          "Try the lively footwork and teamwork behind a traditional lion dance.",
      },
    ],
  },
  {
    id: "myanmar",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    flag: "🇲🇲",
    coordinates: [96.0785, 19.7633],
    cultureOverview:
      "Visit the Thanaka booth to try the traditional fragrant paste and learn about its place in Myanmar's everyday culture.",
    artHighlights: ["Try traditional Thanaka", "Learn about its use", "Drop by the booth"],
    workshops: [
      {
        id: "mm-lacquer",
        title: "Thanaka Experience",
        time: "Drop in anytime",
        location: "Myanmar booth",
        description:
          "Try traditional Thanaka paste and discover how this fragrant natural cosmetic is used in Myanmar.",
      },
    ],
  },
  {
    id: "cambodia",
    name: "Cambodia",
    nativeName: "កម្ពុជា",
    flag: "🇰🇭",
    coordinates: [104.991, 12.5657],
    cultureOverview:
      "Rooted in ancient artistry and carried forward through living practice, Cambodia's dance, weaving, and sculpture tell stories of resilience and renewal.",
    artHighlights: ["Apsara dance", "Krama weaving", "Shadow puppetry"],
    workshops: [
      {
        id: "khmer-dance",
        title: "Apsara in Motion",
        time: "11:00 AM · 45 min",
        location: "Festival Stage",
        description:
          "Learn a few graceful hand gestures from Cambodia's classical dance tradition.",
      },
      {
        id: "khmer-weave",
        title: "Weave a Krama",
        time: "2:00 PM · 50 min",
        location: "Textile House",
        description:
          "Try a simple weave inspired by the versatile Cambodian krama scarf.",
      },
    ],
  },
  {
    id: "laos",
    name: "Laos",
    nativeName: "ລາວ",
    flag: "🇱🇦",
    coordinates: [102.4955, 19.8563],
    cultureOverview:
      "In Laos, a deep connection to land and community is reflected in gentle melodies, mindful craft, and the shared rhythm of festival life.",
    artHighlights: ["Khaen music", "Sinh weaving", "Baci flower art"],
    workshops: [
      {
        id: "lao-khaen",
        title: "Sounds of the Khaen",
        time: "10:00 AM · 40 min",
        location: "Sound Garden",
        description:
          "Listen to the breath-powered khaen and discover its place in Lao folk music.",
      },
      {
        id: "lao-weave",
        title: "Patterned Sinh",
        time: "1:00 PM · 55 min",
        location: "Textile House",
        description:
          "Design a paper weaving inspired by the patterns of the Lao sinh skirt.",
      },
    ],
  },
  {
    id: "brunei",
    name: "Brunei",
    nativeName: "Brunei Darussalam",
    flag: "🇧🇳",
    coordinates: [114.7277, 4.5353],
    cultureOverview:
      "Brunei's warm traditions are reflected in intricate handwork, a welcoming spirit, and the enduring artistry of its woven heritage.",
    artHighlights: ["Jong Sarat weaving", "Silverwork", "Gulingtangan music"],
    workshops: [
      {
        id: "bn-weaving",
        title: "Jong Sarat Patterns",
        time: "11:00 AM · 50 min",
        location: "Textile House",
        description:
          "Explore the geometry of Brunei's ceremonial woven cloth through a simple paper loom.",
      },
      {
        id: "bn-music",
        title: "A Gulingtangan Welcome",
        time: "3:30 PM · 35 min",
        location: "Sound Garden",
        description:
          "Join a guided introduction to the bright sounds of Brunei's traditional gongs.",
      },
    ],
  },
  {
    id: "timor-leste",
    name: "Timor-Leste",
    nativeName: "Timor-Leste",
    flag: "🇹🇱",
    coordinates: [125.7275, -8.8742],
    cultureOverview:
      "Timor-Leste's vibrant identity lives in the motifs of tais weaving, music, and the stories that connect communities across mountain and sea.",
    artHighlights: ["Tais weaving", "Likurai dance", "Wood carving"],
    workshops: [
      {
        id: "tl-tais",
        title: "Tais: Cloth & Story",
        time: "10:30 AM · 60 min",
        location: "Textile House",
        description:
          "Explore the vivid patterns of tais and create a small woven-inspired bookmark.",
      },
      {
        id: "tl-dance",
        title: "Rhythm of Likurai",
        time: "2:30 PM · 40 min",
        location: "Festival Stage",
        description:
          "Feel the beat of a traditional dance and learn a few joyful steps together.",
      },
    ],
  },
];
