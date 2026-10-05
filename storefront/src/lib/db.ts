import fs from "fs"
import path from "path"
import {
  Category,
  Magazine,
  Order,
  StoreSettings,
  Conversation,
  ChatMessage,
  EmbeddedProduct,
} from "./types"

const DATA_FILE = path.join(process.cwd(), "data", "store.json")

interface StoreData {
  categories: Category[]
  magazines: Magazine[]
  orders: Order[]
  settings: StoreSettings
  conversations?: Conversation[]
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "cat_business",
    name: "Business",
    slug: "business",
    description: "Global finance, economic trends, venture capital, and visionary executive leadership.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    description: "Cultural perspectives, wellness, culinary excellence, and contemporary modern living.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_design",
    name: "Design",
    slug: "design",
    description: "Sustainable modern living, architectural masterpieces, and industrial spatial design.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_fashion",
    name: "Fashion",
    slug: "fashion",
    description: "Contemporary runway couture, street luxury, and avant-garde aesthetic directions.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_defense",
    name: "Defense",
    slug: "defense",
    description: "Military technology, aerospace defense, strategic geopolitical analysis, and tactical systems.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_travel",
    name: "Travel",
    slug: "travel",
    description: "Luxury world expeditions, remote island sanctuaries, and global wanderlust escapes.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_science",
    name: "Science",
    slug: "science",
    description: "Cutting-edge artificial intelligence, quantum computing, space exploration, and biotechnology.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_automotive",
    name: "Automotive",
    slug: "automotive",
    description: "High-performance hypercars, motorsport journalism, and electric vehicle engineering.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_formen",
    name: "For Men",
    slug: "for-men",
    description: "Modern gentleman grooming, bespoke tailoring, fitness, and refined masculine lifestyle.",
    created_at: new Date().toISOString(),
  },
  {
    id: "cat_sports",
    name: "Sports",
    slug: "sports",
    description: "Championship athletics, elite competitive leagues, esports tournaments, and sporting icons.",
    created_at: new Date().toISOString(),
  },
]

