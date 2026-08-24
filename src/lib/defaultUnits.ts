import { Unit } from "../types";

export const DEFAULT_UNITS: Unit[] = [
  {
    id: "unit-zayed-prime-01",
    title: "Zayed Signature Residences - Old Sheikh Zayed (Street 1)",
    description: "Exclusive boutique development in the heart of Old Sheikh Zayed directly on Street 1. Prime location with 10% down payment, 1.5-year delivery, luxury ultra-modern finishing, smart home system, and verified ownership deed.",
    price: 4500000,
    location: "Old Sheikh Zayed, Giza",
    propertyType: "Apartment",
    legalPaperStatus: "verified_boost",
    ownerName: "Zayed Developments & Advisory",
    ownerPhone: "+201002345678",
    ownerPercentage: 100,
    visibility: "public",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80"
    ],
    details: {
      areaSq: 185,
      bedrooms: 3,
      bathrooms: 2,
      finishingLevel: "Ultra Super Lux",
      furnished: "No"
    },
    paymentDetails: {
      paymentMethod: "Installments",
      downPayment: 450000,
      monthlyInstallment: 55000,
      installmentYears: 6,
      deliveryStatus: "Delivery in 1.5 Years"
    },
    projectInfo: {
      projectName: "Zayed Signature Residences",
      developerName: "Zayed Urban Developers",
      deliveryDate: "1.5 Years",
      masterplanImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
    }
  },
  {
    id: "unit-zayed-beverly-02",
    title: "Luxury Standalone Villa - Beverly Hills, Sheikh Zayed",
    description: "Spectacular modern standalone villa with private infinity pool, lush landscaped garden, double-height reception, and direct view on the central park. Prime gated compound in Sheikh Zayed.",
    price: 12500000,
    location: "Beverly Hills, Sheikh Zayed",
    propertyType: "Villa",
    legalPaperStatus: "verified_boost",
    ownerName: "Eng. Tarek Mansour",
    ownerPhone: "+201019876543",
    ownerPercentage: 100,
    visibility: "public",
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80"
    ],
    details: {
      areaSq: 340,
      bedrooms: 4,
      bathrooms: 4,
      finishingLevel: "Fully Finished with Smart System",
      furnished: "No"
    },
    paymentDetails: {
      paymentMethod: "Installments",
      downPayment: 1250000,
      monthlyInstallment: 140000,
      installmentYears: 7,
      deliveryStatus: "Immediate / Ready to Move"
    },
    projectInfo: {
      projectName: "Beverly Hills Executive Villas",
      developerName: "SODIC Developments",
      deliveryDate: "Ready to Move"
    }
  },
  {
    id: "unit-newcairo-penthouse-03",
    title: "Skyline Penthouse with Private Roof - Golden Square, New Cairo",
    description: "High-end penthouse overlooking the lake and clubhouse in 5th Settlement Golden Square. Features expansive outdoor roof terrace, panoramic views, 3 master bedrooms, and flexible 8-year payment plan.",
    price: 6800000,
    location: "Golden Square, 5th Settlement, New Cairo",
    propertyType: "Penthouse",
    legalPaperStatus: "verified_boost",
    ownerName: "New Cairo Real Estate Partner",
    ownerPhone: "+201004455667",
    ownerPercentage: 100,
    visibility: "public",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
    ],
    details: {
      areaSq: 235,
      bedrooms: 3,
      bathrooms: 3,
      finishingLevel: "Core & Shell / Fully Finished Option",
      furnished: "No"
    },
    paymentDetails: {
      paymentMethod: "Installments",
      downPayment: 680000,
      monthlyInstallment: 72000,
      installmentYears: 8,
      deliveryStatus: "Delivery in 2 Years"
    },
    projectInfo: {
      projectName: "Golden Square Sky Residences",
      developerName: "Palm Hills Developments",
      deliveryDate: "2026"
    }
  },
  {
    id: "unit-northcoast-chalet-04",
    title: "Sea-View Premium Chalet - Ras El Hekma, North Coast",
    description: "Direct beachfront chalet with crystal lagoon access in prime Ras El Hekma. Fully furnished with international design, ACs installed, private balcony overlooking the Mediterranean.",
    price: 7900000,
    location: "Ras El Hekma, North Coast",
    propertyType: "Chalet",
    legalPaperStatus: "verified_boost",
    ownerName: "Coastal Properties Egypt",
    ownerPhone: "+201099887766",
    ownerPercentage: 100,
    visibility: "public",
    imageUrl: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
    ],
    details: {
      areaSq: 145,
      bedrooms: 3,
      bathrooms: 2,
      finishingLevel: "Fully Furnished with Appliances",
      furnished: "Yes"
    },
    paymentDetails: {
      paymentMethod: "Installments",
      downPayment: 790000,
      monthlyInstallment: 85000,
      installmentYears: 7,
      deliveryStatus: "Delivery next Summer"
    },
    projectInfo: {
      projectName: "Ras El Hekma Azure Bay",
      developerName: "Hassan Allam Properties",
      deliveryDate: "Next Summer"
    }
  }
];
