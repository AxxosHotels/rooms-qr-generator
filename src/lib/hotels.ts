export type Hotel = {
  name: string;
  slug: string;
  baseUrl: string;
  driveFolderId: string;
  folderUrl: string;
};

const HOTEL_CONFIG = [
  {
    name: "President",
    slug: "president-hotel",
    baseUrl: "https://app.tollar.com/president-hotel",
    driveFolderId: "1yue2pz9Ulw4bFWKyIg1uCvgJ_l5uXCrR",
  },
  {
    name: "Dominican",
    slug: "dominican-hotel",
    baseUrl: "https://app.tollar.com/dominican-hotel",
    driveFolderId: "1yPkM684UKMPe-Y9LlDWqOMIKH6m_POVb",
  },
  {
    name: "King Charles",
    slug: "king-charles-hotel",
    baseUrl: "https://app.tollar.com/king-charles-hotel",
    driveFolderId: "1vj4y4kHdQghXuK5FtVcQ96BTSXH9gxcd",
  },
  {
    name: "Dvorak",
    slug: "dvorak-hotel",
    baseUrl: "https://app.tollar.com/dvorak-hotel",
    driveFolderId: "1xGoS1eNM9Gabox1ZW9jDoresRQcN7-3w",
  },
  {
    name: "Olympia",
    slug: "olympia-hotel",
    baseUrl: "https://app.tollar.com/olympia-hotel",
    driveFolderId: "1Auzd58jBOO0ReDHU-a8ppdyc2DBitAu4",
  },
  {
    name: "Cihelny",
    slug: "cihelny-resort",
    baseUrl: "https://app.tollar.com/cihelny-resort",
    driveFolderId: "1XmvFz1M4MiIJh1M7yqAzs_m7aH97jx8r",
  },
  {
    name: "Retro Riverside",
    slug: "retro-riverside-hotel",
    baseUrl: "https://app.tollar.com/retro-riverside-hotel",
    driveFolderId: "1E-WS8AR-YI-jgeos8i4I8nE36jrSyZ5c",
  },
  {
    name: "Sun Palace",
    slug: "sun-palace-hotel",
    baseUrl: "https://app.tollar.com/sun-palace-hotel",
    driveFolderId: "1N2vOaG_8IqkB0oBiV_LxzGgzupSm73if",
  },
  {
    name: "Belvedere",
    slug: "belvedere-hotel",
    baseUrl: "https://app.tollar.com/belvedere-hotel",
    driveFolderId: "1_7wZpTM4vOcdtcodhy8yhRBsuQbJm9XG",
  },
  {
    name: "Radium Palace",
    slug: "radium-palace-hotel",
    baseUrl: "https://app.tollar.com/radium-palace-hotel",
    driveFolderId: "1JYfNcRJNGlLPDwCL8iaDyF1EY-JlaWQE",
  },
  {
    name: "Behounek",
    slug: "bhounek-hotel",
    baseUrl: "https://app.tollar.com/bhounek-hotel",
    driveFolderId: "1K9PEuN0RyH09NHbRueSYRup7SLZOf-0D",
  },
  {
    name: "Curie",
    slug: "curie-hotel",
    baseUrl: "https://app.tollar.com/curie-hotel",
    driveFolderId: "1sNLC7AB5QloRKyr5vfDjyT1GELW3fJOb",
  },
  {
    name: "Astoria",
    slug: "astoria-hotel",
    baseUrl: "https://app.tollar.com/astoria-hotel",
    driveFolderId: "19gFMKEUOu-EZTbBR3EOtss0KbAoxAF0E",
  },
  {
    name: "Dagmar",
    slug: "dagmar-apartments",
    baseUrl: "https://app.tollar.com/dagmar-apartments",
    driveFolderId: "1rlOSlYc0XgblusAdQfhx13WdMadu-rHB",
  },
  {
    name: "Agricola",
    slug: "agricola-aqua-center",
    baseUrl: "https://app.tollar.com/agricola-aqua-center",
    driveFolderId: "1QO9SSW5ZuTDZAZOLBjbcgh8FB-g-XnvU",
  },
] satisfies Array<Omit<Hotel, "folderUrl">>;

export const HOTELS: Hotel[] = HOTEL_CONFIG.map((hotel) => ({
  ...hotel,
  folderUrl: `https://drive.google.com/drive/folders/${hotel.driveFolderId}`,
}));

export function getHotelBySlug(slug: string): Hotel | undefined {
  return HOTELS.find((hotel) => hotel.slug === slug);
}
