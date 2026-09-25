export const contact = {
  whatsapp: "919042555005",
  phone: "9042555005",
  email: "peacocktapes@gmail.com",
  address: "1/126-4, near TVS Nagar, Pernaickenpatti, Vembakottai Main Road, Sivakasi - 626189",
};

export const colours: Record<string, string> = {
  "Milky White": "bg-[#fcfbf8]",
  "Brown": "bg-[#78350f]",
  "Transparent": "swatch-transparent",
  "Orange": "bg-[#ea580c]",
  "Red": "bg-[#dc2626]",
  "Yellow": "bg-[#eab308]",
  "Black": "bg-[#18181b]",
  "Pink": "bg-[#ec4899]",
  "Grey": "bg-[#6b7280]",
  "Violet": "bg-[#7c3aed]",
  "Green": "bg-[#16a34a]",
};

export const prices = [
  {
    order: "1 box",
    colours: ["Milky White"],
    price: 7600,
  },
  {
    order: "2 boxes",
    colours: ["Milky White"],
    price: 6200,
  },
  {
    order: "3 boxes",
    colours: ["Milky White", "Brown", "Transparent"],
    price: 5800,
  },
  {
    order: "5 boxes",
    colours: ["Milky White", "Brown", "Transparent", "Orange", "Red", "Yellow", "Black"],
    price: 5300,
  },
];

export const quoteOnly = [
  {
    name: "Multi-colour printed",
    minimum: "10 boxes",
    note: "Two, three or more print colours. Quoted to your artwork and specifications.",
    colours: [
      "Milky White",
      "Brown",
      "Transparent",
      "Orange",
      "Red",
      "Yellow",
      "Black",
      "Pink",
      "Grey",
      "Violet",
      "Green",
    ],
  },
  {
    name: "Printed, special colours",
    minimum: "10 boxes",
    note: "Single-colour printing on a special base colour.",
    colours: ["Pink", "Grey", "Violet", "Green"],
  },
  {
    name: "Plain, standard colours",
    minimum: "5 boxes",
    note: "Unprinted tape with no dye charge.",
    colours: ["Milky White", "Brown", "Transparent", "Orange", "Red", "Yellow", "Black"],
  },
  {
    name: "Plain, special colours",
    minimum: "10 boxes",
    note: "Unprinted special-colour tape with no dye charge.",
    colours: ["Pink", "Grey", "Violet", "Green"],
  },
];

export const widths = [
  { inch: '1"', metric: "24 mm", rolls: 144 },
  { inch: '1.5"', metric: "36 mm", rolls: 96 },
  { inch: '2"', metric: "48 mm", rolls: 78 },
  { inch: '2.5"', metric: "60 mm", rolls: 56 },
  { inch: '3"', metric: "72 mm", rolls: 48 },
  { inch: '3.5"', metric: "84 mm", rolls: 42 },
  { inch: '6"', metric: "144 mm", rolls: 21 },
];

export const gallery = [
  {
    file: "1",
    title: "Yellow printed tape",
    group: "Coloured",
  },
  {
    file: "2",
    title: "Transparent print",
    group: "Transparent",
  },
  {
    file: "3",
    title: "Milky white print",
    group: "Milky white",
  },
  {
    file: "4",
    title: "Two-colour print",
    group: "Two-colour",
  },
  {
    file: "5",
    title: "Orange safety seal",
    group: "Coloured",
  },
  {
    file: "6",
    title: "Classic Brown BOPP",
    group: "Coloured",
  },
  {
    file: "7",
    title: "Red fragile alert tape",
    group: "Coloured",
  },
  {
    file: "8",
    title: "Green botanical print",
    group: "Two-colour",
  },
];