const DEFAULT_MAGAZINES: Magazine[] = [
  {
    "id": "mag_fashion_1",
    "title": "NEO-VOGUE - Minimalism in Tokyo & Paris",
    "issueNumber": "Fall/Winter Edition",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 45000,
    "coverImage": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Exploring architectural silhouettes, bespoke Japanese denim tailoring, and the renaissance of organic textiles. Curated by top Parisian art directors with studio lookbooks.",
    "highlights": [
      "Tokyo Streetwear Meets French Haute Couture",
      "Sustainable Cashmere & Smart Fabric Innovations",
      "Photographic Gallery: 40 Pages of Midnight Paris"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_fashion_2",
    "title": "VOGUE NOIR - Tokyo Streetwear Revolution",
    "issueNumber": "Issue #14 • Street Culture",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 45000,
    "coverImage": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Harajuku subcultures reimagined through luxury monochrome lenses. An intimate look at underground Tokyo runway collectives and raw urban tailoring.",
    "highlights": [
      "The Monochrome Aesthetic: Black on Black Styling",
      "Tokyo Underground Atelier Interviews",
      "Streetwear As Modern High Fashion"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_fashion_3",
    "title": "PARIS COUTURE - The Haute Minimalist Era",
    "issueNumber": "Collection No. 8",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 48000,
    "coverImage": "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Inside the historic Parisian ateliers adopting zero-waste draping and ultra-clean silhouettes. An ode to timeless craftsmanship and post-modern elegance.",
    "highlights": [
      "Exclusive Backstage Access at Paris Fashion Week",
      "The Architecture of Hand-Sewn Garments",
      "Color Palettes of Autumn 2026"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_fashion_4",
    "title": "ATELIER SILHOUETTE - Sustainable Italian Denim",
    "issueNumber": "Summer Capsule",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 42000,
    "coverImage": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Crafted in Milan and Tuscany. A masterclass in vintage shuttle loom selvedge denim and sustainable circular fashion systems.",
    "highlights": [
      "Artisan Loom Weaving in Northern Italy",
      "Zero-Water Indigo Dye Techniques",
      "Denim Jacket Pattern Drafting Guide"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_fashion_5",
    "title": "MODA AVANT-GARDE - Seoul Runway & Cyber Textiles",
    "issueNumber": "Vol. 22 • Next Trend",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 46000,
    "coverImage": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "South Korea's fashion scene blends digital tech with bold experimental silhouettes, conductive fabrics, and neon-infused luxury.",
    "highlights": [
      "Smart Interactive Fabrics on Seoul Runways",
      "K-Fashion Designer Collective Spotlight",
      "The Convergence of Gaming Skins and Real-World Apparel"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_tech_1",
    "title": "QUANTUM AI - Issue #42: The Synthetic Mind",
    "issueNumber": "Vol. 42 • Oct 2026",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 49000,
    "coverImage": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "An exclusive deep-dive into autonomous neural architectures, post-silicon computation, and the moral landscape of sentient AI. Features an interview with leading frontier lab founders and a 30-page editorial retrospective.",
    "highlights": [
      "Exclusive: Inside DeepMind's Next Frontier Reasoning Engine",
      "Quantum Supremacy in Commercial Logistics",
      "The Blueprint for Autonomous Robotics Operating Systems"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_tech_2",
    "title": "SYNTHETIC MIND - Autonomous AI & Neural Agents",
    "issueNumber": "Vol. 12 • Frontier Labs",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 49000,
    "coverImage": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Examining the rapid rise of multi-agent cognitive frameworks, self-healing codebases, and synthetic intelligence that reasons autonomously.",
    "highlights": [
      "Agentic Coding Systems and Developer Productivity",
      "Neural Memory Architecture Breakdown",
      "Ethical Guardrails for Autonomous Decision Systems"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_tech_3",
    "title": "QUANTUM LOGIC - Supercomputing & Silicon Frontiers",
    "issueNumber": "Special Issue #09",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 52000,
    "coverImage": "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "A comprehensive review of 100,000-qubit topological quantum processors and room-temperature superconductors transforming data centers.",
    "highlights": [
      "Superconducting Qubits vs Neutral Atoms",
      "Breaking Encryption: The Post-Quantum Cryptography Era",
      "Cooling the Cloud: Cryogenic Infrastructure"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_tech_4",
    "title": "NEURAL CHRONICLES - Generative Robotics in 2027",
    "issueNumber": "Tech Annual 2026",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 48000,
    "coverImage": "https://images.unsplash.com/photo-1617791160505-6f00b656715b?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "From factory automation to humanoid companions: how visual-language-action models empower machines to perceive and touch the physical world.",
    "highlights": [
      "Humanoid Bipedal Locomotion Telemetry",
      "End-to-End Reinforcement Learning from Real-World Video",
      "Factory Floor Deployments in Tokyo and Munich"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_tech_5",
    "title": "CYBERPUNK CODE - Open Source Intelligence & Security",
    "issueNumber": "Cyber Security Vol. 5",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 45000,
    "coverImage": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Investigating cryptographic vulnerabilities, decentralized autonomous organizations, and the defenders guarding critical digital infrastructure.",
    "highlights": [
      "Zero-Day Exploits Unveiled by Red Teams",
      "Hardware Enclaves and Secure Enclave Bypasses",
      "The Linux Kernel Security Evolution"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_auto_1",
    "title": "APEX HORSEPOWER - Hypercars of 2027",
    "issueNumber": "Edition #88 • Special Release",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 55000,
    "coverImage": "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Witness the clash of 2000-horsepower hybrid titans on the Nürburgring Nordschleife. Complete with dyno telemetry, track aerofoil analysis, and high-resolution cockpit photography.",
    "highlights": [
      "Track Test: Rimac Nevera R vs Koenigsegg Jesko Attack",
      "Aerodynamics of Active Ground Effect Spoilers",
      "The Final V12 Symphony: Pure Combustion Collectibles"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_auto_2",
    "title": "HORSEPOWER UNLEASHED - Nürburgring Lap Record Titans",
    "issueNumber": "Track Edition #34",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 55000,
    "coverImage": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Pushing the limits of traction in the Green Hell. Telemetry comparisons, tire degradation metrics, and driver cockpit telemetry.",
    "highlights": [
      "Breaking the 6-Minute Barrier at Nordschleife",
      "Downforce Science: Venturi Tunnels Explained",
      "Driver Interview: Setting the Ultimate Production Lap"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_auto_3",
    "title": "APEX TRACKDAY - Porsche 911 GT3 RS Telemetry Special",
    "issueNumber": "Motorsport Vol. 19",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 58000,
    "coverImage": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Dissecting the aero package, active DRS, and double-wishbone front axle of the most track-focused 911 ever created.",
    "highlights": [
      "Telemetry Analysis at Spa-Francorchamps",
      "Suspension Tuning for High-G Cornering",
      "Carbon Ceramic Braking Performance Under Heat Soak"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_auto_4",
    "title": "VELOCE ITALIA - Ferrari & Lamborghini V12 Legacy",
    "issueNumber": "Heritage Series #04",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 54000,
    "coverImage": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "A tribute to naturally aspirated Italian craftsmanship from Maranello and Sant'Agata Bolognese, chronicling sixty years of sonic euphoria.",
    "highlights": [
      "The Evolution of the V12 from Miura to Revuelto",
      "Ferrari Daytona SP3 Driving Impression",
      "Restoring Classic Italian Grand Tourers"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_auto_5",
    "title": "TURBO CHARGE - The Future of Electric GT Racing",
    "issueNumber": "EV Racing Vol. 7",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 50000,
    "coverImage": "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "High-voltage silicon carbide inverters, torque vectoring across four independent motors, and the thrill of lightning-fast acceleration.",
    "highlights": [
      "900V Battery Chemistries for Extreme Discharge",
      "Torque Vectoring Algorithms Explained",
      "The New Formula E Championship Contenders"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_design_1",
    "title": "ARCHITECTURA - Tropical Brutalism",
    "issueNumber": "Issue #19 • Global Design",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 50000,
    "coverImage": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Raw exposed concrete seamlessly intertwined with lush rainforest canopies in Bali, São Paulo, and Singapore. An exploration of passive ventilation, natural daylighting, and monolithic structural serenity.",
    "highlights": [
      "Villa Monolith: The Cliffside Sanctuary of Uluwatu",
      "Thermal Mass Cooling Without Air Conditioning",
      "Material Study: Board-Marked Concrete & Reclaimed Teak"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_design_2",
    "title": "BRUTALIST SPACES - Concrete Architecture of Eastern Europe",
    "issueNumber": "Monograph No. 12",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 52000,
    "coverImage": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Monumental geometric concrete forms, spomeniks, and modernist public structures captured during sunrise and dusk across Belgrade and Tbilisi.",
    "highlights": [
      "Photo Retrospective: 50 Monumental Concrete Façades",
      "The Politics and Geometry of Post-War Modernism",
      "Preserving Endangered Architectural Icons"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_design_3",
    "title": "TROPICAL MODERNISM - Bali & Singapore Eco-Villas",
    "issueNumber": "Architectural Digest #45",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 49000,
    "coverImage": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Blurring indoor and outdoor living with open-plan layouts, natural bamboo cantilever roofs, and rainwater harvesting pools.",
    "highlights": [
      "Passive Solar Shading in Tropical Climates",
      "Bamboo Joinery: Engineering Sustainable Megastructures",
      "Infinity Pools Integrated into Jungle Topography"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_design_4",
    "title": "MONOLITH DESIGN - Sustainable Prefab Masterpieces",
    "issueNumber": "Modern Living Vol. 28",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 48000,
    "coverImage": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "High-precision modular architecture constructed offsite with cross-laminated timber, reducing carbon footprints without sacrificing luxury.",
    "highlights": [
      "Cross-Laminated Timber vs Steel Framed Skyscrapers",
      "Rapid Onsite Assembly in Alpine Terrains",
      "Minimalist Interiors and Hidden Storage Architecture"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_design_5",
    "title": "SCANDI MINIMAL - Nordic Interior & Spatial Harmony",
    "issueNumber": "Nordic Series #08",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 45000,
    "coverImage": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Light oak woods, soft muted palettes, and functional minimalism that creates cozy, serene living spaces in Copenhagen and Stockholm.",
    "highlights": [
      "Mastering Hygge: Lighting Design for Winter Nights",
      "Iconic Mid-Century Scandinavian Furniture",
      "The Minimalist Wardrobe and Space Planning"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_gaming_1",
    "title": "PIXEL CHRONICLE - The Unreal Engine 6 Era",
    "issueNumber": "Vol. 63 • Next-Gen Dev",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 40000,
    "coverImage": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Inside the next generation of photorealistic game worlds: real-time ray-traced audio, procedural narrative generation, and the evolution of open-world worldbuilding.",
    "highlights": [
      "Breaking Down Nanite 2.0 & Lumen Global Illumination",
      "Interview with Legendary RPG Scenario Designers",
      "Retro Spotlight: The 30-Year Legacy of Doom & Quake"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_gaming_2",
    "title": "PIXEL ODYSSEY - Cyberpunk RPG Worldbuilding",
    "issueNumber": "Game Arts Issue #21",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 42000,
    "coverImage": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Creating atmospheric megacities in dystopian role-playing games: concept art breakdown, environmental storytelling, and synthwave sound design.",
    "highlights": [
      "Concept Art Showcase: Neon Alleys of Neo-Kyoto",
      "Writing Branching Dialogues for Open-Ended RPGs",
      "Designing Cybernetic Enhancements and UI Elements"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_gaming_3",
    "title": "UNREAL ARCHIVES - 30 Years of 3D Graphics Innovation",
    "issueNumber": "Developer Special #03",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 45000,
    "coverImage": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "From software rasterizers and Voodoo 3dfx cards to hardware ray tracing and path-traced cinematic simulations.",
    "highlights": [
      "The Evolution of 3D Acceleration: 1996 to 2026",
      "Shader Mathematics: Writing Custom Post-Processing Filters",
      "Interviews with Graphics Pioneers and Engine Architects"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_gaming_4",
    "title": "ESPORTS ARENA - Global Counter-Strike Major Finals",
    "issueNumber": "Tournament Review #11",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 39000,
    "coverImage": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Analyzing clutch plays, tactical map rotations, economy management, and the high-stakes psychology of sold-out stadium finals.",
    "highlights": [
      "Tactical Breakdown: Winning Round 30 at Major Grand Finals",
      "Player Profile: The 19-Year-Old Prodigy Sniper",
      "The Esports Production Engine Behind Live Stage Broadcasts"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_gaming_5",
    "title": "INDIE CRAFT - The Golden Age of Solo Game Creators",
    "issueNumber": "Indie Spotlight #17",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 40000,
    "coverImage": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Inspiring stories of single developers creating multi-million copy masterpieces using Godot, Blender, and handcrafted pixel art.",
    "highlights": [
      "Post-Mortem: From Solo Hobby Project to Steam Top Seller",
      "Pixel Art Animation: Mastering Sub-Pixel Motion",
      "Marketing Your Indie Game with Zero Budget"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:41:48.341Z"
  },
  {
    "id": "mag_fashion_6",
    "title": "RUNWAY ESSENTIALS - Autumn/Winter Milan Review",
    "issueNumber": "Milan FW 2026",
    "categoryId": "cat_fashion",
    "categoryName": "Fashion",
    "price": 44000,
    "coverImage": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Backstage insights from Milan fashion week: textile craftsmanship, model styling portfolios, and trends defining the season.",
    "highlights": [
      "Front Row Runway Analysis: Milan 2026",
      "Sustainable Fabric Weaving Showcases",
      "Designer Q&A: The Future of Ready-to-Wear"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:43:10.398Z"
  },
  {
    "id": "mag_tech_6",
    "title": "SILICON HORIZON - Post-Moore Microarchitecture",
    "issueNumber": "Computing Vol. 16",
    "categoryId": "cat_science",
    "categoryName": "Science",
    "price": 47000,
    "coverImage": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Next-gen wafer scale engines, optical interconnects, and 3D stacked semiconductor packaging pushing compute past silicon limits.",
    "highlights": [
      "Wafer-Scale Engines vs Distributed GPU Clusters",
      "Optical Interconnects for Terabit Bandwidth",
      "Thermal Dissipation via Microchannel Liquid Cooling"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:43:10.399Z"
  },
  {
    "id": "mag_auto_6",
    "title": "CIRCUIT MASTERS - Le Mans 24h Prototype Dynamics",
    "issueNumber": "Endurance #06",
    "categoryId": "cat_automotive",
    "categoryName": "Automotive",
    "price": 52000,
    "coverImage": "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Hypercar class prototypes battling through night rain at Circuit de la Sarthe. Complete chassis setups, hybrid boost strategies, and telemetry logs.",
    "highlights": [
      "LMDh Hybrid Powertrain Energy Regeneration",
      "Night Rain Strategy & Tire Compounds",
      "Brembo Carbon Matrix Brake Thermal Profiles"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:43:10.399Z"
  },
  {
    "id": "mag_design_6",
    "title": "KINETIC SPACES - Interactive Urban Pavilions",
    "issueNumber": "Spatial #10",
    "categoryId": "cat_design",
    "categoryName": "Design",
    "price": 46000,
    "coverImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "Dynamic kinetic façades responding to natural sunlight, wind flows, and public foot traffic in metropolitan plazas.",
    "highlights": [
      "Biomimetic Responsive Building Skins",
      "Parametric Pavilion Geometry Modeling",
      "Smart Glazing and Passive Climate Control"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:43:10.399Z"
  },
  {
    "id": "mag_gaming_6",
    "title": "VIRTUAL REALITY - Spatial Computing & Next-Gen Engines",
    "issueNumber": "VR Trends #05",
    "categoryId": "cat_sports",
    "categoryName": "Sports",
    "price": 43000,
    "coverImage": "https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=600&h=800&q=85",
    "description": "High-density micro-OLED displays, foveated eye-tracking rendering, and neural haptic feedback transforming immersive gaming worlds.",
    "highlights": [
      "Foveated Rendering with Dynamic Eye-Tracking",
      "Neural Haptic Glove Feedback Systems",
      "Developing VR Titles with OpenXR and Vulkan"
    ],
    "pdfUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "created_at": "2026-10-03T21:43:10.399Z"
  }
]
const DEFAULT_SETTINGS: StoreSettings = {
  merchantName: "DIGITALPITSTOP - SOFTWARE",
  nmid: "ID1026568992402",
  qrisImageUrl: "/qris.jpg",
  supportEmail: "support@digitalpitstop.com",
  currency: "IDR",
}

function loadData(): StoreData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial: StoreData = {
        categories: DEFAULT_CATEGORIES,
        magazines: DEFAULT_MAGAZINES,
        orders: [],
        settings: DEFAULT_SETTINGS,
        conversations: [],
      }
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8")
      return initial
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    if (!parsed.conversations) {
      parsed.conversations = []
    }
    return parsed
  } catch (error) {
    console.error("Error reading store.json, returning fallback", error)
    return {
      categories: DEFAULT_CATEGORIES,
      magazines: DEFAULT_MAGAZINES,
      orders: [],
      settings: DEFAULT_SETTINGS,
      conversations: [],
    }
  }
}

function saveData(data: StoreData) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
  } catch (error) {
    console.error("Error writing to store.json", error)
    throw error
  }
}

// ============================================================================
// Categories API
// ============================================================================
export function getCategories(): Category[] {
  const data = loadData()
  return data.categories || []
}

export function addCategory(name: string, description?: string): Category {
  const data = loadData()
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  const newCat: Category = {
    id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    slug,
    description: description || "",
    created_at: new Date().toISOString(),
  }
  data.categories.push(newCat)
  saveData(data)
  return newCat
}

export function deleteCategory(id: string): boolean {
  const data = loadData()
  const beforeCount = data.categories.length
  data.categories = data.categories.filter((c) => c.id !== id)
  if (data.categories.length !== beforeCount) {
    saveData(data)
    return true
  }
  return false
}

// ============================================================================
// Magazines API (Single + Multi Add / Bulk Upload)
// ============================================================================
export function getMagazines(categoryId?: string): Magazine[] {
  const data = loadData()
  // Ensure every magazine has its categoryName in sync with registered categories
  const syncedMagazines = (data.magazines || []).map((m) => {
    const matched = data.categories.find(
      (c) =>
        c.id === m.categoryId ||
        c.name.toLowerCase() === (m.categoryName || "").toLowerCase() ||
        c.slug.toLowerCase() === (m.categoryId || "").toLowerCase()
    )
    if (matched) {
      return {
        ...m,
        categoryId: matched.id,
        categoryName: matched.name,
      }
    }
    return m
  })

  if (categoryId && categoryId !== "all") {
    return syncedMagazines.filter((m) => m.categoryId === categoryId)
  }
  return syncedMagazines
}

export function getMagazineById(id: string): Magazine | null {
  const data = loadData()
  const m = (data.magazines || []).find((item) => item.id === id)
  if (!m) return null
  const matched = data.categories.find(
    (c) =>
      c.id === m.categoryId ||
      c.name.toLowerCase() === (m.categoryName || "").toLowerCase() ||
      c.slug.toLowerCase() === (m.categoryId || "").toLowerCase()
  )
  if (matched) {
    return {
      ...m,
      categoryId: matched.id,
      categoryName: matched.name,
    }
  }
  return m
}

export function addMagazines(magazinesList: Omit<Magazine, "id" | "created_at">[]): Magazine[] {
  const data = loadData()
  const created: Magazine[] = []

  for (const item of magazinesList) {
    const matched = data.categories.find(
      (c) =>
        c.id === item.categoryId ||
        c.name.toLowerCase() === (item.categoryName || "").toLowerCase() ||
        c.slug.toLowerCase() === (item.categoryId || "").toLowerCase()
    )
    const newMag: Magazine = {
      ...item,
      id: `mag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      categoryId: matched ? matched.id : item.categoryId,
      categoryName: matched ? matched.name : item.categoryName || "General",
      created_at: new Date().toISOString(),
    }
    data.magazines.unshift(newMag)
    created.push(newMag)
  }

  saveData(data)
  return created
}

export function updateMagazine(id: string, updates: Partial<Magazine>): Magazine | null {
  const data = loadData()
  const index = data.magazines.findIndex((m) => m.id === id)
  if (index === -1) return null

  // Determine target categoryId from updates or existing record
  const targetCategoryId = updates.categoryId || data.magazines[index].categoryId

  // Search matching category from categories list by id, name, or slug
  const matchedCat = data.categories.find(
    (c) =>
      c.id === targetCategoryId ||
      c.name.toLowerCase() === (updates.categoryName || "").toLowerCase() ||
      c.slug.toLowerCase() === (targetCategoryId || "").toLowerCase()
  )

  const resolvedCategoryId = matchedCat ? matchedCat.id : targetCategoryId
  const resolvedCategoryName = matchedCat
    ? matchedCat.name
    : (updates.categoryName || data.magazines[index].categoryName || "General")

  const updated: Magazine = {
    ...data.magazines[index],
    ...updates,
    id, // protect immutable id
    categoryId: resolvedCategoryId,
    categoryName: resolvedCategoryName,
  }

  data.magazines[index] = updated
  saveData(data)
  return updated
}

export function deleteMagazine(id: string): boolean {
  const data = loadData()
  const beforeCount = data.magazines.length
  data.magazines = data.magazines.filter((m) => m.id !== id)
  if (data.magazines.length !== beforeCount) {
    saveData(data)
    return true
  }
  return false
}

// ============================================================================
// Orders & Payment Verification API
// ============================================================================
export function getOrders(): Order[] {
  const data = loadData()
  return (data.orders || [])
    .map((order) => ({
      ...order,
      items: (order.items || []).map((item) => {
        if (!item.pdfUrl) {
          const mag = data.magazines.find(
            (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          )
          if (mag?.pdfUrl) {
            return { ...item, pdfUrl: mag.pdfUrl }
          }
        }
        return item
      }),
    }))
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export function getOrderById(id: string): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === id || o.orderCode === id) || null
  if (!order) return null
  return {
    ...order,
    items: (order.items || []).map((item) => {
      if (!item.pdfUrl) {
        const mag = data.magazines.find(
          (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
        )
        if (mag?.pdfUrl) {
          return { ...item, pdfUrl: mag.pdfUrl }
        }
      }
      return item
    }),
  }
}

export function getOrdersByCustomerEmail(email: string): Order[] {
  const data = loadData()
  const cleanEmail = email.trim().toLowerCase()
  return (data.orders || [])
    .filter((o) => o.customerEmail.trim().toLowerCase() === cleanEmail)
    .map((order) => ({
      ...order,
      items: (order.items || []).map((item) => {
        if (!item.pdfUrl) {
          const mag = data.magazines.find(
            (m) => m.id === item.magazineId || m.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          )
          if (mag?.pdfUrl) {
            return { ...item, pdfUrl: mag.pdfUrl }
          }
        }
        return item
      }),
    }))
}

export function createOrder(
  customerName: string,
  customerEmail: string,
  items: Magazine[],
  paymentProofUrl?: string
): Order {
  const data = loadData()
  const randomSuffix = Math.floor(10000 + Math.random() * 90000)
  const orderCode = `ORD-MAG-${randomSuffix}`

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0)

  const newOrder: Order = {
    id: `order_${Date.now()}`,
    orderCode,
    customerName,
    customerEmail: customerEmail.trim().toLowerCase(),
    items: items.map((m) => {
      const magFromDb = data.magazines.find(
        (x) => x.id === (m as any).magazineId || x.id === m.id || x.title.trim().toLowerCase() === m.title.trim().toLowerCase()
      )
      return {
        magazineId: m.id || (m as any).magazineId,
        title: m.title,
        issueNumber: m.issueNumber || magFromDb?.issueNumber,
        coverImage: m.coverImage || magFromDb?.coverImage || "",
        price: m.price || magFromDb?.price || 0,
        pdfUrl: (m as any).pdfUrl || magFromDb?.pdfUrl || "",
      }
    }),
    totalAmount,
    status: paymentProofUrl ? "pending_verification" : "pending_verification",
    paymentProofUrl,
    paymentProofUploadedAt: paymentProofUrl ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  }

  data.orders.unshift(newOrder)
  saveData(data)
  return newOrder
}

export function attachPaymentProof(orderId: string, proofUrl: string): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === orderId || o.orderCode === orderId)
  if (!order) return null

  order.paymentProofUrl = proofUrl
  order.paymentProofUploadedAt = new Date().toISOString()
  order.status = "pending_verification"
  saveData(data)
  return order
}

export function updateOrderStatus(
  orderId: string,
  status: "verified" | "rejected" | "pending_verification",
  adminNotes?: string
): Order | null {
  const data = loadData()
  const order = data.orders.find((o) => o.id === orderId || o.orderCode === orderId)
  if (!order) return null

  order.status = status
  if (adminNotes !== undefined) {
    order.adminNotes = adminNotes
  }
  saveData(data)
  return order
}

// ============================================================================
// Store Settings
// ============================================================================
export function getSettings(): StoreSettings {
  const data = loadData()
  return data.settings || DEFAULT_SETTINGS
}

export function updateSettings(settings: Partial<StoreSettings>): StoreSettings {
  const data = loadData()
  data.settings = { ...data.settings, ...settings }
  saveData(data)
  return data.settings
}

export { formatRupiah } from "./format"


// ============================================================================
// Live Customer Chat API
// ============================================================================
export function getConversations(): Conversation[] {
  const data = loadData()
  return (data.conversations || []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function getConversationByEmail(email: string): Conversation | null {
  const data = loadData()
  const cleanEmail = email.trim().toLowerCase()
  return (
    (data.conversations || []).find(
      (c) => c.customerEmail.toLowerCase() === cleanEmail
    ) || null
  )
}

export function sendChatMessage(params: {
  customerEmail: string
  customerName?: string
  sender: "customer" | "admin"
  senderName?: string
  text?: string
  imageUrl?: string
  productEmbed?: EmbeddedProduct
}): { conversation: Conversation; message: ChatMessage } {
  const data = loadData()
  if (!data.conversations) {
    data.conversations = []
  }

  const cleanEmail = params.customerEmail.trim().toLowerCase()
  let conv = data.conversations.find(
    (c) => c.customerEmail.toLowerCase() === cleanEmail
  )

  const now = new Date().toISOString()

  if (!conv) {
    conv = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerEmail: cleanEmail,
      customerName: params.customerName || cleanEmail.split("@")[0],
      messages: [],
      updatedAt: now,
    }
    data.conversations.unshift(conv)
  }

  if (params.customerName && params.sender === "customer") {
    conv.customerName = params.customerName
  }

  const newMessage: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: params.sender,
    senderName:
      params.senderName ||
      (params.sender === "admin" ? "Store Owner (DigitalPitstop)" : conv.customerName),
    text: params.text || "",
    imageUrl: params.imageUrl,
    productEmbed: params.productEmbed,
    timestamp: now,
    read: false,
  }

  conv.messages.push(newMessage)
  conv.updatedAt = now

  saveData(data)
  return { conversation: conv, message: newMessage }
}

export function markChatAsRead(customerEmail: string, reader: "customer" | "admin"): boolean {
  const data = loadData()
  const cleanEmail = customerEmail.trim().toLowerCase()
  const conv = (data.conversations || []).find(
    (c) => c.customerEmail.toLowerCase() === cleanEmail
  )
  if (!conv) return false

  // If reader is customer, mark all admin messages as read
  // If reader is admin, mark all customer messages as read
  const targetSender = reader === "customer" ? "admin" : "customer"
  let changed = false

  for (const msg of conv.messages) {
    if (msg.sender === targetSender && !msg.read) {
      msg.read = true
      changed = true
    }
  }

  if (changed) {
    saveData(data)
  }
  return true
}

